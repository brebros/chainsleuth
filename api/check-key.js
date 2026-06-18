export default async function handler(req, res) {
  const key = process.env.ZG_COMPUTE_KEY || ''
  const stripped = key.replace(/^Bearer\s+/i, '').replace(/[\r\n]+/g, '')
  
  res.json({
    rawLength: key.length,
    strippedLength: stripped.length,
    first10: stripped.substring(0, 10),
    last10: stripped.substring(stripped.length - 10),
    hasNewlines: key.includes('\n'),
    hasBearer: key.startsWith('Bearer'),
    // Check for common corruption
    hasNullBytes: key.includes('\0'),
    hasHighBytes: [...stripped].some(c => c.charCodeAt(0) > 127)
  })
}
