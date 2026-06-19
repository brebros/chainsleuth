// 0G Chain data fetcher — uses direct RPC since no Etherscan API available
const ZG_RPC = 'https://evmrpc.0g.ai'

async function rpcCall(method, params = []) {
  const resp = await fetch(ZG_RPC, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', method, params, id: 1 }),
    signal: AbortSignal.timeout(10000)
  })
  const data = await resp.json()
  return data.result
}

export async function getZeroGContractInfo(address) {
  const info = { age: null, creator: null, txCount: null, isProxy: false }

  try {
    // Tx count
    const txHex = await rpcCall('eth_getTransactionCount', [address, 'latest'])
    if (txHex) info.txCount = parseInt(txHex, 16)

    // Contract code (check if it's a contract)
    const code = await rpcCall('eth_getCode', [address, 'latest'])
    const isContract = code && code !== '0x' && code.length > 2

    // Check if proxy (EIP-1967)
    if (isContract && code.includes('363d3d373d3d3d363d73')) {
      info.isProxy = true
    }

    // Get code length as a proxy for complexity
    info.codeLength = isContract ? Math.floor((code.length - 2) / 2) : 0
  } catch (e) {
    console.error('0G RPC error:', e.message)
  }

  return info
}

export async function getZeroGBalance(address) {
  try {
    const hex = await rpcCall('eth_getBalance', [address, 'latest'])
    if (hex) {
      const wei = BigInt(hex)
      return Number(wei) / 1e18
    }
  } catch (e) {}
  return 0
}
