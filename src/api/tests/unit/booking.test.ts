import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { createUser, activateUser, setUserRole } from '../../src/models/user-store.js';
import { createTrainingType, createTemplate, generateSlots } from '../../src/services/schedule.js';
import { assignPackage } from '../../src/services/packages.js';
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
function createFutureSlot(daysAhead = 7, capacity = 1, category: 'personal' | 'gruppe' | 'ernaehrung' = 'personal') {
  const futureDate = new Date(Date.now() + daysAhead * 86400000);
  const dateStr = futureDate.toISOString().split('T')[0];
  // Recalculate day of week from the date string to avoid timezone mismatch
  const parsedDate = new Date(dateStr + 'T12:00:00');
  const dayOfWeek = parsedDate.getDay();

  const names: Record<string, string> = { personal: 'Personal Training', gruppe: 'Gruppentraining', ernaehrung: 'Ernährungscoaching' };
  const tt = createTrainingType({
    name: names[category],
    category,
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
  return { trainingType: tt, slot: slots[0], dateStr };
}

function assignDefaultPackage(userId: string, category: 'personal' | 'gruppe' | 'ernaehrung' = 'personal') {
  const packageDefIdByCategory: Record<'personal' | 'gruppe' | 'ernaehrung', string> = {
    personal: 'pkg-personal-20',
    gruppe: 'pkg-gruppe-20',
    ernaehrung: 'pkg-ernaehrung-5',
  };

  assignPackage({ userId, packageDefId: packageDefIdByCategory[category] });
}

describe('Client Booking API', () => {
  let clientCookie: string[];
  let clientUserId: string;

  beforeEach(async () => {
    const { user, cookie } = await loginUser('client@example.com');
    clientCookie = cookie;
    clientUserId = user.id;
    assignDefaultPackage(clientUserId, 'personal');
    assignDefaultPackage(clientUserId, 'gruppe');
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
    const { user: otherUser, cookie: otherCookie } = await loginUser('other@example.com');
    assignDefaultPackage(otherUser.id, 'personal');
    const res = await request(app)
      .post('/api/bookings')
      .set('Cookie', otherCookie)
      .send({ timeSlotId: slot.id });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('SLOT_FULL');
  });

  it('should allow multiple bookings for group slots', async () => {
    const { slot } = createFutureSlot(7, 5, 'gruppe');

    await request(app)
      .post('/api/bookings')
      .set('Cookie', clientCookie)
      .send({ timeSlotId: slot.id });

    const { user: otherUser, cookie: otherCookie } = await loginUser('other@example.com');
    assignDefaultPackage(otherUser.id, 'gruppe');
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
    const { user: otherUser, cookie: otherCookie } = await loginUser('other@example.com');
    assignDefaultPackage(otherUser.id, 'personal');
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
    const { user: otherUser, cookie: otherCookie } = await loginUser('other@example.com');
    assignDefaultPackage(otherUser.id, 'personal');
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
    assignDefaultPackage(clientUserId, 'personal');
    assignDefaultPackage(clientUserId, 'gruppe');
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

describe('Group Training Enrollment', () => {
  let clientCookie: string[];

  beforeEach(async () => {
    const { user, cookie } = await loginUser('client@example.com');
    clientCookie = cookie;
    assignDefaultPackage(user.id, 'personal');
    assignDefaultPackage(user.id, 'gruppe');
  });

  it('should show available spots on public slot API', async () => {
    const { slot, dateStr } = createFutureSlot(7, 5, 'gruppe');

    const res = await request(app)
      .get(`/api/schedule/slots?from=${dateStr}&to=${dateStr}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].maxCapacity).toBe(5);
    expect(res.body[0].currentBookings).toBe(0);
    expect(res.body[0].availableSpots).toBe(5);
  });

  it('should decrement available spots after booking', async () => {
    const { slot, dateStr } = createFutureSlot(7, 5, 'gruppe');

    await request(app)
      .post('/api/bookings')
      .set('Cookie', clientCookie)
      .send({ timeSlotId: slot.id });

    const res = await request(app)
      .get(`/api/schedule/slots?from=${dateStr}&to=${dateStr}`);

    expect(res.body[0].currentBookings).toBe(1);
    expect(res.body[0].availableSpots).toBe(4);
  });

  it('should fill group slot to capacity', async () => {
    const { slot, dateStr } = createFutureSlot(7, 3, 'gruppe');

    // Book 3 clients to fill capacity
    for (let i = 0; i < 3; i++) {
      const { user, cookie } = await loginUser(`user${i}@example.com`);
      assignDefaultPackage(user.id, 'gruppe');
      await request(app)
        .post('/api/bookings')
        .set('Cookie', cookie)
        .send({ timeSlotId: slot.id });
    }

    // Check availability
    const res = await request(app)
      .get(`/api/schedule/slots?from=${dateStr}&to=${dateStr}`);

    expect(res.body[0].currentBookings).toBe(3);
    expect(res.body[0].availableSpots).toBe(0);
    expect(res.body[0].status).toBe('full');
  });

  it('should restore capacity after cancellation', async () => {
    const { slot, dateStr } = createFutureSlot(7, 2, 'gruppe');

    // Book 2 clients to fill
    const { user: user1, cookie: cookie1 } = await loginUser('user1@example.com');
    assignDefaultPackage(user1.id, 'gruppe');
    const book1 = await request(app)
      .post('/api/bookings')
      .set('Cookie', cookie1)
      .send({ timeSlotId: slot.id });

    const { user: user2, cookie: cookie2 } = await loginUser('user2@example.com');
    assignDefaultPackage(user2.id, 'gruppe');
    await request(app)
      .post('/api/bookings')
      .set('Cookie', cookie2)
      .send({ timeSlotId: slot.id });

    // Cancel one booking
    await request(app)
      .delete(`/api/bookings/${book1.body.id}`)
      .set('Cookie', cookie1);

    const res = await request(app)
      .get(`/api/schedule/slots?from=${dateStr}&to=${dateStr}`);

    expect(res.body[0].currentBookings).toBe(1);
    expect(res.body[0].availableSpots).toBe(1);
    expect(res.body[0].status).toBe('available');
  });

  it('should filter slots by category', async () => {
    const { dateStr } = createFutureSlot(7, 1, 'personal');
    createFutureSlot(7, 5, 'gruppe');

    const res = await request(app)
      .get(`/api/schedule/slots?from=${dateStr}&to=${dateStr}&category=gruppe`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].trainingTypeCategory).toBe('gruppe');
  });

  it('should include full slots in public API', async () => {
    const { slot, dateStr } = createFutureSlot(7, 1, 'personal');

    // Book to fill
    await request(app)
      .post('/api/bookings')
      .set('Cookie', clientCookie)
      .send({ timeSlotId: slot.id });

    const res = await request(app)
      .get(`/api/schedule/slots?from=${dateStr}&to=${dateStr}`);

    // Full slots should still be visible (so clients can see schedule)
    expect(res.body).toHaveLength(1);
    expect(res.body[0].status).toBe('full');
    expect(res.body[0].availableSpots).toBe(0);
  });
});
