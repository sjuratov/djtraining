import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { createUser, activateUser, setUserRole } from '../../src/models/user-store.js';
import { createTrainingType, createTemplate, generateSlots } from '../../src/services/schedule.js';
import { assignPackage, getClientPackages } from '../../src/services/packages.js';
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

// Helper: create a future training slot
function createFutureSlot(daysAhead = 7, capacity = 1, category: 'personal' | 'gruppe' | 'ernaehrung' = 'personal') {
  const futureDate = new Date(Date.now() + daysAhead * 86400000);
  const dateStr = futureDate.toISOString().split('T')[0];
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

describe('Package Definitions (Admin)', () => {
  let adminCookie: string[];
  let clientCookie: string[];

  beforeEach(async () => {
    const { cookie } = await loginUser('admin@example.com', 'admin');
    adminCookie = cookie;
    const { cookie: cCookie } = await loginUser('client@example.com');
    clientCookie = cCookie;
  });

  it('should list default seed package definitions', async () => {
    const res = await request(app)
      .get('/api/admin/package-definitions')
      .set('Cookie', adminCookie);

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(15);
    const personal = res.body.filter((p: { trainingCategory: string }) => p.trainingCategory === 'personal');
    expect(personal.length).toBe(9);
  });

  it('should create a new package definition', async () => {
    const res = await request(app)
      .post('/api/admin/package-definitions')
      .set('Cookie', adminCookie)
      .send({
        name: 'Test Paket',
        trainingCategory: 'personal',
        totalSessions: 10,
        priceChf: 50000,
        validityDays: 180,
      });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Test Paket');
    expect(res.body.totalSessions).toBe(10);
    expect(res.body.priceChf).toBe(50000);
    expect(res.body.validityDays).toBe(180);
    expect(res.body.active).toBe(true);
  });

  it('should reject invalid training category', async () => {
    const res = await request(app)
      .post('/api/admin/package-definitions')
      .set('Cookie', adminCookie)
      .send({
        name: 'Bad Category',
        trainingCategory: 'invalid',
        totalSessions: 5,
        priceChf: 10000,
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Ungültige Trainingskategorie');
  });

  it('should update a package definition', async () => {
    const createRes = await request(app)
      .post('/api/admin/package-definitions')
      .set('Cookie', adminCookie)
      .send({
        name: 'Update Test',
        trainingCategory: 'gruppe',
        totalSessions: 5,
        priceChf: 20000,
      });

    const res = await request(app)
      .put(`/api/admin/package-definitions/${createRes.body.id}`)
      .set('Cookie', adminCookie)
      .send({ name: 'Updated Name', priceChf: 25000 });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Updated Name');
    expect(res.body.priceChf).toBe(25000);
  });

  it('should deactivate a package definition', async () => {
    const createRes = await request(app)
      .post('/api/admin/package-definitions')
      .set('Cookie', adminCookie)
      .send({
        name: 'Deactivate Test',
        trainingCategory: 'ernaehrung',
        totalSessions: 3,
        priceChf: 15000,
      });

    const res = await request(app)
      .put(`/api/admin/package-definitions/${createRes.body.id}`)
      .set('Cookie', adminCookie)
      .send({ active: false });

    expect(res.status).toBe(200);
    expect(res.body.active).toBe(false);
  });

  it('should reject non-admin access', async () => {
    const res = await request(app)
      .get('/api/admin/package-definitions')
      .set('Cookie', clientCookie);

    expect(res.status).toBe(403);
  });
});

describe('Package Assignment', () => {
  let adminCookie: string[];
  let clientUserId: string;

  beforeEach(async () => {
    const { cookie } = await loginUser('admin@example.com', 'admin');
    adminCookie = cookie;
    const { user } = await loginUser('client@example.com');
    clientUserId = user.id;
  });

  it('should assign a package to a client', async () => {
    const res = await request(app)
      .post(`/api/admin/users/${clientUserId}/packages`)
      .set('Cookie', adminCookie)
      .send({ packageDefId: 'pkg-personal-20' });

    expect(res.status).toBe(201);
    expect(res.body.userId).toBe(clientUserId);
    expect(res.body.totalSessions).toBe(20);
    expect(res.body.remainingSessions).toBe(20);
    expect(res.body.status).toBe('active');
    expect(res.body.packageName).toBe('Personal Training 20er-Abo');
  });

  it('should calculate expires_at from validity_days', async () => {
    const res = await request(app)
      .post(`/api/admin/users/${clientUserId}/packages`)
      .set('Cookie', adminCookie)
      .send({ packageDefId: 'pkg-personal-20' });

    expect(res.status).toBe(201);
    expect(res.body.expiresAt).toBeDefined();
    // Should be roughly 365 days from now
    const expiresAt = new Date(res.body.expiresAt);
    const daysUntilExpiry = (expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    expect(daysUntilExpiry).toBeGreaterThan(363);
    expect(daysUntilExpiry).toBeLessThan(367);
  });

  it('should not set expires_at when validity_days is null', async () => {
    const res = await request(app)
      .post(`/api/admin/users/${clientUserId}/packages`)
      .set('Cookie', adminCookie)
      .send({ packageDefId: 'pkg-personal-1' });

    expect(res.status).toBe(201);
    expect(res.body.expiresAt).toBeNull();
  });
});

describe('Session Deduction', () => {
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

  it('should deduct session on booking', async () => {
    // Assign a package
    assignPackage({ userId: clientUserId, packageDefId: 'pkg-personal-1' });

    const { slot } = createFutureSlot();

    await request(app)
      .post('/api/bookings')
      .set('Cookie', clientCookie)
      .send({ timeSlotId: slot.id });

    const packages = getClientPackages(clientUserId);
    expect(packages[0].remainingSessions).toBe(0);
    expect(packages[0].status).toBe('depleted');
  });

  it('should credit session on cancellation', async () => {
    assignPackage({ userId: clientUserId, packageDefId: 'pkg-personal-1' });

    const { slot } = createFutureSlot();

    const bookRes = await request(app)
      .post('/api/bookings')
      .set('Cookie', clientCookie)
      .send({ timeSlotId: slot.id });

    // Package should be depleted
    let packages = getClientPackages(clientUserId);
    expect(packages[0].remainingSessions).toBe(0);
    expect(packages[0].status).toBe('depleted');

    // Cancel the booking
    await request(app)
      .delete(`/api/bookings/${bookRes.body.id}`)
      .set('Cookie', clientCookie);

    // Package should be restored
    packages = getClientPackages(clientUserId);
    expect(packages[0].remainingSessions).toBe(1);
    expect(packages[0].status).toBe('active');
  });

  it('should mark package as depleted when sessions reach 0', async () => {
    assignPackage({ userId: clientUserId, packageDefId: 'pkg-personal-1' });

    const { slot } = createFutureSlot();
    await request(app)
      .post('/api/bookings')
      .set('Cookie', clientCookie)
      .send({ timeSlotId: slot.id });

    const packages = getClientPackages(clientUserId);
    expect(packages[0].status).toBe('depleted');
    expect(packages[0].remainingSessions).toBe(0);
  });

  it('should reactivate package on credit-back from depleted', async () => {
    assignPackage({ userId: clientUserId, packageDefId: 'pkg-personal-1' });

    const { slot } = createFutureSlot();
    const bookRes = await request(app)
      .post('/api/bookings')
      .set('Cookie', clientCookie)
      .send({ timeSlotId: slot.id });

    let packages = getClientPackages(clientUserId);
    expect(packages[0].status).toBe('depleted');

    await request(app)
      .delete(`/api/bookings/${bookRes.body.id}`)
      .set('Cookie', clientCookie);

    packages = getClientPackages(clientUserId);
    expect(packages[0].status).toBe('active');
    expect(packages[0].remainingSessions).toBe(1);
  });

  it('should use FIFO (earliest expiry first) for deduction', async () => {
    // Create two packages for the same user — one expiring sooner
    const pkg1 = assignPackage({ userId: clientUserId, packageDefId: 'pkg-personal-20', notes: 'first' });
    const pkg2 = assignPackage({ userId: clientUserId, packageDefId: 'pkg-personal-20', notes: 'second' });

    const { slot } = createFutureSlot();
    await request(app)
      .post('/api/bookings')
      .set('Cookie', clientCookie)
      .send({ timeSlotId: slot.id });

    const packages = getClientPackages(clientUserId);
    // The first package (earlier expiry since both 365 days but first has earlier purchasedAt) should be deducted
    const first = packages.find(p => p.id === pkg1.id);
    const second = packages.find(p => p.id === pkg2.id);
    expect(first!.remainingSessions).toBe(19);
    expect(second!.remainingSessions).toBe(20);
  });

  it('should allow booking without active package (pay-per-session)', async () => {
    // No package assigned
    const { slot } = createFutureSlot();

    const res = await request(app)
      .post('/api/bookings')
      .set('Cookie', clientCookie)
      .send({ timeSlotId: slot.id });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('confirmed');
  });
});

describe('Client API', () => {
  let clientCookie: string[];
  let clientUserId: string;

  beforeEach(async () => {
    const { user, cookie } = await loginUser('client@example.com');
    clientCookie = cookie;
    clientUserId = user.id;
  });

  it('should list client active packages', async () => {
    assignPackage({ userId: clientUserId, packageDefId: 'pkg-personal-20' });

    const res = await request(app)
      .get('/api/packages')
      .set('Cookie', clientCookie);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].packageName).toBe('Personal Training 20er-Abo');
    expect(res.body[0].status).toBe('active');
  });

  it('should not list other client packages', async () => {
    const { user: otherUser } = await loginUser('other@example.com');
    assignPackage({ userId: otherUser.id, packageDefId: 'pkg-personal-20' });

    const res = await request(app)
      .get('/api/packages')
      .set('Cookie', clientCookie);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(0);
  });
});

describe('Admin Adjustment', () => {
  let adminCookie: string[];
  let clientUserId: string;

  beforeEach(async () => {
    const { cookie } = await loginUser('admin@example.com', 'admin');
    adminCookie = cookie;
    const { user } = await loginUser('client@example.com');
    clientUserId = user.id;
  });

  it('should adjust remaining sessions', async () => {
    const pkg = assignPackage({ userId: clientUserId, packageDefId: 'pkg-personal-20' });

    const res = await request(app)
      .put(`/api/admin/packages/${pkg.id}/adjust`)
      .set('Cookie', adminCookie)
      .send({ delta: -5, reason: 'Correction' });

    expect(res.status).toBe(200);
    expect(res.body.remainingSessions).toBe(15);
  });

  it('should reject negative adjustment below zero', async () => {
    const pkg = assignPackage({ userId: clientUserId, packageDefId: 'pkg-personal-1' });

    const res = await request(app)
      .put(`/api/admin/packages/${pkg.id}/adjust`)
      .set('Cookie', adminCookie)
      .send({ delta: -5, reason: 'Too much' });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('negativ');
  });
});

describe('Overview', () => {
  let adminCookie: string[];
  let clientUserId: string;

  beforeEach(async () => {
    const { cookie } = await loginUser('admin@example.com', 'admin');
    adminCookie = cookie;
    const { user } = await loginUser('client@example.com');
    clientUserId = user.id;
  });

  it('should show expiring packages in overview', async () => {
    // Assign a package with 365 days validity — not expiring soon
    assignPackage({ userId: clientUserId, packageDefId: 'pkg-personal-20' });

    const res = await request(app)
      .get('/api/admin/packages/overview')
      .set('Cookie', adminCookie);

    expect(res.status).toBe(200);
    expect(res.body.expiringSoon).toBeDefined();
    expect(res.body.depleted).toBeDefined();
    // Package with 365 days should NOT be in expiringSoon
    expect(res.body.expiringSoon).toHaveLength(0);
    expect(res.body.depleted).toHaveLength(0);
  });
});
