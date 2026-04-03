import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { getUserByEmail } from '../../src/models/user-store.js';

describe('GET /api/admin/users', () => {
  const app = createApp();

  async function registerAndVerify(email: string, password: string, displayName: string) {
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({ email, password, displayName });
    expect(registerRes.status).toBe(201);

    const token = getUserByEmail(email)?.confirmationToken;
    expect(token).toBeTruthy();

    const verifyRes = await request(app).get(`/api/auth/verify/${token}`);
    expect(verifyRes.status).toBe(200);
  }

  beforeEach(async () => {
    await request(app).post('/api/test/reset');
  });

  it('should return 200 with user list for admin', async () => {
    await request(app)
      .post('/api/test/create-user')
      .send({ email: 'admin@example.com', password: 'SecurePass123!', displayName: 'Admin User', role: 'admin' });

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
      .post('/api/test/create-user')
      .send({ email: 'firstadmin@example.com', password: 'SecurePass123!', displayName: 'First Admin', role: 'admin' });

    await registerAndVerify('regular@example.com', 'SecurePass123!', 'Regular User');

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

  it('should not include passwordHash in response', async () => {
    await request(app)
      .post('/api/test/create-user')
      .send({ email: 'nohash@example.com', password: 'SecurePass123!', displayName: 'No Hash User', role: 'admin' });

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
      expect(user).toHaveProperty('id');
    }
  });

  it('should immediately revoke admin access after demotion', async () => {
    await request(app)
      .post('/api/test/create-user')
      .send({ email: 'admin1@example.com', password: 'SecurePass123!', displayName: 'Admin 1', role: 'admin' });
    await request(app)
      .post('/api/test/create-user')
      .send({ email: 'admin2@example.com', password: 'SecurePass123!', displayName: 'Admin 2', role: 'admin' });

    const admin1Login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin1@example.com', password: 'SecurePass123!' });
    const admin2Login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin2@example.com', password: 'SecurePass123!' });

    const admin1Cookies = admin1Login.headers['set-cookie'];
    const admin2Cookies = admin2Login.headers['set-cookie'];

    const usersRes = await request(app)
      .get('/api/admin/users')
      .set('Cookie', admin1Cookies);
    const admin2 = usersRes.body.find((user: { email: string }) => user.email === 'admin2@example.com');

    await request(app)
      .post(`/api/admin/users/${admin2.id}/demote`)
      .set('Cookie', admin1Cookies);

    const res = await request(app)
      .get('/api/admin/users')
      .set('Cookie', admin2Cookies);

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Forbidden');
  });
});
