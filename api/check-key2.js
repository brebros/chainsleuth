export default async function handler(req, res) {
  const key = process.env.ZG_COMPUTE_KEY || ''
  
  // Find ALL non-standard characters
  const issues = []
  for (let i = 0; i < key.length; i++) {
    const code = key.charCodeAt(i)
    const ch = key[i]
    if (code > 127) issues.push({ pos: i, char: ch, code })
    if (ch === '\n') issues.push({ pos: i, char: 'LF', code })
    if (ch === '\r') issues.push({ pos: i, char: 'CR', code })
    if (ch === '\t') issues.push({ pos: i, char: 'TAB', code })
    if (ch === ' ') issues.push({ pos: i, char: 'SPACE', code })
  }
  
  // Also try the actual API call
  const apiKey = key.replace(/^Bearer\s+/i, '').replace(/[\r\n]+/g, '')
  let apiResult = null
  
  try {
    const r = await fetch('https://compute-network-6.integratenetwork.work/v1/proxy/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'qwen/qwen2.5-omni-7b',
        messages: [{ role: 'user', content: 'Say hi in 3 words' }],
        max_tokens: 20
      })
    })
    apiResult = { status: r.status, body: (await r.text()).substring(0, 200) }
  } catch(e) {
    apiResult = { error: e.message }
  }
  
  res.json({
    keyLength: key.length,
    issueCount: issues.length,
    issues: issues.slice(0, 10), // first 10 issues
    apiResult
  })
}
