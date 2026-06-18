// Etherscan V2 API helper
export async function etherscanQuery(params, apiKey) {
  params.apikey = apiKey
  params.chainid = 1
  const url = 'https://api.etherscan.io/v2/api' + '?' + new URLSearchParams(params).toString()
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) })
  if (!res.ok) throw new Error('Etherscan HTTP ' + res.status)
  const data = await res.json()
  if (data.status === '0' && String(data.result || '').includes('API Pro')) return null
  return data
}

export function analyzeContract(contractSource, tokenInfo, holders, txCount, address) {
  const flags = []
  let riskScore = 50
  const isVerified = contractSource?.result?.[0]?.SourceCode && contractSource.result[0].SourceCode !== ''
  flags.push({ name: 'Contract Verified', status: isVerified ? 'safe' : 'danger',
    details: isVerified ? 'Verified. Compiler: ' + (contractSource.result[0].CompilerVersion || 'unknown')
    : 'NOT verified — cannot inspect for malicious code' })
  if (!isVerified) riskScore += 15
  const sourceCode = contractSource?.result?.[0]?.SourceCode || ''
  const ownerPatterns = ['onlyOwner', 'Ownable', 'owner()', '_owner', 'transferOwnership']
  const hasOwnerFunction = ownerPatterns.some(p => sourceCode.includes(p))
  const isRenounced = sourceCode.includes('renounceOwnership') && !hasOwnerFunction
  flags.push({ name: 'Owner Renounced', status: isRenounced ? 'safe' : hasOwnerFunction ? 'warning' : 'safe',
    details: isRenounced ? 'Ownership renounced' : hasOwnerFunction ? 'Owner functions detected' : 'No owner functions found' })
  if (hasOwnerFunction) riskScore += 10
  const hasSellRestriction = sourceCode.includes('canSell') || sourceCode.includes('isBlacklisted') || sourceCode.includes('maxTxAmount')
  flags.push({ name: 'Honeypot Check', status: !hasSellRestriction ? 'safe' : 'danger',
    details: !hasSellRestriction ? 'No sell restrictions detected' : 'Possible honeypot' })
  if (hasSellRestriction) riskScore += 20
  const hasMint = sourceCode.includes('function mint') || sourceCode.includes('_mint(') || sourceCode.includes('minting')
  const hasCap = sourceCode.includes('cap') || sourceCode.includes('MAX_SUPPLY') || sourceCode.includes('maxSupply')
  flags.push({ name: 'Mint Authority', status: hasMint && !hasCap ? 'danger' : hasMint && hasCap ? 'warning' : 'safe',
    details: hasMint && !hasCap ? 'Mint with NO cap — unlimited' : hasMint && hasCap ? 'Mint capped' : 'No mint or fixed supply' })
  if (hasMint && !hasCap) riskScore += 15
  const holderList = holders?.result || []
  const totalSupply = parseInt(txCount?.result || '0')
  let top10Concentration = 0
  if (holderList.length > 0 && totalSupply > 0) {
    const top10 = holderList.slice(0, 10).reduce((s, h) => s + parseInt(h.TokenHolderQuantity || '0'), 0)
    top10Concentration = Math.round((top10 / totalSupply) * 100)
  }
  flags.push({ name: 'Holder Distribution', status: top10Concentration > 50 ? 'danger' : top10Concentration > 30 ? 'warning' : 'safe',
    details: top10Concentration > 0 ? 'Top 10 own ' + top10Concentration + '% of supply' : 'Holder data N/A' })
  if (top10Concentration > 50) riskScore += 15
  else if (top10Concentration > 30) riskScore += 5
  flags.push({ name: 'LP Locked', status: 'warning', details: 'Requires DEX data — manual check' })
  riskScore = Math.max(1, Math.min(100, riskScore))
  return { address, riskScore, flags, summary: 'Analyzing...',
    holderData: { totalHolders: holderList.length || 'N/A', top10Concentration, totalSupply: isNaN(totalSupply) ? 'N/A' : totalSupply.toLocaleString() },
    contractInfo: { name: contractSource?.result?.[0]?.ContractName || 'Unknown', compiler: contractSource?.result?.[0]?.CompilerVersion || 'Unknown', isVerified }
  }
}
