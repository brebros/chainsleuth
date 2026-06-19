import React from 'react'

export default function ExportButton({ analysis }) {
  const handleExport = () => {
    window.print()
  }

  if (!analysis) return null

  return (
    <button
      onClick={handleExport}
      className="print-show flex items-center gap-2 px-4 py-2 bg-gray-700/50 border border-gray-600/30 rounded-xl text-gray-300 text-sm font-medium hover:bg-gray-600/50 transition-all"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      Export PDF
    </button>
  )
}
