import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';

describe('Role-Based Access Control — role assignment', () => {
  const app = createApp();
  const previousAdminEmail = process.env.ADMIN_EMAIL;

  beforeEach(async () => {
    await request(app).post('/api/test/reset');
    delete process.env.ADMIN_EMAIL;
  });

  afterAll(() => {
    if (previousAdminEmail === undefined) {
      delete process.env.ADMIN_EMAIL;
      return;
    }
    process.env.ADMIN_EMAIL = previousAdminEmail;
  });

  it('should assign user role to the first registered user when ADMIN_EMAIL is not set', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'first@example.com', password: 'SecurePass123!', displayName: 'First User' });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'first@example.com', password: 'SecurePass123!' });

    const cookies = loginRes.headers['set-cookie'];

    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Cookie', cookies);
    expect(meRes.status).toBe(200);
    expect(meRes.body.role).toBe('user');
  });

  it('should assign admin role when registration email matches ADMIN_EMAIL', async () => {
    process.env.ADMIN_EMAIL = 'admin@example.com';

    await request(app)
      .post('/api/auth/register')
      .send({ email: 'admin@example.com', password: 'SecurePass123!', displayName: 'Admin User' });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@example.com', password: 'SecurePass123!' });

    const cookies = loginRes.headers['set-cookie'];

    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Cookie', cookies);
    expect(meRes.status).toBe(200);
    expect(meRes.body.role).toBe('admin');
  });

  it('should assign user role to users whose email does not match ADMIN_EMAIL', async () => {
    process.env.ADMIN_EMAIL = 'admin@example.com';

    await request(app)
      .post('/api/auth/register')
      .send({ email: 'admin@example.com', password: 'SecurePass123!', displayName: 'Admin User' });

    await request(app)
      .post('/api/auth/register')
      .send({ email: 'regular@example.com', password: 'SecurePass123!', displayName: 'Regular User' });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'regular@example.com', password: 'SecurePass123!' });

    const cookies = loginRes.headers['set-cookie'];

    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Cookie', cookies);
    expect(meRes.status).toBe(200);
    expect(meRes.body.role).toBe('user');
  });
});
