import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  resolve: {
    alias: {
      '@harness': path.resolve(import.meta.dirname, './src'),
      '@template': '/tmp/mc002-inta-fe',
    },
  },
  test: {
    environment: 'node',
  },
})
