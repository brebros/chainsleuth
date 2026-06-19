// GoPlus Security API — free honeypot/rug detection
// Docs: https://docs.gopluslabs.io/reference/security-api

export async function getGoPlusSecurity(address) {
  try {
    const resp = await fetch(
      `https://api.gopluslabs.io/api/v1/token_security/1?contract_addresses=${address.toLowerCase()}`,
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

  if (security.isHoneypot) {
    flags.push({ name: 'GoPlus: Honeypot', status: 'danger', details: 'CONFIRMED HONEYPOT — cannot sell!' })
    riskBoost += 40
  }

  if (security.cannotSellAll) {
    flags.push({ name: 'GoPlus: Cannot Sell', status: 'danger', details: 'Sell transactions will fail' })
    riskBoost += 30
  }

  if (security.buyTax > 10) {
    flags.push({ name: 'GoPlus: High Buy Tax', status: 'danger', details: `Buy tax: ${(security.buyTax * 100).toFixed(1)}%` })
    riskBoost += 20
  }

  if (security.sellTax > 10) {
    flags.push({ name: 'GoPlus: High Sell Tax', status: 'danger', details: `Sell tax: ${(security.sellTax * 100).toFixed(1)}%` })
    riskBoost += 20
  }

  if (security.hiddenOwner) {
    flags.push({ name: 'GoPlus: Hidden Owner', status: 'danger', details: 'Owner隐藏 — can change contract behavior' })
    riskBoost += 25
  }

  if (security.canTakeBackOwnership) {
    flags.push({ name: 'GoPlus: Can Reclaim Owner', status: 'danger', details: 'Owner can reclaim even after renouncing' })
    riskBoost += 20
  }

  if (security.ownerChangeBalance) {
    flags.push({ name: 'GoPlus: Owner Can Change Balance', status: 'danger', details: 'Owner can modify holder balances directly' })
    riskBoost += 25
  }

  if (security.antiWhaleModifiable) {
    flags.push({ name: 'GoPlus: Anti-Whale Modifiable', status: 'warning', details: 'Anti-whale limits can be changed by owner' })
    riskBoost += 10
  }

  if (security.isBlacklisted) {
    flags.push({ name: 'GoPlus: Blacklist Active', status: 'warning', details: 'Contract has blacklist functionality' })
    riskBoost += 15
  }

  if (security.isWhitelisted) {
    flags.push({ name: 'GoPlus: Whitelist Active', status: 'warning', details: 'Contract has whitelist (selective trading)' })
    riskBoost += 10
  }

  return { flags, riskBoost, security }
}
