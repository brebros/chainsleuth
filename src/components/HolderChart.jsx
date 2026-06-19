import React from 'react'

export default function HolderChart({ concentration, totalHolders, contractInfo, holderData }) {
  const top10 = concentration || 0
  const supply = holderData?.totalSupply || 'N/A'
  const hasHolderData = totalHolders && totalHolders !== 'N/A'

  return (
    <div className="bg-cyber-dark/80 border border-cyber-purple/20 rounded-xl p-6">
      <div className="text-gray-400 text-sm mb-4 flex items-center gap-2">
        <span>📊</span> CONTRACT OVERVIEW
      </div>

      {hasHolderData ? (
        <div className="flex items-center gap-8">
          <div className="relative w-32 h-32">
            <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
              <circle cx="18" cy="18" r="14" fill="none" stroke="#1f2937" strokeWidth="4" />
              <circle
                cx="18" cy="18" r="14" fill="none"
                stroke={top10 > 50 ? '#ef4444' : top10 > 30 ? '#eab308' : '#8b5cf6'}
                strokeWidth="4"
                strokeDasharray={`${top10} ${100 - top10}`}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-white">{top10}%</span>
              <span className="text-xs text-gray-400">Top 10</span>
            </div>
          </div>
          <div className="flex-1 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: top10 > 50 ? '#ef4444' : top10 > 30 ? '#eab308' : '#8b5cf6' }} />
                <span className="text-sm text-gray-300">Top 10 Holders</span>
              </div>
              <span className="text-sm font-mono font-medium text-white">{top10}%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#1f2937' }} />
                <span className="text-sm text-gray-300">Others</span>
              </div>
              <span className="text-sm font-mono font-medium text-white">{100 - top10}%</span>
            </div>
            <div className="pt-2 border-t border-gray-800">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Total Holders</span>
                <span className="text-sm font-mono font-medium text-cyber-purple">
                  {totalHolders?.toLocaleString() || 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-cyber-darker/50 rounded-lg">
            <div className="text-xs text-gray-400 mb-1">Token Name</div>
            <div className="text-sm font-mono text-white font-semibold truncate">
              {contractInfo?.name || 'Unknown'}
            </div>
          </div>
          <div className="p-3 bg-cyber-darker/50 rounded-lg">
            <div className="text-xs text-gray-400 mb-1">Compiler</div>
            <div className="text-sm font-mono text-white truncate">
              {contractInfo?.compiler || 'Unknown'}
            </div>
          </div>
          <div className="p-3 bg-cyber-darker/50 rounded-lg">
            <div className="text-xs text-gray-400 mb-1">Total Supply</div>
            <div className="text-sm font-mono text-cyber-purple truncate">
              {supply !== 'N/A' ? Number(supply).toLocaleString() : 'N/A'}
            </div>
          </div>
          <div className="p-3 bg-cyber-darker/50 rounded-lg">
            <div className="text-xs text-gray-400 mb-1">Verified Source</div>
            <div className="text-sm font-mono">
              {contractInfo?.isVerified ? (
                <span className="text-green-400">✓ Verified</span>
              ) : (
                <span className="text-red-400">✗ Not Verified</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Warnings */}
      {hasHolderData && top10 > 50 && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          ⚠️ High whale concentration — potential rug pull risk
        </div>
      )}
      {hasHolderData && top10 > 30 && top10 <= 50 && (
        <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-400 text-sm">
          ⚠️ Moderate concentration — exercise caution
        </div>
      )}
    </div>
  )
}
