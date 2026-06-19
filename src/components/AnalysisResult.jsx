import React from 'react'
import GoPlusPanel from './GoPlusPanel'

export default function AnalysisResult({ analysis }) {
  const getFlagIcon = (status) => {
    switch (status) {
      case 'safe': return '🟢'
      case 'warning': return '🟡'
      case 'danger': return '🔴'
      default: return '⚪'
    }
  }

  const getFlagColor = (status) => {
    switch (status) {
      case 'safe': return 'text-green-400 bg-green-500/10 border-green-500/20'
      case 'warning': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'
      case 'danger': return 'text-red-400 bg-red-500/10 border-red-500/20'
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/20'
    }
  }

  const chainNames = { eth: 'Ethereum', bsc: 'BNB Chain', base: 'Base', polygon: 'Polygon', arbitrum: 'Arbitrum' }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Contract Info Card */}
      <div className="bg-cyber-dark/80 border border-cyber-purple/20 rounded-2xl p-6 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Contract Address</div>
            <div className="font-mono text-cyber-purple text-sm break-all">{analysis.address}</div>
            {analysis.chain && (
              <span className="inline-block mt-1 px-2 py-0.5 bg-cyber-purple/20 text-cyber-purple text-xs rounded-full">
                {chainNames[analysis.chain] || analysis.chain}
              </span>
            )}
          </div>
          {analysis.contractInfo?.isVerified && (
            <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30">
              ✓ Verified
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-cyber-darker/50 rounded-xl">
          <div className="text-center">
            <div className="text-lg font-bold text-white font-mono truncate">
              {analysis.contractInfo?.age ? analysis.contractInfo.age + 'd' : '—'}
            </div>
            <div className="text-xs text-gray-400">Token Age</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-white font-mono truncate">
              {analysis.contractInfo?.txCount ? analysis.contractInfo.txCount.toLocaleString() : '—'}
            </div>
            <div className="text-xs text-gray-400">Transactions</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-white font-mono truncate">
              {analysis.holderData?.totalSupply && analysis.holderData.totalSupply !== 'N/A'
                ? Number(analysis.holderData.totalSupply).toLocaleString() : '—'}
            </div>
            <div className="text-xs text-gray-400">Total Supply</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-white font-mono truncate">
              {analysis.contractInfo?.compiler?.match(/v[\d.]+/)?.[0] || '—'}
            </div>
            <div className="text-xs text-gray-400">Compiler</div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          {analysis.contractInfo?.isProxy && (
            <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded border border-yellow-500/30">
              ⚠️ Proxy Contract
            </span>
          )}
          {analysis.contractInfo?.creator && (
            <span className="px-2 py-1 bg-gray-800 text-gray-400 text-xs rounded border border-gray-700">
              👤 {analysis.contractInfo.creator.slice(0, 8)}...{analysis.contractInfo.creator.slice(-4)}
            </span>
          )}
          {analysis.liquidity?.hasLiquidity && (
            <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded border border-purple-500/30">
              💧 Uniswap Liquidity
            </span>
          )}
        </div>
      </div>

      {/* GoPlus Security */}
      <GoPlusPanel goPlus={analysis.goPlus} />

      {/* Security Checklist */}
      <div className="bg-cyber-dark/80 border border-cyber-purple/20 rounded-2xl p-6 backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-5">
          <span className="text-lg">🛡️</span>
          <span className="text-gray-400 text-sm uppercase tracking-wider">Security Checklist</span>
        </div>
        <div className="space-y-3">
          {analysis.flags?.map((flag, index) => (
            <div key={index} className={`flex items-center gap-4 p-4 rounded-xl border transition-all hover:scale-[1.01] ${getFlagColor(flag.status)}`}>
              <span className="text-xl flex-shrink-0">{getFlagIcon(flag.status)}</span>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-white">{flag.name}</div>
                <div className="text-sm opacity-75 mt-0.5">{flag.details}</div>
              </div>
              <span className="text-xs font-bold uppercase tracking-wider flex-shrink-0 opacity-75">{flag.status}</span>
            </div>
          ))}
        </div>
      </div>

      {/* AI Deep Analysis */}
      {analysis.aiDetails && analysis.aiDetails.length > 0 && (
        <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-cyber-purple/30 rounded-2xl p-6 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">🤖</span>
            <span className="text-gray-300 text-sm uppercase tracking-wider font-semibold">AI Deep Analysis</span>
          </div>
          <div className="space-y-3">
            {analysis.aiDetails.map((detail, index) => (
              <div key={index} className={`p-3 rounded-lg border ${getFlagColor(detail.status)}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span>{getFlagIcon(detail.status)}</span>
                  <span className="font-semibold text-white text-sm">{detail.category}</span>
                </div>
                <p className="text-sm opacity-80 ml-6">{detail.explanation}</p>
              </div>
            ))}
          </div>
          {analysis.aiConfidence && (
            <div className="mt-4 pt-4 border-t border-gray-700/50">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">AI Confidence</span>
                <span className="text-purple-400 font-mono">{Math.round(analysis.aiConfidence * 100)}%</span>
              </div>
              <div className="mt-2 h-2 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${analysis.aiConfidence * 100}%` }} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* AI Summary */}
      <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-cyber-purple/30 rounded-2xl p-6 backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">📋</span>
          <span className="text-gray-300 text-sm uppercase tracking-wider font-semibold">AI Summary</span>
        </div>
        <p className="text-gray-200 leading-relaxed text-lg">{analysis.summary}</p>
      </div>

      {/* Recommendations */}
      {analysis.aiRecommendations && analysis.aiRecommendations.length > 0 && (
        <div className="bg-cyber-dark/80 border border-cyber-purple/20 rounded-2xl p-6 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">💡</span>
            <span className="text-gray-400 text-sm uppercase tracking-wider">Recommendations</span>
          </div>
          <ul className="space-y-2">
            {analysis.aiRecommendations.map((rec, index) => (
              <li key={index} className="flex items-start gap-3 text-sm text-gray-300">
                <span className="text-purple-400 mt-0.5">•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Social Signals */}
      {analysis.social && (
        <div className="bg-cyber-dark/80 border border-cyber-purple/20 rounded-2xl p-6 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">📡</span>
            <span className="text-gray-400 text-sm uppercase tracking-wider">Social Signals</span>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-3">
            <div className="text-center p-3 bg-gray-800/50 rounded-lg">
              <div className={`text-lg font-bold ${analysis.social.sentiment === 'high' ? 'text-green-400' : analysis.social.sentiment === 'moderate' ? 'text-yellow-400' : 'text-red-400'}`}>
                {analysis.social.twitterMentions}
              </div>
              <div className="text-xs text-gray-400">Online Mentions</div>
            </div>
            <div className="text-center p-3 bg-gray-800/50 rounded-lg">
              <div className={`text-lg font-bold ${analysis.social.hasWebsite ? 'text-green-400' : 'text-red-400'}`}>
                {analysis.social.hasWebsite ? '✓' : '✗'}
              </div>
              <div className="text-xs text-gray-400">Website</div>
            </div>
            <div className="text-center p-3 bg-gray-800/50 rounded-lg">
              <div className={`text-lg font-bold ${analysis.social.hasGitHub ? 'text-green-400' : 'text-red-400'}`}>
                {analysis.social.hasGitHub ? '✓' : '✗'}
              </div>
              <div className="text-xs text-gray-400">GitHub</div>
            </div>
          </div>
          {analysis.social.redFlags.length > 0 && (
            <div className="space-y-1">
              {analysis.social.redFlags.map((flag, i) => (
                <div key={i} className="text-sm text-yellow-400 flex items-center gap-2">
                  <span>⚠️</span> {flag}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Disclaimer */}
      <div className="text-center text-xs text-gray-500 py-4 border-t border-gray-800">
        ⚠️ This is NOT financial advice. Always do your own research (DYOR) before investing.
      </div>
    </div>
  )
}
