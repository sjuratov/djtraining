import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { getUserByEmail } from '../../src/models/user-store.js';

describe('Role-Based Access Control — role assignment', () => {
  const app = createApp();
  const previousAdminEmail = process.env.ADMIN_EMAIL;

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
    await registerAndVerify('first@example.com', 'SecurePass123!', 'First User');

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

    await registerAndVerify('admin@example.com', 'SecurePass123!', 'Admin User');

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

    await registerAndVerify('admin@example.com', 'SecurePass123!', 'Admin User');

    await registerAndVerify('regular@example.com', 'SecurePass123!', 'Regular User');

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
