#!/usr/bin/env node
/**
 * One-shot helper: writes the metadata every published package needs.
 * Run from the repo root: `node scripts/prepare-publish.mjs`.
 *
 * Idempotent — safe to re-run after edits.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const PACKAGES = [
  ['packages/types',   '@rabit/types',   'TypeScript types for the Rabit embedded wallet SDK'],
  ['packages/keys',    '@rabit/keys',    'Split-key (Shamir 2-of-3) management for Rabit'],
  ['packages/core',    '@rabit/core',    'Core SDK orchestration: auth, wallet, on-ramp'],
  ['packages/evm',     '@rabit/evm',     'EVM wallet (EOA + ERC-4337 smart accounts) for Rabit'],
  ['packages/solana',  '@rabit/solana',  'Solana wallet helpers for Rabit'],
  ['packages/onramp',  '@rabit/onramp',  'On-ramp / off-ramp engine for Rabit'],
  ['packages/react',   '@rabit/react',   'React SDK for the Rabit embedded wallet — drop-in components & hooks'],
];

const REPO_URL = 'https://github.com/foniolabs/rabit-wallet';
const VERSION  = '0.1.0';

for (const [dir, name, description] of PACKAGES) {
  const path = resolve(dir, 'package.json');
  const json = JSON.parse(readFileSync(path, 'utf8'));

  json.name        = name;
  json.version     = VERSION;
  json.description = description;
  json.license     = 'MIT';
  json.author      = json.author ?? 'Rabit contributors';
  json.homepage    = `${REPO_URL}#readme`;
  json.repository  = { type: 'git', url: `${REPO_URL}.git`, directory: dir };
  json.bugs        = { url: `${REPO_URL}/issues` };
  json.keywords    = json.keywords ?? [
    'wallet', 'web3', 'embedded', 'evm', 'solana', 'sdk',
    'non-custodial', 'shamir', 'erc-4337', 'rabit',
  ];
  json.publishConfig = { access: 'public' };
  json.sideEffects   = false;

  // Strip any `private: true` left from the monorepo phase.
  delete json.private;

  // Make sure `files` is set so we don't ship src (we ship dist + types only).
  if (!json.files || json.files.length === 0) {
    json.files = ['dist', 'README.md'];
  }

  writeFileSync(path, JSON.stringify(json, null, 2) + '\n');
  console.log(`✓ ${name}@${VERSION}`);
}

console.log('\nDone. Review with `git diff packages/*/package.json` then commit.');
