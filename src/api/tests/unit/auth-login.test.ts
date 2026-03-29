import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { createUser } from '../../src/models/user-store.js';
import bcrypt from 'bcryptjs';

describe('POST /api/auth/login', () => {
  const app = createApp();

  beforeEach(async () => {
    await request(app).post('/api/test/reset');
  });

  it('should return 200 and set JWT cookie on successful login', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'login@example.com', password: 'SecurePass123!', displayName: 'Login User' });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@example.com', password: 'SecurePass123!' });
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Anmeldung erfolgreich');

    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    expect(cookies.toString()).toMatch(/token=/);
  });

  it('should set JWT cookie with correct security attributes', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'cookie@example.com', password: 'SecurePass123!', displayName: 'Cookie User' });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'cookie@example.com', password: 'SecurePass123!' });

    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    const cookieStr = cookies.toString();
    expect(cookieStr).toMatch(/HttpOnly/i);
    expect(cookieStr).toMatch(/Secure/i);
    expect(cookieStr).toMatch(/SameSite=Strict/i);
    expect(cookieStr).toMatch(/Path=\//);
    expect(cookieStr).toMatch(/Max-Age=86400/);
  });

  it('should return 401 for invalid password', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'wrongpass@example.com', password: 'SecurePass123!', displayName: 'Wrong Pass' });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'wrongpass@example.com', password: 'WrongPassword123!' });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Ungültige Anmeldedaten');
  });

  it('should return 401 for non-existent user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nonexistent@example.com', password: 'SomePassword123!' });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Ungültige Anmeldedaten');
  });

  it('should return 400 when fields are missing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('E-Mail und Passwort sind erforderlich');
  });

  it('should return 403 when user status is pending', async () => {
    const passwordHash = await bcrypt.hash('SecurePass123!', 10);
    createUser({
      email: 'pending@example.com',
      displayName: 'Pending User',
      passwordHash,
      authProvider: 'local',
      confirmationToken: 'test-token',
      googleId: null,
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'pending@example.com', password: 'SecurePass123!' });
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Bitte bestätige zuerst deine E-Mail-Adresse');
  });
});
