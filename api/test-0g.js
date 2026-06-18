// GET /api/test-0g — debug + test with native https
import https from 'https'

export default async function handler(req, res) {
  const rawKey = process.env.ZG_COMPUTE_KEY || ''
  const model = process.env.ZG_COMPUTE_MODEL || 'qwen/qwen2.5-omni-7b'
  
  // Clean key: strip Bearer + newlines
  const apiKey = rawKey.replace(/^Bearer\s+/i, '').replace(/[\r\n]+/g, '')
  
  const result = {
    rawLen: rawKey.length,
    cleanLen: apiKey.length,
    keyOK: apiKey.startsWith('app-sk-'),
  }

  // Try with native https (bypass any fetch encoding issues)
  try {
    const body = JSON.stringify({
      model,
      messages: [{ role: 'user', content: 'Say hi in 3 words' }],
      max_tokens: 20
    })

    const aiResult = await new Promise((resolve, reject) => {
      const req2 = https.request({
        hostname: 'compute-network-6.integratenetwork.work',
        path: '/v1/proxy/v1/chat/completions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'Content-Length': Buffer.byteLength(body)
        }
      }, (res2) => {
        let data = ''
        res2.on('data', chunk => data += chunk)
        res2.on('end', () => resolve({ status: res2.statusCode, body: data.substring(0, 300) }))
      })
      req2.on('error', reject)
      req2.write(body)
      req2.end()
    })
    
    result.nativeResult = aiResult
  } catch(e) {
    result.nativeError = e.message
  }

  res.json(result)
}
