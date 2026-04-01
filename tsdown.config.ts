import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: 'src/index.ts',
  format: ['cjs'],
  dts: {
    eager: true,
  },
  sourcemap: false,
  minify: false,
  clean: true,
  outDir: 'dist',
  outExtensions() {
    return { js: '.cjs' };
  },
  outputOptions: {
    banner: '#!/usr/bin/env node',
  },
  platform: 'node',
  deps: {
    skipNodeModulesBundle: true,
  },
});
