import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';

describe('GET /api/auth/me', () => {
  const app = createApp();

  beforeEach(async () => {
    await request(app).post('/api/test/reset');
  });

  it('should return 200 with user profile when authenticated', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'me@example.com', password: 'SecurePass123!', displayName: 'Me User' });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'me@example.com', password: 'SecurePass123!' });

    const cookies = loginRes.headers['set-cookie'];

    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', cookies);
    expect(res.status).toBe(200);
    expect(res.body.email).toBe('me@example.com');
    expect(res.body.displayName).toBe('Me User');
    expect(res.body.role).toBeDefined();
    expect(res.body.authProvider).toBeDefined();
    expect(res.body.createdAt).toBeDefined();
    expect(res.body).not.toHaveProperty('username');
  });

  it('should return 401 when not authenticated', async () => {
    const res = await request(app)
      .get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Not authenticated');
  });

  it('should return 401 with expired JWT', async () => {
    const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0IiwiaWF0IjoxNjAwMDAwMDAwLCJleHAiOjE2MDAwMDAwMDF9.invalid';
    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', [`token=${expiredToken}`]);
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Not authenticated');
  });

  it('should return 401 with malformed JWT', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', ['token=not-a-valid-jwt']);
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Not authenticated');
  });
});
