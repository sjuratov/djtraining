import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { getUserByEmail } from '../../src/models/user-store.js';

describe('POST /api/auth/logout', () => {
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

  it('should return 200 and clear the auth cookie', async () => {
    await registerAndVerify('logout@example.com', 'SecurePass123!', 'Logout User');

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'logout@example.com', password: 'SecurePass123!' });

    const loginCookies = loginRes.headers['set-cookie'];

    const res = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', loginCookies);
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Abmeldung erfolgreich');

    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    const cookieStr = cookies.toString();
    expect(cookieStr).toMatch(/token=/);
    expect(cookieStr).toMatch(/Max-Age=0|Expires=Thu, 01 Jan 1970/);
  });

  it('should return 200 even when not logged in (idempotent)', async () => {
    const res = await request(app)
      .post('/api/auth/logout');
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Abmeldung erfolgreich');
  });
});
