import { defineConfig } from 'vitest/config'

// Pure-logic tests for src/model/. Node environment, no jsdom.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/model/__tests__/**/*.test.ts'],
  },
})
