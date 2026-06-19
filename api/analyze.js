// POST /api/analyze — Vercel serverless function
import { etherscanQuery, analyzeContract } from '../lib/etherscan.js'

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
    const delay = ms => new Promise(r => setTimeout(r, ms))

    const contractSource = await etherscanQuery({ module: 'contract', action: 'getsourcecode', address }, apiKey).catch(() => null)
    await delay(300)
    const holders = await etherscanQuery({ module: 'token', action: 'tokenholderlist', contractaddress: address, page: 1, offset: 20 }, apiKey).catch(() => null)
    await delay(300)
    const txCount = await etherscanQuery({ module: 'stats', action: 'tokensupply', contractaddress: address }, apiKey).catch(() => null)
    await delay(300)
    const tokenTx = await etherscanQuery({ module: 'account', action: 'tokentx', address, page: 1, offset: 10, sort: 'desc' }, apiKey).catch(() => null)

    const analysis = analyzeContract(contractSource, null, holders, txCount, address)

    // Add extra data
    if (tokenTx?.result?.length > 0) {
      analysis.recentActivity = tokenTx.result.length
      analysis.lastActivity = tokenTx.result[0].timeStamp ? new Date(parseInt(tokenTx.result[0].timeStamp) * 1000).toISOString() : null
    }

    // AI analysis via VPS
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
          analysis.riskScore = Math.max(0, Math.min(100, aiResult.riskScore))
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
