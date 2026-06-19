// POST /api/analyze — Vercel serverless function
import { etherscanQuery, analyzeContract, getContractInfo, checkLiquidity, getChainId } from '../lib/etherscan.js'
import { checkSocialSignals } from '../lib/social.js'
import { getGoPlusSecurity, goPlusToFlags } from '../lib/goplus.js'
import { getZeroGContractInfo } from '../lib/zeroG.js'
import { detectChain } from '../lib/chainDetect.js'
import { getCachedScore, setCachedScore } from '../lib/scoreCache.js'

// 0G Compute — Direct mode (no VPS proxy needed)
const ZG_URL = process.env.ZG_COMPUTE_URL || 'https://compute-network-18.integratenetwork.work/v1/proxy/chat/completions'
const ZG_MODEL = process.env.ZG_COMPUTE_MODEL || 'qwen3.6-plus'

function getZGKey() {
  const raw = process.env.ZG_COMPUTE_KEY_B64 || process.env.ZG_COMPUTE_KEY
  if (!raw) return null
  try {
    const decoded = Buffer.from(raw, 'base64').toString('utf8')
    return decoded.startsWith('app-sk-') ? decoded : raw
  } catch { return raw }
}

const ZG_SYSTEM_PROMPT = `You are a blockchain security expert. Analyze smart contracts for rug pull risk.
You MUST respond in this exact JSON format:
{"riskScore": <0-100>, "riskLevel": "<LOW|MEDIUM|HIGH>", "summary": "<2-3 sentences>", "details": [{"category": "<name>", "status": "<safe|warning|danger>", "explanation": "<why>"}], "recommendations": ["<actionable advice>"], "confidence": <0.0-1.0>}
SCORING: 0-20 verified+clean, 21-40 verified+minor flags, 41-60 unverified+clean or verified+warnings, 61-80 unverified+suspicious, 81-100 definite rug.
VERIFIED contracts with owner functions are NORMAL. Blacklist on verified = compliance. Only flag honeypot on unverified contracts.`

function buildZGPrompt(d) {
  const v = d.contractInfo?.isVerified ? 'Yes' : 'No'
  const n = (d.contractInfo?.name || 'Unknown').replace(/[^\w\s.-]/g, '').substring(0, 50)
  const f = (d.flags || []).map(x => `- ${x.name}: ${x.status.toUpperCase()} - ${x.details}`).join('\n') || 'None'
  const h = d.holderData?.totalHolders || 'Unknown'
  const c = d.holderData?.top10Concentration || 'Unknown'
  return `Contract: ${d.address}\nName: ${n}\nVerified: ${v}\nRule-based Score: ${d.riskScore}/100\nAge: ${d.contractInfo?.age ?? 'Unknown'} days\nProxy: ${d.contractInfo?.isProxy ? 'Yes' : 'No'}\nLiquidity: ${d.liquidity?.hasLiquidity ? 'Yes' : 'No'}\n\nFlags:\n${f}\n\nHolder Data:\n- Total holders: ${h}\n- Top 10 concentration: ${c}%\n\nProvide your risk assessment as JSON.`
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { address, chain } = req.body
    const selectedChain = chain || 'eth'

    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return res.status(400).json({ error: 'Invalid contract address' })
    }

    // Auto-detect chain: quick-check if contract exists on selected chain
    const detection = await detectChain(address, selectedChain)
    let chainName = detection.detectedChain
    let chainSuggestion = null

    if (!detection.isContract) {
      // Contract not found on any chain — return clear error, not misleading score
      return res.status(404).json({
        error: 'Contract not found',
        message: `No contract code found at ${address} on ${selectedChain.toUpperCase()} or any supported chain. This may be a wallet address (EOA) or the contract doesn't exist.`,
        address,
        chain: selectedChain
      })
    } else if (chainName !== selectedChain) {
      chainSuggestion = {
        type: 'switched',
        message: `Contract found on ${chainName.toUpperCase()}, not ${selectedChain.toUpperCase()}. Auto-switched.`,
        detectedChain: chainName
      }
    }

    const chainId = getChainId(chainName)
    const apiKey = process.env.ETHERSCAN_API_KEY || 'AX2RKA7JF4DEBFI3EB7EY5XKRXFIUIT5EG'

    // Check score cache first (5 min TTL)
    const cachedScore = getCachedScore(address, chainName)
    if (cachedScore !== null) {
      // Re-run full analysis but use cached score for consistency
      // (details may vary but score stays stable)
    }

    let analysis
    const dataSources = { etherscan: { ok: false, error: null }, goplus: { ok: false, error: null }, social: { ok: false, error: null }, ai: { ok: false, error: null } }

    if (chainName === '0g') {
      // 0G: use direct RPC (no Etherscan API support)
      try {
        const zgInfo = await getZeroGContractInfo(address).catch(() => ({}))
        analysis = analyzeContract(null, null, null, null, address)
        analysis.chain = '0g'
        analysis.contractInfo = {
          name: '0G Contract',
          compiler: 'unknown',
          isVerified: false,
          ...zgInfo
        }
        analysis.flags.push({
          name: '0G Chain',
          status: 'safe',
          details: 'Scanned via 0G RPC — source code verification not available'
        })
        dataSources.etherscan.ok = true
        dataSources.etherscan.note = '0G RPC (no Etherscan support)'
      } catch (zgErr) {
        dataSources.etherscan.error = `0G RPC failed: ${zgErr.message}`
        analysis = { address, riskScore: 0, flags: [], summary: '', contractInfo: { name: 'Unknown', compiler: 'unknown', isVerified: false }, holderData: {} }
        analysis.chain = '0g'
      }
    } else {
      // EVM chains: use Etherscan V2 API
      const q = (params) => etherscanQuery(params, apiKey, chainId)

      // Track individual source errors
      let contractSource = null, holders = null, txCount = null, contractInfoData = null, liquidityData = null, goPlusData = null

      // Source code query with retry (critical for verification status)
      const fetchSource = async (retries = 2) => {
        for (let i = 0; i <= retries; i++) {
          try {
            const r = await q({ module: 'contract', action: 'getsourcecode', address })
            if (r && r.status === '1') {
              // API responded successfully — even if SourceCode is empty (unverified)
              // we must return the result so analyzeContract can handle it properly
              dataSources.etherscan.ok = true
              return r
            }
            // status=0 (rate limited) — retry after delay
            if (i < retries) await new Promise(r => setTimeout(r, 500 * (i + 1)))
          } catch (e) {
            if (i < retries) await new Promise(r => setTimeout(r, 500 * (i + 1)))
            else dataSources.etherscan.error = `Etherscan source: ${e.message}`
          }
        }
        dataSources.etherscan.error = dataSources.etherscan.error || 'Etherscan source: no data returned'
        return null
      }

      const ethPromises = [
        fetchSource(),
        q({ module: 'token', action: 'tokenholderlist', contractaddress: address, page: 1, offset: 20 }).catch(e => { dataSources.etherscan.error = dataSources.etherscan.error || `Etherscan holders: ${e.message}`; return null }),
        q({ module: 'stats', action: 'tokensupply', contractaddress: address }).catch(e => { dataSources.etherscan.error = dataSources.etherscan.error || `Etherscan supply: ${e.message}`; return null }),
        getContractInfo(address, apiKey, chainId).catch(e => { dataSources.etherscan.error = dataSources.etherscan.error || `Etherscan info: ${e.message}`; return null }),
        checkLiquidity(address, apiKey, chainId).catch(e => { dataSources.etherscan.error = dataSources.etherscan.error || `Etherscan liquidity: ${e.message}`; return null }),
        getGoPlusSecurity(address, chainName).then(r => { if (r) dataSources.goplus.ok = true; return r }).catch(e => { dataSources.goplus.error = `GoPlus: ${e.message}`; return null }),
      ]

      ;[contractSource, holders, txCount, contractInfoData, liquidityData, goPlusData] = await Promise.all(ethPromises)

      // If ALL etherscan calls failed, return meaningful error
      if (!dataSources.etherscan.ok && !contractSource) {
        return res.status(503).json({
          error: 'Data source unavailable',
          message: 'Unable to fetch contract data from Etherscan. The API may be rate-limited or temporarily down.',
          dataSources,
          suggestion: 'Try again in a few minutes, or try a different chain.'
        })
      }

      analysis = analyzeContract(contractSource, null, holders, txCount, address)
      analysis.chain = chainName
      if (contractInfoData) analysis.contractInfo = { ...analysis.contractInfo, ...contractInfoData }
      if (liquidityData) analysis.liquidity = liquidityData

      // GoPlus security data
      if (goPlusData) {
        const { flags: gpFlags, riskBoost } = goPlusToFlags(goPlusData)
        analysis.flags = [...analysis.flags, ...gpFlags]
        analysis.riskScore = Math.min(100, analysis.riskScore + riskBoost)
        analysis.goPlus = goPlusData
      }
    }

    // Attach data source status to response
    analysis.dataSources = dataSources

    // Attach chain suggestion to response
    if (chainSuggestion) {
      analysis.chainSuggestion = chainSuggestion
    }

    // Social signals
    try {
      const social = await checkSocialSignals(analysis.contractInfo?.name || '', address)
      if (social) {
        analysis.social = social
        dataSources.social.ok = true
      }
    } catch (socialErr) {
      dataSources.social.error = `Social signals: ${socialErr.message}`
    }

    // AI analysis — Direct 0G Compute (no VPS proxy)
    const zgKey = getZGKey()
    if (zgKey) {
      try {
        const zgPrompt = buildZGPrompt(analysis)
        const aiResp = await fetch(ZG_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + zgKey },
          body: JSON.stringify({
            model: ZG_MODEL,
            messages: [
              { role: 'system', content: ZG_SYSTEM_PROMPT },
              { role: 'user', content: zgPrompt }
            ],
            temperature: 0.3,
            max_tokens: 500
          }),
          signal: AbortSignal.timeout(25000)
        })
        if (!aiResp.ok) {
          const errText = await aiResp.text().catch(() => '')
          throw new Error(`0G HTTP ${aiResp.status}: ${errText.substring(0, 100)}`)
        }
        const aiData = await aiResp.json()
        const content = aiData.choices?.[0]?.message?.content
        if (content) {
          let parsed = null
          try { const m = content.match(/\{[\s\S]*\}/); if (m) parsed = JSON.parse(m[0]) } catch {}
          analysis.summary = parsed?.summary || content.substring(0, 200)
          analysis.aiSource = '0g-compute'
          analysis.aiDetails = parsed?.details || null
          analysis.aiRecommendations = parsed?.recommendations || null
          analysis.aiConfidence = parsed?.confidence || null
          if (parsed?.riskScore != null) analysis.aiRiskScore = Math.max(0, Math.min(100, parsed.riskScore))
          dataSources.ai.ok = true
        }
      } catch (aiErr) {
        console.log('0G Compute failed:', aiErr.message)
        dataSources.ai.error = `0G Compute: ${aiErr.message}`
        analysis.aiSource = 'rule-based'
      }
    } else {
      dataSources.ai.error = '0G Compute: no API key configured'
      analysis.aiSource = 'rule-based'
    }

    // Use cached score for consistency, or cache new score
    if (cachedScore !== null) {
      analysis.riskScore = cachedScore
      analysis.scoreFromCache = true
    } else {
      setCachedScore(address, chainName, analysis.riskScore)
    }

    res.json(analysis)
  } catch (error) {
    console.error('Analysis error:', error.message)
    res.status(500).json({ error: 'Failed to analyze contract' })
  }
}
