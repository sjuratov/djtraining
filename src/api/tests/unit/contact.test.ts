import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';

describe('Contact Endpoints', () => {
  const app = createApp();

  it('POST /api/contact with valid data should return 200', async () => {
    const res = await request(app)
      .post('/api/contact')
      .send({
        name: 'Max Muster',
        email: 'max@beispiel.ch',
        phone: '+41 79 123 45 67',
        message: 'Ich möchte ein Probetraining vereinbaren.',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Nachricht erfolgreich gesendet.');
  });

  it('POST /api/contact missing required fields should return 400', async () => {
    const res = await request(app)
      .post('/api/contact')
      .send({
        name: 'Max Muster',
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Name, E-Mail und Nachricht sind erforderlich.');
  });

  it('POST /api/contact with name and email but no message should return 400', async () => {
    const res = await request(app)
      .post('/api/contact')
      .send({
        name: 'Max Muster',
        email: 'max@beispiel.ch',
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('POST /api/contact without phone should return 200', async () => {
    const res = await request(app)
      .post('/api/contact')
      .send({
        name: 'Anna Test',
        email: 'anna@test.ch',
        message: 'Frage zu Gruppentraining.',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
