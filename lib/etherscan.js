// Etherscan API helper — V2 API, fetch native (no axios)
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || ''
const ETHERSCAN_BASE = 'https://api.etherscan.io/v2/api'

export async function etherscanQuery(params) {
  params.apikey = ETHERSCAN_API_KEY
  params.chainid = 1

  const url = ETHERSCAN_BASE + '?' + new URLSearchParams(params).toString()
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) })

  if (!res.ok) {
    throw new Error(`Etherscan HTTP ${res.status}`)
  }

  const data = await res.json()

  // V2 returns status "0" for Pro-only endpoints — treat as null, not error
  if (data.status === '0' && data.result?.includes?.('API Pro')) {
    return null
  }

  return data
}

export function analyzeContract(contractSource, tokenInfo, holders, txCount, address) {
  const flags = []
  let riskScore = 50

  // 1. Contract verification
  const isVerified = contractSource?.result?.[0]?.SourceCode && contractSource.result[0].SourceCode !== ''
  flags.push({
    name: 'Contract Verified',
    status: isVerified ? 'safe' : 'danger',
    details: isVerified
      ? `Source code verified on Etherscan. Compiler: ${contractSource.result[0].CompilerVersion || 'unknown'}`
      : 'Source code NOT verified — cannot inspect for malicious code'
  })
  if (!isVerified) riskScore += 15

  // 2. Owner renounced
  const sourceCode = contractSource?.result?.[0]?.SourceCode || ''
  const ownerPatterns = ['onlyOwner', 'Ownable', 'owner()', '_owner', 'transferOwnership']
  const hasOwnerFunction = ownerPatterns.some(p => sourceCode.includes(p))
  const isRenounced = sourceCode.includes('renounceOwnership') && !hasOwnerFunction
  flags.push({
    name: 'Owner Renounced',
    status: isRenounced ? 'safe' : hasOwnerFunction ? 'warning' : 'safe',
    details: isRenounced
      ? 'Ownership has been renounced'
      : hasOwnerFunction
        ? 'Owner functions detected — developer retains control'
        : 'No owner functions found in contract'
  })
  if (hasOwnerFunction) riskScore += 10

  // 3. Honeypot check
  const hasSellRestriction = sourceCode.includes('canSell') || sourceCode.includes('isBlacklisted') || sourceCode.includes('maxTxAmount')
  flags.push({
    name: 'Honeypot Check',
    status: !hasSellRestriction ? 'safe' : 'danger',
    details: !hasSellRestriction
      ? 'No sell restrictions or blacklisting detected'
      : 'Potential sell restrictions found — possible honeypot'
  })
  if (hasSellRestriction) riskScore += 20

  // 4. Mint authority
  const hasMint = sourceCode.includes('function mint') || sourceCode.includes('_mint(') || sourceCode.includes('minting')
  const hasCap = sourceCode.includes('cap') || sourceCode.includes('MAX_SUPPLY') || sourceCode.includes('maxSupply')
  flags.push({
    name: 'Mint Authority',
    status: hasMint && !hasCap ? 'danger' : hasMint && hasCap ? 'warning' : 'safe',
    details: hasMint && !hasCap
      ? 'Mint function found with NO supply cap — unlimited minting possible'
      : hasMint && hasCap
        ? 'Mint function found but supply is capped'
        : 'No mint function or supply is fixed'
  })
  if (hasMint && !hasCap) riskScore += 15

  // 5. Holder distribution
  const holderList = holders?.result || []
  const totalSupply = parseInt(txCount?.result || '0')
  let top10Concentration = 0

  if (holderList.length > 0 && totalSupply > 0) {
    const top10Balance = holderList.slice(0, 10).reduce((sum, h) => sum + parseInt(h.TokenHolderQuantity || '0'), 0)
    top10Concentration = Math.round((top10Balance / totalSupply) * 100)
  }

  flags.push({
    name: 'Holder Distribution',
    status: top10Concentration > 50 ? 'danger' : top10Concentration > 30 ? 'warning' : 'safe',
    details: top10Concentration > 0
      ? `Top 10 holders own ${top10Concentration}% of total supply`
      : 'Holder data requires Pro API — manual check recommended'
  })
  if (top10Concentration > 50) riskScore += 15
  else if (top10Concentration > 30) riskScore += 5

  // 6. Liquidity lock
  flags.push({
    name: 'LP Locked',
    status: 'warning',
    details: 'Liquidity lock status requires DEX-specific data — manual verification recommended'
  })

  riskScore = Math.max(1, Math.min(100, riskScore))

  return {
    address,
    riskScore,
    flags,
    summary: 'Analyzing...',
    holderData: {
      totalHolders: holderList.length || 'N/A (Pro API)',
      top10Concentration: top10Concentration || 'N/A',
      totalSupply: isNaN(totalSupply) ? 'N/A' : totalSupply.toLocaleString(),
    },
    contractInfo: {
      name: contractSource?.result?.[0]?.ContractName || 'Unknown',
      compiler: contractSource?.result?.[0]?.CompilerVersion || 'Unknown',
      isVerified,
    }
  }
}
