#!/usr/bin/env node

import { program } from 'commander';
import { testPackage } from '../test.js';

program
  .name('rabit-test')
  .description('Run tests using Jest or Vitest')
  .version('1.0.0')
  .option('-w, --watch', 'Watch mode', false)
  .option('-c, --coverage', 'Generate coverage report', false)
  .option('-t, --testMatch <patterns>', 'Test name patterns (comma-separated)')
  .option('--testPathPattern <pattern>', 'Test path pattern')
  .option('--collectCoverageFrom <patterns>', 'Collect coverage from (comma-separated)')
  .option('--verbose', 'Verbose output', false)
  .option('--silent', 'Silent output', false)
  .option('--no-passWithNoTests', 'Fail when no tests are found')
  .action(async (options) => {
    try {
      const testMatch = options.testMatch ? options.testMatch.split(',').map((s: string) => s.trim()) : [];
      const collectCoverageFrom = options.collectCoverageFrom ? 
        options.collectCoverageFrom.split(',').map((s: string) => s.trim()) : [];
      
      console.log('🧪 Running tests...');
      
      await testPackage({
        watch: options.watch,
        coverage: options.coverage,
        testMatch,
        testPathPattern: options.testPathPattern,
        collectCoverageFrom,
        verbose: options.verbose,
        silent: options.silent,
        passWithNoTests: options.passWithNoTests,
      });
      
    } catch (error) {
      console.error('❌ Tests failed:', error);
      process.exit(1);
    }
  });

program.parse();