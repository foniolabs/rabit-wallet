module.exports = {
  root: true,
  env: {
    browser: true,
    es2020: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  rules: {
    'no-unused-vars': 'off', // Turn off for TypeScript
    'no-console': 'warn',
    'no-undef': 'off', // Turn off for TypeScript files since TS handles this
  },
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      parser: '@typescript-eslint/parser',
      rules: {
        // TypeScript-specific rules can go here
        'no-unused-vars': 'off',
      },
    },
  ],
  ignorePatterns: ['dist/', 'node_modules/', '*.d.ts'],
};
