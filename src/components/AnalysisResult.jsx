import React from 'react'
import HolderChart from './HolderChart'

export default function AnalysisResult({ analysis }) {
  const getFlagIcon = (status) => {
    switch (status) {
      case 'safe': return '🟢'
      case 'warning': return '🟡'
      case 'danger': return '🔴'
      default: return '⚪'
    }
  }

  const getFlagColor = (status) => {
    switch (status) {
      case 'safe': return 'text-green-400 bg-green-500/10 border-green-500/20'
      case 'warning': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'
      case 'danger': return 'text-red-400 bg-red-500/10 border-red-500/20'
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/20'
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Contract Info Card */}
      <div className="bg-cyber-dark/80 border border-cyber-purple/20 rounded-2xl p-6 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Contract Address</div>
            <div className="font-mono text-cyber-purple text-sm break-all">
              {analysis.address}
            </div>
          </div>
          {analysis.contractInfo?.isVerified && (
            <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30">
              ✓ Verified
            </span>
          )}
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-cyber-darker/50 rounded-xl">
          <div className="text-center">
            <div className="text-2xl font-bold text-white font-mono truncate">
              {analysis.holderData?.totalSupply && analysis.holderData.totalSupply !== 'N/A' 
                ? Number(analysis.holderData.totalSupply).toLocaleString() 
                : '—'}
            </div>
            <div className="text-xs text-gray-400 mt-1">Total Supply</div>
          </div>
          <div className="text-center border-x border-gray-800">
            <div className="text-2xl font-bold text-white font-mono">
              {analysis.contractInfo?.compiler?.match(/v[\d.]+/)?.[0] || '—'}
            </div>
            <div className="text-xs text-gray-400 mt-1">Compiler</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white font-mono truncate">
              {analysis.contractInfo?.name || '—'}
            </div>
            <div className="text-xs text-gray-400 mt-1">Token Name</div>
          </div>
        </div>
      </div>

      {/* Contract Overview / Holder Chart */}
      <HolderChart
        concentration={analysis.holderData?.top10Concentration}
        totalHolders={analysis.holderData?.totalHolders}
        contractInfo={analysis.contractInfo}
        holderData={analysis.holderData}
      />

      {/* Security Checklist */}
      <div className="bg-cyber-dark/80 border border-cyber-purple/20 rounded-2xl p-6 backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-5">
          <span className="text-lg">🛡️</span>
          <span className="text-gray-400 text-sm uppercase tracking-wider">Security Checklist</span>
        </div>
        
        <div className="space-y-3">
          {analysis.flags?.map((flag, index) => (
            <div 
              key={index} 
              className={`flex items-center gap-4 p-4 rounded-xl border transition-all hover:scale-[1.01] ${getFlagColor(flag.status)}`}
            >
              <span className="text-xl flex-shrink-0">{getFlagIcon(flag.status)}</span>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-white">{flag.name}</div>
                <div className="text-sm opacity-75 mt-0.5">{flag.details}</div>
              </div>
              <span className="text-xs font-bold uppercase tracking-wider flex-shrink-0 opacity-75">
                {flag.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* AI Summary */}
      <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-cyber-purple/30 rounded-2xl p-6 backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">🤖</span>
          <span className="text-gray-300 text-sm uppercase tracking-wider font-semibold">AI Analysis Summary</span>
        </div>
        <p className="text-gray-200 leading-relaxed text-lg">
          {analysis.summary}
        </p>
      </div>

      {/* Disclaimer */}
      <div className="text-center text-xs text-gray-500 py-4 border-t border-gray-800">
        ⚠️ This is NOT financial advice. Always do your own research (DYOR) before investing.
      </div>
    </div>
  )
}
