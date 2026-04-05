import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { getDb } from '../../src/db/database.js';
import { createUser, activateUser, setUserRole } from '../../src/models/user-store.js';
import { createTrainingType, createTemplate, generateSlots } from '../../src/services/schedule.js';
import { assignPackage, creditSession, getClientPackages } from '../../src/services/packages.js';
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

  it('should not credit a package beyond its purchased session total', async () => {
    // Validates: specs/frd-packages.md, Client View + Session Deduction
    const pkg = assignPackage({ userId: clientUserId, packageDefId: 'pkg-gruppe-20' });

    const credited = creditSession(pkg.id);

    expect(credited).toBeDefined();
    expect(credited!.remainingSessions).toBe(20);
    expect(credited!.totalSessions).toBe(20);
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

  it('should reject booking without active package', async () => {
    // No package assigned
    const { slot } = createFutureSlot();

    const res = await request(app)
      .post('/api/bookings')
      .set('Cookie', clientCookie)
      .send({ timeSlotId: slot.id });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('NO_ELIGIBLE_PACKAGE');
    expect(res.body.error).toContain('Kein aktives Abo');
  });

  it('should allow booking again when admin grants grace on an expired package', async () => {
    const pkg = assignPackage({ userId: clientUserId, packageDefId: 'pkg-personal-1' });
    const db = getDb();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    db.prepare('UPDATE client_packages SET expires_at = ? WHERE id = ?').run(yesterday, pkg.id);

    const { slot } = createFutureSlot();

    const failedBooking = await request(app)
      .post('/api/bookings')
      .set('Cookie', clientCookie)
      .send({ timeSlotId: slot.id });

    expect(failedBooking.status).toBe(409);
    expect(failedBooking.body.code).toBe('NO_ELIGIBLE_PACKAGE');

    const graceUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const graceRes = await request(app)
      .put(`/api/admin/packages/${pkg.id}/grace`)
      .set('Cookie', adminCookie)
      .send({ graceUntil, reason: 'Kulanz nach Ferienabwesenheit' });

    expect(graceRes.status).toBe(200);
    expect(graceRes.body.graceUntil).toBeDefined();
    expect(graceRes.body.effectiveExpiresAt).toBe(graceRes.body.graceUntil);
    expect(graceRes.body.isBookable).toBe(true);

    const successfulBooking = await request(app)
      .post('/api/bookings')
      .set('Cookie', clientCookie)
      .send({ timeSlotId: slot.id });

    expect(successfulBooking.status).toBe(201);
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

  it('should expose reminder metadata for packages nearing expiry', async () => {
    const db = getDb();
    const pkg = assignPackage({ userId: clientUserId, packageDefId: 'pkg-personal-20' });
    const soon = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();
    db.prepare('UPDATE client_packages SET expires_at = ? WHERE id = ?').run(soon, pkg.id);

    const res = await request(app)
      .get('/api/packages')
      .set('Cookie', clientCookie);

    expect(res.status).toBe(200);
    expect(res.body[0].isExpiringSoon).toBe(true);
    expect(res.body[0].daysUntilExpiry).toBeLessThanOrEqual(5);
    expect(res.body[0].effectiveExpiresAt).toBe(soon);
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

  it('should reject positive adjustment beyond the purchased session total', async () => {
    // Validates: specs/frd-packages.md, Client View + Admin Adjustment corrections
    const pkg = assignPackage({ userId: clientUserId, packageDefId: 'pkg-personal-20' });

    const res = await request(app)
      .put(`/api/admin/packages/${pkg.id}/adjust`)
      .set('Cookie', adminCookie)
      .send({ delta: 2, reason: 'Correction' });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('maximal');
  });

  it('should require a reason when extending package grace', async () => {
    const pkg = assignPackage({ userId: clientUserId, packageDefId: 'pkg-personal-20' });
    const res = await request(app)
      .put(`/api/admin/packages/${pkg.id}/grace`)
      .set('Cookie', adminCookie)
      .send({ graceUntil: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), reason: '' });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Grund');
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

  it('should highlight packages within the 14-day reminder window', async () => {
    const createRes = await request(app)
      .post('/api/admin/package-definitions')
      .set('Cookie', adminCookie)
      .send({
        name: '10 Tage Testpaket',
        trainingCategory: 'gruppe',
        totalSessions: 10,
        priceChf: 25000,
        validityDays: 10,
      });

    expect(createRes.status).toBe(201);

    const assignRes = await request(app)
      .post(`/api/admin/users/${clientUserId}/packages`)
      .set('Cookie', adminCookie)
      .send({ packageDefId: createRes.body.id });

    expect(assignRes.status).toBe(201);

    const res = await request(app)
      .get('/api/admin/packages/overview')
      .set('Cookie', adminCookie);

    expect(res.status).toBe(200);
    expect(res.body.expiringSoon).toHaveLength(1);
    expect(res.body.expiringSoon[0].userId).toBe(clientUserId);
    expect(res.body.expiringSoon[0].isExpiringSoon).toBe(true);
  });
});
