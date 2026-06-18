import React, { useState } from 'react'
import ContractInput from './components/ContractInput'
import RiskScore from './components/RiskScore'
import AnalysisResult from './components/AnalysisResult'
import Header from './components/Header'
import Footer from './components/Footer'
import History from './components/History'
import LoadingAnimation from './components/LoadingAnimation'

const API_BASE = window.location.port === '3000'
  ? 'http://localhost:3001'
  : window.location.origin

function App() {
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleAnalyze = async (contractAddress) => {
    setLoading(true)
    setError(null)
    setAnalysis(null)

    try {
      const response = await fetch(`${API_BASE}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: contractAddress })
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Analysis failed')
      }

      const data = await response.json()
      setAnalysis(data)
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
                  {analysis.aiSource === '0g-compute' ? '0G Compute' : 'Rule-based Analysis'}
                </span>
              )}

              {analysis.storageResult && (
                <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
                  analysis.storageResult.storage === '0g-network'
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : 'bg-gray-800 text-gray-400 border border-gray-700'
                }`}>
                  {analysis.storageResult.storage === '0g-network' ? '⛓️' : '💾'}
                  {analysis.storageResult.storage === '0g-network' ? 'Stored on 0G' : 'Saved Locally'}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Features Section */}
        {!analysis && !loading && (
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
        )}

        {/* History Section */}
        <History />
      </main>

      <Footer />
    </div>
  )
}

export default App
