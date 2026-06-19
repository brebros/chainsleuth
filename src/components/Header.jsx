import React from 'react'
import ThemeToggle from './ThemeToggle'

export default function Header() {
  return (
    <header className="relative border-b border-gray-800/50 dark:border-gray-800/50 border-gray-200/50 bg-gray-950/80 dark:bg-gray-950/80 bg-white/80 backdrop-blur-xl sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="text-2xl">🔍</div>
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          </div>
          <span className="font-bold text-xl bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            ChainSleuth
          </span>
        </div>

        {/* Nav */}
        <nav className="flex items-center gap-3">
          <ThemeToggle />
          <a
            href="https://github.com/brebros/chainsleuth"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 dark:bg-gray-800/50 bg-gray-100 border border-gray-700 dark:border-gray-700 border-gray-300 rounded-xl text-gray-300 dark:text-gray-300 text-gray-600 hover:bg-gray-800 dark:hover:bg-gray-800 hover:bg-gray-200 hover:border-gray-600 dark:hover:border-gray-600 transition-all text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            GitHub
          </a>
        </nav>
      </div>
    </header>
  )
}
