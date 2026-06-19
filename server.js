import express from 'express'
import cors from 'cors'
import axios from 'axios'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import zgStorage from './src/storage.js'
import zgCompute from './src/compute.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3001

// Etherscan API (free tier: 5 calls/sec)
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || 'YourApiKeyToken'
const ETHERSCAN_BASE = 'https://api.etherscan.io/api'

// 0G Compute — initialized async

app.use(cors())
app.use(express.json())

// Serve static files from dist
app.use(express.static(join(__dirname, 'dist')))

// Initialize 0G services
async function initServices() {
  // Initialize 0G Storage
  const storageReady = await zgStorage.initialize()
  console.log(`0G Storage: ${storageReady ? '✅ Ready' : '⚠️ Fallback mode (local storage)'}`)
  
  // Initialize 0G Compute
  const computeReady = await zgCompute.initialize()
  console.log(`0G Compute: ${computeReady ? '✅ Ready (0G Network)' : '⚠️ Fallback mode (rule-based)'}`)
}

// Helper: Etherscan API call
async function etherscanQuery(params) {
  params.apikey = ETHERSCAN_API_KEY
  const { data } = await axios.get(ETHERSCAN_BASE, { params, timeout: 15000 })
  return data
}

// Analyze contract endpoint
app.post('/api/analyze', async (req, res) => {
  try {
    const { address } = req.body

    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return res.status(400).json({ error: 'Invalid contract address' })
    }

    console.log(`Analyzing: ${address}`)

    // Fetch data in parallel
    const [contractSource, tokenInfo, holders, txCount] = await Promise.all([
      etherscanQuery({ module: 'contract', action: 'getsourcecode', address }).catch(() => null),
      etherscanQuery({ module: 'token', action: 'tokeninfo', contractaddress: address }).catch(() => null),
      etherscanQuery({ module: 'token', action: 'tokenholderlist', contractaddress: address, page: 1, offset: 20 }).catch(() => null),
      etherscanQuery({ module: 'stats', action: 'tokensupply', contractaddress: address }).catch(() => null),
    ])

    // Analyze results
    const analysis = analyzeContract(contractSource, tokenInfo, holders, txCount, address)

    // Get AI-enhanced summary
    const aiResult = await zgCompute.analyzeContract(analysis)
    if (aiResult.success) {
      analysis.summary = aiResult.summary
      analysis.aiSource = aiResult.source
    }

    // Save to 0G Storage (or local fallback)
    const saveResult = await zgStorage.saveScanHistory({
      address,
      riskScore: analysis.riskScore,
      flags: analysis.flags,
      contractInfo: analysis.contractInfo,
      holderData: analysis.holderData
    })
    analysis.storageResult = saveResult

    console.log(`Analysis complete: ${address} → Score: ${analysis.riskScore}`)
    res.json(analysis)
  } catch (error) {
    console.error('Analysis error:', error.message)
    res.status(500).json({ error: 'Failed to analyze contract' })
  }
})

// Get scan history
app.get('/api/history', async (req, res) => {
  try {
    const history = await zgStorage.getScanHistory()
    res.json(history)
  } catch (error) {
    console.error('History error:', error.message)
    res.status(500).json({ error: 'Failed to fetch history' })
  }
})

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    version: '1.0.0',
    storage: '0g-network',
    compute: zgCompute.initialized ? '0g-compute' : 'rule-based'
  })
})

function analyzeContract(contractSource, tokenInfo, holders, txCount, address) {
  const flags = []
  let riskScore = 0 // Start at 0 (safe baseline)

  // 1. Contract verification check
  const isVerified = contractSource?.result?.[0]?.SourceCode && contractSource.result[0].SourceCode !== ''
  flags.push({
    name: 'Contract Verified',
    status: isVerified ? 'safe' : 'danger',
    details: isVerified
      ? `Source code verified on Etherscan. Compiler: ${contractSource.result[0].CompilerVersion || 'unknown'}`
      : 'Source code NOT verified — cannot inspect for malicious code'
  })
  if (!isVerified) riskScore += 15

  // 2. Owner renounced check
  const sourceCode = contractSource?.result?.[0]?.SourceCode || ''
  const ownerPatterns = ['onlyOwner', 'Ownable', 'owner()', '_owner', 'transferOwnership']
  const hasOwnerFunction = ownerPatterns.some(p => sourceCode.includes(p))
  const isRenounced = sourceCode.includes('renounceOwnership') && !hasOwnerFunction
  flags.push({
    name: 'Owner Renounced',
    status: isRenounced ? 'safe' : hasOwnerFunction ? 'warning' : 'safe',
    details: isRenounced
      ? 'Ownership has been renounced'
      : hasOwnerFunction
        ? 'Owner functions detected — developer retains control'
        : 'No owner functions found in contract'
  })
  // Owner functions only risky on unverified contracts
  if (hasOwnerFunction && !isVerified) riskScore += 10

  // 3. Honeypot check
  const honeypotPatterns = ['canSell', 'isBlacklisted', 'maxTxAmount', 'blacklist', 'whiteList', '_isExcluded', 'antiBot', 'maxWallet', 'tradingEnabled']
  const hasSellRestriction = honeypotPatterns.some(p => sourceCode.includes(p))
  flags.push({
    name: 'Honeypot Check',
    status: !hasSellRestriction ? 'safe' : 'danger',
    details: !hasSellRestriction
      ? 'No sell restrictions or blacklisting detected'
      : 'Potential sell restrictions found — possible honeypot'
  })
  if (hasSellRestriction) riskScore += 20

  // 4. Mint authority check
  const hasMint = sourceCode.includes('function mint') || sourceCode.includes('_mint(') || sourceCode.includes('minting')
  const hasCap = sourceCode.includes('cap') || sourceCode.includes('MAX_SUPPLY') || sourceCode.includes('maxSupply')
  flags.push({
    name: 'Mint Authority',
    status: hasMint && !hasCap ? 'danger' : hasMint && hasCap ? 'warning' : 'safe',
    details: hasMint && !hasCap
      ? 'Mint function found with NO supply cap — unlimited minting possible'
      : hasMint && hasCap
        ? 'Mint function found but supply is capped'
        : 'No mint function or supply is fixed'
  })
  if (hasMint && !hasCap && !isVerified) riskScore += 15
  else if (hasMint && !hasCap) riskScore += 5

  // 5. Suspicious code patterns
  const suspiciousPatterns = ['selfDestruct', 'delegatecall', 'suicide']
  const suspHits = suspiciousPatterns.filter(p => sourceCode.includes(p))
  if (suspHits.length > 0) {
    riskScore += 15
    flags.push({ name: 'Dangerous Code', status: 'danger',
      details: 'Found: ' + suspHits.join(', ') + ' — potential exploit vector' })
  }

  // 6. Holder distribution
  const holderList = holders?.result || []
  const totalSupply = parseInt(txCount?.result || '0')
  let top10Concentration = 0

  if (holderList.length > 0 && totalSupply > 0) {
    const top10Balance = holderList.slice(0, 10).reduce((sum, h) => sum + parseInt(h.TokenHolderQuantity || '0'), 0)
    top10Concentration = Math.round((top10Balance / totalSupply) * 100)
  }

  flags.push({
    name: 'Holder Distribution',
    status: top10Concentration > 50 ? 'danger' : top10Concentration > 30 ? 'warning' : 'safe',
    details: top10Concentration > 0
      ? `Top 10 holders own ${top10Concentration}% of total supply`
      : 'Holder data unavailable'
  })
  if (top10Concentration > 50) riskScore += 15
  else if (top10Concentration > 30) riskScore += 5

  // 7. Liquidity lock
  flags.push({
    name: 'LP Locked',
    status: 'warning',
    details: 'Liquidity lock status requires DEX-specific data — manual verification recommended'
  })

  // Bonus: verified + no red flags
  if (isVerified && !hasSellRestriction && suspHits.length === 0) {
    riskScore = Math.max(0, riskScore - 5)
  }

  // Clamp risk score
  riskScore = Math.max(0, Math.min(100, riskScore))

  return {
    address,
    riskScore,
    flags,
    summary: 'Analyzing...', // Will be replaced by AI
    holderData: {
      totalHolders: holderList.length,
      top10Concentration,
      totalSupply: totalSupply.toLocaleString(),
    },
    contractInfo: {
      name: contractSource?.result?.[0]?.ContractName || 'Unknown',
      compiler: contractSource?.result?.[0]?.CompilerVersion || 'Unknown',
      isVerified,
    }
  }
}

// Catch-all: serve index.html
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'))
})

// Start server
initServices().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🔍 ChainSleuth running on http://0.0.0.0:${PORT}`)
  })
})
