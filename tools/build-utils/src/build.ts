import { build, type BuildResult as ESBuildBuildResult } from 'esbuild';
import { glob } from 'glob';
import path from 'path';
import fs from 'fs';
import { execa } from 'execa';
import type { BuildOptions, BuildResult, PackageJsonConfig } from './types.js';

const defaultExternals = [
  'next',
  'next/router',
  'next/head',
  'next/image',
  'next/link',
  'next/script',
  'react',
  'react-dom',
  'react/jsx-runtime',
  'wagmi',
  'viem',
  '@tanstack/react-query',
  '@walletconnect/web3wallet',
  '@web3modal/wagmi',
  'ethers',
  'web3',
];

export async function buildPackage(options: BuildOptions = {}): Promise<BuildResult> {
  const {
    entryDir = 'src',
    outDir = 'dist',
    format = 'both',
    minify = false,
    sourcemap = true,
    external = [],
    declaration = true,
    platform = 'neutral',
    target = 'es2020',
    bundle = false,
  } = options;

  console.log('🚀 Building package...');

  try {
    // Clean output directory
    if (fs.existsSync(outDir)) {
      fs.rmSync(outDir, { recursive: true, force: true });
    }
    fs.mkdirSync(outDir, { recursive: true });

    // Find all entry points
    const entryPoints = await glob(`${entryDir}/**/*.{ts,tsx}`, {
      ignore: ['**/*.test.*', '**/*.spec.*', '**/*.d.ts', '**/__tests__/**/*']
    });

    if (entryPoints.length === 0) {
      throw new Error('No entry points found');
    }

    console.log(`📁 Found ${entryPoints.length} entry points`);

    // Base build options
    const baseOptions = {
      entryPoints,
      bundle,
      platform: platform as 'node' | 'browser' | 'neutral',
      target,
      sourcemap,
      minify,
      // Only add external if bundling
      ...(bundle && { external: [...defaultExternals, ...external] }),
      outbase: entryDir,
      preserveSymlinks: true,
      metafile: true,
      logLevel: 'error' as const,
    };

    const buildPromises: Promise<ESBuildBuildResult>[] = [];

    // Build ESM
    if (format === 'esm' || format === 'both') {
      console.log('📦 Building ESM...');
      buildPromises.push(
        build({
          ...baseOptions,
          format: 'esm',
          outdir: format === 'both' ? path.join(outDir, 'esm') : outDir,
          outExtension: format === 'both' ? { '.js': '.mjs' } : { '.js': '.js' },
        })
      );
    }

    // Build CJS
    if (format === 'cjs' || format === 'both') {
      console.log('📦 Building CJS...');
      buildPromises.push(
        build({
          ...baseOptions,
          format: 'cjs',
          outdir: format === 'both' ? path.join(outDir, 'cjs') : outDir,
          outExtension: format === 'both' ? { '.js': '.cjs' } : { '.js': '.js' },
        })
      );
    }

    const buildResults = await Promise.all(buildPromises);

    // Generate TypeScript declarations if needed
    if (declaration) {
      try {
        console.log('📝 Generating TypeScript declarations...');
        await execa('tsc', [
          '--emitDeclarationOnly',
          '--declaration',
          '--declarationMap',
          '--outDir', outDir,
          '--project', './tsconfig.json'
        ], { 
          stdio: 'pipe',
          preferLocal: true,
          cwd: process.cwd()
        });
      } catch (error) {
        console.warn('⚠️  Warning: TypeScript declaration generation failed');
        if (error instanceof Error) {
          console.warn(error.message);
        }
      }
    }

    // Copy and update package.json
    await copyAndUpdatePackageJson(outDir, format);

    // Create barrel export if needed
    await createBarrelExport(outDir, format);

    console.log('✅ Package built successfully!');

    return {
      success: true,
      outputFiles: buildResults.flatMap(result => 
        result.outputFiles?.map(file => file.path) || []
      ),
      metafile: buildResults[0]?.metafile,
    };

  } catch (error) {
    console.error('❌ Build failed');
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(errorMessage);
    
    return {
      success: false,
      errors: [errorMessage],
    };
  }
}

/**
 * Copy and update package.json for the built package
 */
async function copyAndUpdatePackageJson(outDir: string, format: BuildOptions['format']): Promise<void> {
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    return;
  }

  const packageJson: PackageJsonConfig = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  // Update paths based on build format
  if (format === 'both') {
    packageJson.main = './cjs/index.cjs';
    packageJson.module = './esm/index.mjs';
    packageJson.types = './index.d.ts';
    packageJson.exports = {
      '.': {
        import: './esm/index.mjs',
        require: './cjs/index.cjs',
        types: './index.d.ts'
      },
      './package.json': './package.json'
    };
  } else if (format === 'esm') {
    packageJson.main = './index.js';
    packageJson.module = './index.js';
    packageJson.type = 'module';
    packageJson.types = './index.d.ts';
    packageJson.exports = {
      '.': {
        import: './index.js',
        types: './index.d.ts'
      },
      './package.json': './package.json'
    };
  } else if (format === 'cjs') {
    packageJson.main = './index.js';
    packageJson.types = './index.d.ts';
    packageJson.exports = {
      '.': {
        require: './index.js',
        types: './index.d.ts'
      },
      './package.json': './package.json'
    };
  }

  // Remove dev dependencies and scripts
  delete packageJson.devDependencies;
  delete packageJson.scripts;

  // Ensure we have the required fields
  packageJson.files = packageJson.files || ['dist', '*.d.ts', 'README.md'];
  packageJson.publishConfig = packageJson.publishConfig || {
    access: 'public'
  };

  fs.writeFileSync(
    path.join(outDir, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );
}

/**
 * Create barrel export file if index doesn't exist
 */
async function createBarrelExport(outDir: string, format: BuildOptions['format']): Promise<void> {
  const srcIndexPath = path.join(process.cwd(), 'src', 'index.ts');
  const srcIndexTsxPath = path.join(process.cwd(), 'src', 'index.tsx');
  
  // If there's already an index file, don't create a barrel export
  if (fs.existsSync(srcIndexPath) || fs.existsSync(srcIndexTsxPath)) {
    return;
  }

  // Find all TypeScript files in src (excluding test files)
  const tsFiles = await glob('src/**/*.{ts,tsx}', {
    ignore: ['**/*.test.*', '**/*.spec.*', '**/*.d.ts', '**/index.*']
  });

  if (tsFiles.length === 0) {
    return;
  }

  // Generate barrel exports
  const exports = tsFiles
    .map(file => {
      const relativePath = path.relative('src', file).replace(/\.(ts|tsx)$/, '');
      return `export * from './${relativePath}';`;
    })
    .join('\n');

  // Write barrel export files based on format
  if (format === 'both') {
    // ESM barrel
    fs.writeFileSync(
      path.join(outDir, 'esm', 'index.mjs'),
      exports
    );
    
    // CJS barrel
    fs.writeFileSync(
      path.join(outDir, 'cjs', 'index.cjs'),
      exports
    );
  } else {
    fs.writeFileSync(
      path.join(outDir, 'index.js'),
      exports
    );
  }
}