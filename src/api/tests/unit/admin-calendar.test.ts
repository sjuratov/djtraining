import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { assignPackage } from '../../src/services/packages.js';

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

async function createUserAndLogin(
  email = 'client@example.com',
  displayName = 'Client',
): Promise<{ cookie: string; userId: string }> {
  await request(app).post('/api/test/create-user').send({
    email,
    password: 'User1234!',
    displayName,
  });
  const loginRes = await request(app).post('/api/auth/login').send({
    email,
    password: 'User1234!',
  });
  const cookie = loginRes.headers['set-cookie']?.[0] ?? '';
  const meRes = await request(app).get('/api/auth/me').set('Cookie', cookie);
  assignPackage({ userId: meRes.body.sub, packageDefId: 'pkg-personal-20' });
  return { cookie, userId: meRes.body.sub };
}

function futureDate(daysAhead = 7): string {
  const d = new Date(Date.now() + daysAhead * 86400000);
  return d.toISOString().split('T')[0];
}

async function createTrainingType(
  adminCookie: string,
  overrides: Record<string, unknown> = {},
) {
  const res = await request(app)
    .post('/api/admin/training-types')
    .set('Cookie', adminCookie)
    .send({
      name: 'Personal Training',
      category: 'personal',
      durationMinutes: 60,
      maxCapacity: 3,
      priceSingle: 12000,
      ...overrides,
    });
  return res.body;
}

async function createTimeSlot(
  adminCookie: string,
  trainingTypeId: string,
  dateStr: string,
  overrides: Record<string, unknown> = {},
) {
  return request(app)
    .post('/api/admin/time-slots')
    .set('Cookie', adminCookie)
    .send({
      trainingTypeId,
      date: dateStr,
      startTime: '10:00',
      endTime: '11:00',
      ...overrides,
    });
}

describe('Admin Calendar API', () => {
  let adminCookie: string;

  beforeEach(async () => {
    adminCookie = await createAdminAndLogin();
  });

  it('should return calendar data with slots and booking counts', async () => {
    const tt = await createTrainingType(adminCookie, { maxCapacity: 5 });
    const dateStr = futureDate(10);

    await createTimeSlot(adminCookie, tt.id, dateStr);

    const { userId } = await createUserAndLogin();
    const slotsRes = await request(app).get(`/api/schedule/slots?from=${dateStr}&to=${dateStr}`);
    const slotId = slotsRes.body[0].id;

    await request(app)
      .post('/api/admin/bookings')
      .set('Cookie', adminCookie)
      .send({ userId, timeSlotId: slotId });

    const res = await request(app)
      .get(`/api/admin/calendar?from=${dateStr}&to=${dateStr}`)
      .set('Cookie', adminCookie);

    expect(res.status).toBe(200);
    expect(res.body.slots).toHaveLength(1);
    expect(res.body.slots[0].currentBookings).toBe(1);
    expect(res.body.slots[0].availableSpots).toBe(4);
  });

  it('should create an ad-hoc time slot', async () => {
    const tt = await createTrainingType(adminCookie);
    const dateStr = futureDate(10);

    const res = await request(app)
      .post('/api/admin/time-slots')
      .set('Cookie', adminCookie)
      .send({
        trainingTypeId: tt.id,
        date: dateStr,
        startTime: '14:00',
        endTime: '15:00',
        notes: 'Ad-hoc session',
      });

    expect(res.status).toBe(201);
    expect(res.body.date).toBe(dateStr);
    expect(res.body.startTime).toBe('14:00');
    expect(res.body.endTime).toBe('15:00');
    expect(res.body.notes).toBe('Ad-hoc session');
    expect(res.body.templateId).toBeNull();
  });

  it('should cancel a time slot', async () => {
    const tt = await createTrainingType(adminCookie);
    const dateStr = futureDate(10);

    const slotRes = await createTimeSlot(adminCookie, tt.id, dateStr);
    const slotId = slotRes.body.id;

    const cancelRes = await request(app)
      .post(`/api/admin/time-slots/${slotId}/cancel`)
      .set('Cookie', adminCookie);

    expect(cancelRes.status).toBe(200);

    // Verify via calendar endpoint
    const calRes = await request(app)
      .get(`/api/admin/calendar?from=${dateStr}&to=${dateStr}`)
      .set('Cookie', adminCookie);

    const slot = calRes.body.slots.find((s: { id: string }) => s.id === slotId);
    expect(slot).toBeDefined();
    expect(slot.status).toBe('cancelled');
  });

  it('should bulk-cancel slots for a date range', async () => {
    const tt = await createTrainingType(adminCookie, { maxCapacity: 5 });
    const dateStr = futureDate(10);

    await createTimeSlot(adminCookie, tt.id, dateStr, {
      startTime: '09:00',
      endTime: '10:00',
    });
    await createTimeSlot(adminCookie, tt.id, dateStr, {
      startTime: '11:00',
      endTime: '12:00',
    });

    const res = await request(app)
      .post('/api/admin/time-slots/bulk-cancel')
      .set('Cookie', adminCookie)
      .send({ fromDate: dateStr, toDate: dateStr });

    expect(res.status).toBe(200);
    expect(res.body.cancelledCount).toBe(2);
  });

  it('should book on behalf of a client', async () => {
    const tt = await createTrainingType(adminCookie, { maxCapacity: 5 });
    const dateStr = futureDate(10);

    await createTimeSlot(adminCookie, tt.id, dateStr);

    const { userId } = await createUserAndLogin();
    const slotsRes = await request(app).get(`/api/schedule/slots?from=${dateStr}&to=${dateStr}`);
    const slotId = slotsRes.body[0].id;

    const res = await request(app)
      .post('/api/admin/bookings')
      .set('Cookie', adminCookie)
      .send({ userId, timeSlotId: slotId });

    expect(res.status).toBe(201);
    expect(res.body.userId).toBe(userId);
    expect(res.body.status).toBe('confirmed');
  });

  it('should update booking status to completed', async () => {
    const tt = await createTrainingType(adminCookie, { maxCapacity: 5 });
    const dateStr = futureDate(10);

    await createTimeSlot(adminCookie, tt.id, dateStr);

    const { userId } = await createUserAndLogin();
    const slotsRes = await request(app).get(`/api/schedule/slots?from=${dateStr}&to=${dateStr}`);
    const slotId = slotsRes.body[0].id;

    const bookRes = await request(app)
      .post('/api/admin/bookings')
      .set('Cookie', adminCookie)
      .send({ userId, timeSlotId: slotId });

    const res = await request(app)
      .put(`/api/admin/bookings/${bookRes.body.id}/status`)
      .set('Cookie', adminCookie)
      .send({ status: 'completed' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('completed');
  });

  it('should update booking status to no-show', async () => {
    const tt = await createTrainingType(adminCookie, { maxCapacity: 5 });
    const dateStr = futureDate(10);

    await createTimeSlot(adminCookie, tt.id, dateStr);

    const { userId } = await createUserAndLogin();
    const slotsRes = await request(app).get(`/api/schedule/slots?from=${dateStr}&to=${dateStr}`);
    const slotId = slotsRes.body[0].id;

    const bookRes = await request(app)
      .post('/api/admin/bookings')
      .set('Cookie', adminCookie)
      .send({ userId, timeSlotId: slotId });

    const res = await request(app)
      .put(`/api/admin/bookings/${bookRes.body.id}/status`)
      .set('Cookie', adminCookie)
      .send({ status: 'no-show' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('no-show');
  });

  it('should reject non-admin access to calendar endpoint', async () => {
    const { cookie: userCookie } = await createUserAndLogin('regular@example.com', 'Regular');

    const res = await request(app)
      .get(`/api/admin/calendar?from=${futureDate(1)}&to=${futureDate(7)}`)
      .set('Cookie', userCookie);

    expect(res.status).toBe(403);
  });
});
