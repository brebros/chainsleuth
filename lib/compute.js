// 0G Compute — AI analysis via 0G Network (Vercel serverless)
// Uses SDK to generate fresh auth headers per request (IP-bound sessions)

import { ethers } from 'ethers'
import { createZGComputeNetworkBroker } from '@0gfoundation/0g-compute-ts-sdk'

const ZG_TESTNET_RPC = 'https://evmrpc-testnet.0g.ai'
const PROVIDER_ADDRESS = '0xa48f01287233509FD694a22Bf840225062E67836'

class ZGCompute {
  constructor() {
    this.broker = null
    this.initialized = false
    this.model = process.env.ZG_COMPUTE_MODEL || 'qwen/qwen2.5-omni-7b'
  }

  async initialize() {
    try {
      const privateKey = process.env.ZG_WALLET_KEY
      if (!privateKey) {
        console.log('0G wallet key missing — using fallback')
        return false
      }

      const provider = new ethers.JsonRpcProvider(ZG_TESTNET_RPC)
      const wallet = new ethers.Wallet(privateKey.trim(), provider)
      this.broker = await createZGComputeNetworkBroker(wallet)

      this.initialized = true
      console.log('✅ 0G Compute SDK initialized — wallet:', wallet.address)
      return true
    } catch (error) {
      console.error('0G Compute init failed:', error.message)
      return false
    }
  }

  async analyzeContract(contractData) {
    if (!this.initialized || !this.broker) {
      return this.fallbackAnalysis(contractData)
    }

    try {
      const prompt = this.buildAnalysisPrompt(contractData)

      // Get fresh auth headers (IP-bound session)
      const headers = await this.broker.inference.getRequestHeaders(PROVIDER_ADDRESS)

      const response = await fetch(`${process.env.ZG_COMPUTE_URL}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers
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
        console.error('0G Compute HTTP error:', response.status, errText.substring(0, 200))
        return this.fallbackAnalysis(contractData)
      }

      const data = await response.json()
      const aiSummary = data.choices?.[0]?.message?.content

      if (!aiSummary) {
        console.error('0G Compute empty response')
        return this.fallbackAnalysis(contractData)
      }

      console.log('0G Compute success:', aiSummary.substring(0, 50))
      return { success: true, summary: aiSummary, source: '0g-compute' }
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

    return { success: true, summary, source: 'rule-based' }
  }
}

const zgCompute = new ZGCompute()
zgCompute.initialize()

export default zgCompute
