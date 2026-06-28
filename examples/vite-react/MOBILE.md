# Shipping Rabit as iOS + Android with Capacitor

Capacitor wraps your existing Vite React app in a native shell and lets you call native APIs (biometrics, secure storage, push) from the same JS bundle. Zero changes to wallet logic — the same `@rabit/react` SDK runs.

## Why Capacitor over React Native

- **Reuse 100% of this codebase.** Your wallet UI, the SDK, IndexedDB, the auth modal, everything — drops in unchanged.
- **One bundle, three platforms.** Web + iOS + Android from the same `dist/`.
- **Native plugins available** (biometrics, secure storage, deep links, push) when you need them.
- React Native would mean rewriting every component with RN primitives. Months of work.

## 1. Install Capacitor

```bash
cd examples/vite-react
pnpm add @capacitor/core @capacitor/cli
pnpm add @capacitor/ios @capacitor/android
```

## 2. Initialize

```bash
npx cap init "Rabit Demo" "com.rabit.demo" --web-dir=dist
```

This creates `capacitor.config.ts`. Open it and set:

```ts
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.rabit.demo',
  appName: 'Rabit Demo',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
```

## 3. Build the web bundle, then add platforms

```bash
pnpm build
npx cap add ios
npx cap add android
```

After every web rebuild you sync into the native projects:

```bash
pnpm build && npx cap sync
```

## 4. Open in native IDEs

```bash
npx cap open ios       # opens Xcode
npx cap open android   # opens Android Studio
```

Press Run. Your Vite app runs natively, with a fully embedded wallet.

## 5. Hardening for production

These are the things you'll want before shipping to App Store / Play Store:

### 5a. Biometric unlock for the PIN

Replace the `<PinUnlock />` flow with biometric prompt → fall back to PIN.

```bash
pnpm add @capacitor-community/biometric-auth
```

```ts
import { BiometricAuth } from '@capacitor-community/biometric-auth';

async function unlockWithBiometric() {
  const { isAvailable } = await BiometricAuth.isAvailable();
  if (!isAvailable) return false;
  await BiometricAuth.verify({ reason: 'Unlock your wallet' });
  return true;
}
```

Wrap the existing PIN flow: try biometric first, on success skip PIN entry.

### 5b. Move the device share to the system keychain

By default Rabit stores the device share in IndexedDB. On native you can move it to iOS Keychain / Android Keystore for hardware-backed protection:

```bash
pnpm add @capacitor/preferences
```

Build a thin adapter that uses Capacitor Preferences when available, falls back to IndexedDB on web. Replace the calls in `@rabit/keys/storage/device-share.ts` (or override via a custom storage adapter — `RabitConfig` accepts one).

### 5c. Deep link your OAuth callback

Google sign-in needs to come back to the app. In `capacitor.config.ts` add:

```ts
plugins: {
  GoogleAuth: {
    scopes: ['profile', 'email'],
    serverClientId: 'YOUR_GOOGLE_CLIENT_ID',
  },
},
```

Or use Capacitor's URL handler:

```bash
pnpm add @capacitor/app
```

```ts
import { App } from '@capacitor/app';

App.addListener('appUrlOpen', (event) => {
  // Handle OAuth callback / wallet-connect deeplinks here
});
```

### 5d. App icon + splash screen

```bash
pnpm add -D @capacitor/assets
npx capacitor-assets generate --iconBackgroundColor '#6366f1'
```

Drops icons into both native projects.

### 5e. CSP / network whitelisting

iOS App Transport Security requires you whitelist any non-HTTPS origin. Your API at `http://localhost:3001` won't work in production builds — point at your deployed API URL via env var:

```env
VITE_API_BASE_URL=https://api.your-domain.com
```

And in `App.tsx`:

```tsx
apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001',
```

## 6. Common gotchas

- **`Buffer is not defined`** — already fixed in [src/polyfills.ts](src/polyfills.ts), runs in mobile too.
- **IndexedDB inside a WKWebView** — works, but Apple has been known to wipe IndexedDB if storage pressure is high. Move sensitive shares to Keychain (5b) for production.
- **Live reload during dev** — point Capacitor at your dev server:
  ```ts
  // capacitor.config.ts
  server: { url: 'http://192.168.1.10:3012', cleartext: true }
  ```
  Replace with your machine's LAN IP. Remove before building for release.
- **Bundle size** — `pnpm build` is ~650KB gzipped right now. Acceptable for mobile, but use `manualChunks` in `vite.config.ts` to split if you ship more views.

## 7. Releasing

```bash
# iOS
npx cap copy ios && npx cap sync ios
# Open Xcode → Product → Archive → distribute via App Store Connect

# Android
cd android && ./gradlew bundleRelease
# Upload .aab to Play Console
```

## What you don't need to change

The whole wallet flow — auth, key generation, Shamir splits, signing, the dashboard, swaps, on/off-ramp — runs unchanged. The same `@rabit/react` package, the same `RabitProvider` config, the same `useWallet`/`useAuth`/`useSwap` hooks. Capacitor is purely a packaging step around what you already shipped.
