import React, { useState, useEffect } from 'react'

export default function LoadingAnimation() {
  const [step, setStep] = useState(0)
  const steps = [
    '🔍 Connecting to blockchain...',
    '📡 Fetching contract data...',
    '🔎 Analyzing source code...',
    '📊 Checking holder distribution...',
    '🤖 Running AI analysis...',
    '✨ Generating report...'
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setStep(prev => (prev + 1) % steps.length)
    }, 800)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="w-full max-w-md mx-auto mt-8">
      <div className="bg-cyber-dark/80 border border-cyber-purple/30 rounded-2xl p-8 text-center">
        {/* Animated scanner */}
        <div className="relative w-24 h-24 mx-auto mb-6">
          {/* Outer ring */}
          <div className="absolute inset-0 rounded-full border-2 border-cyber-purple/30 animate-ping" />
          
          {/* Middle ring */}
          <div className="absolute inset-2 rounded-full border-2 border-cyber-purple/50 animate-spin" style={{ animationDuration: '3s' }} />
          
          {/* Inner ring */}
          <div className="absolute inset-4 rounded-full border-2 border-cyber-purple animate-spin" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }} />
          
          {/* Center icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-3xl animate-pulse">🔍</span>
          </div>
        </div>

        {/* Step text */}
        <div className="text-lg text-gray-300 font-medium mb-2">
          {steps[step]}
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 mt-4">
          {steps.map((_, i) => (
            <div 
              key={i}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                i <= step ? 'bg-cyber-purple scale-110' : 'bg-gray-700'
              }`}
            />
          ))}
        </div>

        {/* Tip */}
        <div className="mt-6 text-xs text-gray-500">
          Analyzing on-chain data from Etherscan...
        </div>
      </div>
    </div>
  )
}
