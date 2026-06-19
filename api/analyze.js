// POST /api/analyze — Vercel serverless function
import { etherscanQuery, analyzeContract, getContractInfo, checkLiquidity, getChainId } from '../lib/etherscan.js'
import { checkSocialSignals } from '../lib/social.js'
import { getGoPlusSecurity, goPlusToFlags } from '../lib/goplus.js'
import { getZeroGContractInfo } from '../lib/zeroG.js'
import { detectChain } from '../lib/chainDetect.js'

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
    const apiKey = process.env.ETHERSCAN_API_KEY || ''
    let analysis

    if (chainName === '0g') {
      // 0G: use direct RPC (no Etherscan API support)
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
    } else {
      // EVM chains: use Etherscan V2 API
      const q = (params) => etherscanQuery(params, apiKey, chainId)
      const [contractSource, holders, txCount, contractInfo, liquidity, goPlus] = await Promise.all([
        q({ module: 'contract', action: 'getsourcecode', address }).catch(() => null),
        q({ module: 'token', action: 'tokenholderlist', contractaddress: address, page: 1, offset: 20 }).catch(() => null),
        q({ module: 'stats', action: 'tokensupply', contractaddress: address }).catch(() => null),
        getContractInfo(address, apiKey, chainId).catch(() => null),
        checkLiquidity(address, apiKey, chainId).catch(() => null),
        getGoPlusSecurity(address, chainName).catch(() => null)
      ])

      analysis = analyzeContract(contractSource, null, holders, txCount, address)
      analysis.chain = chainName
      if (contractInfo) analysis.contractInfo = { ...analysis.contractInfo, ...contractInfo }
      if (liquidity) analysis.liquidity = liquidity

      // GoPlus security data
      if (goPlus) {
        const { flags: gpFlags, riskBoost } = goPlusToFlags(goPlus)
        analysis.flags = [...analysis.flags, ...gpFlags]
        analysis.riskScore = Math.min(100, analysis.riskScore + riskBoost)
        analysis.goPlus = goPlus
      }
    }

    // Attach chain suggestion to response
    if (chainSuggestion) {
      analysis.chainSuggestion = chainSuggestion
    }

    // Social signals
    const social = await checkSocialSignals(analysis.contractInfo?.name || '', address).catch(() => null)
    if (social) analysis.social = social

    // AI analysis — PRIMARY SCORE SOURCE
    try {
      const aiResp = await fetch(VPS_URL + '/api/ai-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(analysis),
        signal: AbortSignal.timeout(30000)
      })
      const aiResult = await aiResp.json()
      if (aiResult.success) {
        analysis.summary = aiResult.summary
        analysis.aiSource = aiResult.source
        analysis.aiDetails = aiResult.details || null
        analysis.aiRecommendations = aiResult.recommendations || null
        analysis.aiConfidence = aiResult.confidence || null
        if (aiResult.riskScore !== null && aiResult.riskScore !== undefined) {
          // Use the HIGHER of rule-based and AI scores — AI can't downgrade real risks
          const ruleBasedScore = analysis.riskScore
          const aiScore = aiResult.riskScore
          analysis.riskScore = Math.max(ruleBasedScore, aiScore)
          // But cap for verified safe tokens
          const isVerified = analysis.contractInfo?.isVerified
          const hasHoneypot = analysis.flags?.some(f => f.name === 'GoPlus: Honeypot' && f.status === 'danger')
          const hasPonzi = analysis.flags?.some(f => f.name === 'Ponzi/Scam Pattern' && f.status === 'danger')
          if (isVerified && !hasHoneypot && !hasPonzi) {
            analysis.riskScore = Math.min(15, analysis.riskScore)
          }
        }
      }
    } catch (aiErr) {
      console.log('AI proxy failed:', aiErr.message)
      analysis.aiSource = 'rule-based'
    }

    res.json(analysis)
  } catch (error) {
    console.error('Analysis error:', error.message)
    res.status(500).json({ error: 'Failed to analyze contract' })
  }
}
