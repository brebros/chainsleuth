import React, { useState } from 'react'

export default function RiskExplanation({ explanation }) {
  const [show, setShow] = useState(false)

  if (!explanation) return null

  return (
    <span className="relative inline-flex ml-1.5">
      <button
        type="button"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow(!show)}
        className="w-4 h-4 rounded-full bg-gray-700/50 hover:bg-gray-600/50 text-gray-400 hover:text-gray-200 text-[10px] font-bold flex items-center justify-center transition-colors flex-shrink-0"
        aria-label="Why?"
      >
        ?
      </button>
      {show && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 p-3 bg-gray-800 border border-gray-600 rounded-xl text-xs text-gray-300 leading-relaxed shadow-xl z-50">
          <div className="font-semibold text-white mb-1 flex items-center gap-1.5">
            <span>💡</span> Why this matters
          </div>
          {explanation}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-800 border-r border-b border-gray-600 rotate-45 -mt-1" />
        </div>
      )}
    </span>
  )
}
