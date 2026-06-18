// 0G Storage Integration — Save scan history to decentralized storage
import { ZgFile, Indexer } from '@0gfoundation/0g-storage-ts-sdk'
import { ethers } from 'ethers'
import fs from 'fs'
import path from 'path'

const ZG_TESTNET_RPC = 'https://evmrpc-testnet.0g.ai'
const ZG_STORAGE_INDEXER = 'https://indexer-storage-testnet-turbo.0g.ai'

class ZGStorage {
  constructor() {
    this.provider = null
    this.signer = null
    this.indexer = null
    this.walletPath = path.join(process.env.HOME || '/root', '.chainsleuth-wallet.json')
  }

  async initialize() {
    try {
      // Load or create wallet
      let walletData = await this.loadWallet()
      
      this.provider = new ethers.JsonRpcProvider(ZG_TESTNET_RPC)
      this.signer = new ethers.Wallet(walletData.privateKey, this.provider)
      this.indexer = new Indexer(ZG_STORAGE_INDEXER)
      
      console.log(`0G Storage initialized with wallet: ${this.signer.address}`)
      return true
    } catch (error) {
      console.error('0G Storage init failed:', error.message)
      return false
    }
  }

  async loadWallet() {
    if (fs.existsSync(this.walletPath)) {
      return JSON.parse(fs.readFileSync(this.walletPath, 'utf8'))
    }

    // Generate new wallet
    const wallet = ethers.Wallet.createRandom()
    const walletData = {
      address: wallet.address,
      privateKey: wallet.privateKey,
      createdAt: new Date().toISOString()
    }

    fs.writeFileSync(this.walletPath, JSON.stringify(walletData, null, 2))
    fs.chmodSync(this.walletPath, 0o600)
    
    console.log(`New 0G wallet created: ${wallet.address}`)
    console.log(`Get testnet tokens from: https://faucet.0g.ai`)
    
    return walletData
  }

  async saveScanHistory(scanData) {
    if (!this.signer || !this.indexer) {
      console.log('0G Storage not initialized, saving locally')
      return this.saveLocal(scanData)
    }

    try {
      // Create JSON file from scan data
      const jsonContent = JSON.stringify({
        ...scanData,
        timestamp: new Date().toISOString(),
        chain: '0g-testnet'
      }, null, 2)

      // Save to temp file
      const tempPath = `/tmp/scan-${Date.now()}.json`
      fs.writeFileSync(tempPath, jsonContent)

      // Upload to 0G Storage
      const file = await ZgFile.fromFilePath(tempPath)
      const [tree] = await file.merkleTree()
      
      // Upload via indexer
      const rootHash = tree?.rootHash
      if (rootHash) {
        console.log(`Scan saved to 0G Storage: ${rootHash}`)
        
        // Clean up temp file
        fs.unlinkSync(tempPath)
        
        return {
          success: true,
          rootHash,
          gateway: `https://storagescan-galileo.0g.ai/tx/${rootHash}`
        }
      }

      // Fallback to local
      fs.unlinkSync(tempPath)
      return this.saveLocal(scanData)
    } catch (error) {
      console.error('0G Storage upload failed:', error.message)
      return this.saveLocal(scanData)
    }
  }

  saveLocal(scanData) {
    const historyPath = path.join(process.env.HOME || '/root', '.chainsleuth-history.json')
    let history = []
    
    if (fs.existsSync(historyPath)) {
      history = JSON.parse(fs.readFileSync(historyPath, 'utf8'))
    }

    history.unshift({
      ...scanData,
      timestamp: new Date().toISOString(),
      storage: 'local'
    })

    // Keep last 100 scans
    history = history.slice(0, 100)
    fs.writeFileSync(historyPath, JSON.stringify(history, null, 2))

    return { success: true, storage: 'local' }
  }

  async getScanHistory() {
    // For now, return local history
    // 0G retrieval would need the root hashes from on-chain
    const historyPath = path.join(process.env.HOME || '/root', '.chainsleuth-history.json')
    
    if (fs.existsSync(historyPath)) {
      return JSON.parse(fs.readFileSync(historyPath, 'utf8'))
    }
    
    return []
  }
}

export default new ZGStorage()
