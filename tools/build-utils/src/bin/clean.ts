#!/usr/bin/env node

import { program } from 'commander';
import { cleanPackage, deepClean } from '../clean.js';

program
  .name('rabit-clean')
  .description('Clean build artifacts and cache files')
  .version('1.0.0')
  .option('-d, --dirs <directories>', 'Directories to clean (comma-separated)', 'dist,build,.next,.turbo,coverage')
  .option('--deep', 'Deep clean (removes node_modules and lock files)', false)
  .option('--verbose', 'Verbose output', false)
  .action(async (options) => {
    try {
      if (options.deep) {
        console.log('🧹 Starting deep clean...');
        await deepClean();
      } else {
        const dirs = options.dirs.split(',').map((s: string) => s.trim());
        
        console.log('🧹 Cleaning directories...');
        await cleanPackage({
          dirs,
          verbose: options.verbose,
        });
      }
      
    } catch (error) {
      console.error('❌ Clean failed:', error);
      process.exit(1);
    }
  });

program.parse();