import React, { useState } from 'react'

export default function ShareButton({ address, chain }) {
  const [copied, setCopied] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)

  const shareUrl = `${window.location.origin}/scan/${address}${chain && chain !== 'eth' ? `?chain=${chain}` : ''}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
      const el = document.createElement('textarea')
      el.value = shareUrl
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `ChainSleuth Scan: ${address.slice(0, 10)}...`,
          text: `Check this contract risk analysis on ChainSleuth`,
          url: shareUrl
        })
      } catch {}
    } else {
      handleCopy()
    }
  }

  return (
    <div className="relative inline-flex items-center">
      <button
        onClick={handleShare}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="flex items-center gap-2 px-4 py-2 bg-cyber-purple/20 border border-cyber-purple/30 rounded-xl text-cyber-purple text-sm font-medium hover:bg-cyber-purple/30 transition-all"
      >
        {copied ? (
          <>
            <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-green-400">Copied!</span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            <span>Share</span>
          </>
        )}
      </button>

      {/* Tooltip */}
      {showTooltip && !copied && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-xs text-gray-300 whitespace-nowrap z-50">
          Copy share link
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-800 border-r border-b border-gray-700 rotate-45 -mt-1" />
        </div>
      )}
    </div>
  )
}
