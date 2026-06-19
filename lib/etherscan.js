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
  let riskScore = 0
  const sourceCode = contractSource?.result?.[0]?.SourceCode || ''

  // 1. Contract verification check
  const isVerified = contractSource?.result?.[0]?.SourceCode && contractSource.result[0].SourceCode !== ''
  flags.push({ name: 'Contract Verified', status: isVerified ? 'safe' : 'danger',
    details: isVerified ? 'Verified. Compiler: ' + (contractSource.result[0].CompilerVersion || 'unknown')
    : 'NOT verified — cannot inspect for malicious code' })
  if (!isVerified) riskScore += 25

  // 2. Owner / access control
  const ownerPatterns = ['onlyOwner', 'Ownable', 'owner()', '_owner', 'transferOwnership']
  const hasOwnerFunction = ownerPatterns.some(p => sourceCode.includes(p))
  const isRenounced = sourceCode.includes('renounceOwnership') && !hasOwnerFunction
  flags.push({ name: 'Owner Renounced', status: isRenounced ? 'safe' : hasOwnerFunction ? 'warning' : 'safe',
    details: isRenounced ? 'Ownership renounced' : hasOwnerFunction ? 'Owner functions detected' : 'No owner functions found' })
  if (hasOwnerFunction) riskScore += 10

  // 3. Honeypot detection (expanded)
  const honeypotPatterns = ['canSell', 'isBlacklisted', 'maxTxAmount', 'blacklist',
    'whiteList', '_isExcluded', 'antiBot', 'maxWallet', 'tradingEnabled']
  const honeypotHits = honeypotPatterns.filter(p => sourceCode.includes(p))
  const hasHoneypot = honeypotHits.length > 0
  flags.push({ name: 'Honeypot Check', status: hasHoneypot ? 'danger' : 'safe',
    details: hasHoneypot ? 'Suspicious patterns: ' + honeypotHits.join(', ') : 'No sell restrictions detected' })
  if (hasHoneypot) riskScore += 25

  // 4. Mint authority
  const hasMint = sourceCode.includes('function mint') || sourceCode.includes('_mint(') || sourceCode.includes('minting')
  const hasCap = sourceCode.includes('cap') || sourceCode.includes('MAX_SUPPLY') || sourceCode.includes('maxSupply')
  flags.push({ name: 'Mint Authority', status: hasMint && !hasCap ? 'danger' : hasMint && hasCap ? 'warning' : 'safe',
    details: hasMint && !hasCap ? 'Mint with NO cap — unlimited' : hasMint && hasCap ? 'Mint capped' : 'No mint or fixed supply' })
  if (hasMint && !hasCap) riskScore += 20
  else if (hasMint && hasCap) riskScore += 5

  // 5. Holder distribution
  const holderList = Array.isArray(holders?.result) ? holders.result : []
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

  // 6. Suspicious code patterns
  const suspiciousPatterns = ['selfDestruct', 'delegatecall', 'suicide']
  const suspHits = suspiciousPatterns.filter(p => sourceCode.includes(p))
  if (suspHits.length > 0) {
    riskScore += 15
    flags.push({ name: 'Dangerous Code', status: 'danger',
      details: 'Found: ' + suspHits.join(', ') + ' — potential exploit vector' })
  }

  // 7. LP lock
  flags.push({ name: 'LP Locked', status: 'warning', details: 'Requires DEX data — manual check' })
  riskScore += 5

  // Bonus: verified + no red flags
  if (isVerified && !hasOwnerFunction && !hasHoneypot && !(hasMint && !hasCap) && suspHits.length === 0) {
    riskScore = Math.max(0, riskScore - 10)
  }

  riskScore = Math.max(0, Math.min(100, riskScore))

  return { address, riskScore, flags, summary: 'Analyzing...',
    holderData: { totalHolders: holderList.length || 'N/A', top10Concentration, totalSupply: txCount?.result || 'N/A' },
    contractInfo: { name: contractSource?.result?.[0]?.ContractName || 'Unknown', compiler: contractSource?.result?.[0]?.CompilerVersion || 'Unknown', isVerified }
  }
}

// Get contract creation date
export async function getContractAge(address, apiKey) {
  try {
    const data = await etherscanQuery({
      module: 'contract',
      action: 'getcontractcreation',
      contractaddresses: address
    }, apiKey)
    if (data?.result?.[0]?.contractCreator) {
      const txHash = data.result[0].txHash
      // Get block timestamp
      const txData = await etherscanQuery({
        module: 'proxy',
        action: 'eth_getTransactionByHash',
        txhash: txHash
      }, apiKey)
      // Fallback: just return creator info
      return { creator: data.result[0].contractCreator, txHash }
    }
  } catch (e) {
    return null
  }
  return null
}

// Check if contract has Uniswap pair
export async function checkDexLiquidity(address, apiKey) {
  // Check token transfers to Uniswap router
  try {
    const data = await etherscanQuery({
      module: 'account',
      action: 'tokentx',
      address: address,
      page: 1,
      offset: 5,
      sort: 'desc'
    }, apiKey)
    if (data?.result?.length > 0) {
      return { hasActivity: true, recentTxCount: data.result.length }
    }
  } catch (e) {}
  return { hasActivity: false }
}
