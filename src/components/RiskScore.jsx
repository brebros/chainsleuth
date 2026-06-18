import React from 'react'

export default function RiskScore({ score }) {
  const getScoreColor = (score) => {
    if (score <= 30) return 'text-cyber-green'
    if (score <= 70) return 'text-cyber-yellow'
    return 'text-cyber-red'
  }

  const getScoreLabel = (score) => {
    if (score <= 30) return 'LOW RISK'
    if (score <= 70) return 'MODERATE RISK'
    return 'HIGH RISK'
  }

  const getScoreGlow = (score) => {
    if (score <= 30) return 'glow-green'
    if (score <= 70) return 'glow-yellow'
    return 'glow-red'
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className={`bg-cyber-dark/80 border border-cyber-purple/20 rounded-2xl p-8 text-center ${getScoreGlow(score)}`}>
        <div className="text-gray-400 text-sm mb-2">RISK SCORE</div>
        <div className={`text-7xl font-bold font-mono ${getScoreColor(score)}`}>
          {score}
        </div>
        <div className={`text-xl font-semibold mt-2 ${getScoreColor(score)}`}>
          {getScoreLabel(score)}
        </div>
        
        {/* Score bar */}
        <div className="mt-6 h-3 bg-gray-800 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-1000 ${
              score <= 30 ? 'bg-cyber-green' : 
              score <= 70 ? 'bg-cyber-yellow' : 
              'bg-cyber-red'
            }`}
            style={{ width: `${score}%` }}
          />
        </div>
        
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>Safe</span>
          <span>Moderate</span>
          <span>Danger</span>
        </div>
      </div>
    </div>
  )
}
