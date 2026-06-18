// GET /api/debug — test all integrations
export default async function handler(req, res) {
  const result = { etherscan: null, zgCompute: null }

  // Test Etherscan
  try {
    const key = process.env.ETHERSCAN_API_KEY || ''
    const url = `https://api.etherscan.io/v2/api?chainid=1&module=contract&action=getsourcecode&address=0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48&apikey=${key}`
    const r = await fetch(url)
    const d = await r.json()
    result.etherscan = {
      status: d.status,
      name: d.result?.[0]?.ContractName || 'N/A',
      keyLen: key.length,
      keyStart: key.substring(0, 5)
    }
  } catch(e) {
    result.etherscan = { error: e.message }
  }

  // Test 0G Compute
  try {
    const key = process.env.ZG_COMPUTE_KEY_B64 || process.env.ZG_COMPUTE_KEY || ''
    result.zgCompute = { hasKey: key.length > 0, keyLen: key.length }
  } catch(e) {
    result.zgCompute = { error: e.message }
  }

  res.json(result)
}
