# 🔍 ChainSleuth

**AI-powered smart contract risk analyzer. Paste a contract address — get instant risk assessment.**

Built by [The Bross](https://github.com/brebros) 🇮🇩 Indonesia for [Zero Cup 2026](https://0g.ai/arena/zero-cup).

🔗 **[chainsleuth.vercel.app](https://chainsleuth.vercel.app)**

---

## Why ChainSleuth?

Rug pulls cost traders **$4.7B+ annually**. Most victims don't know what hit them until the liquidity vanishes.

ChainSleuth combines **on-chain data analysis** with **AI inference** to detect dangerous contract patterns before you lose your money. No wallet connection. No sign-up. Paste an address, get a verdict.

**7 chains. 17+ security checks. 0G-powered AI. Under 10 seconds.**

---

## Features

| | Feature | What it does |
|---|---------|-------------|
| 🔗 | **Auto-Detect Chain** | Paste any address — we scan all 6 chains and tell you which one it's on |
| 📊 | **Risk Scoring** | 0–100 scale. Low (safe) → Medium (caution) → High (danger). Consistent every time. |
| 🤖 | **AI Analysis** | 0G Compute (Qwen) explains *why* a contract is risky in plain language |
| 🛡️ | **17+ Checks** | Ownership, honeypot, mint, blacklist, tax, LP lock, dangerous code patterns |
| ⚖️ | **Compare Mode** | Side-by-side comparison of up to 3 contracts |
| 📄 | **Shareable Links** | `chainsleuth.vercel.app/scan/0x...` — share results with one click |
| 💡 | **Risk Explanations** | Every flag comes with a human-readable tooltip explaining *why* it matters |
| 🌓 | **Dark / Light Mode** | Because hackers also need to read at night |
| 📱 | **Mobile Ready** | Works on any device. No app download. |
| 📥 | **Export PDF** | One-click report for your records or sharing |

---

## Supported Chains

| Chain | Status | RPC |
|-------|--------|-----|
| Ethereum | ✅ Full | Goerli Public |
| BNB Chain (BSC) | ✅ Full | Public Node |
| Base | ✅ Full | Base.org |
| Polygon | ✅ Full | Polygon RPC |
| Arbitrum | ✅ Full | Arb1 |
| 0G (Zero Gravity) | ✅ Full | RPC + AI Inference |

---

## Architecture

```
┌──────────────────────────────────────────────────────┐
│               Frontend (Vercel)                       │
│          React 18 · TailwindCSS · Vite               │
│    [Auto-Detect] [Compare] [Share] [Dark/Light]     │
└────────────────────┬─────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────┐
│           Vercel Serverless API (/api/analyze)        │
│                                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐│
│  │  Etherscan   │  │  GoPlus     │  │ Chain Detect  ││
│  │  V2 API      │  │  Security   │  │ (6 chains)    ││
│  └─────────────┘  └─────────────┘  └──────────────┘│
└────────────────────┬─────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────┐
│            VPS Proxy (port 3001)                      │
│         Chainsleuth Proxy Service                     │
└────────────────────┬─────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────┐
│                 0G Compute Network                    │
│           Qwen 3.6-Plus (AI Inference)               │
│       Decentralized · Censorship-Resistant           │
└──────────────────────────────────────────────────────┘
```

---

## Security Checks

**Rule-based scoring (17 flags):**

| Category | Checks | Max Impact |
|----------|--------|------------|
| **Verification** | Source code verified, proxy detection | +25 |
| **Ownership** | Owner functions, proxy pattern, pause, freeze | +10 |
| **Honeypot** | Sell restrictions, blacklist, anti-bot, max TX limits | +25 |
| **Mint** | Unlimited minting capability | +20 |
| **Holder Distribution** | Top 10 holder concentration | +5 to +15 |
| **Dangerous Code** | selfdestruct, delegatecall (non-proxy), assembly calls | +15 |
| **LP Status** | Liquidity pool lock status | +5 |
| **Tax** | Abnormal buy/sell tax (>10%) | +5 |

**AI-powered analysis (0G Compute):**
- Source code review with natural language explanation
- Tokenomics assessment
- Pattern detection for known scam templates
- Risk summary with confidence level

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, TailwindCSS, Vite |
| Backend API | Vercel Serverless Functions (Node.js) |
| AI Inference | 0G Compute (Qwen 3.6-Plus) |
| Data Sources | Etherscan V2 API, GoPlus Security API, Public RPCs |
| Infrastructure | Vercel (frontend), VPS HostBrr (AI proxy) |
| Multi-chain | 6 EVM chains via auto-detect |

---

## Getting Started

### Demo

1. Go to [chainsleuth.vercel.app](https://chainsleuth.vercel.app)
2. Paste a contract address (try `0xdAC17F958D2ee523a2206206994597C13D831ec7` — USDT)
3. Select chain (or let auto-detect find it)
4. Click **Analyze**
5. View risk score, security checks, AI explanation, and GoPlus data

### Local Development

```bash
git clone https://github.com/brebros/chainsleuth.git
cd chainsleuth
npm install
npm run dev
```

### Environment Variables

```bash
# Required (Vercel)
ETHERSCAN_API_KEY=your_etherscan_v2_key

# Optional (for AI — already configured on Vercel)
VPS_0G_URL=http://77.90.51.232:3001
```

---

## How It Works

1. **Address In** → User pastes contract address
2. **Auto-Detect** → System scans 6 chains to find the contract
3. **Data Pull** → Etherscan V2 fetches source code, token holders, supply data
4. **Security Scan** → 17+ rule-based checks flag dangerous patterns
5. **AI Analysis** → 0G Compute reviews source code and explains risks
6. **Score Generated** → Rule-based score (authoritative) + AI summary (explanation)
7. **Verdict Delivered** → Risk level, confidence, and actionable recommendations

**Total time: ~3-8 seconds.** Rule-based checks are instant. AI analysis adds 2-5 seconds.

---

## Roadmap

- [x] Multi-chain support (6 chains)
- [x] Auto-detect chain from address
- [x] AI-powered risk analysis via 0G Compute
- [x] Compare mode (side-by-side)
- [x] Share links with hash routing
- [x] Risk explanation tooltips
- [x] Dark/Light mode
- [x] Export PDF reports
- [x] Mobile responsive
- [ ] Portfolio risk scanner (batch analysis)
- [ ] Historical rug pull database
- [ ] Token similarity detection
- [ ] Real-time price/liquidity overlay

---

## Zero Cup 2026

Built for the [Zero Cup 2026](https://0g.ai/arena/zero-cup) hackathon by **The Bross**.

**Why 0G?**
- Decentralized AI inference = no single point of failure
- No API keys to steal, no rate limits, no vendor lock-in
- Censorship-resistant — works even when centralized APIs don't
- Transparent — you can verify the AI model is what it claims to be

---

## License

MIT

---

## Acknowledgments

- [0G Network](https://0g.ai) — Decentralized AI infrastructure
- [Etherscan](https://etherscan.io) — Blockchain data API
- [GoPlus Security](https://gopluslabs.io) — Token security API
- [Zero Cup 2026](https://0g.ai/arena/zero-cup) — The hackathon that made this happen
