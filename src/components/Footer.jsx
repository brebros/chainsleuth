import React from 'react'

export default function Footer() {
  return (
    <footer className="border-t border-cyber-purple/20 mt-16 py-8">
      <div className="container mx-auto px-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <span className="text-xl">🔍</span>
          <span className="font-bold">ChainSleuth</span>
        </div>
        <p className="text-gray-500 text-sm mb-4">
          Built for <span className="text-cyber-purple">Zero Cup 2026</span> on <span className="text-cyber-blue">0G</span>
        </p>
        <div className="flex justify-center gap-4">
          <a 
            href="https://github.com/brebros/chainsleuth" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-white transition-colors"
          >
            GitHub
          </a>
          <a 
            href="https://0g.ai" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-white transition-colors"
          >
            0G Network
          </a>
        </div>
        <p className="text-gray-600 text-xs mt-6">
          © 2026 ChainSleuth. Not financial advice. DYOR.
        </p>
      </div>
    </footer>
  )
}
