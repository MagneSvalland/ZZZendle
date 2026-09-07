import { defineConfig } from 'vitest/config'
import path from 'path'

// Mirrors the `@/*` -> `./*` path alias from tsconfig.json — Next.js reads
// that natively, but Vitest resolves modules through Vite and needs its own
// alias config to understand the same imports.
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname),
    },
  },
})
