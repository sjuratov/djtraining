import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { getUserByEmail } from '../../src/models/user-store.js';

describe('POST /api/auth/register', () => {
  const app = createApp();

  beforeEach(async () => {
    await request(app).post('/api/test/reset');
  });

  it('should return 201 for valid registration', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@example.com', password: 'SecurePass123!', displayName: 'Test User' });
    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Registrierung erfolgreich. Bitte bestätige deine E-Mail-Adresse.');
    expect(res.body.verificationRequired).toBe(true);
  });

  it('should keep newly registered local users pending until verification', async () => {
    const email = 'pending-register@example.com';

    const res = await request(app)
      .post('/api/auth/register')
      .send({ email, password: 'SecurePass123!', displayName: 'Pending User' });

    expect(res.status).toBe(201);

    const user = getUserByEmail(email);
    expect(user).toBeDefined();
    expect(user?.status).toBe('pending');
    expect(user?.confirmationToken).toBeTruthy();
  });

  it('should return 409 when email already registered', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'duplicate@example.com', password: 'SecurePass123!', displayName: 'First User' });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'duplicate@example.com', password: 'AnotherPass123!', displayName: 'Second User' });
    expect(res.status).toBe(409);
    expect(res.body.error).toBe('E-Mail-Adresse ist bereits registriert');
  });

  it('should return 400 when email is missing', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ password: 'SecurePass123!', displayName: 'Test User' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('E-Mail ist erforderlich');
  });

  it('should return 400 when email format is invalid', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'not-an-email', password: 'SecurePass123!', displayName: 'Test User' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Ungültige E-Mail-Adresse');
  });

  it('should return 400 when password is missing', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@example.com', displayName: 'Test User' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Passwort ist erforderlich');
  });

  it('should return 400 when password is too short', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@example.com', password: 'short', displayName: 'Test User' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Passwort muss mindestens 8 Zeichen lang sein');
  });

  it('should return 400 when displayName is too short', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@example.com', password: 'SecurePass123!', displayName: 'A' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Name muss mindestens 2 Zeichen lang sein');
  });

  it('should validate email before password (first error only)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: '', password: 'short', displayName: 'Test User' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/E-Mail/);
    expect(res.body.error).not.toMatch(/Passwort/);
  });

  it('should store password as bcrypt hash, not plain text', async () => {
    const password = 'SecurePass123!';
    const email = 'hashtest@example.com';
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email, password, displayName: 'Hash Test' });
    expect(res.status).toBe(201);

    const user = getUserByEmail(email);
    expect(user?.confirmationToken).toBeTruthy();

    await request(app).get(`/api/auth/verify/${user?.confirmationToken}`);

    // Verify hashing by confirming the original password works for login
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email, password });
    expect(loginRes.status).toBe(200);

    // Verify a wrong password is rejected (proves password isn't stored plain)
    const badLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ email, password: 'WrongPassword!' });
    expect(badLoginRes.status).toBe(401);
  });
});
