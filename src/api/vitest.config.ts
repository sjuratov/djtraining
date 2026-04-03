import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    setupFiles: ['./tests/setup.ts'],
    env: {
      JWT_SECRET: 'test-jwt-secret-for-vitest',
      ENABLE_TEST_ROUTES: 'true',
      DATABASE_PATH: ':memory:',
    },
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/index.ts'],
    },
  },
});
