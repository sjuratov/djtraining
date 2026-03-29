import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';

describe('Chat Endpoints', () => {
  const app = createApp();
  let cookies: string;

  beforeEach(async () => {
    await request(app).post('/api/test/reset');
    await request(app).post('/api/test/create-user').send({
      email: 'chat@test.de', displayName: 'Chat User', password: 'test1234',
    });
    const loginRes = await request(app).post('/api/auth/login').send({
      email: 'chat@test.de', password: 'test1234',
    });
    cookies = loginRes.headers['set-cookie']?.[0] ?? '';
  });

  it('POST /api/chat/sessions should return 401 without auth', async () => {
    const res = await request(app).post('/api/chat/sessions');
    expect(res.status).toBe(401);
  });

  it('POST /api/chat/sessions should create a session', async () => {
    const res = await request(app).post('/api/chat/sessions').set('Cookie', cookies);
    expect(res.status).toBe(201);
    expect(res.body.sessionId).toBeDefined();
  });

  it('POST /api/chat/sessions/:id/messages should require message', async () => {
    const res = await request(app)
      .post('/api/chat/sessions/test-id/messages')
      .set('Cookie', cookies)
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Message is required');
  });

  it('POST /api/chat/sessions/:id/messages should return reply', async () => {
    const res = await request(app)
      .post('/api/chat/sessions/test-id/messages')
      .set('Cookie', cookies)
      .send({ message: 'Hello' });
    expect(res.status).toBe(200);
    expect(res.body.reply).toBeDefined();
  });
});
