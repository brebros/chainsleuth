import React, { useState, useEffect } from 'react'

export default function History() {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = () => {
    try {
      const data = JSON.parse(localStorage.getItem('chainsleuth_history') || '[]')
      setHistory(data.slice(0, 20))
    } catch (error) {
      console.error('Failed to load history')
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score) => {
    if (score <= 30) return 'text-cyber-green'
    if (score <= 70) return 'text-cyber-yellow'
    return 'text-cyber-red'
  }

  const clearHistory = () => {
    localStorage.removeItem('chainsleuth_history')
    setHistory([])
  }

  if (loading) return null
  if (history.length === 0) return null

  return (
    <div className="w-full max-w-2xl mx-auto mt-8">
      {/* Toggle header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 bg-cyber-dark/50 border border-gray-800 rounded-xl hover:border-cyber-purple/30 transition-all"
      >
        <div className="flex items-center gap-2">
          <span>📋</span>
          <span className="text-gray-400 text-sm font-medium">Scan History</span>
          <span className="text-xs text-gray-600">({history.length})</span>
        </div>
        <span className={`text-gray-500 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>

      {/* Collapsible list */}
      {expanded && (
        <div className="mt-2 space-y-2 animate-fade-in">
          {history.map((scan, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-cyber-dark/50 border border-gray-800 rounded-lg hover:border-cyber-purple/30 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="font-mono text-sm text-gray-300 truncate">
                  {scan.address}
                </div>
                <div className="text-xs text-gray-500">
                  {scan.contractInfo?.name || 'Unknown'} • {new Date(scan.timestamp).toLocaleDateString()}
                </div>
              </div>
              <div className={`text-lg font-bold font-mono ${getScoreColor(scan.riskScore)}`}>
                {scan.riskScore}
              </div>
            </div>
          ))}
          <button
            onClick={clearHistory}
            className="w-full p-2 text-xs text-gray-500 hover:text-red-400 transition-colors"
          >
            Clear History
          </button>
        </div>
      )}
    </div>
  )
}
