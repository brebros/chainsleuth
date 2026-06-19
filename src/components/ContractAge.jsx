import React from 'react'

export default function ContractAge({ ageDays }) {
  if (ageDays == null) return null

  let label, color, icon, riskLevel

  if (ageDays < 1) {
    label = 'Deployed today'
    color = 'text-red-400 bg-red-500/10 border-red-500/30'
    icon = '🆕'
    riskLevel = 'VERY HIGH'
  } else if (ageDays < 7) {
    label = `${ageDays}d old`
    color = 'text-red-400 bg-red-500/10 border-red-500/30'
    icon = '⚠️'
    riskLevel = 'HIGH'
  } else if (ageDays < 30) {
    label = `${Math.floor(ageDays / 7)}w ${ageDays % 7}d old`
    color = 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30'
    icon = '🟡'
    riskLevel = 'MODERATE'
  } else if (ageDays < 365) {
    const months = Math.floor(ageDays / 30)
    const days = ageDays % 30
    label = `${months}mo ${days}d old`
    color = 'text-green-400 bg-green-500/10 border-green-500/30'
    icon = '✅'
    riskLevel = 'LOW'
  } else {
    const years = Math.floor(ageDays / 365)
    const months = Math.floor((ageDays % 365) / 30)
    label = `${years}y ${months}mo old`
    color = 'text-green-400 bg-green-500/10 border-green-500/30'
    icon = '🟢'
    riskLevel = 'SAFE'
  }

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium ${color}`}>
      <span>{icon}</span>
      <span>{label}</span>
      <span className="opacity-60">• {riskLevel}</span>
    </div>
  )
}
