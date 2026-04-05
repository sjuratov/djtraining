import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { createUser, activateUser } from '../../src/models/user-store.js';
import { createTrainingType, createTemplate, generateSlots } from '../../src/services/schedule.js';
import { assignPackage } from '../../src/services/packages.js';
import bcrypt from 'bcryptjs';

const app = createApp();

async function loginUser(email: string, role: 'user' | 'admin' = 'user') {
  const passwordHash = await bcrypt.hash('Test1234!', 10);
  const user = createUser({
    email,
    displayName: email.split('@')[0],
    passwordHash,
    authProvider: 'local',
    confirmationToken: null,
    googleId: null,
  });
  activateUser(user.id);
  if (role === 'admin') {
    const { setUserRole } = await import('../../src/models/user-store.js');
    setUserRole(user.id, 'admin');
  }

  const res = await request(app).post('/api/auth/login').send({ email, password: 'Test1234!' });
  const cookie = res.headers['set-cookie'];
  return { user, cookie };
}

function createFutureSlot(daysAhead = 7, category: 'personal' | 'gruppe' | 'ernaehrung' = 'personal') {
  const futureDate = new Date(Date.now() + daysAhead * 86400000);
  const dateStr = futureDate.toISOString().split('T')[0];
  const parsedDate = new Date(dateStr + 'T12:00:00');
  const dayOfWeek = parsedDate.getDay();

  const names: Record<string, string> = {
    personal: 'Personal Training',
    gruppe: 'Gruppentraining',
    ernaehrung: 'Ernährungscoaching',
  };
  const tt = createTrainingType({
    name: names[category],
    category,
    durationMinutes: 60,
    maxCapacity: 1,
    priceSingle: 120,
  });

  createTemplate({ trainingTypeId: tt.id, dayOfWeek, startTime: '10:00' });
  const slots = generateSlots({ fromDate: dateStr, toDate: dateStr });
  return { trainingType: tt, slot: slots[0], dateStr };
}

function createPastSlot(daysAgo = 3, category: 'personal' | 'gruppe' | 'ernaehrung' = 'personal') {
  const pastDate = new Date(Date.now() - daysAgo * 86400000);
  const dateStr = pastDate.toISOString().split('T')[0];
  const parsedDate = new Date(dateStr + 'T12:00:00');
  const dayOfWeek = parsedDate.getDay();

  const tt = createTrainingType({
    name: 'Personal Training (Past)',
    category,
    durationMinutes: 60,
    maxCapacity: 1,
    priceSingle: 120,
  });

  createTemplate({ trainingTypeId: tt.id, dayOfWeek, startTime: '10:00' });
  const slots = generateSlots({ fromDate: dateStr, toDate: dateStr });
  return { trainingType: tt, slot: slots[0], dateStr };
}

function createSoonSlot(hoursAhead = 4) {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const parsedDate = new Date(dateStr + 'T12:00:00');
  const dayOfWeek = parsedDate.getDay();
  const startHour = Math.min(now.getHours() + hoursAhead, 23);
  const startTime = `${String(startHour).padStart(2, '0')}:00`;

  const tt = createTrainingType({
    name: 'Personal Training (Soon)',
    category: 'personal',
    durationMinutes: 60,
    maxCapacity: 1,
    priceSingle: 120,
  });

  createTemplate({ trainingTypeId: tt.id, dayOfWeek, startTime });
  const slots = generateSlots({ fromDate: dateStr, toDate: dateStr });
  return { trainingType: tt, slot: slots[0], dateStr };
}

function assignDefaultPackage(userId: string, category: 'personal' | 'gruppe' | 'ernaehrung' = 'personal') {
  const packageDefIdByCategory: Record<string, string> = {
    personal: 'pkg-personal-20',
    gruppe: 'pkg-gruppe-20',
    ernaehrung: 'pkg-ernaehrung-5',
  };
  assignPackage({ userId, packageDefId: packageDefIdByCategory[category] });
}

describe('Client Booking Dashboard API', () => {
  let clientCookie: string[];
  let clientUserId: string;

  beforeEach(async () => {
    await request(app).post('/api/test/reset');
    const { user, cookie } = await loginUser('dashboard-client@example.com');
    clientCookie = cookie;
    clientUserId = user.id;
    assignDefaultPackage(clientUserId, 'personal');
  });

  it('should list upcoming bookings for the authenticated client', async () => {
    const { slot } = createFutureSlot();

    await request(app)
      .post('/api/bookings')
      .set('Cookie', clientCookie)
      .send({ timeSlotId: slot.id });

    const res = await request(app)
      .get('/api/bookings?upcoming=true')
      .set('Cookie', clientCookie);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].status).toBe('confirmed');
    expect(res.body[0].slotDate).toBeDefined();
    expect(res.body[0].trainingTypeName).toBe('Personal Training');
  });

  it('should list all bookings including past ones', async () => {
    const { slot: futureSlot } = createFutureSlot();
    const { slot: pastSlot } = createPastSlot();

    await request(app)
      .post('/api/bookings')
      .set('Cookie', clientCookie)
      .send({ timeSlotId: futureSlot.id });

    await request(app)
      .post('/api/bookings')
      .set('Cookie', clientCookie)
      .send({ timeSlotId: pastSlot.id });

    const res = await request(app)
      .get('/api/bookings')
      .set('Cookie', clientCookie);

    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  it('should cancel a future booking and return success', async () => {
    const { slot } = createFutureSlot();

    const bookRes = await request(app)
      .post('/api/bookings')
      .set('Cookie', clientCookie)
      .send({ timeSlotId: slot.id });

    const res = await request(app)
      .delete(`/api/bookings/${bookRes.body.id}`)
      .set('Cookie', clientCookie);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('cancelled');
    expect(res.body.cancelledAt).toBeDefined();

    // Verify it no longer appears in upcoming bookings
    const listRes = await request(app)
      .get('/api/bookings?upcoming=true')
      .set('Cookie', clientCookie);

    const confirmed = listRes.body.filter((b: { status: string }) => b.status === 'confirmed');
    expect(confirmed).toHaveLength(0);
  });

  it('should include 24h warning flag when cancelling a booking within 24 hours', async () => {
    const { slot } = createSoonSlot(4);

    const bookRes = await request(app)
      .post('/api/bookings')
      .set('Cookie', clientCookie)
      .send({ timeSlotId: slot.id });

    const res = await request(app)
      .delete(`/api/bookings/${bookRes.body.id}`)
      .set('Cookie', clientCookie);

    expect(res.status).toBe(200);
    expect(res.body.within24hWarning).toBe(true);
  });

  it('should return 404 when cancelling a non-existent booking', async () => {
    const res = await request(app)
      .delete('/api/bookings/non-existent-id')
      .set('Cookie', clientCookie);

    expect(res.status).toBe(404);
  });

  it('should return 401 for unauthenticated booking list request', async () => {
    const res = await request(app).get('/api/bookings');

    expect(res.status).toBe(401);
  });

  it('should return client packages for the authenticated user', async () => {
    const res = await request(app)
      .get('/api/packages')
      .set('Cookie', clientCookie);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].packageName).toBeDefined();
    expect(res.body[0].totalSessions).toBeDefined();
    expect(res.body[0].remainingSessions).toBeDefined();
  });

  it('should return empty packages for user with no package', async () => {
    const { cookie } = await loginUser('no-package@example.com');

    const res = await request(app)
      .get('/api/packages')
      .set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(0);
  });

  it('should not include cancelled bookings in upcoming filter', async () => {
    const { slot } = createFutureSlot();

    const bookRes = await request(app)
      .post('/api/bookings')
      .set('Cookie', clientCookie)
      .send({ timeSlotId: slot.id });

    await request(app)
      .delete(`/api/bookings/${bookRes.body.id}`)
      .set('Cookie', clientCookie);

    const res = await request(app)
      .get('/api/bookings?upcoming=true')
      .set('Cookie', clientCookie);

    expect(res.status).toBe(200);
    const confirmed = res.body.filter((b: { status: string }) => b.status === 'confirmed');
    expect(confirmed).toHaveLength(0);
  });
});
