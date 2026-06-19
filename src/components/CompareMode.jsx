import React, { useState } from 'react'

const API_BASE = window.location.origin

export default function CompareMode() {
  const [address1, setAddress1] = useState('')
  const [address2, setAddress2] = useState('')
  const [result1, setResult1] = useState(null)
  const [result2, setResult2] = useState(null)
  const [loading, setLoading] = useState(false)

  const isValidAddress = (addr) => /^0x[a-fA-F0-9]{40}$/.test(addr)

  const handleCompare = async () => {
    if (!isValidAddress(address1) || !isValidAddress(address2)) return
    setLoading(true)
    setResult1(null)
    setResult2(null)

    try {
      const [res1, res2] = await Promise.all([
        fetch(`${API_BASE}/api/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address: address1 })
        }).then(r => r.json()),
        fetch(`${API_BASE}/api/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address: address2 })
        }).then(r => r.json())
      ])
      setResult1(res1)
      setResult2(res2)
    } catch (err) {
      console.error('Compare failed:', err)
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score) => {
    if (score <= 30) return 'text-green-400'
    if (score <= 70) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getScoreBg = (score) => {
    if (score <= 30) return 'bg-green-500/20 border-green-500/30'
    if (score <= 70) return 'bg-yellow-500/20 border-yellow-500/30'
    return 'bg-red-500/20 border-red-500/30'
  }

  const getLabel = (score) => {
    if (score <= 30) return 'LOW RISK'
    if (score <= 70) return 'MODERATE RISK'
    return 'HIGH RISK'
  }

  return (
    <div className="w-full max-w-4xl mx-auto mt-16">
      <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8">
        <div className="flex items-center gap-2 mb-6">
          <span className="text-2xl">⚖️</span>
          <h2 className="text-2xl font-bold text-white">Compare Contracts</h2>
        </div>
        <p className="text-gray-400 text-sm mb-6">Paste two contract addresses to compare their risk profiles side by side.</p>

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
          disabled={loading || !isValidAddress(address1) || !isValidAddress(address2)}
          className="w-full py-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed hover:from-purple-600 hover:to-blue-600 transition-all"
        >
          {loading ? 'Comparing...' : '⚖️ Compare Now'}
        </button>

        {/* Results */}
        {result1 && result2 && (
          <div className="mt-8 grid md:grid-cols-2 gap-6">
            {[result1, result2].map((result, idx) => (
              <div key={idx} className={`p-6 rounded-2xl border ${getScoreBg(result.riskScore)}`}>
                <div className="text-center mb-4">
                  <div className={`text-5xl font-black font-mono ${getScoreColor(result.riskScore)}`}>
                    {result.riskScore}
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
                    <span className="text-gray-400">Age</span>
                    <span className="text-white">{result.contractInfo?.age ? result.contractInfo.age + ' days' : 'N/A'}</span>
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
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
