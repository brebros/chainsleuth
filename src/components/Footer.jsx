import React from 'react'

export default function Footer() {
  return (
    <footer className="relative border-t border-gray-800/50 bg-gray-950/80 mt-16 py-8">
      <div className="container mx-auto px-4 text-center">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <span className="text-xl">🔍</span>
          <span className="font-bold text-lg bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            ChainSleuth
          </span>
        </div>

        {/* Info */}
        <p className="text-gray-500 text-sm mb-2">
          Built for <span className="text-purple-400 font-semibold">Zero Cup 2026</span>
        </p>
        <p className="text-gray-600 text-xs mb-4">
          Powered by <span className="text-blue-400">0G Network</span> • AI-Powered Security Analysis
        </p>

        {/* Links */}
        <div className="flex justify-center gap-6 mb-6">
          <a 
            href="https://github.com/brebros/chainsleuth" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-white transition-colors text-sm"
          >
            GitHub
          </a>
          <a 
            href="https://0g.ai" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-white transition-colors text-sm"
          >
            0G Network
          </a>
          <a 
            href="https://0g.ai/arena/zero-cup" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-white transition-colors text-sm"
          >
            Zero Cup
          </a>
        </div>

        {/* Disclaimer */}
        <div className="p-4 bg-gray-900/50 rounded-xl border border-gray-800 max-w-lg mx-auto">
          <p className="text-xs text-gray-500">
            ⚠️ <span className="font-semibold text-gray-400">Disclaimer:</span> ChainSleuth is for educational purposes only. 
            This is NOT financial advice. Always do your own research (DYOR) before investing in any cryptocurrency.
          </p>
        </div>

        {/* Copyright */}
        <p className="text-gray-600 text-xs mt-6">
          © 2026 ChainSleuth. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
