// tests/setup.ts
import { vi, beforeEach, afterEach } from 'vitest'

// Global test setup - run before all tests
beforeEach(() => {
  // Clear all mocks
  vi.clearAllMocks()

  // Reset window.ethereum if it exists
  if (typeof window !== 'undefined') {
    // Delete the property first to allow redefinition
    delete (window as any).ethereum
  }

  // Create a fresh mock ethereum object for each test
  const mockEthereum = {
    isMetaMask: false,
    request: vi.fn(),
    on: vi.fn(),
    removeListener: vi.fn()
  }

  // Define it as configurable so tests can redefine it
  if (typeof window !== 'undefined') {
    Object.defineProperty(window, 'ethereum', {
      value: mockEthereum,
      writable: true,
      configurable: true // This is key!
    })
  }

  // Mock navigator
  if (typeof navigator !== 'undefined') {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      writable: true,
      configurable: true
    })
  }

  // Reset Function constructor mock
  const originalFunction = global.Function
  global.Function = vi.fn().mockImplementation((code: string) => {
    return originalFunction(code)
  }) as any
})

afterEach(() => {
  // Restore all mocks
  vi.restoreAllMocks()
  
  // Clean up global state
  if (typeof window !== 'undefined') {
    delete (window as any).ethereum
  }
})

// Set test timeout
vi.setConfig({ testTimeout: 10000 })