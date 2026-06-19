import React, { useEffect, useState } from 'react'

export default function RiskScore({ score }) {
  const [animatedScore, setAnimatedScore] = useState(0)
  const [rotation, setRotation] = useState(0)

  useEffect(() => {
    // Animate score counting up
    const duration = 1500
    const steps = 60
    const increment = score / steps
    let current = 0
    const timer = setInterval(() => {
      current += increment
      if (current >= score) {
        setAnimatedScore(score)
        clearInterval(timer)
      } else {
        setAnimatedScore(Math.floor(current))
      }
    }, duration / steps)

    // Animate gauge rotation
    const targetRotation = (score / 100) * 180 - 90
    const rotationTimer = setTimeout(() => setRotation(targetRotation), 100)

    return () => { clearInterval(timer); clearTimeout(rotationTimer) }
  }, [score])

  const getColor = (s) => {
    if (s <= 30) return { text: '#10b981', bg: 'from-green-500/20 to-green-600/10', border: 'border-green-500/30', glow: 'shadow-green-500/20' }
    if (s <= 70) return { text: '#f59e0b', bg: 'from-yellow-500/20 to-yellow-600/10', border: 'border-yellow-500/30', glow: 'shadow-yellow-500/20' }
    return { text: '#ef4444', bg: 'from-red-500/20 to-red-600/10', border: 'border-red-500/30', glow: 'shadow-red-500/20' }
  }

  const getLabel = (s) => {
    if (s <= 30) return 'LOW RISK'
    if (s <= 70) return 'MODERATE RISK'
    return 'HIGH RISK'
  }

  const getEmoji = (s) => {
    if (s <= 30) return '✅'
    if (s <= 70) return '⚠️'
    return '🚨'
  }

  const colors = getColor(score)

  return (
    <div className="w-full max-w-md mx-auto">
      <div className={`bg-gradient-to-b ${colors.bg} border ${colors.border} rounded-3xl p-10 text-center shadow-2xl ${colors.glow} backdrop-blur-sm`}>
        {/* Animated gauge */}
        <div className="relative w-48 h-24 mx-auto mb-6 overflow-hidden">
          {/* Gauge background */}
          <div className="absolute bottom-0 left-0 right-0 h-24 rounded-t-full bg-gray-800/50 border-t border-x border-gray-700/50" />
          
          {/* Gauge fill */}
          <div 
            className="absolute bottom-0 left-0 right-0 h-24 rounded-t-full transition-all duration-1000 ease-out"
            style={{
              background: `conic-gradient(from 0.75turn, ${colors.text} 0%, ${colors.text}88 ${(score / 100) * 100}%, transparent ${(score / 100) * 100}%, transparent 100%)`,
              clipPath: 'polygon(0 100%, 50% 0, 100% 100%)'
            }}
          />
          
          {/* Center circle */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-gray-900 border-2 border-gray-600" />
          
          {/* Needle */}
          <div 
            className="absolute bottom-0 left-1/2 origin-bottom transition-transform duration-1000 ease-out"
            style={{ transform: `translateX(-50%) rotate(${rotation}deg)` }}
          >
            <div className="w-1 h-20 bg-white rounded-full" />
            <div className="absolute -bottom-1 -left-1.5 w-4 h-4 rounded-full bg-white" />
          </div>
        </div>

        {/* Score number */}
        <div className="flex items-center justify-center gap-3 mb-3">
          <span className="text-4xl">{getEmoji(score)}</span>
          <span 
            className="text-7xl font-black font-mono tabular-nums"
            style={{ color: colors.text }}
          >
            {animatedScore}
          </span>
          <span className="text-2xl text-gray-400 font-light">/100</span>
        </div>

        {/* Label — big & clear */}
        <div 
          className="text-2xl font-extrabold tracking-widest mb-2 uppercase"
          style={{ color: colors.text, textShadow: `0 0 20px ${colors.text}44` }}
        >
          {getLabel(score)}
        </div>

        {/* Direction hint */}
        <div className="text-sm text-gray-400 mb-4">
          {score <= 30 
            ? '↑ Lower score = safer contract' 
            : score <= 70 
              ? '↑ Higher score = more risk factors detected'
              : '↑ Higher score = more dangerous'}
        </div>

        {/* Progress bar */}
        <div className="relative h-3 bg-gray-800 rounded-full overflow-hidden">
          <div 
            className="absolute inset-y-0 left-0 rounded-full transition-all duration-1500 ease-out"
            style={{ 
              width: `${score}%`,
              background: `linear-gradient(90deg, ${colors.text}88, ${colors.text})`,
              boxShadow: `0 0 10px ${colors.text}44`
            }}
          />
        </div>

        {/* Scale labels */}
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>🟢 Safe</span>
          <span>🟡 Moderate</span>
          <span>🔴 Danger</span>
        </div>
      </div>
    </div>
  )
}
