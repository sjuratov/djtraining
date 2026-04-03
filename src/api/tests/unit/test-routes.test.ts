import { describe, expect, it } from 'vitest';
import { shouldEnableTestRoutes } from '../../src/app.js';

describe('test route guard', () => {
  it('should not enable test routes in production-like config', () => {
    expect(shouldEnableTestRoutes({
      NODE_ENV: 'production',
      ENABLE_TEST_ROUTES: 'true',
      APP_URL: 'https://app.example.com',
      API_URL: 'https://api.example.com',
    })).toBe(false);
  });

  it('should not enable test routes for non-local development URLs', () => {
    expect(shouldEnableTestRoutes({
      NODE_ENV: 'development',
      ENABLE_TEST_ROUTES: 'true',
      APP_URL: 'https://staging.example.com',
      API_URL: 'https://api-staging.example.com',
    })).toBe(false);
  });

  it('should enable test routes in explicit test mode', () => {
    expect(shouldEnableTestRoutes({
      NODE_ENV: 'test',
    })).toBe(true);
  });

  it('should enable test routes for localhost development automation', () => {
    expect(shouldEnableTestRoutes({
      NODE_ENV: 'development',
      ENABLE_TEST_ROUTES: 'true',
      APP_URL: 'http://localhost:3001',
      API_URL: 'http://localhost:5001',
    })).toBe(true);
  });
});
