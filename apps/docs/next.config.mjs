import path from 'node:path'
import nextra from 'nextra'

const withNextra = nextra({
  defaultShowCopyCode: true,
})

export default withNextra({
  reactStrictMode: true,
  poweredByHeader: false,
  // Pin the monorepo root so Turbopack resolves modules from the pnpm store
  // (a stray package-lock.json in a parent dir otherwise misleads detection).
  turbopack: {
    root: path.resolve(import.meta.dirname, '..', '..'),
  },
})
