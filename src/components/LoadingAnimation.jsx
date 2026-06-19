import React, { useState, useEffect, useRef } from 'react'

const STAGES = [
  { id: 'chain',    icon: '🔗', text: 'Detecting chain & validating address...',      duration: 3000 },
  { id: 'etherscan',icon: '📡', text: 'Fetching contract data from Etherscan...',      duration: 5000 },
  { id: 'goplus',   icon: '🛡️', text: 'Running security checks via GoPlus...',        duration: 4000 },
  { id: 'ai',       icon: '🤖', text: 'AI analyzing source code (0G Compute)...',     duration: 25000 },
  { id: 'report',   icon: '📊', text: 'Generating risk report...',                    duration: 2000 },
]

export default function LoadingAnimation() {
  const [currentStage, setCurrentStage] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [dots, setDots] = useState('')
  const startTime = useRef(Date.now())
  const tickRef = useRef(null)

  // Elapsed timer
  useEffect(() => {
    tickRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime.current) / 1000))
    }, 1000)
    return () => clearInterval(tickRef.current)
  }, [])

  // Animated dots for AI stage
  useEffect(() => {
    const dotInterval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.')
    }, 500)
    return () => clearInterval(dotInterval)
  }, [])

  // Stage progression based on elapsed time
  useEffect(() => {
    let cumTime = 0
    for (let i = 0; i < STAGES.length; i++) {
      cumTime += STAGES[i].duration
      if (elapsed < cumTime / 1000) {
        setCurrentStage(i)
        break
      }
    }
  }, [elapsed])

  // Overall progress %
  const totalDuration = STAGES.reduce((a, s) => a + s.duration, 0)
  const progressPct = Math.min(95, (elapsed * 1000 / totalDuration) * 100)

  // Estimated time remaining
  const eta = Math.max(0, Math.ceil((totalDuration / 1000) - elapsed))

  return (
    <div className="w-full max-w-lg mx-auto mt-8">
      <div className="bg-gray-900/80 border border-purple-500/20 rounded-2xl p-8 backdrop-blur-sm">
        {/* Animated scanner */}
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className="absolute inset-0 rounded-full border-2 border-purple-500/20 animate-ping" />
          <div className="absolute inset-2 rounded-full border-2 border-purple-500/40 animate-spin" style={{ animationDuration: '3s' }} />
          <div className="absolute inset-4 rounded-full border-2 border-purple-500 animate-spin" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl animate-pulse">{STAGES[currentStage].icon}</span>
          </div>
        </div>

        {/* Current stage text */}
        <div className="text-center mb-6">
          <div className="text-lg text-white font-semibold mb-1">
            {STAGES[currentStage].text.replace('...', dots)}
          </div>
          <div className="text-sm text-gray-400">
            {elapsed}s elapsed · ~{eta}s remaining
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden mb-4">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Stage indicators */}
        <div className="flex justify-between">
          {STAGES.map((stage, i) => (
            <div key={stage.id} className="flex flex-col items-center gap-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all duration-300 ${
                i < currentStage
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'  // done
                  : i === currentStage
                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40 scale-110'  // current
                    : 'bg-gray-800 text-gray-600 border border-gray-700'  // pending
              }`}>
                {i < currentStage ? '✓' : stage.icon}
              </div>
              <span className={`text-[10px] hidden sm:block ${
                i <= currentStage ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {stage.id}
              </span>
            </div>
          ))}
        </div>

        {/* Tip */}
        <div className="mt-6 text-center text-xs text-gray-500">
          AI inference via 0G Compute typically takes 20-40 seconds
        </div>
      </div>
    </div>
  )
}
