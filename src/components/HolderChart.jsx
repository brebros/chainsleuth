import React from 'react'

export default function HolderChart({ concentration, totalHolders }) {
  // Generate fake holder segments for visualization
  const top10 = concentration || 0
  const rest = 100 - top10
  
  const segments = [
    { label: 'Top 10 Holders', value: top10, color: '#8b5cf6' },
    { label: 'Others', value: rest, color: '#1f2937' },
  ]

  return (
    <div className="bg-cyber-dark/80 border border-cyber-purple/20 rounded-xl p-6">
      <div className="text-gray-400 text-sm mb-4 flex items-center gap-2">
        <span>📊</span> HOLDER DISTRIBUTION
      </div>

      <div className="flex items-center gap-8">
        {/* Donut chart */}
        <div className="relative w-32 h-32">
          <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
            {/* Background circle */}
            <circle
              cx="18" cy="18" r="14"
              fill="none"
              stroke="#1f2937"
              strokeWidth="4"
            />
            {/* Top 10 segment */}
            <circle
              cx="18" cy="18" r="14"
              fill="none"
              stroke="#8b5cf6"
              strokeWidth="4"
              strokeDasharray={`${top10} ${rest}`}
              strokeLinecap="round"
              className="transition-all duration-1000"
            />
          </svg>
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-white">{top10}%</span>
            <span className="text-xs text-gray-400">Top 10</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-3">
          {segments.map((seg, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: seg.color }} />
                <span className="text-sm text-gray-300">{seg.label}</span>
              </div>
              <span className="text-sm font-mono font-medium text-white">{seg.value}%</span>
            </div>
          ))}
          
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

      {/* Warning if high concentration */}
      {top10 > 50 && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          ⚠️ High whale concentration — potential rug pull risk
        </div>
      )}
      {top10 > 30 && top10 <= 50 && (
        <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-400 text-sm">
          ⚠️ Moderate concentration — exercise caution
        </div>
      )}
    </div>
  )
}
