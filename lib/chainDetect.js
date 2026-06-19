// Chain detection — quick-check which chain a contract lives on
// Uses eth_getCode via RPC to verify contract existence

const CHAIN_RPCS = {
  eth: 'https://ethereum-rpc.publicnode.com',
  bsc: 'https://bsc-rpc.publicnode.com',
  base: 'https://mainnet.base.org',
  polygon: 'https://polygon-bor-rpc.publicnode.com',
  arbitrum: 'https://arbitrum-one-rpc.publicnode.com',
  '0g': 'https://evmrpc.0g.ai'
}

async function hasContractCode(address, rpcUrl) {
  try {
    const resp = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getCode',
        params: [address, 'latest'],
        id: 1
      }),
      signal: AbortSignal.timeout(5000)
    })
    const data = await resp.json()
    const code = data.result
    return code && code !== '0x' && code.length > 2
  } catch {
    return false
  }
}

// Detect which chain a contract is on
// Returns { detectedChain, isContract }
export async function detectChain(address, preferredChain) {
  // First check the preferred chain
  const preferredRpc = CHAIN_RPCS[preferredChain]
  if (preferredRpc) {
    const isContract = await hasContractCode(address, preferredRpc)
    if (isContract) return { detectedChain: preferredChain, isContract: true }
  }

  // Not found on preferred chain — scan others in parallel
  const otherChains = Object.keys(CHAIN_RPCS).filter(c => c !== preferredChain)
  const checks = await Promise.allSettled(
    otherChains.map(async (chain) => {
      const rpc = CHAIN_RPCS[chain]
      const hasCode = await hasContractCode(address, rpc)
      return { chain, hasCode }
    })
  )

  // Find which chain has the contract
  for (const result of checks) {
    if (result.status === 'fulfilled' && result.value.hasCode) {
      return { detectedChain: result.value.chain, isContract: true }
    }
  }

  // Not a contract on any chain (might be an EOA)
  return { detectedChain: preferredChain, isContract: false }
}
