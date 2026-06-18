import React from 'react'

export default function AnalysisResult({ analysis }) {
  const getFlagIcon = (status) => {
    switch (status) {
      case 'safe': return '🟢'
      case 'warning': return '⚠️'
      case 'danger': return '🚩'
      default: return '❓'
    }
  }

  const getFlagColor = (status) => {
    switch (status) {
      case 'safe': return 'text-cyber-green'
      case 'warning': return 'text-cyber-yellow'
      case 'danger': return 'text-cyber-red'
      default: return 'text-gray-400'
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Contract Info */}
      <div className="bg-cyber-dark/80 border border-cyber-purple/20 rounded-xl p-6">
        <div className="text-gray-400 text-sm mb-2">CONTRACT ADDRESS</div>
        <div className="font-mono text-cyber-purple break-all">
          {analysis.address}
        </div>
        
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{analysis.holderData.totalHolders.toLocaleString()}</div>
            <div className="text-xs text-gray-400">Total Holders</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{analysis.holderData.top10Concentration}%</div>
            <div className="text-xs text-gray-400">Top 10 Holdings</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{analysis.holderData.contractAge} days</div>
            <div className="text-xs text-gray-400">Contract Age</div>
          </div>
        </div>
      </div>

      {/* Security Checklist */}
      <div className="bg-cyber-dark/80 border border-cyber-purple/20 rounded-xl p-6">
        <div className="text-gray-400 text-sm mb-4">SECURITY CHECKLIST</div>
        <div className="space-y-3">
          {analysis.flags.map((flag, index) => (
            <div key={index} className="flex items-center gap-3 p-3 bg-cyber-darker/50 rounded-lg">
              <span className="text-xl">{getFlagIcon(flag.status)}</span>
              <div className="flex-1">
                <div className="font-medium">{flag.name}</div>
                <div className="text-sm text-gray-400">{flag.details}</div>
              </div>
              <span className={`text-sm font-medium ${getFlagColor(flag.status)}`}>
                {flag.status.toUpperCase()}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* AI Summary */}
      <div className="bg-cyber-dark/80 border border-cyber-purple/20 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">🤖</span>
          <span className="text-gray-400 text-sm">AI ANALYSIS SUMMARY</span>
        </div>
        <p className="text-gray-300 leading-relaxed">
          {analysis.summary}
        </p>
      </div>

      {/* Disclaimer */}
      <div className="text-center text-xs text-gray-500 mt-6">
        ⚠️ This is NOT financial advice. Always do your own research (DYOR).
      </div>
    </div>
  )
}
