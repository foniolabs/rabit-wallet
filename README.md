<div align="center">
  <h1>Rabit (رابط)</h1>
  <p><strong>The wallet connector that actually works</strong></p>
  
  [![npm version](https://badge.fury.io/js/@rabit%2Freact.svg)](https://badge.fury.io/js/@rabit%2Freact)
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![Build Status](https://github.com/your-org/rabit/workflows/CI/badge.svg)](https://github.com/your-org/rabit/actions)
  
  [Documentation](https://docs.rabit.com) • [Examples](https://examples.rabit.com) • [Dashboard](https://dashboard.rabit.com)
</div>

## 🎯 Why Rabit?

> **"Frustrated with wallet connectors that break? We were too. That's why we built Rabit."**

Rabit (Arabic: رابط, meaning "connector") is an enterprise-grade wallet connection platform that combines the best of RainbowKit's developer experience with Privy's smart account capabilities.

## 🚀 Quick Start

```bash
npm install @rabit/react wagmi viem @tanstack/react-query
```

```typescript
import { RabitProvider, ConnectButton, getDefaultConfig } from '@rabit/react';

const config = getDefaultConfig({
  projectId: 'your-project-id',
  apiKey: 'your-api-key',
  appName: 'My DApp'
});

function App() {
  return (
    <RabitProvider config={config}>
      <ConnectButton />
    </RabitProvider>
  );
}
```

## 🔧 Development

```bash
# Install dependencies
pnpm install

# Start development
pnpm dev

# Build all packages
pnpm build
```

## 📚 Documentation

- [Getting Started](https://docs.rabit.com/getting-started)
- [API Reference](https://docs.rabit.com/api)
- [Examples](https://docs.rabit.com/examples)
- [Migration Guide](https://docs.rabit.com/migration)

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

## 📄 License

Rabit is [MIT licensed](./LICENSE).
