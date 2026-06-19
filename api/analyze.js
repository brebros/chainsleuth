// POST /api/analyze — Vercel serverless function
import { etherscanQuery, analyzeContract, getContractInfo, checkLiquidity } from '../lib/etherscan.js'
import { checkSocialSignals } from '../lib/social.js'
import { getGoPlusSecurity, goPlusToFlags } from '../lib/goplus.js'

const VPS_URL = process.env.VPS_0G_URL || 'http://77.90.51.232:3001'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { address } = req.body
    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return res.status(400).json({ error: 'Invalid contract address' })
    }

    const apiKey = process.env.ETHERSCAN_API_KEY || ''

    const [contractSource, holders, txCount, contractInfo, liquidity, goPlus] = await Promise.all([
      etherscanQuery({ module: 'contract', action: 'getsourcecode', address }, apiKey).catch(() => null),
      etherscanQuery({ module: 'token', action: 'tokenholderlist', contractaddress: address, page: 1, offset: 20 }, apiKey).catch(() => null),
      etherscanQuery({ module: 'stats', action: 'tokensupply', contractaddress: address }, apiKey).catch(() => null),
      getContractInfo(address, apiKey).catch(() => null),
      checkLiquidity(address, apiKey).catch(() => null),
      getGoPlusSecurity(address).catch(() => null)
    ])

    const analysis = analyzeContract(contractSource, null, holders, txCount, address)
    if (contractInfo) analysis.contractInfo = { ...analysis.contractInfo, ...contractInfo }
    if (liquidity) analysis.liquidity = liquidity

    // GoPlus security data
    if (goPlus) {
      const { flags: gpFlags, riskBoost } = goPlusToFlags(goPlus)
      analysis.flags = [...analysis.flags, ...gpFlags]
      analysis.riskScore = Math.min(100, analysis.riskScore + riskBoost)
      analysis.goPlus = goPlus
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
