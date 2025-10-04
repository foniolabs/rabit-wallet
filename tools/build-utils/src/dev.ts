import chokidar from 'chokidar';
import path from 'path';
import fs from 'fs';
import { buildPackage } from './build.js';
import type { DevOptions, WatcherEvent } from './types.js';

export async function devPackage(options: DevOptions = {}): Promise<void> {
  const {
    entryDir = 'src',
    outDir = 'dist',
    format = 'esm',
    debounceMs = 300,
    ...buildOptions
  } = options;

  console.log('🚀 Starting development mode...');
  console.log(`👀 Watching: ${entryDir}`);
  console.log(`📁 Output: ${outDir}`);

  // Initial build
  const initialResult = await buildPackage({
    ...buildOptions,
    entryDir,
    outDir,
    format,
    minify: false,
    sourcemap: true
  });

  if (!initialResult.success) {
    console.error('❌ Initial build failed');
    process.exit(1);
  }

  // Watch for changes
  if (!fs.existsSync(entryDir)) {
    console.error(`❌ Entry directory "${entryDir}" does not exist`);
    process.exit(1);
  }

  console.log('🔍 Watching for changes...');
  
  const watcher = chokidar.watch(entryDir, {
    ignored: /(^|[\/\\])\../, // ignore dotfiles
    persistent: true,
    ignoreInitial: true,
    followSymlinks: false,
  });

  let isBuilding = false;
  let pendingBuild = false;
  let debounceTimer: NodeJS.Timeout | null = null;

  const rebuild = async (event: WatcherEvent) => {
    // Clear any existing debounce timer
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    // Debounce rapid file changes
    debounceTimer = setTimeout(async () => {
      if (isBuilding) {
        pendingBuild = true;
        return;
      }

      isBuilding = true;
      const startTime = Date.now();
      
      console.log(`🔄 Rebuilding due to ${event.type}: ${path.relative(process.cwd(), event.path)}`);

      try {
        const result = await buildPackage({
          ...buildOptions,
          entryDir,
          outDir,
          format,
          minify: false,
          sourcemap: true
        });

        const duration = Date.now() - startTime;
        
        if (result.success) {
          console.log(`✅ Rebuild complete (${duration}ms)`);
        } else {
          console.error('❌ Rebuild failed');
          if (result.errors) {
            result.errors.forEach(error => console.error(error));
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`❌ Rebuild failed: ${errorMessage}`);
      }

      isBuilding = false;

      // If there's a pending build, trigger it
      if (pendingBuild) {
        pendingBuild = false;
        setImmediate(() => rebuild(event));
      }
    }, debounceMs);
  };

  // Set up file watchers
  watcher
    .on('change', (filePath, stats) => {
      rebuild({
        type: 'change',
        path: filePath,
        ...(stats && { stats: { size: stats.size, mtime: stats.mtime } })
      });
    })
    .on('add', (filePath, stats) => {
      rebuild({
        type: 'add',
        path: filePath,
        ...(stats && { stats: { size: stats.size, mtime: stats.mtime } })
      });
    })
    .on('unlink', (filePath) => {
      rebuild({
        type: 'unlink',
        path: filePath
      });
    })
    .on('error', (error) => {
      console.error('❌ Watcher error:', error);
    })
    .on('ready', () => {
      console.log('🎯 File watcher ready');
    });

  // Handle graceful shutdown
  const cleanup = () => {
    console.log('\n🛑 Stopping development mode...');
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    watcher.close();
    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
  process.on('exit', cleanup);

  // Keep the process alive
  process.stdin.resume();
}