import { execa } from 'execa';
import fs from 'fs';
import path from 'path';
import type { TestOptions } from './types.js';

export async function testPackage(options: TestOptions = {}): Promise<void> {
  const {
    watch = false,
    coverage = false,
    testMatch = [],
    testPathPattern,
    collectCoverageFrom = [],
    verbose = false,
    silent = false,
    passWithNoTests = true,
  } = options;

  console.log('🧪 Running tests...');

  try {
    // Determine test runner (prefer Vitest, fallback to Jest)
    const testRunner = await detectTestRunner();
    
    if (!testRunner) {
      console.error('❌ No test runner found. Please install Jest or Vitest.');
      process.exit(1);
    }

    const args: string[] = [];

    // Add test runner specific arguments
    if (testRunner === 'vitest') {
      if (watch) args.push('--watch');
      if (coverage) args.push('--coverage');
      if (verbose) args.push('--reporter=verbose');
      if (silent) args.push('--silent');
      if (passWithNoTests) args.push('--passWithNoTests');
      if (testPathPattern) args.push('--testPathPattern', testPathPattern);
      
      // Handle test name patterns for Vitest
      if (testMatch.length > 0) {
        args.push('--testNamePattern', testMatch.join('|'));
      }
      
      // Coverage collection
      if (coverage && collectCoverageFrom.length > 0) {
        collectCoverageFrom.forEach(pattern => {
          args.push('--coverage.include', pattern);
        });
      }
      
    } else if (testRunner === 'jest') {
      if (watch) args.push('--watch');
      if (coverage) args.push('--coverage');
      if (verbose) args.push('--verbose');
      if (silent) args.push('--silent');
      if (passWithNoTests) args.push('--passWithNoTests');
      if (testPathPattern) args.push('--testPathPattern', testPathPattern);
      
      // Handle test name patterns for Jest
      if (testMatch.length > 0) {
        args.push('--testNamePattern', testMatch.join('|'));
      }
      
      // Coverage collection
      if (coverage && collectCoverageFrom.length > 0) {
        args.push('--collectCoverageFrom', JSON.stringify(collectCoverageFrom));
      }
    }

    console.log(`🎯 Running ${testRunner} tests...`);
    if (args.length > 0) {
      console.log(`📋 Args: ${args.join(' ')}`);
    }

    const result = await execa(testRunner, args, {
      stdio: 'inherit',
      preferLocal: true,
      cwd: process.cwd(),
    });

    if (result.exitCode === 0) {
      console.log('✅ Tests passed!');
    } else {
      console.error('❌ Tests failed!');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Test execution failed');
    if (error instanceof Error) {
      console.error(error.message);
    }
    process.exit(1);
  }
}

/**
 * Detect which test runner is available
 */
async function detectTestRunner(): Promise<'vitest' | 'jest' | null> {
  // Check package.json dependencies
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  
  if (fs.existsSync(packageJsonPath)) {
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies
      };

      // Prefer Vitest
      if (allDeps.vitest) {
        return 'vitest';
      }

      // Fallback to Jest
      if (allDeps.jest || allDeps['@types/jest']) {
        return 'jest';
      }
    } catch (error) {
      console.warn('⚠️  Could not parse package.json');
    }
  }

  // Check if global binaries exist
  try {
    await execa('vitest', ['--version'], { 
      stdio: 'pipe',
      preferLocal: true 
    });
    return 'vitest';
  } catch {
    try {
      await execa('jest', ['--version'], { 
        stdio: 'pipe',
        preferLocal: true 
      });
      return 'jest';
    } catch {
      return null;
    }
  }
}