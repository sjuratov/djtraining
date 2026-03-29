import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';

describe('GET /api/admin/users', () => {
  const app = createApp();

  beforeEach(async () => {
    await request(app).post('/api/test/reset');
  });

  it('should return 200 with user list for admin', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'admin@example.com', password: 'SecurePass123!', displayName: 'Admin User' });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@example.com', password: 'SecurePass123!' });

    const cookies = loginRes.headers['set-cookie'];

    const res = await request(app)
      .get('/api/admin/users')
      .set('Cookie', cookies);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0].email).toBeDefined();
    expect(res.body[0].displayName).toBeDefined();
    expect(res.body[0].role).toBeDefined();
    expect(res.body[0].authProvider).toBeDefined();
    expect(res.body[0].status).toBeDefined();
    expect(res.body[0].createdAt).toBeDefined();
  });

  it('should return 403 for non-admin users', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'firstadmin@example.com', password: 'SecurePass123!', displayName: 'First Admin' });

    await request(app)
      .post('/api/auth/register')
      .send({ email: 'regular@example.com', password: 'SecurePass123!', displayName: 'Regular User' });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'regular@example.com', password: 'SecurePass123!' });

    const cookies = loginRes.headers['set-cookie'];

    const res = await request(app)
      .get('/api/admin/users')
      .set('Cookie', cookies);
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Forbidden');
  });

  it('should return 401 when not authenticated', async () => {
    const res = await request(app)
      .get('/api/admin/users');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Not authenticated');
  });

  it('should not include passwordHash or id in response', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'nohash@example.com', password: 'SecurePass123!', displayName: 'No Hash User' });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nohash@example.com', password: 'SecurePass123!' });

    const cookies = loginRes.headers['set-cookie'];

    const res = await request(app)
      .get('/api/admin/users')
      .set('Cookie', cookies);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    for (const user of res.body) {
      expect(user).not.toHaveProperty('passwordHash');
      expect(user).not.toHaveProperty('id');
    }
  });
});
