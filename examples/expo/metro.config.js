// Expo Metro config for the pnpm monorepo. Lets Metro read rabitwallet-native
// (and its @rabit/* deps) straight from source in the workspace.
const { getDefaultConfig } = require('expo/metro-config')
const path = require('node:path')

const projectRoot = __dirname
const monorepoRoot = path.resolve(projectRoot, '../..')

const config = getDefaultConfig(projectRoot)

// Watch the whole monorepo so edits to packages/* hot-reload.
config.watchFolders = [monorepoRoot]

// Resolve modules from the app first, then the monorepo root (pnpm store).
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
]

// pnpm symlinks — let Metro follow them.
config.resolver.unstable_enableSymlinks = true
config.resolver.disableHierarchicalLookup = false

module.exports = config
