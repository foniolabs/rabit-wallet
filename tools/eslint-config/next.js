/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: ['./react.js', 'next/core-web-vitals'],
  rules: {
    // Next.js specific rules
    '@next/next/no-html-link-for-pages': 'error',
    '@next/next/no-img-element': 'warn',
    '@next/next/no-unwanted-polyfillio': 'error',
    '@next/next/no-page-custom-font': 'error',
    '@next/next/no-css-tags': 'error',
    '@next/next/no-sync-scripts': 'error',
    '@next/next/no-before-interactive-script-outside-document': 'error',
    '@next/next/inline-script-id': 'error',
    '@next/next/next-script-for-ga': 'error',
    
    // Performance and SEO
    '@next/next/no-document-import-in-page': 'error',
    '@next/next/no-head-import-in-document': 'error',
    '@next/next/no-script-component-in-head': 'error',
    '@next/next/no-styled-jsx-in-document': 'error',
    '@next/next/no-title-in-document-head': 'error',
    
    // Import rules for Next.js
    'import/no-anonymous-default-export': 'warn',
    'import/no-default-export': 'off', // Next.js requires default exports for pages
  },
  env: {
    browser: true,
    node: true,
    es2022: true,
  },
  overrides: [
    {
      files: [
        'pages/**/*.{js,ts,jsx,tsx}',
        'app/**/*.{js,ts,jsx,tsx}',
        'next.config.js',
        'next.config.mjs',
        'next.config.ts',
      ],
      rules: {
        'import/no-default-export': 'off',
      },
    },
  ],
};