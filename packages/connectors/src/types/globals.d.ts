
declare global {
  interface Window {
    ethereum?: any // Keep it as any to avoid conflicts with detection.ts
  }
}

export {} // Make this a module