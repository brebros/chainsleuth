// 0G Compute Setup Script
import { createZGComputeNetworkBroker } from '@0gfoundation/0g-compute-ts-sdk'
import { ethers } from 'ethers'
import fs from 'fs'
import path from 'path'

const WALLET_PATH = '/root/.wallets/0g-testnet.json'
const RPC_URL = 'https://evmrpc-testnet.0g.ai'

async function setup() {
  // Load wallet
  const walletData = JSON.parse(fs.readFileSync(WALLET_PATH, 'utf8'))
  const provider = new ethers.JsonRpcProvider(RPC_URL)
  const signer = new ethers.Wallet(walletData.privateKey, provider)

  console.log('Wallet:', signer.address)

  // Create broker
  const broker = createZGComputeNetworkBroker(signer)

  // Check balance
  const balance = await provider.getBalance(signer.address)
  console.log('Balance:', ethers.formatEther(balance), '0G')

  // List available providers
  console.log('\nFetching available providers...')
  try {
    const providers = await broker.listProviders()
    console.log('Available providers:', JSON.stringify(providers, null, 2))
  } catch (error) {
    console.log('Error listing providers:', error.message)
  }
}

setup().catch(console.error)
