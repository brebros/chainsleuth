import React, { useState } from 'react'

export default function ContractInput({ onAnalyze, loading }) {
  const [address, setAddress] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (address.trim() && !loading) {
      onAnalyze(address.trim())
    }
  }

  const isValidAddress = (addr) => {
    return /^0x[a-fA-F0-9]{40}$/.test(addr)
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Paste contract address (0x...)"
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
        {[
          { name: 'USDC', addr: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' },
          { name: 'WETH', addr: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' },
        ].map((token) => (
          <button
            key={token.name}
            type="button"
            onClick={() => setAddress(token.addr)}
            className="px-3 py-1 bg-cyber-dark/50 border border-gray-700 rounded-lg text-sm text-gray-400 hover:text-white hover:border-cyber-purple/50 transition-colors"
          >
            {token.name}
          </button>
        ))}
      </div>
    </div>
  )
}
