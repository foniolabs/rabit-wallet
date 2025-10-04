# Contributing to Rabit

We're excited that you're interested in contributing to Rabit! This guide will help you get started.

## Development Setup

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/rabit.git`
3. Install dependencies: `pnpm install`
4. Start development: `pnpm dev`

## Project Structure

- `apps/` - Applications (dashboard, docs, landing, api)
- `packages/` - Shared packages (react, core, connectors, etc.)
- `examples/` - Example implementations
- `tools/` - Development tools and configs

## Making Changes

1. Create a new branch: `git checkout -b feature/your-feature`
2. Make your changes
3. Test your changes: `pnpm test`
4. Create a changeset: `pnpm changeset`
5. Commit your changes: `git commit -m "feat: add new feature"`
6. Push to your fork: `git push origin feature/your-feature`
7. Create a pull request

## Code Style

- Use TypeScript
- Follow the existing code style
- Add tests for new features
- Update documentation as needed

## Questions?

Join our [Discord](https://discord.gg/rabit) or open an issue!
