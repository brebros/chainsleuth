import React, { useState, useEffect } from 'react'

const API_BASE = window.location.origin

export default function Watchlist() {
  const [watchlist, setWatchlist] = useState([])
  const [address, setAddress] = useState('')
  const [scanning, setScanning] = useState(false)
  const [results, setResults] = useState({})

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('chainsleuth_watchlist') || '[]')
      setWatchlist(saved)
    } catch {}
  }, [])

  const addToWatchlist = () => {
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) return
    if (watchlist.includes(address)) return
    const newList = [...watchlist, address]
    setWatchlist(newList)
    localStorage.setItem('chainsleuth_watchlist', JSON.stringify(newList))
    setAddress('')
  }

  const removeFromWatchlist = (addr) => {
    const newList = watchlist.filter(a => a !== addr)
    setWatchlist(newList)
    localStorage.setItem('chainsleuth_watchlist', JSON.stringify(newList))
  }

  const scanAll = async () => {
    setScanning(true)
    const newResults = {}

    for (const addr of watchlist) {
      try {
        const res = await fetch(`${API_BASE}/api/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address: addr })
        })
        const data = await res.json()
        newResults[addr] = data
      } catch (err) {
        newResults[addr] = { error: err.message }
      }
    }

    setResults(newResults)
    setScanning(false)
  }

  const getScoreColor = (score) => {
    if (score <= 30) return 'text-green-400'
    if (score <= 70) return 'text-yellow-400'
    return 'text-red-400'
  }

  return (
    <div className="w-full max-w-2xl mx-auto mt-16">
      <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">👁️</span>
          <h3 className="text-lg font-semibold text-white">Watchlist</h3>
          <span className="text-sm text-gray-500">({watchlist.length})</span>
        </div>

        {/* Add form */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Add contract to watchlist..."
            className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm font-mono focus:border-purple-500 transition-colors"
          />
          <button
            onClick={addToWatchlist}
            disabled={!/^0x[a-fA-F0-9]{40}$/.test(address)}
            className="px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg text-sm font-medium hover:bg-purple-500/30 transition-colors disabled:opacity-50"
          >
            + Add
          </button>
          <button
            onClick={scanAll}
            disabled={watchlist.length === 0 || scanning}
            className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg text-sm font-medium hover:bg-blue-500/30 transition-colors disabled:opacity-50"
          >
            {scanning ? '⏳' : '🔄'} Scan All
          </button>
        </div>

        {/* List */}
        {watchlist.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            No contracts in watchlist. Add one above!
          </div>
        ) : (
          <div className="space-y-2">
            {watchlist.map((addr) => (
              <div key={addr} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-sm text-gray-300 truncate">{addr}</div>
                  {results[addr] && !results[addr].error && (
                    <div className="text-xs text-gray-500 mt-1">
                      {results[addr].contractInfo?.name || 'Unknown'} • Last scan: {new Date().toLocaleTimeString()}
                    </div>
                  )}
                </div>
                {results[addr] && !results[addr].error ? (
                  <div className={`text-lg font-bold font-mono ${getScoreColor(results[addr].riskScore)}`}>
                    {results[addr].riskScore}
                  </div>
                ) : (
                  <button
                    onClick={() => removeFromWatchlist(addr)}
                    className="text-gray-500 hover:text-red-400 text-sm"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
