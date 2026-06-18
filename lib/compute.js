// 0G Compute — AI analysis via 0G Network
// Lightweight: raw fetch, no SDK

class ZGCompute {
  constructor() {
    this.initialized = false
    this.baseURL = null
    this.apiKey = null
    this.model = process.env.ZG_COMPUTE_MODEL || 'qwen/qwen2.5-omni-7b'
  }

  initialize() {
    try {
      const rawURL = process.env.ZG_COMPUTE_URL
      const encodedKey = process.env.ZG_COMPUTE_KEY_B64 || process.env.ZG_COMPUTE_KEY

      if (!rawURL || !encodedKey) {
        console.log('0G Compute env vars missing — using fallback')
        return false
      }

      // Decode: if key is base64, decode it; otherwise use raw
      let rawKey = encodedKey
      try {
        const decoded = Buffer.from(encodedKey, 'base64').toString('utf8')
        // Check if decoding makes sense (should start with 'app-sk-')
        if (decoded.startsWith('app-sk-')) {
          rawKey = decoded
        }
      } catch { /* not base64, use as-is */ }

      this.apiKey = rawKey.replace(/^Bearer\s+/i, '').replace(/[\r\n]+/g, '')
      const base = rawURL.replace(/\/+$/, '')
      this.baseURL = base.endsWith('/v1') ? base : base + '/v1'

      this.initialized = true
      console.log('✅ 0G Compute initialized')
      return true
    } catch (error) {
      console.error('0G Compute init failed:', error.message)
      return false
    }
  }

  async analyzeContract(contractData) {
    if (!this.initialized) {
      return this.fallbackAnalysis(contractData)
    }

    try {
      const prompt = this.buildAnalysisPrompt(contractData)
      const url = this.baseURL + '/chat/completions'

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'You are a blockchain security expert analyzing smart contracts for rug pull indicators. Be concise, factual, and direct. Always start with a risk level (LOW/MEDIUM/HIGH) and follow with specific reasons. Maximum 3 sentences.'
            },
            { role: 'user', content: prompt }
          ],
          temperature: 0.3,
          max_tokens: 200
        })
      })

      if (!response.ok) {
        const errText = await response.text()
        console.error('0G Compute error:', response.status, errText.substring(0, 200))
        return this.fallbackAnalysis(contractData)
      }

      const data = await response.json()
      const aiSummary = data.choices?.[0]?.message?.content

      if (!aiSummary) return this.fallbackAnalysis(contractData)

      return { success: true, summary: aiSummary, source: '0g-compute' }
    } catch (error) {
      console.error('0G Compute failed:', error.message)
      return this.fallbackAnalysis(contractData)
    }
  }

  buildAnalysisPrompt(data) {
    const verified = data.contractInfo?.isVerified ? 'Yes' : 'No'
    const name = data.contractInfo?.name || 'Unknown'
    const score = data.riskScore
    const flags = data.flags?.map(f => `- ${f.name}: ${f.status.toUpperCase()} — ${f.details}`).join('\n') || 'None'
    const holders = data.holderData?.totalHolders || 'Unknown'
    const concentration = data.holderData?.top10Concentration || 'Unknown'

    return `Analyze this smart contract for rug pull risk:

Contract: ${data.address}
Name: ${name}
Verified on Etherscan: ${verified}
Current Risk Score: ${score}/100

Security Flags:
${flags}

Holder Data:
- Total holders: ${holders}
- Top 10 concentration: ${concentration}%

Provide a brief, professional risk assessment.`
  }

  fallbackAnalysis(contractData) {
    const { riskScore, flags } = contractData
    const dangers = flags?.filter(f => f.status === 'danger').length || 0
    const warnings = flags?.filter(f => f.status === 'warning').length || 0

    let summary = ''
    if (riskScore <= 30) {
      summary = `LOW RISK: Contract is ${contractData.contractInfo?.isVerified ? 'verified' : 'unverified'} with no critical red flags. Standard caution applies.`
    } else if (riskScore <= 60) {
      summary = `MEDIUM RISK: ${warnings > 0 ? `${warnings} warning(s).` : ''} ${dangers > 0 ? `${dangers} critical issue(s).` : ''} Review each flag carefully before investing.`
    } else {
      summary = `HIGH RISK: ${dangers} critical issue(s) and ${warnings} warning(s) detected. Exercise extreme caution.`
    }

    return { success: true, summary, source: 'rule-based' }
  }
}

const zgCompute = new ZGCompute()
zgCompute.initialize()

export default zgCompute
