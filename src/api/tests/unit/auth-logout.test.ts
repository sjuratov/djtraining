import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';

describe('POST /api/auth/logout', () => {
  const app = createApp();

  beforeEach(async () => {
    await request(app).post('/api/test/reset');
  });

  it('should return 200 and clear the auth cookie', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'logout@example.com', password: 'SecurePass123!', displayName: 'Logout User' });

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
