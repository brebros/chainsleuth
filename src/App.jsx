import React, { useState } from 'react'
import ContractInput from './components/ContractInput'
import RiskScore from './components/RiskScore'
import AnalysisResult from './components/AnalysisResult'
import Header from './components/Header'
import Footer from './components/Footer'
import History from './components/History'
import LoadingAnimation from './components/LoadingAnimation'
import CompareMode from './components/CompareMode'
import Watchlist from './components/Watchlist'

const API_BASE = window.location.origin

function App() {
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [scanCount, setScanCount] = useState(() => {
    try { return parseInt(localStorage.getItem('chainsleuth_scan_count') || '0') } catch { return 0 }
  })

  const handleAnalyze = async (contractAddress, chain = 'eth') => {
    setLoading(true)
    setError(null)
    setAnalysis(null)

    try {
      const response = await fetch(`${API_BASE}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: contractAddress, chain })
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Analysis failed')
      }

      const data = await response.json()
      setAnalysis(data)

      // Increment scan count
      const newCount = scanCount + 1
      setScanCount(newCount)
      try { localStorage.setItem('chainsleuth_scan_count', String(newCount)) } catch {}

      // Save to history
      try {
        const history = JSON.parse(localStorage.getItem('chainsleuth_history') || '[]')
        history.unshift({
          address: data.address,
          riskScore: data.riskScore,
          contractInfo: data.contractInfo,
          timestamp: new Date().toISOString()
        })
        localStorage.setItem('chainsleuth_history', JSON.stringify(history.slice(0, 50)))
      } catch (e) {}

    } catch (err) {
      setError(err.message || 'Failed to analyze contract. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(139, 92, 246, 0.05) 1px, transparent 0)',
          backgroundSize: '50px 50px'
        }} />
      </div>

      <Header />

      <main className="relative container mx-auto px-4 py-8 max-w-4xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full mb-6">
            <span className="text-sm">⚡</span>
            <span className="text-sm text-purple-400">Powered by 0G Network</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black mb-4 bg-gradient-to-r from-purple-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
            ChainSleuth
          </h1>
          <p className="text-xl md:text-2xl text-gray-400 mb-2">
            AI-powered rug pull detector
          </p>
          <p className="text-gray-500 text-lg">
            Paste a contract. Get the truth.
          </p>

          {/* Stats */}
          {scanCount > 0 && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-full">
              <span className="text-sm text-gray-400">🔍</span>
              <span className="text-sm text-gray-300">{scanCount.toLocaleString()} contracts scanned</span>
            </div>
          )}
        </div>

        {/* Contract Input */}
        <ContractInput onAnalyze={handleAnalyze} loading={loading} />

        {/* Error Display */}
        {error && (
          <div className="mt-8 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-center backdrop-blur-sm">
            {error}
          </div>
        )}

        {/* Loading Animation */}
        {loading && <LoadingAnimation />}

        {/* Analysis Results */}
        {analysis && !loading && (
          <div className="mt-8 space-y-6 animate-fade-in">
            <RiskScore score={analysis.riskScore} />
            <AnalysisResult analysis={analysis} />

            {/* Badges */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              {analysis.aiSource && (
                <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
                  analysis.aiSource === '0g-compute'
                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                    : 'bg-gray-800 text-gray-400 border border-gray-700'
                }`}>
                  {analysis.aiSource === '0g-compute' ? '⚡' : '🔍'}
                  {analysis.aiSource === '0g-compute' ? '0G Compute AI' : 'Rule-based Analysis'}
                </span>
              )}
            </div>
          </div>
        )}

        {/* How It Works Section */}
        {!analysis && !loading && (
          <>
            {/* Features */}
            <div className="mt-16 grid md:grid-cols-3 gap-6">
              <div className="group p-6 bg-gray-900/50 border border-gray-800 rounded-2xl hover:border-purple-500/30 transition-all hover:scale-105">
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">🔍</div>
                <h3 className="text-lg font-semibold mb-2 text-white">Instant Analysis</h3>
                <p className="text-gray-400 text-sm">Get risk assessment in seconds, not hours</p>
              </div>
              <div className="group p-6 bg-gray-900/50 border border-gray-800 rounded-2xl hover:border-purple-500/30 transition-all hover:scale-105">
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">🤖</div>
                <h3 className="text-lg font-semibold mb-2 text-white">AI-Powered</h3>
                <p className="text-gray-400 text-sm">Advanced AI analyzes contract patterns</p>
              </div>
              <div className="group p-6 bg-gray-900/50 border border-gray-800 rounded-2xl hover:border-purple-500/30 transition-all hover:scale-105">
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">⛓️</div>
                <h3 className="text-lg font-semibold mb-2 text-white">On-Chain Data</h3>
                <p className="text-gray-400 text-sm">Real blockchain data, not guesses</p>
              </div>
            </div>

            {/* How It Works */}
            <div className="mt-16 p-8 bg-gray-900/50 border border-gray-800 rounded-2xl">
              <h2 className="text-2xl font-bold text-center mb-8 text-white">How It Works</h2>
              <div className="grid md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-xl">1️⃣</span>
                  </div>
                  <h4 className="font-semibold text-white mb-2">Paste Address</h4>
                  <p className="text-sm text-gray-400">Enter any Ethereum contract address</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-xl">2️⃣</span>
                  </div>
                  <h4 className="font-semibold text-white mb-2">Fetch Data</h4>
                  <p className="text-sm text-gray-400">We pull source code & holder data from Etherscan</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-xl">3️⃣</span>
                  </div>
                  <h4 className="font-semibold text-white mb-2">AI Analysis</h4>
                  <p className="text-sm text-gray-400">0G Compute AI analyzes for rug pull patterns</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-xl">4️⃣</span>
                  </div>
                  <h4 className="font-semibold text-white mb-2">Get Report</h4>
                  <p className="text-sm text-gray-400">Receive risk score & detailed security report</p>
                </div>
              </div>
            </div>

            {/* Stats Bar */}
            <div className="mt-8 p-6 bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-500/20 rounded-2xl">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-3xl font-bold text-purple-400">⚡</div>
                  <div className="text-sm text-gray-400 mt-1">0G Compute</div>
                  <div className="text-xs text-gray-500">AI-Powered Analysis</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-blue-400">🔗</div>
                  <div className="text-sm text-gray-400 mt-1">Etherscan V2</div>
                  <div className="text-xs text-gray-500">Real-time On-Chain Data</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-green-400">🛡️</div>
                  <div className="text-sm text-gray-400 mt-1">Multi-Check</div>
                  <div className="text-xs text-gray-500">6 Security Indicators</div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* History Section */}
        <History />

        {/* Compare Mode */}
        {!loading && <CompareMode />}

        {/* Watchlist */}
        {!loading && <Watchlist />}
      </main>

      <Footer />
    </div>
  )
}

export default App
