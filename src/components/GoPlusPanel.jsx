import React from 'react'

export default function GoPlusPanel({ goPlus }) {
  if (!goPlus) return null

  const getRiskLevel = () => {
    if (goPlus.isHoneypot || goPlus.cannotSellAll || goPlus.hiddenOwner) return 'danger'
    if (goPlus.buyTax > 0.1 || goPlus.sellTax > 0.1 || goPlus.isBlacklisted || goPlus.canTakeBackOwnership) return 'warning'
    return 'safe'
  }

  const risk = getRiskLevel()
  const riskColors = {
    safe: 'border-green-500/30 bg-green-500/5',
    warning: 'border-yellow-500/30 bg-yellow-500/5',
    danger: 'border-red-500/30 bg-red-500/5'
  }

  return (
    <div className={`border rounded-2xl p-6 backdrop-blur-sm ${riskColors[risk]}`}>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">🛡️</span>
        <span className="text-gray-300 text-sm uppercase tracking-wider font-semibold">GoPlus Security</span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
          risk === 'safe' ? 'bg-green-500/20 text-green-400' :
          risk === 'warning' ? 'bg-yellow-500/20 text-yellow-400' :
          'bg-red-500/20 text-red-400'
        }`}>
          {risk === 'safe' ? 'CLEAN' : risk === 'warning' ? 'CAUTION' : 'DANGER'}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="text-center p-2 bg-gray-800/50 rounded-lg">
          <div className={`text-lg font-bold ${goPlus.isHoneypot ? 'text-red-400' : 'text-green-400'}`}>
            {goPlus.isHoneypot ? '🚨 YES' : '✓ No'}
          </div>
          <div className="text-xs text-gray-400">Honeypot</div>
        </div>
        <div className="text-center p-2 bg-gray-800/50 rounded-lg">
          <div className={`text-lg font-bold ${goPlus.hiddenOwner ? 'text-red-400' : 'text-green-400'}`}>
            {goPlus.hiddenOwner ? '🚨 YES' : '✓ No'}
          </div>
          <div className="text-xs text-gray-400">Hidden Owner</div>
        </div>
        <div className="text-center p-2 bg-gray-800/50 rounded-lg">
          <div className={`text-lg font-bold ${goPlus.buyTax > 0.1 ? 'text-red-400' : goPlus.buyTax > 0 ? 'text-yellow-400' : 'text-green-400'}`}>
            {goPlus.buyTax > 0 ? (goPlus.buyTax * 100).toFixed(1) + '%' : '0%'}
          </div>
          <div className="text-xs text-gray-400">Buy Tax</div>
        </div>
        <div className="text-center p-2 bg-gray-800/50 rounded-lg">
          <div className={`text-lg font-bold ${goPlus.sellTax > 0.1 ? 'text-red-400' : goPlus.sellTax > 0 ? 'text-yellow-400' : 'text-green-400'}`}>
            {goPlus.sellTax > 0 ? (goPlus.sellTax * 100).toFixed(1) + '%' : '0%'}
          </div>
          <div className="text-xs text-gray-400">Sell Tax</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className={goPlus.canTakeBackOwnership ? 'text-red-400' : 'text-green-400'}>
            {goPlus.canTakeBackOwnership ? '🔴' : '🟢'}
          </span>
          <span className="text-gray-300">Reclaim Owner</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={goPlus.ownerChangeBalance ? 'text-red-400' : 'text-green-400'}>
            {goPlus.ownerChangeBalance ? '🔴' : '🟢'}
          </span>
          <span className="text-gray-300">Change Balance</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={goPlus.isBlacklisted ? 'text-yellow-400' : 'text-green-400'}>
            {goPlus.isBlacklisted ? '🟡' : '🟢'}
          </span>
          <span className="text-gray-300">Blacklist</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={goPlus.cannotSellAll ? 'text-red-400' : 'text-green-400'}>
            {goPlus.cannotSellAll ? '🔴' : '🟢'}
          </span>
          <span className="text-gray-300">Can Sell All</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={goPlus.antiWhaleModifiable ? 'text-yellow-400' : 'text-green-400'}>
            {goPlus.antiWhaleModifiable ? '🟡' : '🟢'}
          </span>
          <span className="text-gray-300">Anti-Whale</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={goPlus.isOpenSource ? 'text-green-400' : 'text-yellow-400'}>
            {goPlus.isOpenSource ? '🟢' : '🟡'}
          </span>
          <span className="text-gray-300">Open Source</span>
        </div>
      </div>

      {goPlus.holderCount > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-700/50 text-xs text-gray-400">
          Holders: {goPlus.holderCount.toLocaleString()}
          {goPlus.creatorPercent && parseFloat(goPlus.creatorPercent) > 0.01 && (
            <span className="text-yellow-400 ml-2">
              ⚠️ Creator holds {(parseFloat(goPlus.creatorPercent) * 100).toFixed(2)}%
            </span>
          )}
        </div>
      )}
    </div>
  )
}
