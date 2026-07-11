# Rabit Expo demo

A runnable app wiring `rabitwallet-native` + `<WalletScreen />` against the live
Rabit API. Boots into email sign-in → a full embedded wallet. Runs in a
**browser** (quickest) or on a **real device**.

## One-time setup

From the **monorepo root** (links + builds the workspace packages the app reads):

```bash
pnpm install
pnpm --filter "@rabit/*" build      # build the core packages the app consumes
```

Then the app's own deps:

```bash
cd examples/expo
npm install
cp .env.example .env                # defaults already point at the live API + dev bypass
```

## ▶️ Run in a browser (easiest — no device)

```bash
npm run web
```

Opens in your browser via react-native-web. Storage falls back to `localStorage`
and crypto uses the browser's native `crypto` — no native modules needed. Great
for iterating on the UI. Sign in with email; on the dev bypass the OTP is
returned by the API (check the network response / your API logs).

> Open the same web URL on your **phone's browser** to preview on-device without
> a native build.

## 📱 Run on a real Android phone (native)

For the true native experience (MMKV storage, native crypto) you need a **dev
build** — Expo Go can't load native modules.

1. Enable **USB debugging** on the phone and plug it in (`adb devices` should list it).
2. Install [Android Studio / SDK](https://docs.expo.dev/get-started/set-up-your-environment/).
3. Build + install to the device:

```bash
npm run android         # = expo run:android
```

(iOS is the same with `npm run ios` on a Mac.)

## What you get

- **Sign in** with email OTP (Google too, once you wire `@react-native-google-signin`).
- **`<WalletScreen />`** — orb avatar, portfolio total, Receive/Send/Buy/Swap,
  Tokens/Activity tabs, and bottom-sheet flows.

## Notes

- Excluded from the pnpm workspace (Expo's deps are heavy); `metro.config.js`
  reads `rabitwallet-native` + its `@rabit/*` deps from the monorepo.
- Set `EXPO_PUBLIC_RABIT_*` in `.env` to point at your own project/API.
- Optional polish: `expo-linear-gradient` (orb), `react-native-qrcode-svg`
  (receive QR), `@react-native-clipboard/clipboard` (copy).
