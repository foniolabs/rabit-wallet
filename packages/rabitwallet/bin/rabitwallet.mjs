#!/usr/bin/env node
/**
 * rabitwallet CLI.
 *
 * Usage:
 *   npx rabitwallet init [my-dapp]     scaffold a Next.js app pre-wired with rabitwallet
 *   npx rabitwallet --help
 */

import { mkdirSync, writeFileSync, readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createInterface } from 'node:readline/promises';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = resolve(__dirname, '..', 'templates');

const COLORS = {
  reset: '\x1b[0m', bold: '\x1b[1m', dim: '\x1b[2m',
  green: '\x1b[32m', cyan: '\x1b[36m', yellow: '\x1b[33m', red: '\x1b[31m',
};
const log = (m = '') => process.stdout.write(m + '\n');
const color = (c, s) => `${COLORS[c]}${s}${COLORS.reset}`;

const HELP = `
  ${color('bold', '🐰  rabitwallet')}

  ${color('bold', 'Usage')}
    npx rabitwallet init [name]    Scaffold a Next.js dApp pre-wired with rabitwallet
    npx rabitwallet --help         Show this help

  ${color('dim', 'Already have a project? Just:  npm install rabitwallet')}
`;

async function init() {
  const args = process.argv.slice(3); // after `rabitwallet init`
  let projectName = args.find((a) => !a.startsWith('-'));

  log('');
  log(color('bold', '  🐰  rabitwallet init'));
  log(color('dim', '  Scaffolds a non-custodial embedded-wallet Next.js app.\n'));

  if (!projectName) {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    projectName = (await rl.question(`  ${color('cyan', 'Project name:')} `)).trim() || 'my-rabit-app';
    rl.close();
  }

  const target = resolve(process.cwd(), projectName);
  if (existsSync(target)) {
    log(color('red', `\n  ✘ Directory ${projectName} already exists. Pick another name.\n`));
    process.exit(1);
  }

  const sourceDir = join(TEMPLATES_DIR, 'nextjs');
  if (!existsSync(sourceDir)) {
    log(color('red', `\n  ✘ Template not found at ${sourceDir}\n`));
    process.exit(1);
  }

  log(`  ${color('dim', '→')} Creating ${color('bold', projectName)}…`);
  copyTemplate(sourceDir, target, projectName);

  log(`  ${color('green', '✓')} Done!\n`);
  log(`  ${color('bold', 'Next steps:')}`);
  log(`    cd ${projectName}`);
  log(`    npm install         ${color('dim', '# or pnpm / yarn / bun')}`);
  log(`    npm run dev`);
  log('');
  log(color('dim', '  Docs: https://github.com/web3normad/rabit\n'));
}

/** Recursive copy: rename `_gitignore`→`.gitignore`, replace `__APP_NAME__`. */
function copyTemplate(src, dest, projectName) {
  mkdirSync(dest, { recursive: true });
  for (const entry of readdirSync(src)) {
    const srcPath = join(src, entry);
    const isDir = statSync(srcPath).isDirectory();
    const renamed = entry === '_gitignore' ? '.gitignore' : entry === '_npmrc' ? '.npmrc' : entry;
    const destPath = join(dest, renamed);
    if (isDir) {
      copyTemplate(srcPath, destPath, projectName);
    } else {
      const buf = readFileSync(srcPath);
      const ext = renamed.split('.').pop() ?? '';
      const TEXT_EXT = new Set(['ts', 'tsx', 'js', 'jsx', 'mjs', 'cjs', 'json', 'md', 'html', 'css', 'env', 'gitignore', 'npmrc']);
      if (TEXT_EXT.has(ext) || renamed === '.gitignore' || renamed === '.npmrc') {
        writeFileSync(destPath, buf.toString('utf8').replace(/__APP_NAME__/g, projectName));
      } else {
        writeFileSync(destPath, buf);
      }
    }
  }
}

async function main() {
  const cmd = process.argv[2];
  if (cmd === 'init') return init();
  if (!cmd || cmd === '--help' || cmd === '-h' || cmd === 'help') {
    log(HELP);
    return;
  }
  log(color('red', `\n  ✘ Unknown command "${cmd}".`));
  log(HELP);
  process.exit(1);
}

main().catch((err) => {
  log(color('red', `\n  ✘ ${err.message}\n`));
  process.exit(1);
});
