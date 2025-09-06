// @ts-nocheck
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths()],
  resolve: {
    alias: {
      // @ts-expect-error import.meta is valid in Vite config
      '@/shared': fileURLToPath(new URL('./src/shared', import.meta.url))
    }
  }
})
