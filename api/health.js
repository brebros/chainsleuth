// GET /api/health — Vercel serverless function
import zgCompute from '../lib/compute.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')

  res.json({
    status: 'ok',
    version: '1.0.0',
    storage: 'local',
    compute: zgCompute.initialized ? '0g-compute' : 'rule-based'
  })
}
