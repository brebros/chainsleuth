// ChainSleuth 0G Compute Proxy — runs on VPS
// Vercel calls this endpoint for AI analysis (0G Compute needs same-IP auth)
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
  if (!fs.existsSync(keyPath)) {
    console.log('WARNING: .0g-api-key.json not found')
    return false
  }
  try {
    const kd = JSON.parse(fs.readFileSync(keyPath, 'utf8'))
    zgBaseUrl = kd.serviceUrl
    zgModel = kd.model || zgModel
    const raw = (kd.headers && kd.headers.Authorization) || ''
    zgApiKey = raw.replace(/^Bearer\s+/i, '').trim()
    if (!zgApiKey) {
      console.log('WARNING: empty API key in .0g-api-key.json')
      return false
    }
    console.log('0G Compute ready:', zgModel)
    return true
  } catch (e) {
    console.error('Failed to load 0G config:', e.message)
    return false
  }
}

app.post('/api/ai-analyze', async (req, res) => {
  if (!zgApiKey) {
    return res.json({ success: false, summary: '0G Compute not configured', source: 'unavailable' })
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
          { role: 'system', content: 'You are a blockchain security expert analyzing smart contracts for rug pull indicators. Be concise, factual, and direct. Always start with a risk level (LOW/MEDIUM/HIGH) and follow with specific reasons. Maximum 3 sentences.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 200
      })
    })
    if (!resp.ok) {
      const err = await resp.text()
      console.error('0G error:', resp.status, err.substring(0, 200))
      return res.json({ success: false, summary: '0G Compute error: ' + resp.status, source: 'error' })
    }
    const data = await resp.json()
    const summary = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content
    if (!summary) return res.json({ success: false, summary: 'Empty AI response', source: 'error' })
    console.log('AI done for', (cd.address || '').substring(0, 10))
    res.json({ success: true, summary: summary, source: '0g-compute' })
  } catch (error) {
    console.error('AI analyze error:', error.message)
    res.json({ success: false, summary: 'AI analysis failed', source: 'error' })
  }
})

function buildPrompt(d) {
  const v = d.contractInfo && d.contractInfo.isVerified ? 'Yes' : 'No'
  const n = (d.contractInfo && d.contractInfo.name) || 'Unknown'
  const s = d.riskScore
  const f = (d.flags || []).map(function(x) { return '- ' + x.name + ': ' + x.status.toUpperCase() + ' - ' + x.details }).join('\n') || 'None'
  const h = (d.holderData && d.holderData.totalHolders) || 'Unknown'
  const c = (d.holderData && d.holderData.top10Concentration) || 'Unknown'
  return 'Analyze this smart contract for rug pull risk:\n\nContract: ' + d.address + '\nName: ' + n + '\nVerified: ' + v + '\nRisk Score: ' + s + '/100\n\nFlags:\n' + f + '\n\nHolder Data:\n- Total holders: ' + h + '\n- Top 10 concentration: ' + c + '%\n\nProvide a brief, professional risk assessment.'
}

app.get('/api/health', function(req, res) {
  res.json({ status: 'ok', compute: zgApiKey ? '0g-compute' : 'unavailable', model: zgModel })
})

initCompute()
app.listen(PORT, '0.0.0.0', function() {
  console.log('ChainSleuth 0G Proxy running on port ' + PORT)
})
