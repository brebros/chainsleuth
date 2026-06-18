import React, { useState } from 'react'
import ContractInput from './components/ContractInput'
import RiskScore from './components/RiskScore'
import AnalysisResult from './components/AnalysisResult'
import Header from './components/Header'
import Footer from './components/Footer'
import History from './components/History'

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
    <div className="min-h-screen grid-bg scanline">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-cyber-purple to-cyber-blue bg-clip-text text-transparent">
            ChainSleuth
          </h1>
          <p className="text-xl text-gray-400 mb-2">
            AI-powered rug pull detector
          </p>
          <p className="text-gray-500">
            Paste a contract. Get the truth.
          </p>
        </div>

        {/* Contract Input */}
        <ContractInput onAnalyze={handleAnalyze} loading={loading} />

        {/* Error Display */}
        {error && (
          <div className="mt-8 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-center">
            {error}
          </div>
        )}

        {/* Analysis Results */}
        {analysis && (
          <div className="mt-8 space-y-6">
            <RiskScore score={analysis.riskScore} />
            <AnalysisResult analysis={analysis} />
            
            {/* AI Source Badge */}
            {analysis.aiSource && (
              <div className="text-center">
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs ${
                  analysis.aiSource === '0g-compute' 
                    ? 'bg-cyber-purple/20 text-cyber-purple border border-cyber-purple/30'
                    : 'bg-gray-800 text-gray-400 border border-gray-700'
                }`}>
                  {analysis.aiSource === '0g-compute' ? '⚡ Powered by 0G Compute' : '🔍 Rule-based analysis'}
                </span>
              </div>
            )}

            {/* Storage Badge */}
            {analysis.storageResult && (
              <div className="text-center">
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs ${
                  analysis.storageResult.storage === '0g-network'
                    ? 'bg-cyber-blue/20 text-cyber-blue border border-cyber-blue/30'
                    : 'bg-gray-800 text-gray-400 border border-gray-700'
                }`}>
                  {analysis.storageResult.storage === '0g-network' 
                    ? `⛓️ Stored on 0G — ${analysis.storageResult.gateway}`
                    : '💾 Saved locally'}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Features Section */}
        {!analysis && !loading && (
          <div className="mt-16 grid md:grid-cols-3 gap-6">
            <div className="p-6 bg-cyber-dark/50 border border-cyber-purple/20 rounded-lg">
              <div className="text-3xl mb-4">🔍</div>
              <h3 className="text-lg font-semibold mb-2">Instant Analysis</h3>
              <p className="text-gray-400 text-sm">Get risk assessment in seconds, not hours</p>
            </div>
            <div className="p-6 bg-cyber-dark/50 border border-cyber-purple/20 rounded-lg">
              <div className="text-3xl mb-4">🤖</div>
              <h3 className="text-lg font-semibold mb-2">AI-Powered</h3>
              <p className="text-gray-400 text-sm">Advanced AI analyzes contract patterns</p>
            </div>
            <div className="p-6 bg-cyber-dark/50 border border-cyber-purple/20 rounded-lg">
              <div className="text-3xl mb-4">⛓️</div>
              <h3 className="text-lg font-semibold mb-2">On-Chain Data</h3>
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
