import { describe, it, expect, vi, beforeEach } from 'vitest'
import { RabitCore } from '../../src/rabit-core'
import { createMockConfig } from '../__mocks__/config'

describe('RabitCore', () => {
  let core: RabitCore
  let config: ReturnType<typeof createMockConfig>
  
  beforeEach(() => {
    config = createMockConfig()
    core = new RabitCore(config)
  })

  describe('Initialization', () => {
    it('should initialize with valid config', () => {
      expect(core).toBeInstanceOf(RabitCore)
      expect(core.isConnected()).toBe(false)
    })

    it('should provide access to configuration', () => {
      const coreConfig = core.getConfig()
      expect(coreConfig.app.name).toBe('Test App')
    })

    it('should provide access to chains', () => {
      const chains = core.getChains()
      expect(chains).toHaveLength(2)
      
      const ethereumChain = core.getChain(1)
      expect(ethereumChain?.name).toBe('Ethereum')
    })
  })

  describe('Connection API', () => {
    it('should connect and return success response', async () => {
      const response = await core.connect('metamask')
      
      expect(response.success).toBe(true)
      expect(response.data?.accounts).toHaveLength(1)
      expect(response.timestamp).toBeDefined()
      expect(core.isConnected()).toBe(true)
    })

    it('should handle connection errors', async () => {
      const response = await core.connect('non-existent' as any)
      
      expect(response.success).toBe(false)
      expect(response.error).toBeDefined()
      expect(response.timestamp).toBeDefined()
    })

    it('should disconnect successfully', async () => {
      await core.connect('metamask')
      
      const response = await core.disconnect()
      
      expect(response.success).toBe(true)
      expect(core.isConnected()).toBe(false)
    })
  })

  describe('State Access', () => {
    it('should provide connection state', () => {
      const state = core.getConnectionState()
      expect(state.isLoading).toBe(false)
      expect(state.isSuccess).toBe(false)
      expect(state.data).toBeUndefined()
    })

    it('should provide current status', () => {
      expect(core.getStatus()).toBe('disconnected')
    })

    it('should provide accounts', () => {
      expect(core.getAccounts()).toEqual([])
    })
  })

  describe('Event Management', () => {
    it('should subscribe to events', () => {
      const listener = vi.fn()
      
      const unsubscribe = core.on('connection', listener)
      
      expect(typeof unsubscribe).toBe('function')
    })
  })
})