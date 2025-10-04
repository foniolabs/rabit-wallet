# Rabit Tools

This directory contains shared tooling and configuration for the Rabit monorepo.

## 📁 Structure

```
tools/
├── eslint-config/     # Shared ESLint configurations
├── tsconfig/          # Shared TypeScript configurations
└── build-utils/       # Build utilities and scripts
```

## 🔧 ESLint Config (`@rabit/eslint-config`)

Shared ESLint configurations for different environments:

- **`index.js`** - Base configuration with TypeScript support
- **`react.js`** - React-specific rules and accessibility checks
- **`next.js`** - Next.js optimized configuration
- **`node.js`** - Node.js environment configuration

### Usage

```js
// .eslintrc.js
module.exports = {
  extends: ["@rabit/eslint-config/react"]
}
```

## 📝 TypeScript Config (`@rabit/tsconfig`)

Shared TypeScript configurations:

- **`base.json`** - Base TypeScript configuration
- **`react.json`** - React/DOM environment
- **`next.json`** - Next.js optimized settings
- **`node.json`** - Node.js environment

### Usage

```json
// tsconfig.json
{
  "extends": "@rabit/tsconfig/react.json"
}
```

## 🛠️ Build Utils (`@rabit/build-utils`)

TypeScript-first build utilities with esbuild:

### Features

- **Fast builds** with esbuild
- **TypeScript** declarations generation
- **Multiple formats** (ESM, CJS, or both)
- **File watching** for development
- **Testing** with Jest/Vitest detection
- **Clean utilities** for cache management

### CLI Commands

```bash
# Build package
pnpm rabit-build --format both --minify

# Development mode with watching
pnpm rabit-dev --entry src --out dist

# Run tests
pnpm rabit-test --watch --coverage
```

### Programmatic API

```ts
import { buildPackage, devPackage } from '@rabit/build-utils';

// Build a package
await buildPackage({
  entryDir: 'src',
  outDir: 'dist',
  format: 'both',
  minify: true
});

// Start development mode
await devPackage({
  entryDir: 'src',
  format: 'esm'
});
```

## 🚀 Getting Started

1. **Install dependencies** in each tool directory:
   ```bash
   cd tools/eslint-config && pnpm install
   cd tools/tsconfig && pnpm install
   cd tools/build-utils && pnpm install
   ```

2. **Build the build-utils** (since it's TypeScript):
   ```bash
   cd tools/build-utils && pnpm build
   ```

3. **Use in packages** by extending configurations:
   ```json
   // In any package's package.json
   {
     "devDependencies": {
       "@rabit/eslint-config": "workspace:*",
       "@rabit/tsconfig": "workspace:*",
       "@rabit/build-utils": "workspace:*"
     }
   }
   ```

## 🔄 Integration with Turbo

These tools integrate seamlessly with Turborepo:

```json
// turbo.json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

## 📋 Best Practices

1. **Always extend** base configurations rather than duplicating
2. **Use TypeScript** for all new build utilities
3. **Test configurations** with the examples directory
4. **Keep external dependencies minimal** to avoid version conflicts
5. **Document any new utilities** with examples

---

These tools provide a solid foundation for consistent development across all Rabit packages! 🎯