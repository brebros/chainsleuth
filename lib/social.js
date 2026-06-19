// Social signals checker — free tier (no API key needed)
// Uses DuckDuckGo search to check token mentions

export async function checkSocialSignals(tokenName, contractAddress) {
  const signals = {
    twitterMentions: 0,
    hasWebsite: false,
    hasGitHub: false,
    sentiment: 'unknown',
    redFlags: []
  }

  // Skip if tokenName is empty or undefined
  if (!tokenName || tokenName === 'Unknown') return signals

  try {
    // Check for website
    const websiteResp = await fetch(
      `https://html.duckduckgo.com/html/?q=${encodeURIComponent(tokenName + ' crypto token')}`,
      { signal: AbortSignal.timeout(10000), headers: { 'User-Agent': 'Mozilla/5.0' } }
    )
    const html = await websiteResp.text()

    // Simple heuristics
    if (html.includes('github.com')) signals.hasGitHub = true
    if (html.includes('.com') || html.includes('.io') || html.includes('.xyz')) signals.hasWebsite = true

    // Count mentions (rough estimate) — escape regex special chars to prevent injection
    const escapedName = tokenName.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const mentions = (html.toLowerCase().match(new RegExp(escapedName, 'g')) || []).length
    signals.twitterMentions = mentions

    // Basic sentiment
    if (mentions > 20) signals.sentiment = 'high'
    else if (mentions > 5) signals.sentiment = 'moderate'
    else signals.sentiment = 'low'

    // Red flags
    if (mentions < 2) signals.redFlags.push('Very low online presence')
    if (!signals.hasWebsite) signals.redFlags.push('No official website found')
    if (!signals.hasGitHub) signals.redFlags.push('No GitHub repository')

  } catch (e) {
    signals.redFlags.push('Social check failed')
  }

  return signals
}
