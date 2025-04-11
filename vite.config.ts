// ./vite.config.ts

import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import nodeResolve from 'vite-plugin-resolve';

export default defineConfig({
  plugins: [nodeResolve({})],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.js')
    },
    target: 'esnext',
    outDir: 'dist',
    rollupOptions: {
      output: {
        format: 'cjs',
        assetFileNames: '[name].[ext]', // This will place assets in the root of the dist directory
        entryFileNames: '[name].js', // This will place entry files in the root of the dist directory
        chunkFileNames: '[name].js', // This will place chunk files in the root of the dist directory
      },
    },
  },
});