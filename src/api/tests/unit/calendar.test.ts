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

async function createUserAndLogin(email = 'client@example.com', displayName = 'Client'): Promise<{ cookie: string; userId: string }> {
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
  return {
    cookie,
    userId: meRes.body.sub,
  };
}

function futureDate(daysAhead = 7): string {
  const d = new Date(Date.now() + daysAhead * 86400000);
  return d.toISOString().split('T')[0];
}

async function createTrainingType(adminCookie: string, overrides: Record<string, unknown> = {}) {
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

async function createSlotViaTemplate(adminCookie: string, trainingTypeId: string, dateStr: string) {
  const parsedDate = new Date(dateStr + 'T12:00:00');
  const dayOfWeek = parsedDate.getDay();

  await request(app)
    .post('/api/admin/schedule-templates')
    .set('Cookie', adminCookie)
    .send({ trainingTypeId, dayOfWeek, startTime: '10:00' });

  const genRes = await request(app)
    .post('/api/admin/generate-slots')
    .set('Cookie', adminCookie)
    .send({ fromDate: dateStr, toDate: dateStr });

  return genRes.body.slots[0];
}

describe('Ad-hoc Time Slot Creation', () => {
  let adminCookie: string;
  let trainingTypeId: string;

  beforeEach(async () => {
    await request(app).post('/api/test/reset');
    adminCookie = await createAdminAndLogin();
    const tt = await createTrainingType(adminCookie);
    trainingTypeId = tt.id;
  });

  it('should create an ad-hoc time slot', async () => {
    const dateStr = futureDate(10);
    const res = await request(app)
      .post('/api/admin/time-slots')
      .set('Cookie', adminCookie)
      .send({
        trainingTypeId,
        date: dateStr,
        startTime: '14:00',
        endTime: '15:00',
        notes: 'Extra session',
      });

    expect(res.status).toBe(201);
    expect(res.body.templateId).toBeNull();
    expect(res.body.date).toBe(dateStr);
    expect(res.body.startTime).toBe('14:00');
    expect(res.body.endTime).toBe('15:00');
    expect(res.body.notes).toBe('Extra session');
    expect(res.body.maxCapacity).toBe(3);
    expect(res.body.trainingTypeName).toBe('Personal Training');
  });

  it('should return 400 for invalid training type', async () => {
    const res = await request(app)
      .post('/api/admin/time-slots')
      .set('Cookie', adminCookie)
      .send({
        trainingTypeId: 'non-existent-id',
        date: futureDate(10),
        startTime: '14:00',
        endTime: '15:00',
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Trainingsart nicht gefunden');
  });
});

describe('Bulk Cancel Slots', () => {
  let adminCookie: string;

  beforeEach(async () => {
    await request(app).post('/api/test/reset');
    adminCookie = await createAdminAndLogin();
  });

  it('should cancel multiple slots in date range', async () => {
    const tt = await createTrainingType(adminCookie, { name: 'Group', category: 'gruppe', maxCapacity: 5 });
    const dateStr = futureDate(10);

    // Create multiple ad-hoc slots on the same date
    await request(app)
      .post('/api/admin/time-slots')
      .set('Cookie', adminCookie)
      .send({ trainingTypeId: tt.id, date: dateStr, startTime: '09:00', endTime: '10:00' });

    await request(app)
      .post('/api/admin/time-slots')
      .set('Cookie', adminCookie)
      .send({ trainingTypeId: tt.id, date: dateStr, startTime: '11:00', endTime: '12:00' });

    const res = await request(app)
      .post('/api/admin/time-slots/bulk-cancel')
      .set('Cookie', adminCookie)
      .send({ fromDate: dateStr, toDate: dateStr });

    expect(res.status).toBe(200);
    expect(res.body.cancelledCount).toBe(2);
  });

  it('should not cancel already cancelled slots', async () => {
    const tt = await createTrainingType(adminCookie);
    const dateStr = futureDate(10);

    const slotRes = await request(app)
      .post('/api/admin/time-slots')
      .set('Cookie', adminCookie)
      .send({ trainingTypeId: tt.id, date: dateStr, startTime: '09:00', endTime: '10:00' });

    // Cancel first
    await request(app)
      .post(`/api/admin/time-slots/${slotRes.body.id}/cancel`)
      .set('Cookie', adminCookie);

    // Create another slot
    await request(app)
      .post('/api/admin/time-slots')
      .set('Cookie', adminCookie)
      .send({ trainingTypeId: tt.id, date: dateStr, startTime: '11:00', endTime: '12:00' });

    // Bulk cancel — should only cancel the second one
    const res = await request(app)
      .post('/api/admin/time-slots/bulk-cancel')
      .set('Cookie', adminCookie)
      .send({ fromDate: dateStr, toDate: dateStr });

    expect(res.status).toBe(200);
    expect(res.body.cancelledCount).toBe(1);
  });
});

describe('Admin Calendar Endpoint', () => {
  let adminCookie: string;

  beforeEach(async () => {
    await request(app).post('/api/test/reset');
    adminCookie = await createAdminAndLogin();
  });

  it('should return slots with booking counts', async () => {
    const tt = await createTrainingType(adminCookie, { maxCapacity: 5 });
    const dateStr = futureDate(10);

    await request(app)
      .post('/api/admin/time-slots')
      .set('Cookie', adminCookie)
      .send({ trainingTypeId: tt.id, date: dateStr, startTime: '10:00', endTime: '11:00' });

    // Book a client
    const { cookie: clientCookie } = await createUserAndLogin();
    const slotsRes = await request(app).get(`/api/schedule/slots?from=${dateStr}&to=${dateStr}`);
    const slotId = slotsRes.body[0].id;

    await request(app)
      .post('/api/bookings')
      .set('Cookie', clientCookie)
      .send({ timeSlotId: slotId });

    const res = await request(app)
      .get(`/api/admin/calendar?from=${dateStr}&to=${dateStr}`)
      .set('Cookie', adminCookie);

    expect(res.status).toBe(200);
    expect(res.body.slots).toHaveLength(1);
    expect(res.body.slots[0].currentBookings).toBe(1);
    expect(res.body.slots[0].availableSpots).toBe(4);
  });

  it('should return bookings per slot with user info', async () => {
    const tt = await createTrainingType(adminCookie, { maxCapacity: 5 });
    const dateStr = futureDate(10);

    await request(app)
      .post('/api/admin/time-slots')
      .set('Cookie', adminCookie)
      .send({ trainingTypeId: tt.id, date: dateStr, startTime: '10:00', endTime: '11:00' });

    const { cookie: clientCookie } = await createUserAndLogin('testclient@example.com', 'TestClient');
    const slotsRes = await request(app).get(`/api/schedule/slots?from=${dateStr}&to=${dateStr}`);
    const slotId = slotsRes.body[0].id;

    await request(app)
      .post('/api/bookings')
      .set('Cookie', clientCookie)
      .send({ timeSlotId: slotId });

    const res = await request(app)
      .get(`/api/admin/calendar?from=${dateStr}&to=${dateStr}`)
      .set('Cookie', adminCookie);

    expect(res.status).toBe(200);
    expect(res.body.bookings[slotId]).toBeDefined();
    expect(res.body.bookings[slotId]).toHaveLength(1);
    expect(res.body.bookings[slotId][0].userEmail).toBe('testclient@example.com');
    expect(res.body.bookings[slotId][0].userDisplayName).toBe('TestClient');
  });

  it('should include all slot statuses (available, full, cancelled)', async () => {
    const tt = await createTrainingType(adminCookie, { maxCapacity: 1 });
    const dateStr = futureDate(10);

    // Available slot
    await request(app)
      .post('/api/admin/time-slots')
      .set('Cookie', adminCookie)
      .send({ trainingTypeId: tt.id, date: dateStr, startTime: '09:00', endTime: '10:00' });

    // Full slot (book to capacity)
    const fullSlotRes = await request(app)
      .post('/api/admin/time-slots')
      .set('Cookie', adminCookie)
      .send({ trainingTypeId: tt.id, date: dateStr, startTime: '11:00', endTime: '12:00' });

    const { cookie: clientCookie, userId: clientUserId } = await createUserAndLogin();
    await request(app)
      .post('/api/bookings')
      .set('Cookie', clientCookie)
      .send({ timeSlotId: fullSlotRes.body.id });

    // Cancelled slot
    const cancelledSlotRes = await request(app)
      .post('/api/admin/time-slots')
      .set('Cookie', adminCookie)
      .send({ trainingTypeId: tt.id, date: dateStr, startTime: '14:00', endTime: '15:00' });

    await request(app)
      .post(`/api/admin/time-slots/${cancelledSlotRes.body.id}/cancel`)
      .set('Cookie', adminCookie);

    const res = await request(app)
      .get(`/api/admin/calendar?from=${dateStr}&to=${dateStr}`)
      .set('Cookie', adminCookie);

    expect(res.status).toBe(200);
    expect(res.body.slots).toHaveLength(3);

    const statuses = res.body.slots.map((s: { status: string }) => s.status).sort();
    expect(statuses).toEqual(['available', 'cancelled', 'full']);
  });

  it('should allow admin to book on behalf of client (calendar context)', async () => {
    const tt = await createTrainingType(adminCookie, { maxCapacity: 5 });
    const dateStr = futureDate(10);

    await request(app)
      .post('/api/admin/time-slots')
      .set('Cookie', adminCookie)
      .send({ trainingTypeId: tt.id, date: dateStr, startTime: '10:00', endTime: '11:00' });

    const { userId: clientUserId } = await createUserAndLogin();
    const slotsRes = await request(app).get(`/api/schedule/slots?from=${dateStr}&to=${dateStr}`);
    const slotId = slotsRes.body[0].id;

    const res = await request(app)
      .post('/api/admin/bookings')
      .set('Cookie', adminCookie)
      .send({ userId: clientUserId, timeSlotId: slotId });

    expect(res.status).toBe(201);
    expect(res.body.userId).toBe(clientUserId);
    expect(res.body.status).toBe('confirmed');
  });
});

describe('Get Slot Bookings', () => {
  let adminCookie: string;

  beforeEach(async () => {
    await request(app).post('/api/test/reset');
    adminCookie = await createAdminAndLogin();
  });

  it('should return bookings with correct user details', async () => {
    const tt = await createTrainingType(adminCookie, { maxCapacity: 5 });
    const dateStr = futureDate(10);

    await request(app)
      .post('/api/admin/time-slots')
      .set('Cookie', adminCookie)
      .send({ trainingTypeId: tt.id, date: dateStr, startTime: '10:00', endTime: '11:00' });

    // Two users book the same slot
    const { cookie: cookie1 } = await createUserAndLogin('user1@example.com', 'User One');
    const { cookie: cookie2 } = await createUserAndLogin('user2@example.com', 'User Two');

    const slotsRes = await request(app).get(`/api/schedule/slots?from=${dateStr}&to=${dateStr}`);
    const slotId = slotsRes.body[0].id;

    await request(app).post('/api/bookings').set('Cookie', cookie1).send({ timeSlotId: slotId });
    await request(app).post('/api/bookings').set('Cookie', cookie2).send({ timeSlotId: slotId });

    // Verify via calendar endpoint
    const res = await request(app)
      .get(`/api/admin/calendar?from=${dateStr}&to=${dateStr}`)
      .set('Cookie', adminCookie);

    expect(res.status).toBe(200);
    expect(res.body.bookings[slotId]).toHaveLength(2);

    const emails = res.body.bookings[slotId].map((b: { userEmail: string }) => b.userEmail).sort();
    expect(emails).toEqual(['user1@example.com', 'user2@example.com']);

    const names = res.body.bookings[slotId].map((b: { userDisplayName: string }) => b.userDisplayName).sort();
    expect(names).toEqual(['User One', 'User Two']);
  });
});
