/**
 * Configuration management for Rabit Core
 * Handles configuration validation, merging, and type safety
 */
import type { 
  RabitConfig, 
  Chain, 
  ChainId, 
  WalletConnector,
  DeepPartial 
} from '@rabit/types';
import { ConfigurationError } from '@rabit/types';

/**
 * Default configuration values
 */
const DEFAULT_CONFIG: Partial<RabitConfig> = {
  debug: false,
  ssr: false,
  ui: {
    theme: {
      mode: 'auto',
      borderRadius: 'medium'
    },
    modal: {
      closeOnBackdropClick: true,
      showCloseButton: true,
      size: 'default'
    },
    walletList: {
      showRecent: true,
      maxWallets: 10,
      groupByType: false,
      showAllWallets: true
    }
  },
  analytics: {
    enabled: false,
    identifyUsers: false
  },
  session: {
    persist: true,
    storageKey: 'rabit',
    expiryTime: 24 * 60 * 60 * 1000, // 24 hours
    autoReconnect: true,
    reconnectTimeout: 5000,
    maxReconnectAttempts: 3
  },
  batch: {
    enabled: true,
    batchSize: 10,
    timeout: 100,
    waitForAll: false
  }
};

/**
 * Configuration validator
 */
export class ConfigurationValidator {
  /**
   * Validate a complete Rabit configuration
   */
  static validate(config: RabitConfig): void {
    this.validateApp(config.app);
    this.validateChains(config.chains);
    this.validateConnectors(config.connectors);
    this.validateDefaultChain(config.defaultChain, config.chains);
    
    if (config.smartAccount) {
      this.validateSmartAccount(config.smartAccount);
    }
    
    if (config.multiChain) {
      this.validateMultiChain(config.multiChain, config.chains);
    }
  }

  /**
   * Validate app metadata
   */
  private static validateApp(app: RabitConfig['app']): void {
    if (!app.name || typeof app.name !== 'string') {
      throw new ConfigurationError('App name is required and must be a string', 'app.name');
    }

    if (!app.url || typeof app.url !== 'string') {
      throw new ConfigurationError('App URL is required and must be a string', 'app.url');
    }

    try {
      new URL(app.url);
    } catch {
      throw new ConfigurationError('App URL must be a valid URL', 'app.url');
    }

    if (!Array.isArray(app.icons)) {
      throw new ConfigurationError('App icons must be an array', 'app.icons');
    }

    app.icons.forEach((icon, index) => {
      if (typeof icon !== 'string') {
        throw new ConfigurationError(
          `App icon at index ${index} must be a string`, 
          `app.icons[${index}]`
        );
      }
    });
  }

  /**
   * Validate chains configuration
   */
  private static validateChains(chains: Chain[]): void {
    if (!Array.isArray(chains) || chains.length === 0) {
      throw new ConfigurationError('At least one chain must be configured', 'chains');
    }

    const chainIds = new Set<ChainId>();
    
    chains.forEach((chain, index) => {
      if (chainIds.has(chain.id)) {
        throw new ConfigurationError(
          `Duplicate chain ID ${chain.id}`, 
          `chains[${index}].id`
        );
      }
      chainIds.add(chain.id);

      this.validateChain(chain, index);
    });
  }

  /**
   * Validate a single chain
   */
  private static validateChain(chain: Chain, index: number): void {
    if (!Number.isInteger(chain.id) || chain.id <= 0) {
      throw new ConfigurationError(
        'Chain ID must be a positive integer', 
        `chains[${index}].id`
      );
    }

    if (!chain.name || typeof chain.name !== 'string') {
      throw new ConfigurationError(
        'Chain name is required and must be a string', 
        `chains[${index}].name`
      );
    }

    if (!chain.nativeCurrency) {
      throw new ConfigurationError(
        'Chain native currency is required', 
        `chains[${index}].nativeCurrency`
      );
    }

    if (!chain.rpcUrls?.default) {
      throw new ConfigurationError(
        'Chain must have at least one default RPC URL', 
        `chains[${index}].rpcUrls.default`
      );
    }
  }

  /**
   * Validate connectors
   */
  private static validateConnectors(connectors: WalletConnector[]): void {
    if (!Array.isArray(connectors) || connectors.length === 0) {
      throw new ConfigurationError('At least one connector must be configured', 'connectors');
    }

    const connectorIds = new Set<string>();
    
    connectors.forEach((connector, index) => {
      if (connectorIds.has(connector.id)) {
        throw new ConfigurationError(
          `Duplicate connector ID ${connector.id}`, 
          `connectors[${index}].id`
        );
      }
      connectorIds.add(connector.id);
    });
  }

  /**
   * Validate default chain
   */
  private static validateDefaultChain(defaultChain: ChainId | undefined, chains: Chain[]): void {
    if (defaultChain !== undefined) {
      const chainExists = chains.some(chain => chain.id === defaultChain);
      if (!chainExists) {
        throw new ConfigurationError(
          `Default chain ${defaultChain} is not in the configured chains`, 
          'defaultChain'
        );
      }
    }
  }

  /**
   * Validate smart account configuration
   */
  private static validateSmartAccount(smartAccount: RabitConfig['smartAccount']): void {
    if (!smartAccount?.standard) {
      throw new ConfigurationError(
        'Smart account standard is required', 
        'smartAccount.standard'
      );
    }

    if (!smartAccount.factoryAddress) {
      throw new ConfigurationError(
        'Smart account factory address is required', 
        'smartAccount.factoryAddress'
      );
    }
  }

  /**
   * Validate multi-chain configuration
   */
  private static validateMultiChain(multiChain: RabitConfig['multiChain'], chains: Chain[]): void {
    if (multiChain?.defaultChainId) {
      const chainExists = chains.some(chain => chain.id === multiChain.defaultChainId);
      if (!chainExists) {
        throw new ConfigurationError(
          `Multi-chain default chain ${multiChain.defaultChainId} is not in the configured chains`, 
          'multiChain.defaultChainId'
        );
      }
    }
  }
}

/**
 * Configuration manager for Rabit
 */
export class ConfigurationManager {
  private config: RabitConfig;

  constructor(userConfig: RabitConfig) {
    this.config = this.mergeWithDefaults(userConfig);
    ConfigurationValidator.validate(this.config);
  }

  /**
   * Get the complete configuration
   */
  getConfig(): RabitConfig {
    return { ...this.config };
  }

  /**
   * Get a specific configuration section
   */
  getSection<K extends keyof RabitConfig>(section: K): RabitConfig[K] {
    return this.config[section];
  }

  /**
   * Update configuration
   */
  updateConfig(updates: DeepPartial<RabitConfig>): void {
    this.config = this.deepMerge(this.config, updates);
    ConfigurationValidator.validate(this.config);
  }

  /**
   * Get chains by IDs
   */
  getChains(chainIds?: ChainId[]): Chain[] {
    if (!chainIds) return this.config.chains;
    
    return this.config.chains.filter(chain => chainIds.includes(chain.id));
  }

  /**
   * Get chain by ID
   */
  getChain(chainId: ChainId): Chain | undefined {
    return this.config.chains.find(chain => chain.id === chainId);
  }

  /**
   * Get connector by ID
   */
  getConnector(connectorId: string): WalletConnector | undefined {
    return this.config.connectors.find(connector => connector.id === connectorId);
  }

  /**
   * Get default chain
   */
  getDefaultChain(): Chain {
    const defaultChainId = this.config.defaultChain || this.config.chains[0]?.id;
    const chain = this.getChain(defaultChainId);
    
    if (!chain) {
      throw new ConfigurationError('No default chain available');
    }
    
    return chain;
  }

  /**
   * Check if chain is supported
   */
  isChainSupported(chainId: ChainId): boolean {
    return this.config.chains.some(chain => chain.id === chainId);
  }

  /**
   * Check if smart accounts are enabled
   */
  isSmartAccountEnabled(): boolean {
    return !!this.config.smartAccount;
  }

  /**
   * Check if analytics are enabled
   */
  isAnalyticsEnabled(): boolean {
    return this.config.analytics?.enabled === true;
  }

  /**
   * Merge user config with defaults
   */
  private mergeWithDefaults(userConfig: RabitConfig): RabitConfig {
    return this.deepMerge(DEFAULT_CONFIG, userConfig) as RabitConfig;
  }

  /**
   * Deep merge two objects
   */
  private deepMerge<T>(target: any, source: any): T {
    const result = { ...target };

    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }

    return result;
  }
}

/**
 * Create a configuration manager instance
 */
export function createConfigurationManager(config: RabitConfig): ConfigurationManager {
  return new ConfigurationManager(config);
}