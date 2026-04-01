import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: 'src/index.ts',
  format: ['esm'],
  dts: {
    eager: true,
  },
  sourcemap: false,
  minify: true,
  clean: true,
  outDir: 'dist',
  shims: true,
  outputOptions: {
    banner: '#!/usr/bin/env node',
  },
  platform: 'node',
});
