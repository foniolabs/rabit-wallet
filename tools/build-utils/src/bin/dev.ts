#!/usr/bin/env node

import { program } from 'commander';
import { devPackage } from '../dev.js';

program
  .name('rabit-dev')
  .description('Start development mode with file watching')
  .version('1.0.0')
  .option('-e, --entry <dir>', 'Entry directory', 'src')
  .option('-o, --out <dir>', 'Output directory', 'dist')
  .option('-f, --format <format>', 'Output format (esm, cjs, both)', 'esm')
  .option('--external <packages>', 'External packages (comma-separated)')
  .option('--platform <platform>', 'Platform target (node, browser, neutral)', 'neutral')
  .option('--target <target>', 'JavaScript target version', 'es2020')
  .option('--debounce <ms>', 'Debounce delay in milliseconds', '300')
  .option('--bundle', 'Bundle dependencies', false)
  .action(async (options) => {
    try {
      const external = options.external ? options.external.split(',').map((s: string) => s.trim()) : [];
      const debounceMs = parseInt(options.debounce, 10);
      
      console.log('🚀 Starting Rabit development mode...');
      
      await devPackage({
        entryDir: options.entry,
        outDir: options.out,
        format: options.format,
        external,
        platform: options.platform,
        target: options.target,
        debounceMs,
        bundle: options.bundle,
      });
      
    } catch (error) {
      console.error('❌ Development mode failed:', error);
      process.exit(1);
    }
  });

program.parse();