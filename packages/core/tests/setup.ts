import { vi } from 'vitest'

// Mock browser APIs
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
  writable: true,
})

Object.defineProperty(window, 'sessionStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(), 
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
  writable: true,
})

// Mock console methods for cleaner test output
global.console = {
  ...console,
  debug: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}

// Mock setTimeout/clearTimeout for tests
Object.defineProperty(window, 'setTimeout', {
  value: vi.fn((fn) => fn()),
  writable: true,
})

Object.defineProperty(window, 'clearTimeout', {
  value: vi.fn(),
  writable: true,
})

// Set test timeout
vi.setConfig({ testTimeout: 10000 })