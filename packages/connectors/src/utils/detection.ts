/**
 * Wallet detection utilities
 */

export interface WalletDetectionResult {
  isInstalled: boolean
  provider?: any
}

/**
 * Detect MetaMask installation
 */
export function detectMetaMask(): WalletDetectionResult {
  if (typeof window === 'undefined') {
    return { isInstalled: false }
  }

  // Check for MetaMask directly
  if ((window as any).ethereum?.isMetaMask) {
    return { isInstalled: true, provider: (window as any).ethereum }
  }

  // Check in providers array
  if ((window as any).ethereum?.providers) {
    const metamaskProvider = (window as any).ethereum.providers.find(
      (provider: any) => provider.isMetaMask
    )
    if (metamaskProvider) {
      return { isInstalled: true, provider: metamaskProvider }
    }
  }

  return { isInstalled: false }
}

/**
 * Detect Coinbase Wallet installation
 */
export function detectCoinbaseWallet(): WalletDetectionResult {
  if (typeof window === 'undefined') {
    return { isInstalled: false }
  }

  // Check for Coinbase Wallet directly
  if ((window as any).ethereum?.isCoinbaseWallet) {
    return { isInstalled: true, provider: (window as any).ethereum }
  }

  // Check in providers array
  if ((window as any).ethereum?.providers) {
    const coinbaseProvider = (window as any).ethereum.providers.find(
      (provider: any) => provider.isCoinbaseWallet
    )
    if (coinbaseProvider) {
      return { isInstalled: true, provider: coinbaseProvider }
    }
  }

  // Check for coinbaseWalletExtension
  if ((window as any).coinbaseWalletExtension) {
    return { isInstalled: true, provider: (window as any).coinbaseWalletExtension }
  }

  return { isInstalled: false }
}

/**
 * Detect any injected wallet
 */
export function detectInjectedWallet(): WalletDetectionResult {
  if (typeof window === 'undefined') {
    return { isInstalled: false }
  }

  if ((window as any).ethereum) {
    return { isInstalled: true, provider: (window as any).ethereum }
  }

  return { isInstalled: false }
}

/**
 * Get all available wallets
 */
export function detectAllWallets(): Record<string, WalletDetectionResult> {
  return {
    metamask: detectMetaMask(),
    coinbase: detectCoinbaseWallet(),
    injected: detectInjectedWallet()
  }
}

/**
 * Check if running on mobile device
 */
export function isMobile(): boolean {
  if (typeof navigator === 'undefined') return false
  
  return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

/**
 * Check if running on iOS
 */
export function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false
  
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
}

/**
 * Check if running on Android
 */
export function isAndroid(): boolean {
  if (typeof navigator === 'undefined') return false
  
  return /Android/.test(navigator.userAgent)
}

// Global window types
declare global {
  interface Window {
    ethereum?: any
  }
}