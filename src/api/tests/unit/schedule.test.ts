import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';

const app = createApp();

async function createAdminAndLogin(): Promise<string> {
  await request(app).post('/api/test/create-user').send({
    email: 'admin@example.com',
    password: 'Admin1234!',
    displayName: 'Admin',
    role: 'admin',
  });
  const loginRes = await request(app).post('/api/auth/login').send({
    email: 'admin@example.com',
    password: 'Admin1234!',
  });
  return loginRes.headers['set-cookie']?.[0] ?? '';
}

async function createUserAndLogin(): Promise<string> {
  await request(app).post('/api/test/create-user').send({
    email: 'user@example.com',
    password: 'User1234!',
    displayName: 'User',
  });
  const loginRes = await request(app).post('/api/auth/login').send({
    email: 'user@example.com',
    password: 'User1234!',
  });
  return loginRes.headers['set-cookie']?.[0] ?? '';
}

describe('Admin Training Types', () => {
  let adminCookie: string;

  beforeEach(async () => {
    await request(app).post('/api/test/reset');
    adminCookie = await createAdminAndLogin();
  });

  it('should create a training type', async () => {
    const res = await request(app)
      .post('/api/admin/training-types')
      .set('Cookie', adminCookie)
      .send({
        name: 'Personal Training',
        category: 'personal',
        durationMinutes: 60,
        maxCapacity: 1,
        priceSingle: 10000,
      });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Personal Training');
    expect(res.body.category).toBe('personal');
    expect(res.body.durationMinutes).toBe(60);
    expect(res.body.maxCapacity).toBe(1);
    expect(res.body.active).toBe(true);
  });

  it('should list all training types', async () => {
    await request(app)
      .post('/api/admin/training-types')
      .set('Cookie', adminCookie)
      .send({ name: 'PT', category: 'personal', durationMinutes: 60 });

    await request(app)
      .post('/api/admin/training-types')
      .set('Cookie', adminCookie)
      .send({ name: 'Group', category: 'gruppe', durationMinutes: 60, maxCapacity: 5 });

    const res = await request(app)
      .get('/api/admin/training-types')
      .set('Cookie', adminCookie);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });

  it('should update a training type', async () => {
    const createRes = await request(app)
      .post('/api/admin/training-types')
      .set('Cookie', adminCookie)
      .send({ name: 'PT', category: 'personal', durationMinutes: 60 });

    const res = await request(app)
      .put(`/api/admin/training-types/${createRes.body.id}`)
      .set('Cookie', adminCookie)
      .send({ name: 'Personal Training Updated', active: false });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Personal Training Updated');
    expect(res.body.active).toBe(false);
  });

  it('should reject invalid category', async () => {
    const res = await request(app)
      .post('/api/admin/training-types')
      .set('Cookie', adminCookie)
      .send({ name: 'Bad', category: 'invalid', durationMinutes: 60 });

    expect(res.status).toBe(400);
  });

  it('should reject missing required fields', async () => {
    const res = await request(app)
      .post('/api/admin/training-types')
      .set('Cookie', adminCookie)
      .send({ name: 'PT' });

    expect(res.status).toBe(400);
  });

  it('should reject non-admin access', async () => {
    const userCookie = await createUserAndLogin();
    const res = await request(app)
      .get('/api/admin/training-types')
      .set('Cookie', userCookie);

    expect(res.status).toBe(403);
  });

  it('should reject unauthenticated access', async () => {
    const res = await request(app).get('/api/admin/training-types');
    expect(res.status).toBe(401);
  });
});

describe('Admin Schedule Templates', () => {
  let adminCookie: string;
  let trainingTypeId: string;

  beforeEach(async () => {
    await request(app).post('/api/test/reset');
    adminCookie = await createAdminAndLogin();

    const ttRes = await request(app)
      .post('/api/admin/training-types')
      .set('Cookie', adminCookie)
      .send({ name: 'Gruppentraining', category: 'gruppe', durationMinutes: 60, maxCapacity: 5 });
    trainingTypeId = ttRes.body.id;
  });

  it('should create a schedule template', async () => {
    const res = await request(app)
      .post('/api/admin/schedule-templates')
      .set('Cookie', adminCookie)
      .send({ trainingTypeId, dayOfWeek: 1, startTime: '18:00' });

    expect(res.status).toBe(201);
    expect(res.body.dayOfWeek).toBe(1);
    expect(res.body.startTime).toBe('18:00');
    expect(res.body.trainingTypeName).toBe('Gruppentraining');
  });

  it('should list all templates', async () => {
    await request(app)
      .post('/api/admin/schedule-templates')
      .set('Cookie', adminCookie)
      .send({ trainingTypeId, dayOfWeek: 1, startTime: '18:00' });

    await request(app)
      .post('/api/admin/schedule-templates')
      .set('Cookie', adminCookie)
      .send({ trainingTypeId, dayOfWeek: 4, startTime: '18:00' });

    const res = await request(app)
      .get('/api/admin/schedule-templates')
      .set('Cookie', adminCookie);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });

  it('should update a template', async () => {
    const createRes = await request(app)
      .post('/api/admin/schedule-templates')
      .set('Cookie', adminCookie)
      .send({ trainingTypeId, dayOfWeek: 1, startTime: '18:00' });

    const res = await request(app)
      .put(`/api/admin/schedule-templates/${createRes.body.id}`)
      .set('Cookie', adminCookie)
      .send({ startTime: '19:00' });

    expect(res.status).toBe(200);
    expect(res.body.startTime).toBe('19:00');
  });

  it('should deactivate a template', async () => {
    const createRes = await request(app)
      .post('/api/admin/schedule-templates')
      .set('Cookie', adminCookie)
      .send({ trainingTypeId, dayOfWeek: 1, startTime: '18:00' });

    const res = await request(app)
      .delete(`/api/admin/schedule-templates/${createRes.body.id}`)
      .set('Cookie', adminCookie);

    expect(res.status).toBe(200);
    expect(res.body.active).toBe(false);
  });

  it('should reject invalid day of week', async () => {
    const res = await request(app)
      .post('/api/admin/schedule-templates')
      .set('Cookie', adminCookie)
      .send({ trainingTypeId, dayOfWeek: 7, startTime: '18:00' });

    expect(res.status).toBe(400);
  });

  it('should reject non-existent training type', async () => {
    const res = await request(app)
      .post('/api/admin/schedule-templates')
      .set('Cookie', adminCookie)
      .send({ trainingTypeId: 'non-existent', dayOfWeek: 1, startTime: '18:00' });

    expect(res.status).toBe(400);
  });
});

describe('Slot Generation', () => {
  let adminCookie: string;

  beforeEach(async () => {
    await request(app).post('/api/test/reset');
    adminCookie = await createAdminAndLogin();
  });

  it('should generate slots from templates', async () => {
    const ttRes = await request(app)
      .post('/api/admin/training-types')
      .set('Cookie', adminCookie)
      .send({ name: 'Group', category: 'gruppe', durationMinutes: 60, maxCapacity: 5 });

    // Monday template
    await request(app)
      .post('/api/admin/schedule-templates')
      .set('Cookie', adminCookie)
      .send({ trainingTypeId: ttRes.body.id, dayOfWeek: 1, startTime: '18:00' });

    // Generate for 2 weeks starting from next Monday
    const today = new Date();
    const daysUntilMonday = ((1 - today.getDay()) + 7) % 7 || 7;
    const nextMonday = new Date(today);
    nextMonday.setDate(today.getDate() + daysUntilMonday);
    const twoWeeksLater = new Date(nextMonday);
    twoWeeksLater.setDate(nextMonday.getDate() + 13);

    const fromDate = nextMonday.toISOString().split('T')[0];
    const toDate = twoWeeksLater.toISOString().split('T')[0];

    const res = await request(app)
      .post('/api/admin/generate-slots')
      .set('Cookie', adminCookie)
      .send({ fromDate, toDate });

    expect(res.status).toBe(201);
    expect(res.body.generated).toBe(2); // 2 Mondays in 2 weeks
    expect(res.body.slots[0].startTime).toBe('18:00');
    expect(res.body.slots[0].endTime).toBe('19:00');
    expect(res.body.slots[0].maxCapacity).toBe(5);
  });

  it('should not duplicate slots on re-generation', async () => {
    const ttRes = await request(app)
      .post('/api/admin/training-types')
      .set('Cookie', adminCookie)
      .send({ name: 'PT', category: 'personal', durationMinutes: 60, maxCapacity: 1 });

    await request(app)
      .post('/api/admin/schedule-templates')
      .set('Cookie', adminCookie)
      .send({ trainingTypeId: ttRes.body.id, dayOfWeek: 1, startTime: '09:00' });

    const today = new Date();
    const daysUntilMonday = ((1 - today.getDay()) + 7) % 7 || 7;
    const nextMonday = new Date(today);
    nextMonday.setDate(today.getDate() + daysUntilMonday);
    const fromDate = nextMonday.toISOString().split('T')[0];
    const toDate = fromDate;

    await request(app)
      .post('/api/admin/generate-slots')
      .set('Cookie', adminCookie)
      .send({ fromDate, toDate });

    const res2 = await request(app)
      .post('/api/admin/generate-slots')
      .set('Cookie', adminCookie)
      .send({ fromDate, toDate });

    expect(res2.body.generated).toBe(0);
  });

  it('should reject past dates', async () => {
    const res = await request(app)
      .post('/api/admin/generate-slots')
      .set('Cookie', adminCookie)
      .send({ fromDate: '2020-01-01', toDate: '2020-01-07' });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Vergangenheit');
  });
});

describe('Admin Time Slot Management', () => {
  let adminCookie: string;
  let slotId: string;

  beforeEach(async () => {
    await request(app).post('/api/test/reset');
    adminCookie = await createAdminAndLogin();

    const ttRes = await request(app)
      .post('/api/admin/training-types')
      .set('Cookie', adminCookie)
      .send({ name: 'PT', category: 'personal', durationMinutes: 60, maxCapacity: 1 });

    await request(app)
      .post('/api/admin/schedule-templates')
      .set('Cookie', adminCookie)
      .send({ trainingTypeId: ttRes.body.id, dayOfWeek: 1, startTime: '09:00' });

    const today = new Date();
    const daysUntilMonday = ((1 - today.getDay()) + 7) % 7 || 7;
    const nextMonday = new Date(today);
    nextMonday.setDate(today.getDate() + daysUntilMonday);
    const fromDate = nextMonday.toISOString().split('T')[0];

    const genRes = await request(app)
      .post('/api/admin/generate-slots')
      .set('Cookie', adminCookie)
      .send({ fromDate, toDate: fromDate });

    slotId = genRes.body.slots[0].id;
  });

  it('should cancel a slot', async () => {
    const res = await request(app)
      .post(`/api/admin/time-slots/${slotId}/cancel`)
      .set('Cookie', adminCookie);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('cancelled');
  });

  it('should reject cancelling already-cancelled slot', async () => {
    await request(app)
      .post(`/api/admin/time-slots/${slotId}/cancel`)
      .set('Cookie', adminCookie);

    const res = await request(app)
      .post(`/api/admin/time-slots/${slotId}/cancel`)
      .set('Cookie', adminCookie);

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('bereits abgesagt');
  });

  it('should reschedule a slot', async () => {
    const res = await request(app)
      .put(`/api/admin/time-slots/${slotId}`)
      .set('Cookie', adminCookie)
      .send({ startTime: '10:00', endTime: '11:00' });

    expect(res.status).toBe(200);
    expect(res.body.startTime).toBe('10:00');
    expect(res.body.endTime).toBe('11:00');
  });

  it('should return 404 for non-existent slot', async () => {
    const res = await request(app)
      .post('/api/admin/time-slots/non-existent/cancel')
      .set('Cookie', adminCookie);

    expect(res.status).toBe(404);
  });
});

describe('Public Schedule API', () => {
  let adminCookie: string;

  beforeEach(async () => {
    await request(app).post('/api/test/reset');
    adminCookie = await createAdminAndLogin();
  });

  it('should list active training types without auth', async () => {
    await request(app)
      .post('/api/admin/training-types')
      .set('Cookie', adminCookie)
      .send({ name: 'PT', category: 'personal', durationMinutes: 60 });

    const res = await request(app).get('/api/schedule/types');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe('PT');
  });

  it('should not list inactive training types publicly', async () => {
    const createRes = await request(app)
      .post('/api/admin/training-types')
      .set('Cookie', adminCookie)
      .send({ name: 'PT', category: 'personal', durationMinutes: 60 });

    await request(app)
      .put(`/api/admin/training-types/${createRes.body.id}`)
      .set('Cookie', adminCookie)
      .send({ active: false });

    const res = await request(app).get('/api/schedule/types');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(0);
  });

  it('should return available slots without auth', async () => {
    const ttRes = await request(app)
      .post('/api/admin/training-types')
      .set('Cookie', adminCookie)
      .send({ name: 'Group', category: 'gruppe', durationMinutes: 60, maxCapacity: 5 });

    await request(app)
      .post('/api/admin/schedule-templates')
      .set('Cookie', adminCookie)
      .send({ trainingTypeId: ttRes.body.id, dayOfWeek: 1, startTime: '18:00' });

    const today = new Date();
    const daysUntilMonday = ((1 - today.getDay()) + 7) % 7 || 7;
    const nextMonday = new Date(today);
    nextMonday.setDate(today.getDate() + daysUntilMonday);
    const fromDate = nextMonday.toISOString().split('T')[0];

    await request(app)
      .post('/api/admin/generate-slots')
      .set('Cookie', adminCookie)
      .send({ fromDate, toDate: fromDate });

    const res = await request(app)
      .get(`/api/schedule/slots?from=${fromDate}&to=${fromDate}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].trainingTypeName).toBe('Group');
  });

  it('should filter slots by category', async () => {
    const ptRes = await request(app)
      .post('/api/admin/training-types')
      .set('Cookie', adminCookie)
      .send({ name: 'PT', category: 'personal', durationMinutes: 60, maxCapacity: 1 });

    const grpRes = await request(app)
      .post('/api/admin/training-types')
      .set('Cookie', adminCookie)
      .send({ name: 'Group', category: 'gruppe', durationMinutes: 60, maxCapacity: 5 });

    const today = new Date();
    const daysUntilMonday = ((1 - today.getDay()) + 7) % 7 || 7;
    const nextMonday = new Date(today);
    nextMonday.setDate(today.getDate() + daysUntilMonday);
    const fromDate = nextMonday.toISOString().split('T')[0];

    await request(app)
      .post('/api/admin/schedule-templates')
      .set('Cookie', adminCookie)
      .send({ trainingTypeId: ptRes.body.id, dayOfWeek: 1, startTime: '09:00' });

    await request(app)
      .post('/api/admin/schedule-templates')
      .set('Cookie', adminCookie)
      .send({ trainingTypeId: grpRes.body.id, dayOfWeek: 1, startTime: '18:00' });

    await request(app)
      .post('/api/admin/generate-slots')
      .set('Cookie', adminCookie)
      .send({ fromDate, toDate: fromDate });

    const res = await request(app)
      .get(`/api/schedule/slots?from=${fromDate}&to=${fromDate}&category=gruppe`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].trainingTypeCategory).toBe('gruppe');
  });

  it('should not return cancelled slots', async () => {
    const ttRes = await request(app)
      .post('/api/admin/training-types')
      .set('Cookie', adminCookie)
      .send({ name: 'PT', category: 'personal', durationMinutes: 60, maxCapacity: 1 });

    await request(app)
      .post('/api/admin/schedule-templates')
      .set('Cookie', adminCookie)
      .send({ trainingTypeId: ttRes.body.id, dayOfWeek: 1, startTime: '09:00' });

    const today = new Date();
    const daysUntilMonday = ((1 - today.getDay()) + 7) % 7 || 7;
    const nextMonday = new Date(today);
    nextMonday.setDate(today.getDate() + daysUntilMonday);
    const fromDate = nextMonday.toISOString().split('T')[0];

    const genRes = await request(app)
      .post('/api/admin/generate-slots')
      .set('Cookie', adminCookie)
      .send({ fromDate, toDate: fromDate });

    await request(app)
      .post(`/api/admin/time-slots/${genRes.body.slots[0].id}/cancel`)
      .set('Cookie', adminCookie);

    const res = await request(app)
      .get(`/api/schedule/slots?from=${fromDate}&to=${fromDate}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(0);
  });

  it('should require from and to parameters', async () => {
    const res = await request(app).get('/api/schedule/slots');
    expect(res.status).toBe(400);
  });
});
