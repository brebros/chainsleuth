// GoPlus Security API — free honeypot/rug detection
// Docs: https://docs.gopluslabs.io/reference/security-api
const GOPLUS_CHAIN = { eth: 1, bsc: 56, base: 8453, polygon: 137, arbitrum: 42161 }

export async function getGoPlusSecurity(address, chain) {
  try {
    const chainId = GOPLUS_CHAIN[chain] || 1
    const resp = await fetch(
      `https://api.gopluslabs.io/api/v1/token_security/${chainId}?contract_addresses=${address.toLowerCase()}`,
      { signal: AbortSignal.timeout(10000) }
    )
    const data = await resp.json()
    if (data.code !== 1 || !data.result) return null

    const info = data.result[address.toLowerCase()]
    if (!info) return null

    return {
      isHoneypot: info.is_honeypot === '1',
      cannotSellAll: info.cannot_sell_all === '1',
      ownerChangeBalance: info.owner_change_balance === '1',
      hiddenOwner: info.hidden_owner === '1',
      canTakeBackOwnership: info.can_take_back_ownership === '1',
      antiWhaleModifiable: info.anti_whale_modifiable === '1',
      isBlacklisted: info.is_blacklisted === '1',
      isWhitelisted: info.is_whitelisted === '1',
      isProxy: info.is_proxy === '1',
      isOpenSource: info.is_open_source === '1',
      buyTax: parseFloat(info.buy_tax || '0'),
      sellTax: parseFloat(info.sell_tax || '0'),
      holderCount: parseInt(info.holder_count || '0'),
      creatorAddress: info.creator_address,
      creatorBalance: info.creator_balance,
      creatorPercent: info.creator_percent,
      lpHolderCount: parseInt(info.lp_holder_count || '0'),
      lpTotalSupply: info.lp_total_supply,
    }
  } catch (e) {
    console.error('GoPlus API error:', e.message)
    return null
  }
}

// Convert GoPlus data into our flag format
export function goPlusToFlags(security) {
  if (!security) return { flags: [], riskBoost: 0 }

  const flags = []
  let riskBoost = 0
  const isOpenSource = security.isOpenSource

  if (security.isHoneypot) {
    flags.push({ name: 'GoPlus: Honeypot', status: 'danger', details: 'CONFIRMED HONEYPOT — cannot sell!',
      explanation: 'GoPlus has confirmed this is a honeypot. Buy transactions may work, but ALL sell transactions will fail. Your money is trapped. This is the most dangerous flag possible.' })
    riskBoost += 40
  }

  if (security.cannotSellAll) {
    flags.push({ name: 'GoPlus: Cannot Sell', status: 'danger', details: 'Sell transactions will fail',
      explanation: 'The contract is configured so that sell transactions revert. You can buy tokens but cannot sell them back. This is a confirmed scam mechanism.' })
    riskBoost += 30
  }

  if (security.buyTax > 0.1) {
    flags.push({ name: 'GoPlus: High Buy Tax', status: 'danger', details: `Buy tax: ${(security.buyTax * 100).toFixed(1)}%`,
      explanation: `A ${(security.buyTax * 100).toFixed(1)}% buy tax means you lose that percentage of your investment immediately on purchase. Anything above 10% is considered predatory.` })
    riskBoost += 20
  }

  if (security.sellTax > 0.1) {
    flags.push({ name: 'GoPlus: High Sell Tax', status: 'danger', details: `Sell tax: ${(security.sellTax * 100).toFixed(1)}%`,
      explanation: `A ${(security.sellTax * 100).toFixed(1)}% sell tax means you lose that percentage when selling. Combined with high buy tax, this is how slow-rug scams extract money gradually.` })
    riskBoost += 20
  }

  if (security.hiddenOwner) {
    flags.push({ name: 'GoPlus: Hidden Owner', status: 'danger', details: 'Owner hidden — can change contract behavior',
      explanation: 'The contract has an owner whose identity is concealed. Hidden owners can modify contract behavior (change fees, pause trading, blacklist wallets) without the community knowing who did it.' })
    riskBoost += 25
  }

  if (security.canTakeBackOwnership) {
    flags.push({ name: 'GoPlus: Can Reclaim Owner', status: 'danger', details: 'Owner can reclaim even after renouncing',
      explanation: 'Even if ownership is renounced, the deployer has a backdoor to regain control. This makes "ownership renounced" claims fake — the developer can still rug you.' })
    riskBoost += 20
  }

  if (security.ownerChangeBalance) {
    // Only risky on unverified contracts — verified contracts (USDT etc) use this legitimately
    const severity = isOpenSource ? 'warning' : 'danger'
    const boost = isOpenSource ? 5 : 25
    flags.push({ name: 'GoPlus: Owner Can Change Balance', status: severity, details: isOpenSource ? 'Owner can modify balances (common in verified tokens)' : 'Owner can modify holder balances directly',
      explanation: isOpenSource
        ? 'The owner can modify token balances. On verified, audited tokens (USDT, USDC) this is a standard compliance feature. On unverified contracts, this is extremely dangerous — the owner can set your balance to zero.'
        : 'The owner can directly modify any holder\'s token balance. On an unverified contract, this means the owner can steal your tokens at any time.' })
    riskBoost += boost
  }

  if (security.antiWhaleModifiable) {
    flags.push({ name: 'GoPlus: Anti-Whale Modifiable', status: 'warning', details: 'Anti-whale limits can be changed by owner',
      explanation: 'Anti-whale limits (max transaction size, max wallet size) exist but can be modified by the owner. The owner could lower limits to prevent you from selling significant amounts.' })
    riskBoost += 10
  }

  if (security.isBlacklisted) {
    // Blacklist is normal for verified tokens (compliance), risky for unverified
    const severity = isOpenSource ? 'safe' : 'warning'
    const boost = isOpenSource ? 0 : 15
    flags.push({ name: 'GoPlus: Blacklist', status: severity, details: isOpenSource ? 'Blacklist present (normal for compliance)' : 'Contract has blacklist functionality',
      explanation: isOpenSource
        ? 'Blacklist functionality exists. On verified tokens (USDT, USDC) this is used for regulatory compliance (OFAC sanctions). Not a risk factor for audited tokens.'
        : 'The contract can blacklist wallets, preventing them from trading. On unverified contracts, the owner could blacklist your wallet after you buy, preventing you from selling.' })
    riskBoost += boost
  }

  if (security.isWhitelisted) {
    flags.push({ name: 'GoPlus: Whitelist Active', status: 'warning', details: 'Contract has whitelist (selective trading)',
      explanation: 'Only whitelisted addresses can trade. This could prevent you from buying or selling unless your address is on the whitelist. Potentially restrictive.' })
    riskBoost += 10
  }

  return { flags, riskBoost, security }
}
