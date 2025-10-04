/**
 * tests/setup.ts
 * Test setup and mocks for Smart Accounts package
 */
import { beforeEach, afterEach, vi } from 'vitest'

// Mock browser APIs that might not be available in Node.js test environment
global.fetch = global.fetch || vi.fn(() => Promise.reject(new Error('fetch not available')))

// Handle crypto properly - don't override if it already exists
if (!global.crypto) {
  Object.defineProperty(global, 'crypto', {
    value: {
      getRandomValues: (arr: any) => {
        for (let i = 0; i < arr.length; i++) {
          arr[i] = Math.floor(Math.random() * 256)
        }
        return arr
      },
      subtle: {
        digest: () => Promise.resolve(new ArrayBuffer(32))
      }
    },
    writable: true,
    configurable: true
  })
} else {
  // If crypto exists but missing methods, add them
  if (!global.crypto.getRandomValues) {
    global.crypto.getRandomValues = (arr: any) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256)
      }
      return arr
    }
  }
}

// Mock localStorage for embedded wallet tests
const localStorageMock = {
  getItem: vi.fn(() => null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(() => null)
}

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
  configurable: true
})

// Mock window object for browser-specific signers
Object.defineProperty(global, 'window', {
  value: {
    location: {
      origin: 'http://localhost:3000'
    },
    localStorage: localStorageMock
  },
  writable: true,
  configurable: true
})

// Mock navigator for WebAuthn/Passkey tests
Object.defineProperty(global, 'navigator', {
  value: {
    credentials: {
      create: vi.fn(() => Promise.reject(new Error('WebAuthn not available in test environment'))),
      get: vi.fn(() => Promise.reject(new Error('WebAuthn not available in test environment')))
    }
  },
  writable: true,
  configurable: true
})

// Mock btoa/atob for base64 operations (used in passkey signer)
if (typeof global.btoa === 'undefined') {
  global.btoa = (str: string) => Buffer.from(str, 'binary').toString('base64')
}
if (typeof global.atob === 'undefined') {
  global.atob = (b64: string) => Buffer.from(b64, 'base64').toString('binary')
}

// Console setup for cleaner test output
beforeEach(() => {
  // Suppress console.warn in tests unless explicitly needed
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
  // Restore mocks after each test
  vi.restoreAllMocks()
})