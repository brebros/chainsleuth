// POST /api/analyze — Vercel serverless function
import { etherscanQuery, analyzeContract, getContractInfo, checkLiquidity, getChainId } from '../lib/etherscan.js'
import { checkSocialSignals } from '../lib/social.js'
import { getGoPlusSecurity, goPlusToFlags } from '../lib/goplus.js'
import { getZeroGContractInfo } from '../lib/zeroG.js'
import { detectChain } from '../lib/chainDetect.js'
import { getCachedScore, setCachedScore } from '../lib/scoreCache.js'

const VPS_URL = process.env.VPS_0G_URL || 'http://77.90.51.232:3001'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { address, chain } = req.body
    const selectedChain = chain || 'eth'

    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return res.status(400).json({ error: 'Invalid contract address' })
    }

    // Auto-detect chain: quick-check if contract exists on selected chain
    const detection = await detectChain(address, selectedChain)
    let chainName = detection.detectedChain
    let chainSuggestion = null

    if (!detection.isContract) {
      chainSuggestion = {
        type: 'warning',
        message: 'This address has no contract code on any supported chain. It may be a wallet address (EOA).',
        detectedChain: null
      }
    } else if (chainName !== selectedChain) {
      chainSuggestion = {
        type: 'switched',
        message: `Contract found on ${chainName.toUpperCase()}, not ${selectedChain.toUpperCase()}. Auto-switched.`,
        detectedChain: chainName
      }
    }

    const chainId = getChainId(chainName)
    const apiKey = process.env.ETHERSCAN_API_KEY || 'AX2RKA7JF4DEBFI3EB7EY5XKRXFIUIT5EG'

    // Check score cache first (5 min TTL)
    const cachedScore = getCachedScore(address, chainName)
    if (cachedScore !== null) {
      // Re-run full analysis but use cached score for consistency
      // (details may vary but score stays stable)
    }

    let analysis
    const dataSources = { etherscan: { ok: false, error: null }, goplus: { ok: false, error: null }, social: { ok: false, error: null }, ai: { ok: false, error: null } }

    if (chainName === '0g') {
      // 0G: use direct RPC (no Etherscan API support)
      try {
        const zgInfo = await getZeroGContractInfo(address).catch(() => ({}))
        analysis = analyzeContract(null, null, null, null, address)
        analysis.chain = '0g'
        analysis.contractInfo = {
          name: '0G Contract',
          compiler: 'unknown',
          isVerified: false,
          ...zgInfo
        }
        analysis.flags.push({
          name: '0G Chain',
          status: 'safe',
          details: 'Scanned via 0G RPC — source code verification not available'
        })
        dataSources.etherscan.ok = true
        dataSources.etherscan.note = '0G RPC (no Etherscan support)'
      } catch (zgErr) {
        dataSources.etherscan.error = `0G RPC failed: ${zgErr.message}`
        analysis = { address, riskScore: 0, flags: [], summary: '', contractInfo: { name: 'Unknown', compiler: 'unknown', isVerified: false }, holderData: {} }
        analysis.chain = '0g'
      }
    } else {
      // EVM chains: use Etherscan V2 API
      const q = (params) => etherscanQuery(params, apiKey, chainId)

      // Track individual source errors
      let contractSource = null, holders = null, txCount = null, contractInfoData = null, liquidityData = null, goPlusData = null

      // Source code query with retry (critical for verification status)
      const fetchSource = async (retries = 2) => {
        for (let i = 0; i <= retries; i++) {
          try {
            const r = await q({ module: 'contract', action: 'getsourcecode', address })
            if (r && r.status === '1') {
              // API responded successfully — even if SourceCode is empty (unverified)
              // we must return the result so analyzeContract can handle it properly
              dataSources.etherscan.ok = true
              return r
            }
            // status=0 (rate limited) — retry after delay
            if (i < retries) await new Promise(r => setTimeout(r, 500 * (i + 1)))
          } catch (e) {
            if (i < retries) await new Promise(r => setTimeout(r, 500 * (i + 1)))
            else dataSources.etherscan.error = `Etherscan source: ${e.message}`
          }
        }
        dataSources.etherscan.error = dataSources.etherscan.error || 'Etherscan source: no data returned'
        return null
      }

      const ethPromises = [
        fetchSource(),
        q({ module: 'token', action: 'tokenholderlist', contractaddress: address, page: 1, offset: 20 }).catch(e => { dataSources.etherscan.error = dataSources.etherscan.error || `Etherscan holders: ${e.message}`; return null }),
        q({ module: 'stats', action: 'tokensupply', contractaddress: address }).catch(e => { dataSources.etherscan.error = dataSources.etherscan.error || `Etherscan supply: ${e.message}`; return null }),
        getContractInfo(address, apiKey, chainId).catch(e => { dataSources.etherscan.error = dataSources.etherscan.error || `Etherscan info: ${e.message}`; return null }),
        checkLiquidity(address, apiKey, chainId).catch(e => { dataSources.etherscan.error = dataSources.etherscan.error || `Etherscan liquidity: ${e.message}`; return null }),
        getGoPlusSecurity(address, chainName).then(r => { if (r) dataSources.goplus.ok = true; return r }).catch(e => { dataSources.goplus.error = `GoPlus: ${e.message}`; return null }),
      ]

      ;[contractSource, holders, txCount, contractInfoData, liquidityData, goPlusData] = await Promise.all(ethPromises)

      // If ALL etherscan calls failed, return meaningful error
      if (!dataSources.etherscan.ok && !contractSource) {
        return res.status(503).json({
          error: 'Data source unavailable',
          message: 'Unable to fetch contract data from Etherscan. The API may be rate-limited or temporarily down.',
          dataSources,
          suggestion: 'Try again in a few minutes, or try a different chain.'
        })
      }

      analysis = analyzeContract(contractSource, null, holders, txCount, address)
      analysis.chain = chainName
      if (contractInfoData) analysis.contractInfo = { ...analysis.contractInfo, ...contractInfoData }
      if (liquidityData) analysis.liquidity = liquidityData

      // GoPlus security data
      if (goPlusData) {
        const { flags: gpFlags, riskBoost } = goPlusToFlags(goPlusData)
        analysis.flags = [...analysis.flags, ...gpFlags]
        analysis.riskScore = Math.min(100, analysis.riskScore + riskBoost)
        analysis.goPlus = goPlusData
      }
    }

    // Attach data source status to response
    analysis.dataSources = dataSources

    // Attach chain suggestion to response
    if (chainSuggestion) {
      analysis.chainSuggestion = chainSuggestion
    }

    // Social signals
    try {
      const social = await checkSocialSignals(analysis.contractInfo?.name || '', address)
      if (social) {
        analysis.social = social
        dataSources.social.ok = true
      }
    } catch (socialErr) {
      dataSources.social.error = `Social signals: ${socialErr.message}`
    }

    // AI analysis — PRIMARY SCORE SOURCE
    try {
      const aiResp = await fetch(VPS_URL + '/api/ai-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(analysis),
        signal: AbortSignal.timeout(30000)
      })
      if (!aiResp.ok) throw new Error(`AI proxy HTTP ${aiResp.status}`)
      const aiResult = await aiResp.json()
      if (aiResult.success) {
        analysis.summary = aiResult.summary
        analysis.aiSource = aiResult.source
        analysis.aiDetails = aiResult.details || null
        analysis.aiRecommendations = aiResult.recommendations || null
        analysis.aiConfidence = aiResult.confidence || null
        dataSources.ai.ok = true
      }
    } catch (aiErr) {
      console.log('AI proxy failed:', aiErr.message)
      dataSources.ai.error = `AI analysis: ${aiErr.message}`
      analysis.aiSource = 'rule-based'
    }

    // Use cached score for consistency, or cache new score
    if (cachedScore !== null) {
      analysis.riskScore = cachedScore
      analysis.scoreFromCache = true
    } else {
      setCachedScore(address, chainName, analysis.riskScore)
    }

    res.json(analysis)
  } catch (error) {
    console.error('Analysis error:', error.message)
    res.status(500).json({ error: 'Failed to analyze contract' })
  }
}
