import React, { useState, useEffect } from 'react'

export default function History() {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

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

  if (loading) {
    return (
      <div className="text-center py-8 text-gray-400">
        Loading history...
      </div>
    )
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No scans yet. Try scanning a contract above!
      </div>
    )
  }

  return (
    <div className="w-full max-w-2xl mx-auto mt-8">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <span>📋</span> Scan History
      </h2>
      <div className="space-y-2">
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
      </div>
    </div>
  )
}
