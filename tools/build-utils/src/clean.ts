import fs from 'fs';
import path from 'path';
import type { CleanOptions } from './types.js';

export async function cleanPackage(options: CleanOptions = {}): Promise<void> {
  const {
    dirs = ['dist', 'build', '.next', '.turbo', 'coverage', 'node_modules/.cache'],
    verbose = false
  } = options;

  console.log('🧹 Cleaning directories...');

  try {
    let cleanedCount = 0;

    for (const dir of dirs) {
      const dirPath = path.resolve(dir);
      
      if (fs.existsSync(dirPath)) {
        if (verbose) console.log(`🗑️  Cleaning ${dir}...`);
        
        try {
          fs.rmSync(dirPath, { recursive: true, force: true });
          cleanedCount++;
          if (verbose) console.log(`✓ Removed ${dir}`);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.warn(`⚠️  Failed to remove ${dir}: ${errorMessage}`);
        }
      }
    }

    // Clean TypeScript build info files
    const tsBuildInfoFiles = [
      '.tsbuildinfo',
      'tsconfig.tsbuildinfo',
      'src/.tsbuildinfo',
      'node_modules/.tmp/tsconfig.tsbuildinfo'
    ];

    for (const file of tsBuildInfoFiles) {
      const filePath = path.resolve(file);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
          cleanedCount++;
          if (verbose) console.log(`✓ Removed ${file}`);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.warn(`⚠️  Failed to remove ${file}: ${errorMessage}`);
        }
      }
    }

    // Clean common cache files and directories
    const cacheItems = [
      '.eslintcache',
      '.jest-cache',
      '.vitest-cache',
      '.swc',
      '.turbo',
      'node_modules/.cache'
    ];

    for (const item of cacheItems) {
      const itemPath = path.resolve(item);
      if (fs.existsSync(itemPath)) {
        try {
          const stats = fs.statSync(itemPath);
          if (stats.isDirectory()) {
            fs.rmSync(itemPath, { recursive: true, force: true });
          } else {
            fs.unlinkSync(itemPath);
          }
          cleanedCount++;
          if (verbose) console.log(`✓ Removed ${item}`);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.warn(`⚠️  Failed to remove ${item}: ${errorMessage}`);
        }
      }
    }

    if (cleanedCount > 0) {
      console.log(`✅ Cleaned ${cleanedCount} directories/files`);
    } else {
      console.log('🔵 Nothing to clean');
    }

  } catch (error) {
    console.error('❌ Clean failed');
    if (error instanceof Error) {
      console.error(error.message);
    }
    process.exit(1);
  }
}

/**
 * Clean specific directories
 */
export async function cleanDirectories(directories: string[]): Promise<void> {
  return cleanPackage({ dirs: directories });
}

/**
 * Deep clean - removes node_modules as well
 */
export async function deepClean(): Promise<void> {
  console.log('🧹 Deep cleaning...');

  try {
    // Clean build artifacts first
    await cleanPackage({ verbose: true });

    // Remove node_modules
    const nodeModulesPath = path.resolve('node_modules');
    if (fs.existsSync(nodeModulesPath)) {
      console.log('🗑️  Removing node_modules...');
      fs.rmSync(nodeModulesPath, { recursive: true, force: true });
      console.log('✓ Removed node_modules');
    }

    // Remove package-lock files
    const lockFiles = [
      'package-lock.json',
      'yarn.lock',
      'pnpm-lock.yaml'
    ];

    for (const lockFile of lockFiles) {
      const lockFilePath = path.resolve(lockFile);
      if (fs.existsSync(lockFilePath)) {
        fs.unlinkSync(lockFilePath);
        console.log(`✓ Removed ${lockFile}`);
      }
    }

    console.log('✅ Deep clean completed!');
    console.log('💡 Run your package manager install command to restore dependencies');

  } catch (error) {
    console.error('❌ Deep clean failed');
    if (error instanceof Error) {
      console.error(error.message);
    }
    process.exit(1);
  }
}