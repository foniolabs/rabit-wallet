/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The Rabit SDK runs in the browser only — Solana web3.js pulls Buffer.
  // Tell webpack to alias `buffer` to the npm shim so it works client-side.
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      buffer: 'buffer',
    };
    return config;
  },
};

export default nextConfig;
