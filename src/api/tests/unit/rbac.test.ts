import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';

describe('Role-Based Access Control — role assignment', () => {
  const app = createApp();

  beforeEach(async () => {
    await request(app).post('/api/test/reset');
  });

  it('should assign admin role to the first registered user', async () => {
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
    expect(meRes.body.role).toBe('admin');
  });

  it('should assign user role to subsequent registered users', async () => {
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
