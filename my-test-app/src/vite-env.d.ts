/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_RABIT_PROJECT_ID?: string;
  readonly VITE_RABIT_API_KEY?: string;
  readonly VITE_RABIT_API_BASE_URL?: string;
  readonly VITE_GOOGLE_CLIENT_ID?: string;
  readonly VITE_BUNDLER_URL?: string;
  readonly VITE_PAYMASTER_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
