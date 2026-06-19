// Etherscan V2 API helper — supports multiple chains via chainId
const CHAIN_IDS = { eth: 1, bsc: 56, base: 8453, polygon: 137, arbitrum: 42161, '0g': 16661 }
export function getChainId(chain) { return CHAIN_IDS[chain] || 1 }

export async function etherscanQuery(params, apiKey, chainId) {
  params.apikey = apiKey
  params.chainid = chainId || 1
  const url = 'https://api.etherscan.io/v2/api' + '?' + new URLSearchParams(params).toString()
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) })
  if (!res.ok) throw new Error('Etherscan HTTP ' + res.status)
  const data = await res.json()
  // Return null for ANY error status — prevents false "NOT verified" on rate limits/timeouts
  if (data.status === '0') return null
  return data
}

export function analyzeContract(contractSource, tokenInfo, holders, txCount, address) {
  const flags = []
  let riskScore = 0
  const sourceCode = contractSource?.result?.[0]?.SourceCode || ''

  // 1. Contract verification check
  const isVerified = contractSource?.result?.[0]?.SourceCode && contractSource.result[0].SourceCode !== ''
  flags.push({ name: 'Contract Verified', status: isVerified ? 'safe' : 'danger',
    details: isVerified ? 'Verified. Compiler: ' + (contractSource.result[0].CompilerVersion || 'unknown')
    : 'NOT verified — cannot inspect for malicious code',
    explanation: isVerified
      ? 'The source code is published on Etherscan and matches the deployed bytecode. This means anyone can audit it — a strong trust signal.'
      : 'The source code is NOT published. Nobody can verify what the contract actually does. This is the single biggest red flag — unverified contracts can contain hidden backdoors, mint functions, or sell restrictions.' })
  if (!isVerified) riskScore += 25

  // 2. Owner / access control
  const ownerPatterns = ['onlyOwner', 'Ownable', 'owner()', '_owner', 'transferOwnership']
  const hasOwnerFunction = ownerPatterns.some(p => sourceCode.includes(p))
  const isRenounced = sourceCode.includes('renounceOwnership') && !hasOwnerFunction
  flags.push({ name: 'Owner Renounced', status: isRenounced ? 'safe' : hasOwnerFunction ? 'warning' : 'safe',
    details: isRenounced ? 'Ownership renounced' : hasOwnerFunction ? 'Owner functions detected' : 'No owner functions found',
    explanation: isRenounced
      ? 'Ownership has been permanently renounced. No one can change contract settings — this is the gold standard for trust.'
      : hasOwnerFunction
        ? 'The contract has an owner who can modify settings (fees, pause trading, blacklist wallets). On verified contracts this is normal (USDT, LDO have owners). On unverified contracts, this is risky — the owner could rug you.'
        : 'No owner-related functions found in the source code.' })
  // Owner functions only risky on unverified contracts
  if (hasOwnerFunction && !isVerified) riskScore += 10

  // 3. Honeypot detection (expanded)
  const honeypotPatterns = ['canSell', 'isBlacklisted', 'maxTxAmount',
    'antiBot', 'maxWallet', 'tradingEnabled']
  const honeypotHits = honeypotPatterns.filter(p => sourceCode.includes(p))
  // Also check blacklist but only flag on unverified contracts (compliance feature on verified)
  const hasBlacklist = sourceCode.includes('blacklist') || sourceCode.includes('Blacklist')
  if (hasBlacklist && !isVerified) honeypotHits.push('blacklist')
  const hasHoneypot = honeypotHits.length > 0
  flags.push({ name: 'Honeypot Check', status: hasHoneypot ? 'danger' : 'safe',
    details: hasHoneypot ? 'Suspicious patterns: ' + honeypotHits.join(', ') : 'No sell restrictions detected',
    explanation: hasHoneypot
      ? 'The contract contains code that can prevent you from selling. Patterns like "canSell", "antiBot", "maxTxAmount" are classic honeypot mechanics — you can buy but NOT sell. AVOID.'
      : 'No sell-restriction patterns detected. The contract does not appear to block sell transactions.' })
  if (hasHoneypot) riskScore += 35

  // 3b. Ponzi / high-yield scam patterns
  const srcLower = sourceCode.toLowerCase()
  const ponziPatterns = ['referral', 'staking', '100%', 'ownerwallet', 'investments', 'bounty', 'annualreturn', 'guaranteedprofit', 'doubleyour']
  const ponziHits = ponziPatterns.filter(p => srcLower.includes(p))
  if (ponziHits.length >= 3) {
    riskScore += 50
    flags.push({ name: 'Ponzi/Scam Pattern', status: 'danger',
      details: 'High-yield scam patterns detected: ' + ponziHits.join(', '),
      explanation: 'This contract contains 3+ patterns commonly found in Ponzi/high-yield scam contracts: referral systems, staking promises, guaranteed returns, etc. These are strong indicators of a scam — do NOT invest.' })
  }

  // 4. Mint authority
  const hasMint = sourceCode.includes('function mint')
  const hasCap = sourceCode.includes('MAX_SUPPLY') || sourceCode.includes('maxSupply') || sourceCode.includes('totalSupply') || /cap\s*\(/.test(sourceCode)
  flags.push({ name: 'Mint Authority', status: hasMint && !hasCap ? 'danger' : hasMint && hasCap ? 'warning' : 'safe',
    details: hasMint && !hasCap ? 'Mint with NO cap — unlimited' : hasMint && hasCap ? 'Mint capped' : 'No mint or fixed supply',
    explanation: hasMint && !hasCap
      ? 'The contract can create new tokens with no maximum supply. The deployer can inflate the supply at will, crashing the price. Very dangerous.'
      : hasMint && hasCap
        ? 'The contract has a mint function but it is capped at a maximum supply. This is normal for many legitimate tokens (USDC, DAI).'
        : 'No mint function found — the token supply is fixed and cannot be increased.' })
  if (hasMint && !hasCap && !isVerified) riskScore += 20
  else if (hasMint && !hasCap) riskScore += 5
  else if (hasMint && hasCap) riskScore += 5

  // 5. Holder distribution — use BigInt for large token supplies (SHIB, PEPE, etc.)
  const holderList = Array.isArray(holders?.result) ? holders.result : []
  const totalSupplyStr = txCount?.result || '0'
  let top10Concentration = 0
  if (holderList.length > 0 && totalSupplyStr !== '0') {
    try {
      const totalSupply = BigInt(totalSupplyStr)
      const top10 = holderList.slice(0, 10).reduce((s, h) => s + BigInt(h.TokenHolderQuantity || '0'), 0n)
      top10Concentration = Number((top10 * 100n) / totalSupply)
    } catch {
      // Fallback to parseInt for non-numeric strings
      const totalSupply = parseInt(totalSupplyStr)
      if (totalSupply > 0) {
        const top10 = holderList.slice(0, 10).reduce((s, h) => s + parseInt(h.TokenHolderQuantity || '0'), 0)
        top10Concentration = Math.round((top10 / totalSupply) * 100)
      }
    }
  }
  flags.push({ name: 'Holder Distribution', status: top10Concentration > 50 ? 'danger' : top10Concentration > 30 ? 'warning' : 'safe',
    details: top10Concentration > 0 ? 'Top 10 own ' + top10Concentration + '% of supply' : 'Holder data N/A',
    explanation: top10Concentration > 50
      ? 'The top 10 wallets hold over 50% of the total supply. A few whales can crash the price by selling. High dump risk.'
      : top10Concentration > 30
        ? 'The top 10 wallets hold 30-50% of supply. Moderate concentration — some dump risk from large holders.'
        : top10Concentration > 0
          ? 'Token supply is well distributed across holders. Lower risk of a single whale crashing the price.'
          : 'Holder distribution data is not available for this token.' })
  if (top10Concentration > 50) riskScore += 15
  else if (top10Concentration > 30) riskScore += 5

  // 6. Suspicious code patterns
  const suspiciousPatterns = ['selfDestruct', 'delegatecall', 'suicide']
  const suspHits = suspiciousPatterns.filter(p => sourceCode.includes(p))
  if (suspHits.length > 0) {
    riskScore += 15
    flags.push({ name: 'Dangerous Code', status: 'danger',
      details: 'Found: ' + suspHits.join(', ') + ' — potential exploit vector',
      explanation: 'The contract contains dangerous low-level functions. "selfDestruct" can permanently destroy the contract and steal funds. "delegatecall" can execute arbitrary code. These are serious exploit vectors.' })
  }

  // 7. LP lock
  flags.push({ name: 'LP Locked', status: 'warning', details: 'Requires DEX data — manual check',
    explanation: 'Liquidity lock status could not be automatically verified. If LP tokens are not locked, the developer can remove all liquidity at any time (rug pull). Check manually on DEXScreener or Team.Finance.' })
  riskScore += 5

  // Bonus: verified + no red flags
  if (isVerified && !hasHoneypot && !(hasMint && !hasCap) && suspHits.length === 0) {
    riskScore = Math.max(0, riskScore - 10)
  }

  riskScore = Math.max(0, Math.min(100, riskScore))

  return { address, riskScore, flags, summary: 'Analyzing...',
    holderData: { totalHolders: holderList.length || 'N/A', top10Concentration, totalSupply: txCount?.result || 'N/A' },
    contractInfo: { name: contractSource?.result?.[0]?.ContractName || 'Unknown', compiler: contractSource?.result?.[0]?.CompilerVersion || 'Unknown', isVerified }
  }
}

// Get contract creation info — with retry for rate limits
export async function getContractInfo(address, apiKey, chainId) {
  const info = { age: null, creator: null, txCount: null, isProxy: false }

  // Helper: query with retry
  const qRetry = async (params, retries = 1) => {
    for (let i = 0; i <= retries; i++) {
      const r = await etherscanQuery(params, apiKey, chainId)
      if (r) return r
      if (i < retries) await new Promise(resolve => setTimeout(resolve, 300))
    }
    return null
  }

  try {
    // Get contract creation
    const createData = await qRetry({
      module: 'contract',
      action: 'getcontractcreation',
      contractaddresses: address
    })

    if (createData?.result?.[0]) {
      info.creator = createData.result[0].contractCreator
      const txHash = createData.result[0].txHash

      // Get block timestamp for age
      const txData = await qRetry({
        module: 'proxy',
        action: 'eth_getTransactionByHash',
        txhash: txHash
      })

      if (txData?.result?.blockNumber) {
        const blockData = await qRetry({
          module: 'proxy',
          action: 'eth_getBlockByNumber',
          tag: txData.result.blockNumber,
          boolean: false
        })

        if (blockData?.result?.timestamp) {
          const created = new Date(parseInt(blockData.result.timestamp) * 1000)
          info.age = Math.floor((Date.now() - created.getTime()) / (1000 * 60 * 60 * 24))
        }
      }
    }
  } catch (e) { console.log('getContractInfo age error:', e.message) }

  // Get tx count
  try {
    const txData = await etherscanQuery({
      module: 'proxy',
      action: 'eth_getTransactionCount',
      address: address,
      tag: 'latest'
    }, apiKey, chainId)
    if (txData?.result) {
      info.txCount = parseInt(txData.result, 16)
    }
  } catch (e) {}

  // Check if proxy (has implementation slot)
  try {
    const code = await etherscanQuery({
      module: 'proxy',
      action: 'eth_getCode',
      address: address,
      tag: 'latest'
    }, apiKey, chainId)
    if (code?.result?.includes('363d3d373d3d3d363d73')) {
      info.isProxy = true
    }
  } catch (e) {}

  return info
}

// Check Uniswap/PancakeSwap liquidity
export async function checkLiquidity(address, apiKey, chainId) {
  try {
    const data = await etherscanQuery({
      module: 'account',
      action: 'tokentx',
      address: address,
      page: 1,
      offset: 20,
      sort: 'desc'
    }, apiKey, chainId)

    if (data?.result?.length > 0) {
      const dexAddresses = [
        '0x7a250d5630b4cf539739df2c5dacb4c659f2488d', // Uniswap V2 Router
        '0xe592427a0aece92de3edee1f18e0157c05861564', // Uniswap V3 Router
        '0x10ed43c718714eb63d5aa57b78b54704e256024e', // PancakeSwap V2 Router (BSC)
        '0x1b02da8cb0d097eb8d57a175b88c7d8b47997506', // PancakeSwap V3 Router (BSC)
      ]

      const dexTx = data.result.filter(tx =>
        dexAddresses.includes(tx.to?.toLowerCase()) || dexAddresses.includes(tx.from?.toLowerCase())
      )

      return {
        hasLiquidity: dexTx.length > 0,
        recentTxCount: data.result.length,
        lastActivity: data.result[0].timeStamp ? new Date(parseInt(data.result[0].timeStamp) * 1000).toISOString() : null
      }
    }
  } catch (e) {}

  return { hasLiquidity: false, recentTxCount: 0, lastActivity: null }
}
