# Rabit Expo demo

A runnable Expo app wiring `rabitwallet-native` + `<WalletScreen />` against the
live Rabit API. Boots straight into email sign-in → a full embedded wallet.

## Run it

From the **monorepo root** first, so the workspace packages are linked:

```bash
pnpm install          # links rabitwallet-native + @rabit/* into the workspace
pnpm --filter rabitwallet-native build   # (or it's read from source via Metro)
```

Then the app:

```bash
cd examples/expo
npm install           # installs expo + react-native + native modules
cp .env.example .env  # defaults already point at the live API + dev bypass
npx expo start        # press i (iOS) / a (Android)
```

> **New Architecture / MMKV / crypto** need a **dev build**, not Expo Go:
> `npx expo run:ios` or `npx expo run:android` (or `eas build --profile development`).
> `react-native-mmkv` and `react-native-get-random-values` are native modules.

## What you get

- **Sign in** with email OTP (the API returns the code as `devOtp` on the dev
  bypass; with a real project the OTP is emailed).
- **`<WalletScreen />`** — orb avatar, portfolio total, Receive/Send/Buy/Swap,
  Tokens/Activity tabs, and bottom-sheet flows.

## Notes

- This example is **excluded from the pnpm workspace** (so Expo's heavy deps
  don't slow monorepo CI). The `metro.config.js` resolves `rabitwallet-native`
  and its `@rabit/*` deps from the monorepo `node_modules`.
- Set `EXPO_PUBLIC_RABIT_*` in `.env` to point at your own project/API.
- For a gradient orb, QR receive, and clipboard, add `expo-linear-gradient`,
  `react-native-qrcode-svg`, and `@react-native-clipboard/clipboard`.
