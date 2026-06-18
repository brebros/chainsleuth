// GET /api/test-0g — debug endpoint
export default async function handler(req, res) {
  const url = process.env.ZG_COMPUTE_URL
  const key = process.env.ZG_COMPUTE_KEY
  const model = process.env.ZG_COMPUTE_MODEL

  const result = {
    hasURL: !!url,
    hasKey: !!key,
    hasModel: !!model,
    urlValue: url ? url.substring(0, 30) + '...' : null,
    modelValue: model,
    keyPrefix: key ? key.substring(0, 20) + '...' : null,
    error: null,
    aiResponse: null
  }

  if (!url || !key) {
    result.error = 'Missing env vars'
    return res.json(result)
  }

  try {
    const apiKey = key.replace(/^Bearer\s+/i, '')
    const base = url.replace(/\/+$/, '')
    const endpoint = (base.endsWith('/v1') ? base : base + '/v1') + '/chat/completions'

    result.endpoint = endpoint

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model || 'qwen/qwen2.5-omni-7b',
        messages: [{ role: 'user', content: 'Say hi in 3 words' }],
        max_tokens: 20
      })
    })

    result.httpStatus = response.status
    const body = await response.text()
    result.responsePreview = body.substring(0, 300)

    if (response.ok) {
      const data = JSON.parse(body)
      result.aiResponse = data.choices?.[0]?.message?.content
    }
  } catch (e) {
    result.error = e.message
  }

  res.json(result)
}
