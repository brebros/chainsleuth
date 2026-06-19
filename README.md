# 🔍 ChainSleuth

**AI-powered rug pull detector for Ethereum tokens.**

Built for [Zero Cup 2026](https://0g.ai/arena/zero-cup) by [The Bross](https://github.com/brebros).

🔗 **Live Demo:** [chainsleuth.vercel.app](https://chainsleuth.vercel.app)

---

## 🎯 What It Does

Paste any Ethereum contract address → Get instant risk assessment powered by AI.

**Features:**
- ✅ Real-time on-chain data from Etherscan V2
- ✅ AI analysis via 0G Compute (Qwen 2.5 Omni 7B)
- ✅ 7 security categories checked
- ✅ Risk score with confidence level
- ✅ Actionable recommendations

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (Vercel)                       │
│                    React + TailwindCSS                       │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                   Vercel Serverless API                      │
│              /api/analyze (Etherscan V2)                     │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    VPS Proxy (port 3001)                     │
│               /api/ai-analyze (0G Compute)                  │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                      0G Network                             │
│             Qwen 2.5 Omni 7B (AI Model)                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛡️ Security Checks

| Check | Description | Risk Impact |
|-------|-------------|-------------|
| Contract Verified | Source code verified on Etherscan | +25 if unverified |
| Owner Control | Owner functions detected | +10 |
| Honeypot Patterns | Sell restrictions, blacklists, anti-bot | +25 |
| Mint Authority | Unlimited minting possible | +20 |
| Holder Distribution | Top 10 concentration | +5 to +15 |
| Dangerous Code | selfdestruct, delegatecall | +15 |
| LP Locked | Liquidity pool status | +5 |

---

## 🚀 Tech Stack

- **Frontend:** React 18, TailwindCSS, Vite
- **Backend:** Vercel Serverless Functions
- **AI:** 0G Compute (Qwen 2.5 Omni 7B)
- **Data:** Etherscan V2 API
- **Deployment:** Vercel + VPS (0G Proxy)

---

## 📦 Local Development

```bash
# Clone
git clone https://github.com/brebros/chainsleuth.git
cd chainsleuth

# Install
npm install

# Dev server
npm run dev

# Build
npm run build
```

---

## 🔑 Environment Variables

```
ETHERSCAN_API_KEY=your_etherscan_key
VPS_0G_URL=http://77.90.51.232:3001
```

---

## ⚡ 0G Integration

ChainSleuth uses **0G Compute** for AI-powered analysis:

1. Etherscan data fetched (source code, holders, supply)
2. Data sent to VPS proxy
3. VPS calls 0G Compute with Qwen model
4. AI returns risk assessment with 7 categories
5. Score adjusted based on AI analysis

**Why 0G?** Decentralized AI inference = no single point of failure, censorship resistant, transparent.

---

## 📄 License

MIT

---

## 🙏 Acknowledgments

- [0G Network](https://0g.ai) — AI infrastructure
- [Etherscan](https://etherscan.io) — Blockchain data
- [Zero Cup 2026](https://0g.ai/arena/zero-cup) — Hackathon
