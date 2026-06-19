// Score cache — prevents inconsistent scoring from cold starts
// Same address gets same score for 5 minutes

const cache = new Map()
const TTL = 5 * 60 * 1000 // 5 minutes

export function getCachedScore(address, chain) {
  const key = `${address.toLowerCase()}:${chain}`
  const entry = cache.get(key)
  if (entry && Date.now() - entry.time < TTL) {
    return entry.score
  }
  return null
}

export function setCachedScore(address, chain, score) {
  const key = `${address.toLowerCase()}:${chain}`
  cache.set(key, { score, time: Date.now() })
  // Cleanup old entries every 100 writes
  if (cache.size > 100) {
    const now = Date.now()
    for (const [k, v] of cache) {
      if (now - v.time > TTL) cache.delete(k)
    }
  }
}
