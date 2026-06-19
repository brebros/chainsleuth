import React, { useState } from 'react'

const CHAINS = [
  { id: 'eth', name: 'Ethereum', icon: '🔷', color: 'text-blue-400' },
  { id: 'bsc', name: 'BNB Chain', icon: '🟡', color: 'text-yellow-400' },
  { id: 'base', name: 'Base', icon: '🔵', color: 'text-blue-300' },
  { id: 'polygon', name: 'Polygon', icon: '🟣', color: 'text-purple-400' },
  { id: 'arbitrum', name: 'Arbitrum', icon: '🔵', color: 'text-blue-500' },
  { id: '0g', name: '0G', icon: '⚫', color: 'text-white' },
]

const EXAMPLES = {
  eth: [
    { name: 'USDT', addr: '0xdAC17F958D2ee523a2206206994597C13D831ec7', tag: 'Stablecoin' },
    { name: 'UNI', addr: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', tag: 'DeFi' },
    { name: 'LINK', addr: '0x514910771AF9Ca656af840dff83E8264EcF986CA', tag: 'Oracle' },
    { name: 'Honeypot', addr: '0x80e4f014c98320eab524ae16b0aaf1603f4dc01d', tag: '🚨 SCAM' },
  ],
  bsc: [
    { name: 'CAKE', addr: '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82', tag: 'DEX' },
    { name: 'BUSD', addr: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56', tag: 'Stablecoin' },
    { name: 'XVS', addr: '0xcF6BB5389c92Bdda8a3747Ddb454cB7a64626C63', tag: 'DeFi' },
  ],
  base: [
    { name: 'BRETT', addr: '0x532f27101965dd16442E59d40670FaF5eBB142E4', tag: 'Meme' },
  ],
  polygon: [
    { name: 'QUICK', addr: '0x831753DD70371b682959de3Cdb45Ce7421BaC44F', tag: 'DEX' },
  ],
  arbitrum: [
    { name: 'GMX', addr: '0xfc5A1A6EB076a2C7aD06eD22C90d7E710E35ad0a', tag: 'Perps' },
  ],
  '0g': [
    { name: '0G Storage', addr: '0x62D4144dB0F0a6fBBaeb6296c785C71B3D57C526', tag: 'Infra' },
  ],
}

export default function ContractInput({ onAnalyze, loading }) {
  const [address, setAddress] = useState('')
  const [chain, setChain] = useState('eth')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (address.trim() && !loading) {
      onAnalyze(address.trim(), chain)
    }
  }

  const isValidAddress = (addr) => {
    return /^0x[a-fA-F0-9]{40}$/.test(addr)
  }

  const examples = EXAMPLES[chain] || EXAMPLES.eth
  const currentChain = CHAINS.find(c => c.id === chain)

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Chain Selector */}
      <div className="flex gap-2 justify-center mb-4 flex-wrap">
        {CHAINS.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setChain(c.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
              chain === c.id
                ? 'bg-cyber-purple/20 border-2 border-cyber-purple text-white'
                : 'bg-cyber-dark/50 border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500'
            }`}
          >
            <span>{c.icon}</span>
            <span>{c.name}</span>
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="relative">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder={`Paste ${currentChain.name} contract address (0x...)`}
              className="w-full px-6 py-4 bg-cyber-dark border border-cyber-purple/30 rounded-xl text-white placeholder-gray-500 font-mono text-lg focus:border-cyber-purple focus:ring-2 focus:ring-cyber-purple/20 transition-all"
              disabled={loading}
            />
            {address && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                {isValidAddress(address) ? (
                  <span className="text-cyber-green">✓</span>
                ) : (
                  <span className="text-cyber-red">✗</span>
                )}
              </div>
            )}
          </div>
          <button
            type="submit"
            disabled={loading || !address.trim() || !isValidAddress(address)}
            className="px-8 py-4 bg-gradient-to-r from-cyber-purple to-cyber-blue rounded-xl font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed hover:from-cyber-purple/80 hover:to-cyber-blue/80 transition-all flex items-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Scanning...
              </>
            ) : (
              <>
                <span>🔍</span>
                Scan
              </>
            )}
          </button>
        </div>
      </form>

      {/* Example addresses */}
      <div className="mt-4 flex flex-wrap gap-2 justify-center">
        <span className="text-gray-500 text-sm">Try:</span>
        {examples.map((token) => (
          <button
            key={token.name}
            type="button"
            onClick={() => setAddress(token.addr)}
            className="px-3 py-1 bg-cyber-dark/50 border border-gray-700 rounded-lg text-sm text-gray-400 hover:text-white hover:border-cyber-purple/50 transition-colors"
          >
            {token.name} <span className="text-xs opacity-50">{token.tag}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
