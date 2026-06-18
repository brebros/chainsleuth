import React from 'react'

export default function Header() {
  return (
    <header className="border-b border-cyber-purple/20 bg-cyber-darker/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-2xl">🔍</div>
          <span className="font-bold text-xl">ChainSleuth</span>
        </div>
        <nav className="flex items-center gap-6">
          <a href="#features" className="text-gray-400 hover:text-white transition-colors">Features</a>
          <a href="#about" className="text-gray-400 hover:text-white transition-colors">About</a>
          <a 
            href="https://github.com/brebros/chainsleuth" 
            target="_blank" 
            rel="noopener noreferrer"
            className="px-4 py-2 bg-cyber-purple/20 border border-cyber-purple/30 rounded-lg text-cyber-purple hover:bg-cyber-purple/30 transition-colors"
          >
            GitHub
          </a>
        </nav>
      </div>
    </header>
  )
}
