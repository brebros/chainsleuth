import React, { useState } from 'react'
import ContractInput from './components/ContractInput'
import RiskScore from './components/RiskScore'
import AnalysisResult from './components/AnalysisResult'
import Header from './components/Header'
import Footer from './components/Footer'

function App() {
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleAnalyze = async (contractAddress) => {
    setLoading(true)
    setError(null)
    setAnalysis(null)

    try {
      // Simulate API call - will be replaced with real 0G Compute integration
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Mock analysis result
      const mockAnalysis = {
        address: contractAddress,
        riskScore: Math.floor(Math.random() * 100),
        flags: [
          { name: 'LP Locked', status: Math.random() > 0.3 ? 'safe' : 'warning', details: 'Liquidity locked for 6 months' },
          { name: 'Owner Renounced', status: Math.random() > 0.5 ? 'safe' : 'danger', details: 'Contract ownership not renounced' },
          { name: 'Holder Distribution', status: Math.random() > 0.4 ? 'safe' : 'warning', details: 'Top 10 holders own 35% of supply' },
          { name: 'Contract Verified', status: Math.random() > 0.2 ? 'safe' : 'danger', details: 'Source code not verified on Etherscan' },
          { name: 'Honeypot Check', status: Math.random() > 0.1 ? 'safe' : 'danger', details: 'No honeypot patterns detected' },
          { name: 'Mint Authority', status: Math.random() > 0.6 ? 'safe' : 'warning', details: 'Mint function still available' },
        ],
        summary: 'This token shows moderate risk indicators. While liquidity is locked and the contract is verified, the owner retains significant control. Exercise caution and do your own research before investing.',
        holderData: {
          totalHolders: Math.floor(Math.random() * 10000) + 1000,
          top10Concentration: Math.floor(Math.random() * 40) + 20,
          contractAge: Math.floor(Math.random() * 30) + 1,
        }
      }

      setAnalysis(mockAnalysis)
    } catch (err) {
      setError('Failed to analyze contract. Please try again.')
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
      </main>

      <Footer />
    </div>
  )
}

export default App
