/**
 * Save this as tests/quick-verify.test.ts
 * A simple test to verify your setup is working
 */
import { describe, it, expect } from 'vitest'
import { createConnectors } from '../src/index.js'
import { MetaMaskConnector } from '../src/implementations/metamask.js'

describe('Quick Verification', () => {
  it('should create connectors successfully', () => {
    const connectors = createConnectors()
    
    expect(connectors).toBeDefined()
    expect(connectors.length).toBeGreaterThan(0)
    expect(connectors[0]).toBeInstanceOf(MetaMaskConnector)
  })

  it('should have correct connector metadata', () => {
    const connectors = createConnectors()
    const metamask = connectors.find(c => c.id === 'metamask')
    
    expect(metamask).toBeDefined()
    expect(metamask?.metadata.name).toBe('MetaMask')
    expect(metamask?.type).toBe('injected')
  })

  it('should export all required functions', async () => {
    const metamask = new MetaMaskConnector()
    
    // Test that all required methods exist
    expect(typeof metamask.connect).toBe('function')
    expect(typeof metamask.disconnect).toBe('function')
    expect(typeof metamask.getProvider).toBe('function')
    expect(typeof metamask.isAvailable).toBe('function')
    expect(typeof metamask.getAccounts).toBe('function')
    expect(typeof metamask.getChainId).toBe('function')
  })
})