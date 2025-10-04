/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: ['./index.js'],
  rules: {
    // Node.js specific rules
    'no-console': 'off', // Console is fine in Node.js
    'no-process-env': 'off',
    'no-process-exit': 'error',
    'no-buffer-constructor': 'error',
    'no-new-require': 'error',
    'no-path-concat': 'error',
    
    // Prefer modern Node.js APIs
    'prefer-promise-reject-errors': 'error',
    'prefer-rest-params': 'error',
    'prefer-spread': 'error',
    
    // Import rules for Node.js
    'import/no-default-export': 'error',
    'import/prefer-default-export': 'off',
  },
  env: {
    node: true,
    es2022: true,
  },
  overrides: [
    {
      files: ['*.config.js', '*.config.ts', '*.config.mjs'],
      rules: {
        'import/no-default-export': 'off',
      },
    },
  ],
};