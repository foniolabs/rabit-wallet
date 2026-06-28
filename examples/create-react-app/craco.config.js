const webpack = require('webpack');

/**
 * CRA (webpack 5) drops Node core polyfills that @rabit/keys / Solana need.
 * Re-add the handful that matter and provide Buffer/process globals.
 */
module.exports = {
  webpack: {
    configure: (config) => {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        buffer: require.resolve('buffer/'),
        crypto: false,
        stream: false,
        process: false,
      };
      config.plugins.push(
        new webpack.ProvidePlugin({
          Buffer: ['buffer', 'Buffer'],
        })
      );
      // Silence source-map warnings from prebuilt deps shipping maps.
      config.ignoreWarnings = [/Failed to parse source map/];
      return config;
    },
  },
};
