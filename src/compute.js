// 0G Compute Integration — AI analysis for contract risk assessment
// Uses 0G Compute Network (OpenAI-compatible API)

import OpenAI from 'openai'

class ZGCompute {
  constructor() {
    this.client = null
    this.initialized = false
  }

  initialize(serviceUrl, apiSecret) {
    if (!serviceUrl || !apiSecret) {
      console.log('0G Compute not configured — using fallback analysis')
      return false
    }

    try {
      this.client = new OpenAI({
        baseURL: `${serviceUrl}/v1/proxy`,
        apiKey: apiSecret,
      })
      this.initialized = true
      console.log('0G Compute initialized')
      return true
    } catch (error) {
      console.error('0G Compute init failed:', error.message)
      return false
    }
  }

  async analyzeContract(contractData) {
    if (!this.initialized || !this.client) {
      // Fallback to enhanced rule-based analysis
      return this.fallbackAnalysis(contractData)
    }

    try {
      const prompt = this.buildAnalysisPrompt(contractData)
      
      const completion = await this.client.chat.completions.create({
        model: 'qwen/qwen-2.5-7b-instruct',
        messages: [
          {
            role: 'system',
            content: `You are a blockchain security expert. Analyze smart contracts for rug pull indicators. Be concise and factual. Always include risk level (LOW/MEDIUM/HIGH) and specific reasons.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 500
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
    return `Analyze this smart contract for rug pull risk:

Contract: ${data.address}
Name: ${data.contractInfo?.name || 'Unknown'}
Verified: ${data.contractInfo?.isVerified ? 'Yes' : 'No'}
Risk Score: ${data.riskScore}/100

Security Flags:
${data.flags?.map(f => `- ${f.name}: ${f.status.toUpperCase()} — ${f.details}`).join('\n') || 'No flags available'}

Holder Data:
- Total holders: ${data.holderData?.totalHolders || 'Unknown'}
- Top 10 concentration: ${data.holderData?.top10Concentration || 'Unknown'}%

Provide a brief, professional risk assessment in 2-3 sentences.`
  }

  fallbackAnalysis(contractData) {
    const { riskScore, flags } = contractData
    const dangers = flags?.filter(f => f.status === 'danger').length || 0
    const warnings = flags?.filter(f => f.status === 'warning').length || 0

    let summary = ''
    let riskLevel = ''

    if (riskScore <= 30) {
      riskLevel = 'LOW'
      summary = `This contract shows low risk indicators. Contract is ${contractData.contractInfo?.isVerified ? 'verified' : 'unverified'}. No major red flags detected in the automated analysis. Always verify independently before investing.`
    } else if (riskScore <= 60) {
      riskLevel = 'MEDIUM'
      summary = `This contract shows moderate risk. ${warnings > 0 ? `${warnings} warning(s) detected.` : ''} ${dangers > 0 ? `${dangers} critical issue(s) found.` : 'No critical issues.'} Review each flag carefully and verify the project's legitimacy through official channels.`
    } else {
      riskLevel = 'HIGH'
      summary = `⚠️ HIGH RISK: This contract shows significant red flags. ${dangers} critical issue(s) and ${warnings} warning(s) detected. Exercise extreme caution — this contract may be malicious. Do not invest without thorough independent verification.`
    }

    return {
      success: true,
      summary,
      riskLevel,
      source: 'rule-based'
    }
  }
}

export default new ZGCompute()
