// 0G Compute Integration — Real AI analysis via 0G Network
import OpenAI from 'openai'
import fs from 'fs'
import path from 'path'

class ZGCompute {
  constructor() {
    this.client = null
    this.initialized = false
    this.model = 'qwen/qwen2.5-omni-7b'
  }

  async initialize() {
    try {
      // 1. Try loading from .0g-api-key.json file
      const keyPath = path.join(process.cwd(), '.0g-api-key.json')
      if (fs.existsSync(keyPath)) {
        const keyData = JSON.parse(fs.readFileSync(keyPath, 'utf8'))
        this.client = new OpenAI({
          baseURL: keyData.serviceUrl,
          apiKey: keyData.headers.Authorization.replace('Bearer ', '')
        })
        this.model = keyData.model || this.model
        this.initialized = true
        console.log('✅ 0G Compute initialized from file — model:', this.model)
        return true
      }

      // 2. Fallback: env vars (for Vercel deployment)
      const envUrl = process.env.ZG_COMPUTE_URL
      const envKey = process.env.ZG_COMPUTE_KEY_B64
      if (envUrl && envKey) {
        const apiKey = Buffer.from(envKey, 'base64').toString('utf8').replace(/^Bearer\s+/i, '').trim()
        this.client = new OpenAI({ baseURL: envUrl, apiKey })
        if (process.env.ZG_COMPUTE_MODEL) this.model = process.env.ZG_COMPUTE_MODEL
        this.initialized = true
        console.log('✅ 0G Compute initialized from env — model:', this.model)
        return true
      }

      console.log('0G API key not found — using fallback')
      return false
    } catch (error) {
      console.error('0G Compute init failed:', error.message)
      return false
    }
  }

  async analyzeContract(contractData) {
    if (!this.initialized || !this.client) {
      return this.fallbackAnalysis(contractData)
    }

    try {
      const prompt = this.buildAnalysisPrompt(contractData)
      
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: `You are a blockchain security expert analyzing smart contracts for rug pull indicators. Be concise, factual, and direct. Always start with a risk level (LOW/MEDIUM/HIGH) and follow with specific reasons. Maximum 3 sentences.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 200
      })

      const aiSummary = completion.choices[0]?.message?.content
      return {
        success: true,
        summary: aiSummary,
        source: '0g-compute'
      }
    } catch (error) {
      console.error('0G Compute analysis failed:', error.message)
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
      summary = `LOW RISK: This contract shows strong security indicators. Contract is ${contractData.contractInfo?.isVerified ? 'verified' : 'unverified'} with no critical red flags. Standard caution applies — always verify independently.`
    } else if (riskScore <= 60) {
      summary = `MEDIUM RISK: This contract shows moderate risk indicators. ${warnings > 0 ? `${warnings} warning(s) detected.` : ''} ${dangers > 0 ? `${dangers} critical issue(s) found.` : ''} Review each flag carefully before investing.`
    } else {
      summary = `HIGH RISK: This contract shows significant red flags. ${dangers} critical issue(s) and ${warnings} warning(s) detected. Exercise extreme caution — do not invest without thorough independent verification.`
    }

    return {
      success: true,
      summary,
      source: 'rule-based'
    }
  }
}

const zgCompute = new ZGCompute()
export default zgCompute
