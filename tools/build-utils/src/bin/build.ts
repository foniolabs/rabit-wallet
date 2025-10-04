#!/usr/bin/env node

import { program } from 'commander';
import { buildPackage } from '../build.js';

program
  .name('rabit-build')
  .description('Build packages using esbuild')
  .version('1.0.0')
  .option('-e, --entry <dir>', 'Entry directory', 'src')
  .option('-o, --out <dir>', 'Output directory', 'dist')
  .option('-f, --format <format>', 'Output format (esm, cjs, both)', 'both')
  .option('-m, --minify', 'Minify output', false)
  .option('--no-sourcemap', 'Disable sourcemaps')
  .option('--no-declaration', 'Skip TypeScript declarations')
  .option('--external <packages>', 'External packages (comma-separated)')
  .option('--platform <platform>', 'Platform target (node, browser, neutral)', 'neutral')
  .option('--target <target>', 'JavaScript target version', 'es2020')
  .option('--bundle', 'Bundle dependencies', false)
  .action(async (options) => {
    try {
      const external = options.external ? options.external.split(',').map((s: string) => s.trim()) : [];
      
      console.log('🚀 Starting Rabit build...');
      
      const result = await buildPackage({
        entryDir: options.entry,
        outDir: options.out,
        format: options.format,
        minify: options.minify,
        sourcemap: options.sourcemap,
        declaration: options.declaration,
        external,
        platform: options.platform,
        target: options.target,
        bundle: options.bundle,
      });
      
      if (result.success) {
        console.log('✅ Build completed successfully!');
        if (result.outputFiles && result.outputFiles.length > 0) {
          console.log(`📦 Generated ${result.outputFiles.length} files`);
        }
        process.exit(0);
      } else {
        console.error('❌ Build failed');
        if (result.errors) {
          result.errors.forEach(error => console.error(error));
        }
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Build failed:', error);
      process.exit(1);
    }
  });

program.parse();