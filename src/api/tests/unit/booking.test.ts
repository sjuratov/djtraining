import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { createUser, activateUser, setUserRole } from '../../src/models/user-store.js';
import { createTrainingType, createTemplate, generateSlots } from '../../src/services/schedule.js';
import bcrypt from 'bcryptjs';

const app = createApp();

// Helper: create and login a user, return cookie
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
  if (role === 'admin') setUserRole(user.id, 'admin');

  const res = await request(app).post('/api/auth/login').send({ email, password: 'Test1234!' });
  const cookie = res.headers['set-cookie'];
  return { user, cookie };
}

// Helper: create a future personal training slot
function createFutureSlot(daysAhead = 7, capacity = 1) {
  const futureDate = new Date(Date.now() + daysAhead * 86400000);
  const dateStr = futureDate.toISOString().split('T')[0];
  // Recalculate day of week from the date string to avoid timezone mismatch
  const parsedDate = new Date(dateStr + 'T12:00:00');
  const dayOfWeek = parsedDate.getDay();

  const tt = createTrainingType({
    name: 'Personal Training',
    category: 'personal',
    durationMinutes: 60,
    maxCapacity: capacity,
    priceSingle: 120,
  });

  createTemplate({
    trainingTypeId: tt.id,
    dayOfWeek,
    startTime: '10:00',
  });

  const slots = generateSlots({ fromDate: dateStr, toDate: dateStr });
  return { trainingType: tt, slot: slots[0] };
}

describe('Client Booking API', () => {
  let clientCookie: string[];
  let clientUserId: string;

  beforeEach(async () => {
    const { user, cookie } = await loginUser('client@example.com');
    clientCookie = cookie;
    clientUserId = user.id;
  });

  it('should create a booking for an available slot', async () => {
    const { slot } = createFutureSlot();
    const res = await request(app)
      .post('/api/bookings')
      .set('Cookie', clientCookie)
      .send({ timeSlotId: slot.id });

    expect(res.status).toBe(201);
    expect(res.body.userId).toBe(clientUserId);
    expect(res.body.timeSlotId).toBe(slot.id);
    expect(res.body.status).toBe('confirmed');
    expect(res.body.trainingTypeName).toBe('Personal Training');
  });

  it('should reject booking without timeSlotId', async () => {
    const res = await request(app)
      .post('/api/bookings')
      .set('Cookie', clientCookie)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Zeitfenster-ID');
  });

  it('should reject booking for non-existent slot', async () => {
    const res = await request(app)
      .post('/api/bookings')
      .set('Cookie', clientCookie)
      .send({ timeSlotId: 'non-existent-id' });

    expect(res.status).toBe(404);
    expect(res.body.code).toBe('SLOT_NOT_FOUND');
  });

  it('should prevent double booking', async () => {
    const { slot } = createFutureSlot();

    await request(app)
      .post('/api/bookings')
      .set('Cookie', clientCookie)
      .send({ timeSlotId: slot.id });

    const res = await request(app)
      .post('/api/bookings')
      .set('Cookie', clientCookie)
      .send({ timeSlotId: slot.id });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('DOUBLE_BOOKING');
  });

  it('should prevent booking a full slot (capacity 1)', async () => {
    const { slot } = createFutureSlot(7, 1);

    // First client books
    await request(app)
      .post('/api/bookings')
      .set('Cookie', clientCookie)
      .send({ timeSlotId: slot.id });

    // Second client tries to book
    const { cookie: otherCookie } = await loginUser('other@example.com');
    const res = await request(app)
      .post('/api/bookings')
      .set('Cookie', otherCookie)
      .send({ timeSlotId: slot.id });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('SLOT_FULL');
  });

  it('should allow multiple bookings for group slots', async () => {
    const { slot } = createFutureSlot(7, 5);

    await request(app)
      .post('/api/bookings')
      .set('Cookie', clientCookie)
      .send({ timeSlotId: slot.id });

    const { cookie: otherCookie } = await loginUser('other@example.com');
    const res = await request(app)
      .post('/api/bookings')
      .set('Cookie', otherCookie)
      .send({ timeSlotId: slot.id });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('confirmed');
  });

  it('should list client bookings', async () => {
    const { slot } = createFutureSlot();
    await request(app)
      .post('/api/bookings')
      .set('Cookie', clientCookie)
      .send({ timeSlotId: slot.id });

    const res = await request(app)
      .get('/api/bookings')
      .set('Cookie', clientCookie);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].slotDate).toBeDefined();
    expect(res.body[0].trainingTypeName).toBe('Personal Training');
  });

  it('should filter upcoming bookings', async () => {
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
  });

  it('should cancel a booking', async () => {
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
  });

  it('should reject cancelling already cancelled booking', async () => {
    const { slot } = createFutureSlot();
    const bookRes = await request(app)
      .post('/api/bookings')
      .set('Cookie', clientCookie)
      .send({ timeSlotId: slot.id });

    await request(app)
      .delete(`/api/bookings/${bookRes.body.id}`)
      .set('Cookie', clientCookie);

    const res = await request(app)
      .delete(`/api/bookings/${bookRes.body.id}`)
      .set('Cookie', clientCookie);

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('ALREADY_CANCELLED');
  });

  it('should not allow client to cancel another user booking', async () => {
    const { slot } = createFutureSlot(7, 5);

    // Another user books
    const { cookie: otherCookie } = await loginUser('other@example.com');
    const bookRes = await request(app)
      .post('/api/bookings')
      .set('Cookie', otherCookie)
      .send({ timeSlotId: slot.id });

    // Client tries to cancel
    const res = await request(app)
      .delete(`/api/bookings/${bookRes.body.id}`)
      .set('Cookie', clientCookie);

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('NOT_AUTHORIZED');
  });

  it('should free slot capacity after cancellation', async () => {
    const { slot } = createFutureSlot(7, 1);

    // Book (slot becomes full)
    const bookRes = await request(app)
      .post('/api/bookings')
      .set('Cookie', clientCookie)
      .send({ timeSlotId: slot.id });

    // Second client fails
    const { cookie: otherCookie } = await loginUser('other@example.com');
    let res = await request(app)
      .post('/api/bookings')
      .set('Cookie', otherCookie)
      .send({ timeSlotId: slot.id });
    expect(res.status).toBe(409);

    // Cancel first booking
    await request(app)
      .delete(`/api/bookings/${bookRes.body.id}`)
      .set('Cookie', clientCookie);

    // Second client succeeds now
    res = await request(app)
      .post('/api/bookings')
      .set('Cookie', otherCookie)
      .send({ timeSlotId: slot.id });
    expect(res.status).toBe(201);
  });

  it('should reject booking a cancelled slot', async () => {
    const { slot } = createFutureSlot();

    // Cancel the slot itself (via admin schedule)
    const { cookie: adminCookie } = await loginUser('admin@example.com', 'admin');
    await request(app)
      .post(`/api/admin/time-slots/${slot.id}/cancel`)
      .set('Cookie', adminCookie);

    const res = await request(app)
      .post('/api/bookings')
      .set('Cookie', clientCookie)
      .send({ timeSlotId: slot.id });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('SLOT_CANCELLED');
  });

  it('should require authentication for booking', async () => {
    const res = await request(app)
      .post('/api/bookings')
      .send({ timeSlotId: 'some-id' });

    expect(res.status).toBe(401);
  });
});

describe('Admin Booking API', () => {
  let adminCookie: string[];
  let clientCookie: string[];
  let clientUserId: string;

  beforeEach(async () => {
    const { cookie } = await loginUser('admin@example.com', 'admin');
    adminCookie = cookie;
    const { user, cookie: cCookie } = await loginUser('client@example.com');
    clientCookie = cCookie;
    clientUserId = user.id;
  });

  it('should list all bookings', async () => {
    const { slot } = createFutureSlot(7, 5);

    await request(app)
      .post('/api/bookings')
      .set('Cookie', clientCookie)
      .send({ timeSlotId: slot.id });

    const res = await request(app)
      .get('/api/admin/bookings')
      .set('Cookie', adminCookie);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].userId).toBe(clientUserId);
  });

  it('should filter bookings by date range', async () => {
    const { slot } = createFutureSlot(7, 5);

    await request(app)
      .post('/api/bookings')
      .set('Cookie', clientCookie)
      .send({ timeSlotId: slot.id });

    const futureDate = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
    const res = await request(app)
      .get(`/api/admin/bookings?from=${futureDate}&to=${futureDate}`)
      .set('Cookie', adminCookie);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  it('should book on behalf of client', async () => {
    const { slot } = createFutureSlot();

    const res = await request(app)
      .post('/api/admin/bookings')
      .set('Cookie', adminCookie)
      .send({ userId: clientUserId, timeSlotId: slot.id });

    expect(res.status).toBe(201);
    expect(res.body.userId).toBe(clientUserId);
    expect(res.body.bookedBy).not.toBe(clientUserId); // admin booked it
  });

  it('should require both userId and timeSlotId for admin booking', async () => {
    const res = await request(app)
      .post('/api/admin/bookings')
      .set('Cookie', adminCookie)
      .send({ timeSlotId: 'some-id' });

    expect(res.status).toBe(400);
  });

  it('should cancel any booking', async () => {
    const { slot } = createFutureSlot(7, 5);

    const bookRes = await request(app)
      .post('/api/bookings')
      .set('Cookie', clientCookie)
      .send({ timeSlotId: slot.id });

    // Admin cancels
    const res = await request(app)
      .delete(`/api/admin/bookings/${bookRes.body.id}`)
      .set('Cookie', adminCookie)
      .send({ reason: 'Trainer krank' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('cancelled');
    expect(res.body.cancellationReason).toBe('Trainer krank');
  });

  it('should update booking status', async () => {
    const { slot } = createFutureSlot(7, 5);

    const bookRes = await request(app)
      .post('/api/bookings')
      .set('Cookie', clientCookie)
      .send({ timeSlotId: slot.id });

    const res = await request(app)
      .put(`/api/admin/bookings/${bookRes.body.id}/status`)
      .set('Cookie', adminCookie)
      .send({ status: 'completed' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('completed');
  });

  it('should reject invalid status', async () => {
    const { slot } = createFutureSlot(7, 5);

    const bookRes = await request(app)
      .post('/api/bookings')
      .set('Cookie', clientCookie)
      .send({ timeSlotId: slot.id });

    const res = await request(app)
      .put(`/api/admin/bookings/${bookRes.body.id}/status`)
      .set('Cookie', adminCookie)
      .send({ status: 'invalid' });

    expect(res.status).toBe(400);
  });

  it('should reject non-admin access to admin bookings', async () => {
    const res = await request(app)
      .get('/api/admin/bookings')
      .set('Cookie', clientCookie);

    expect(res.status).toBe(403);
  });
});
