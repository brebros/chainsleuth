import React from 'react'

const SOURCES = {
  etherscan: { label: 'Etherscan V2', icon: '🔗', color: 'blue' },
  goplus: { label: 'GoPlus Security', icon: '🛡️', color: 'green' },
  social: { label: 'Social Signals', icon: '📡', color: 'purple' },
  ai: { label: 'AI Analysis', icon: '🤖', color: 'violet' },
}

export default function DataSourcesBar({ dataSources }) {
  if (!dataSources) return null

  const sources = Object.entries(dataSources)
  const allOk = sources.every(([, s]) => s && (s.ok || s.note))
  const hasErrors = sources.some(([, s]) => s && s.error)

  if (allOk) {
    return (
      <div className="flex items-center justify-center gap-3 flex-wrap">
        {sources.map(([key, src]) => {
          const meta = SOURCES[key]
          if (!meta) return null
          return (
            <span key={key} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full text-xs text-green-400">
              <span>{meta.icon}</span>
              <span>{meta.label}</span>
              {src.note && <span className="text-green-300/60 ml-1">({src.note})</span>}
            </span>
          )
        })}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="text-xs text-gray-500 uppercase tracking-wider text-center mb-2">Data Sources</div>
      <div className="flex items-center justify-center gap-3 flex-wrap">
        {sources.map(([key, src]) => {
          const meta = SOURCES[key]
          if (!meta) return null
          if (src.ok || src.note) {
            return (
              <span key={key} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full text-xs text-green-400">
                <span>{meta.icon}</span>
                <span>{meta.label}</span>
                <span className="ml-0.5">✓</span>
              </span>
            )
          }
          if (src.error) {
            return (
              <span key={key} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-full text-xs text-red-400" title={src.error}>
                <span>{meta.icon}</span>
                <span>{meta.label}</span>
                <span className="ml-0.5">✗</span>
              </span>
            )
          }
          return null
        })}
      </div>
      {hasErrors && (
        <div className="text-center">
          <p className="text-xs text-gray-500 mt-2">
            Some data sources returned errors. Results may be incomplete.
          </p>
        </div>
      )}
    </div>
  )
}
