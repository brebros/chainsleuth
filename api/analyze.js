// POST /api/analyze — Vercel serverless function
import zgCompute from '../lib/compute.js'
import { etherscanQuery, analyzeContract } from '../lib/etherscan.js'

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
    console.log('Analyzing:', address, 'key:', apiKey.substring(0, 5))

    const [contractSource, tokenInfo, holders, txCount] = await Promise.all([
      etherscanQuery({ module: 'contract', action: 'getsourcecode', address }, apiKey).catch(e => { console.log('source err:', e.message); return null }),
      etherscanQuery({ module: 'token', action: 'tokeninfo', contractaddress: address }, apiKey).catch(e => null),
      etherscanQuery({ module: 'token', action: 'tokenholderlist', contractaddress: address, page: 1, offset: 20 }, apiKey).catch(e => null),
      etherscanQuery({ module: 'stats', action: 'tokensupply', contractaddress: address }, apiKey).catch(e => null),
    ])

    console.log('Etherscan results:', { source: !!contractSource, holders: !!holders })

    const analysis = analyzeContract(contractSource, tokenInfo, holders, txCount, address)

    const aiResult = await zgCompute.analyzeContract(analysis)
    if (aiResult.success) {
      analysis.summary = aiResult.summary
      analysis.aiSource = aiResult.source
    }

    res.json(analysis)
  } catch (error) {
    console.error('Analysis error:', error.message, error.stack)
    res.status(500).json({ error: 'Failed to analyze contract' })
  }
}
