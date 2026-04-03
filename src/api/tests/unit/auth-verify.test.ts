import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { getUserByEmail } from '../../src/models/user-store.js';

describe('GET /api/auth/verify/:token', () => {
  const app = createApp();

  beforeEach(async () => {
    await request(app).post('/api/test/reset');
  });

  it('should activate a pending user with a valid token', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'verify@example.com', password: 'SecurePass123!', displayName: 'Verify User' });

    const user = getUserByEmail('verify@example.com');
    expect(user?.status).toBe('pending');
    expect(user?.confirmationToken).toBeTruthy();

    const res = await request(app).get(`/api/auth/verify/${user?.confirmationToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('E-Mail-Adresse erfolgreich bestätigt');
    expect(getUserByEmail('verify@example.com')?.status).toBe('active');
    expect(getUserByEmail('verify@example.com')?.confirmationToken).toBeNull();
  });

  it('should return 400 for an invalid token', async () => {
    const res = await request(app).get('/api/auth/verify/not-a-real-token');

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Ungültiger oder abgelaufener Bestätigungslink');
  });

  it('should allow login only after verification', async () => {
    const email = 'login-after-verify@example.com';
    const password = 'SecurePass123!';

    await request(app)
      .post('/api/auth/register')
      .send({ email, password, displayName: 'Verify Then Login' });

    let loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email, password });
    expect(loginRes.status).toBe(403);
    expect(loginRes.body.error).toBe('Bitte bestätige zuerst deine E-Mail-Adresse');

    const token = getUserByEmail(email)?.confirmationToken;
    const verifyRes = await request(app).get(`/api/auth/verify/${token}`);
    expect(verifyRes.status).toBe(200);

    loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email, password });
    expect(loginRes.status).toBe(200);
  });
});
