import { describe, it, expect, beforeEach } from 'vitest'
import { ConfigurationManager, ConfigurationValidator } from '../../src/configuration'
import { createMockConfig } from '../__mocks__/config'
import { ConfigurationError } from '@rabit/types'

describe('ConfigurationManager', () => {
  let config: ReturnType<typeof createMockConfig>
  let configManager: ConfigurationManager
  
  beforeEach(() => {
    config = createMockConfig()
    configManager = new ConfigurationManager(config)
  })

  describe('Initialization', () => {
    it('should create configuration manager with valid config', () => {
      expect(configManager).toBeInstanceOf(ConfigurationManager)
      expect(configManager.getConfig()).toBeDefined()
    })

    it('should throw error for invalid config', () => {
      const invalidConfig = { ...config, app: { ...config.app, name: '' } }
      
      expect(() => new ConfigurationManager(invalidConfig)).toThrow(ConfigurationError)
    })
  })

  describe('Configuration Access', () => {
    it('should get complete configuration', () => {
      const fullConfig = configManager.getConfig()
      expect(fullConfig.app.name).toBe('Test App')
      expect(fullConfig.chains).toHaveLength(2)
      expect(fullConfig.connectors).toHaveLength(3)
    })

    it('should get specific configuration sections', () => {
      const appConfig = configManager.getSection('app')
      expect(appConfig.name).toBe('Test App')
      
      const chains = configManager.getSection('chains')
      expect(chains).toHaveLength(2)
    })
  })

  describe('Chain Management', () => {
    it('should get all chains', () => {
      const chains = configManager.getChains()
      expect(chains).toHaveLength(2)
      expect(chains[0].name).toBe('Ethereum')
      expect(chains[1].name).toBe('Polygon')
    })

    it('should get chain by ID', () => {
      const chain = configManager.getChain(1)
      expect(chain).toBeDefined()
      expect(chain!.name).toBe('Ethereum')
      
      const nonExistentChain = configManager.getChain(999)
      expect(nonExistentChain).toBeUndefined()
    })

    it('should check if chain is supported', () => {
      expect(configManager.isChainSupported(1)).toBe(true)
      expect(configManager.isChainSupported(137)).toBe(true)
      expect(configManager.isChainSupported(999)).toBe(false)
    })
  })

  describe('Feature Checks', () => {
    it('should check if smart accounts are enabled', () => {
      expect(configManager.isSmartAccountEnabled()).toBe(false)
    })

    it('should check if analytics are enabled', () => {
      expect(configManager.isAnalyticsEnabled()).toBe(false)
    })
  })
})