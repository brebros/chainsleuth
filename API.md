# ChainSleuth API Documentation

## Base URL
```
https://chainsleuth.vercel.app
```

## Endpoints

### POST /api/analyze

Analyze a smart contract for rug pull indicators.

**Request:**
```json
{
  "address": "0xdAC17F958D2ee523a2206206994597C13D831ec7"
}
```

**Response:**
```json
{
  "address": "0xdAC17F958D2ee523a2206206994597C13D831ec7",
  "riskScore": 25,
  "contractInfo": {
    "name": "TetherToken",
    "compiler": "v0.4.18",
    "isVerified": true,
    "age": 3200,
    "txCount": 1500000,
    "creator": "0x...",
    "isProxy": false
  },
  "holderData": {
    "totalHolders": 5000,
    "top10Concentration": 15,
    "totalSupply": "1000000000000"
  },
  "flags": [
    {
      "name": "Contract Verified",
      "status": "safe",
      "details": "Verified. Compiler: v0.4.18"
    }
  ],
  "summary": "LOW RISK: Contract is verified...",
  "aiSource": "0g-compute",
  "aiDetails": [
    {
      "category": "Contract Verification",
      "status": "safe",
      "explanation": "Source code is verified..."
    }
  ],
  "aiRecommendations": [
    "Contract appears safe for interaction"
  ],
  "aiConfidence": 0.85,
  "liquidity": {
    "hasLiquidity": true,
    "recentTxCount": 10,
    "lastActivity": "2026-06-19T..."
  }
}
```

**Error Response:**
```json
{
  "error": "Invalid contract address"
}
```

### GET /api/health

Check API status.

**Response:**
```json
{
  "status": "ok",
  "version": "1.0.0",
  "storage": "local",
  "compute": "0g-compute"
}
```

## Rate Limits
- Free tier: 5 requests per second (Etherscan limitation)
- 0G Compute: ~30 second timeout per analysis

## Error Codes
- `400` - Invalid address format
- `405` - Method not allowed
- `500` - Internal server error

## Usage Examples

### cURL
```bash
curl -X POST https://chainsleuth.vercel.app/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"address": "0xdAC17F958D2ee523a2206206994597C13D831ec7"}'
```

### JavaScript
```javascript
const response = await fetch('https://chainsleuth.vercel.app/api/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ address: '0xdAC17F958D2ee523a2206206994597C13D831ec7' })
});
const data = await response.json();
console.log(`Risk Score: ${data.riskScore}`);
```

### Python
```python
import requests

response = requests.post(
    'https://chainsleuth.vercel.app/api/analyze',
    json={'address': '0xdAC17F958D2ee523a2206206994597C13D831ec7'}
)
data = response.json()
print(f"Risk Score: {data['riskScore']}")
```

## Data Sources
- **Etherscan V2 API** - Contract source code, token holders, supply
- **0G Compute** - AI-powered risk analysis (Qwen 2.5 Omni 7B)
- **Uniswap** - Liquidity pair detection

## Changelog

### v1.1.0 (2026-06-19)
- Added AI detailed analysis (7 categories)
- Added recommendations and confidence score
- Added token age and transaction count
- Added proxy contract detection
- Added Uniswap liquidity check
- Added compare mode
- Added watchlist feature

### v1.0.0 (2026-06-18)
- Initial release
- Basic risk scoring
- 0G Compute AI analysis
- Etherscan V2 integration
