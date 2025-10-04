export interface BuildOptions {
  entryDir?: string;
  outDir?: string;
  format?: 'esm' | 'cjs' | 'both';
  minify?: boolean;
  sourcemap?: boolean;
  external?: string[];
  declaration?: boolean;
  watch?: boolean;
  platform?: 'node' | 'browser' | 'neutral';
  target?: string;
  bundle?: boolean;
}

export interface DevOptions extends BuildOptions {
  port?: number;
  host?: string;
  debounceMs?: number;
}

export interface TestOptions {
  watch?: boolean;
  coverage?: boolean;
  testMatch?: string[];
  testPathPattern?: string;
  collectCoverageFrom?: string[];
  verbose?: boolean;
  silent?: boolean;
  passWithNoTests?: boolean;
}

export interface CleanOptions {
  dirs?: string[];
  verbose?: boolean;
}

export interface PackageJsonConfig {
  name: string;
  version: string;
  main?: string;
  module?: string;
  types?: string;
  type?: 'module' | 'commonjs';
  exports?: Record<string, any>;
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
  files?: string[];
  publishConfig?: {
    access?: 'public' | 'restricted';
    registry?: string;
    [key: string]: any;
  };
  engines?: Record<string, string>;
  repository?: string | {
    type: string;
    url: string;
  };
  keywords?: string[];
  author?: string | {
    name: string;
    email?: string;
    url?: string;
  };
  license?: string;
  description?: string;
  homepage?: string;
  bugs?: string | {
    url: string;
    email?: string;
  };
  // Allow additional properties
  [key: string]: any;
}

export interface BuildResult {
  success: boolean;
  errors?: string[];
  warnings?: string[];
  outputFiles?: string[];
  metafile?: any;
}

export interface WatcherEvent {
  type: 'change' | 'add' | 'unlink';
  path: string;
  stats?: {
    size: number;
    mtime: Date;
  };
}