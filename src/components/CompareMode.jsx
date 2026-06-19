import React, { useState } from 'react'

const API_BASE = window.location.origin

const EXAMPLES = [
  { name: 'USDT vs UNI', addr1: '0xdAC17F958D2ee523a2206206994597C13D831ec7', addr2: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984' },
  { name: 'USDT vs Honeypot', addr1: '0xdAC17F958D2ee523a2206206994597C13D831ec7', addr2: '0x80e4f014c98320eab524ae16b0aaf1603f4dc01d' },
  { name: 'CAKE vs XVS', addr1: '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82', addr2: '0xcF6BB5389c92Bdda8a3747Ddb454cB7a64626C63' },
]

export default function CompareMode() {
  const [address1, setAddress1] = useState('')
  const [address2, setAddress2] = useState('')
  const [result1, setResult1] = useState(null)
  const [result2, setResult2] = useState(null)
  const [loading1, setLoading1] = useState(false)
  const [loading2, setLoading2] = useState(false)
  const [error, setError] = useState(null)

  const isValidAddress = (addr) => /^0x[a-fA-F0-9]{40}$/.test(addr)
  const isLoading = loading1 || loading2

  const handleCompare = async () => {
    if (!isValidAddress(address1) || !isValidAddress(address2)) return
    setLoading1(true)
    setLoading2(true)
    setResult1(null)
    setResult2(null)
    setError(null)

    // Fetch both in parallel — if one fails, the other still shows
    const fetchOne = async (addr, setResult, setLoading) => {
      try {
        const res = await fetch(`${API_BASE}/api/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address: addr })
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err.error || `HTTP ${res.status}`)
        }
        const data = await res.json()
        setResult(data)
      } catch (err) {
        setError(err.message || 'Failed to analyze')
      } finally {
        setLoading(false)
      }
    }

    await Promise.allSettled([
      fetchOne(address1, setResult1, setLoading1),
      fetchOne(address2, setResult2, setLoading2)
    ])
  }

  const getScoreColor = (score) => {
    if (score == null || isNaN(score)) return 'text-gray-400'
    if (score <= 30) return 'text-green-400'
    if (score <= 70) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getScoreBg = (score) => {
    if (score == null || isNaN(score)) return 'bg-gray-500/20 border-gray-500/30'
    if (score <= 30) return 'bg-green-500/20 border-green-500/30'
    if (score <= 70) return 'bg-yellow-500/20 border-yellow-500/30'
    return 'bg-red-500/20 border-red-500/30'
  }

  const getLabel = (score) => {
    if (score == null || isNaN(score)) return 'NO DATA'
    if (score <= 30) return 'LOW RISK'
    if (score <= 70) return 'MODERATE RISK'
    return 'HIGH RISK'
  }

  const renderCard = (result, loading, addr) => {
    if (loading) {
      return (
        <div className="p-6 rounded-2xl border bg-gray-500/10 border-gray-500/30">
          <div className="flex flex-col items-center justify-center py-8">
            <svg className="animate-spin h-8 w-8 text-purple-400 mb-3" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-gray-400 text-sm">Scanning...</span>
          </div>
        </div>
      )
    }

    if (!result) return null

    return (
      <div className={`p-6 rounded-2xl border ${getScoreBg(result.riskScore)}`}>
        <div className="text-center mb-4">
          <div className={`text-5xl font-black font-mono ${getScoreColor(result.riskScore)}`}>
            {result.riskScore != null ? result.riskScore : '—'}
          </div>
          <div className={`text-sm font-bold mt-2 ${getScoreColor(result.riskScore)}`}>
            {getLabel(result.riskScore)}
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Name</span>
            <span className="text-white font-mono">{result.contractInfo?.name || 'Unknown'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Verified</span>
            <span className={result.contractInfo?.isVerified ? 'text-green-400' : 'text-red-400'}>
              {result.contractInfo?.isVerified ? '✓ Yes' : '✗ No'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Chain</span>
            <span className="text-white">{result.chain?.toUpperCase() || 'ETH'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Top 10 Holders</span>
            <span className="text-white">{result.holderData?.top10Concentration || 0}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Flags</span>
            <span className="text-white">
              <span className="text-green-400">{result.flags?.filter(f => f.status === 'safe').length || 0}</span>
              {' / '}
              <span className="text-yellow-400">{result.flags?.filter(f => f.status === 'warning').length || 0}</span>
              {' / '}
              <span className="text-red-400">{result.flags?.filter(f => f.status === 'danger').length || 0}</span>
            </span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-700/50 text-xs text-gray-500 truncate">
          {result.address}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-4xl mx-auto mt-16">
      <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8">
        <div className="flex items-center gap-2 mb-6">
          <span className="text-2xl">⚖️</span>
          <h2 className="text-2xl font-bold text-white">Compare Contracts</h2>
        </div>
        <p className="text-gray-400 text-sm mb-6">Paste two contract addresses to compare their risk profiles side by side.</p>

        {/* Quick examples */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="text-gray-500 text-sm">Try:</span>
          {EXAMPLES.map((ex) => (
            <button
              key={ex.name}
              onClick={() => { setAddress1(ex.addr1); setAddress2(ex.addr2) }}
              className="px-3 py-1 bg-gray-800/50 border border-gray-700 rounded-lg text-sm text-gray-400 hover:text-white hover:border-purple-500/50 transition-colors"
            >
              {ex.name}
            </button>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <input
            type="text"
            value={address1}
            onChange={(e) => setAddress1(e.target.value)}
            placeholder="First contract (0x...)"
            className="px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white font-mono text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
          />
          <input
            type="text"
            value={address2}
            onChange={(e) => setAddress2(e.target.value)}
            placeholder="Second contract (0x...)"
            className="px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white font-mono text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
          />
        </div>

        <button
          onClick={handleCompare}
          disabled={isLoading || !isValidAddress(address1) || !isValidAddress(address2)}
          className="w-full py-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed hover:from-purple-600 hover:to-blue-600 transition-all flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Scanning...
            </>
          ) : (
            <>⚖️ Compare Now</>
          )}
        </button>

        {/* Error */}
        {error && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm text-center">
            ⚠️ {error}
          </div>
        )}

        {/* Results */}
        {(result1 || result2 || loading1 || loading2) && (
          <div className="mt-8 grid md:grid-cols-2 gap-6">
            {renderCard(result1, loading1, address1)}
            {renderCard(result2, loading2, address2)}
          </div>
        )}

        {/* Verdict hint */}
        {result1 && result2 && result1.riskScore != null && result2.riskScore != null && (
          <div className="mt-6 p-4 bg-gray-800/50 border border-gray-700 rounded-xl text-center">
            <span className="text-gray-400 text-sm">
              {result1.riskScore < result2.riskScore
                ? `📊 First contract is ${result2.riskScore - result1.riskScore} points safer`
                : result2.riskScore < result1.riskScore
                  ? `📊 Second contract is ${result1.riskScore - result2.riskScore} points safer`
                  : '📊 Both contracts have the same risk level'}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
