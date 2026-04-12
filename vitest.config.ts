import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['src/__tests__/**/*.test.ts'],
    globals: true,
    deps: {
      interopDefault: true
    }
  },
  resolve: {
    alias: {
      'micromark-util-symbol': 'micromark-util-symbol'
    }
  }
})
