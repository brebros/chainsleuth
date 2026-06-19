// ChainSleuth 0G Compute Proxy — runs on VPS
import express from 'express'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

let zgBaseUrl = null
let zgApiKey = null
let zgModel = 'qwen/qwen2.5-omni-7b'

function initCompute() {
  const keyPath = path.join(__dirname, '.0g-api-key.json')
  if (!fs.existsSync(keyPath)) { console.log('WARNING: .0g-api-key.json not found'); return false }
  try {
    const kd = JSON.parse(fs.readFileSync(keyPath, 'utf8'))
    zgBaseUrl = kd.serviceUrl
    zgModel = kd.model || zgModel
    const raw = (kd.headers && kd.headers.Authorization) || ''
    zgApiKey = raw.replace(/^Bearer\s+/i, '').trim()
    if (!zgApiKey) { console.log('WARNING: empty API key'); return false }
    console.log('0G Compute ready:', zgModel)
    return true
  } catch (e) { console.error('Failed to load 0G config:', e.message); return false }
}

const SYSTEM_PROMPT = `You are a blockchain security expert. Analyze smart contracts for rug pull risk.

You MUST respond in this exact JSON format:
{
  "riskScore": <number 0-100>,
  "riskLevel": "<LOW|MEDIUM|HIGH>",
  "summary": "<2-3 sentence overall assessment>",
  "details": [
    {"category": "<name>", "status": "<safe|warning|danger>", "explanation": "<why>"}
  ],
  "recommendations": ["<actionable advice>"],
  "confidence": <0.0-1.0>
}

SCORING RULES (STRICT):
- 0-20: Verified, no owner, no honeypot, clean code (UNI, COMP, DAI, LINK, WETH)
- 21-40: Verified but has owner functions OR capped mint (USDT, LDO, MATIC)
- 41-60: Owner functions + other warnings, OR unverified but clean code (USDC, SUSHI, 1INCH)
- 61-80: Unverified + suspicious patterns, OR honeypot patterns detected
- 81-100: Unverified + honeypot + mint + high concentration = DEFINITE RUG

KEY FACTORS:
- Owner functions (onlyOwner, transferOwnership) = +15 points
- Honeypot patterns (blacklist, canSell, antiBot, maxWallet, tradingEnabled) = +20 points  
- Unverified source code = +20 points
- Mint without cap = +15 points
- Top 10 holders > 50% = +10 points
- Verified + no owner + no honeypot = -10 points (bonus)
- Proxy contract = +5 points

Be STRICT. If owner has too much control, score HIGH. If honeypot patterns exist, score HIGH.
If everything is clean and verified, score LOW.

Provide detailed explanations for each finding.`

app.post('/api/ai-analyze', async (req, res) => {
  if (!zgApiKey) {
    return res.json({ success: false, summary: '0G Compute not configured', source: 'unavailable', riskScore: null, details: null, recommendations: null, confidence: null })
  }
  try {
    const cd = req.body
    const prompt = buildPrompt(cd)
    const url = zgBaseUrl.replace(/\/+$/, '') + '/v1/chat/completions'
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + zgApiKey },
      body: JSON.stringify({
        model: zgModel,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 500
      })
    })
    if (!resp.ok) {
      const err = await resp.text()
      console.error('0G error:', resp.status, err.substring(0, 200))
      return res.json({ success: false, summary: '0G Compute error', source: 'error', riskScore: null, details: null, recommendations: null, confidence: null })
    }
    const data = await resp.json()
    const content = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content
    if (!content) return res.json({ success: false, summary: 'Empty response', source: 'error', riskScore: null, details: null, recommendations: null, confidence: null })

    let parsed = null
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) parsed = JSON.parse(jsonMatch[0])
    } catch (e) { console.log('AI response not JSON') }

    const summary = parsed ? parsed.summary : content
    const aiRiskScore = parsed ? Math.max(0, Math.min(100, parsed.riskScore)) : null
    const details = parsed ? parsed.details : null
    const recommendations = parsed ? parsed.recommendations : null
    const confidence = parsed ? parsed.confidence : null

    console.log('AI done for', (cd.address || '').substring(0, 10), 'score:', aiRiskScore)
    res.json({ success: true, summary: summary, source: '0g-compute', riskScore: aiRiskScore, details: details, recommendations: recommendations, confidence: confidence })
  } catch (error) {
    console.error('AI error:', error.message)
    res.json({ success: false, summary: 'AI analysis failed', source: 'error', riskScore: null, details: null, recommendations: null, confidence: null })
  }
})

function buildPrompt(d) {
  const v = d.contractInfo && d.contractInfo.isVerified ? 'Yes' : 'No'
  const n = (d.contractInfo && d.contractInfo.name) || 'Unknown'
  const s = d.riskScore
  const f = (d.flags || []).map(function(x) { return '- ' + x.name + ': ' + x.status.toUpperCase() + ' - ' + x.details }).join('\n') || 'None'
  const h = (d.holderData && d.holderData.totalHolders) || 'Unknown'
  const c = (d.holderData && d.holderData.top10Concentration) || 'Unknown'
  const age = d.contractInfo?.age || 'Unknown'
  const txCount = d.contractInfo?.txCount || 'Unknown'
  const isProxy = d.contractInfo?.isProxy ? 'Yes' : 'No'
  const liquidity = d.liquidity?.hasLiquidity ? 'Yes' : 'No'

  return 'Contract: ' + d.address + '\nName: ' + n + '\nVerified: ' + v + '\nRule-based Score: ' + s + '/100\nAge: ' + age + ' days\nTransactions: ' + txCount + '\nProxy: ' + isProxy + '\nLiquidity: ' + liquidity + '\n\nFlags:\n' + f + '\n\nHolder Data:\n- Total holders: ' + h + '\n- Top 10 concentration: ' + c + '%\n\nProvide your risk assessment as JSON with riskScore (0-100), riskLevel (LOW/MEDIUM/HIGH), summary, details, recommendations, and confidence.'
}

app.get('/api/health', function(req, res) {
  res.json({ status: 'ok', compute: zgApiKey ? '0g-compute' : 'unavailable', model: zgModel })
})

initCompute()
app.listen(PORT, '0.0.0.0', function() {
  console.log('ChainSleuth 0G Proxy running on port ' + PORT)
})
