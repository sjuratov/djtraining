import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';

const app = createApp();

async function createUserAndLogin(
  email: string,
  opts: { displayName?: string; password?: string; role?: string } = {},
): Promise<string[]> {
  const password = opts.password ?? 'SecurePass123!';
  await request(app).post('/api/test/create-user').send({
    email,
    displayName: opts.displayName ?? email,
    password,
    role: opts.role,
  });
  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ email, password });
  return loginRes.headers['set-cookie'] as unknown as string[];
}

describe('GET /api/profile', () => {
  beforeEach(async () => {
    await request(app).post('/api/test/reset');
  });

  it('should return default empty profile for new user', async () => {
    const cookies = await createUserAndLogin('user@example.com');

    const res = await request(app)
      .get('/api/profile')
      .set('Cookie', cookies);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      firstName: '',
      lastName: '',
      phone: '',
      birthDate: null,
      gender: null,
      trainingGoal: null,
      experienceLevel: null,
      healthNotes: '',
      trainingType: null,
      sessionsPerWeek: null,
      preferredTimes: [],
    });
  });

  it('should return 401 without authentication', async () => {
    const res = await request(app).get('/api/profile');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Not authenticated');
  });
});

describe('PUT /api/profile', () => {
  beforeEach(async () => {
    await request(app).post('/api/test/reset');
  });

  it('should update profile with valid data and return updated profile', async () => {
    const cookies = await createUserAndLogin('user@example.com');

    const profileData = {
      firstName: 'Max',
      lastName: 'Mustermann',
      phone: '+49 123 456789',
      birthDate: '1990-05-15',
      gender: 'männlich',
      trainingGoal: 'muskelaufbau',
      experienceLevel: 'fortgeschritten',
      healthNotes: 'Keine Einschränkungen',
      trainingType: 'personal',
      sessionsPerWeek: 3,
      preferredTimes: ['morgens', 'abends'],
    };

    const res = await request(app)
      .put('/api/profile')
      .set('Cookie', cookies)
      .send(profileData);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Profil aktualisiert');
    expect(res.body.profile).toEqual(profileData);
  });

  it('should update partial profile (only some fields)', async () => {
    const cookies = await createUserAndLogin('user@example.com');

    const res = await request(app)
      .put('/api/profile')
      .set('Cookie', cookies)
      .send({ firstName: 'Anna', trainingGoal: 'fitness' });

    expect(res.status).toBe(200);
    expect(res.body.profile.firstName).toBe('Anna');
    expect(res.body.profile.trainingGoal).toBe('fitness');
    // Unset fields retain defaults
    expect(res.body.profile.lastName).toBe('');
    expect(res.body.profile.gender).toBeNull();
  });

  it('should reject invalid gender', async () => {
    const cookies = await createUserAndLogin('user@example.com');

    const res = await request(app)
      .put('/api/profile')
      .set('Cookie', cookies)
      .send({ gender: 'invalid' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Geschlecht/);
  });

  it('should reject invalid trainingGoal', async () => {
    const cookies = await createUserAndLogin('user@example.com');

    const res = await request(app)
      .put('/api/profile')
      .set('Cookie', cookies)
      .send({ trainingGoal: 'invalid' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Trainingsziel/);
  });

  it('should reject invalid experienceLevel', async () => {
    const cookies = await createUserAndLogin('user@example.com');

    const res = await request(app)
      .put('/api/profile')
      .set('Cookie', cookies)
      .send({ experienceLevel: 'invalid' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Erfahrungslevel/);
  });

  it('should reject invalid trainingType', async () => {
    const cookies = await createUserAndLogin('user@example.com');

    const res = await request(app)
      .put('/api/profile')
      .set('Cookie', cookies)
      .send({ trainingType: 'invalid' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Trainingsart/);
  });

  it('should reject sessionsPerWeek of 0', async () => {
    const cookies = await createUserAndLogin('user@example.com');

    const res = await request(app)
      .put('/api/profile')
      .set('Cookie', cookies)
      .send({ sessionsPerWeek: 0 });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Trainingseinheiten/);
  });

  it('should reject sessionsPerWeek of 6 (max is 5)', async () => {
    const cookies = await createUserAndLogin('user@example.com');

    const res = await request(app)
      .put('/api/profile')
      .set('Cookie', cookies)
      .send({ sessionsPerWeek: 6 });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Trainingseinheiten/);
  });

  it('should reject non-integer sessionsPerWeek', async () => {
    const cookies = await createUserAndLogin('user@example.com');

    const res = await request(app)
      .put('/api/profile')
      .set('Cookie', cookies)
      .send({ sessionsPerWeek: 2.5 });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Trainingseinheiten/);
  });

  it('should reject invalid preferredTimes array values', async () => {
    const cookies = await createUserAndLogin('user@example.com');

    const res = await request(app)
      .put('/api/profile')
      .set('Cookie', cookies)
      .send({ preferredTimes: ['morgens', 'nachts'] });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/bevorzugte Zeiten/);
  });

  it('should reject invalid birthDate string', async () => {
    const cookies = await createUserAndLogin('user@example.com');

    const res = await request(app)
      .put('/api/profile')
      .set('Cookie', cookies)
      .send({ birthDate: 'not-a-date' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Geburtsdatum/);
  });

  it('should return 401 without authentication', async () => {
    const res = await request(app)
      .put('/api/profile')
      .send({ firstName: 'Test' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Not authenticated');
  });
});

describe('GET /api/admin/users/:userId/profile', () => {
  beforeEach(async () => {
    await request(app).post('/api/test/reset');
  });

  it('should allow admin to view any user profile', async () => {
    // First user becomes admin
    const adminCookies = await createUserAndLogin('admin@example.com', {
      displayName: 'Admin',
    });

    // Second user is regular
    const userCookies = await createUserAndLogin('member@example.com', {
      displayName: 'Member',
    });

    // Member updates their profile
    await request(app)
      .put('/api/profile')
      .set('Cookie', userCookies)
      .send({ firstName: 'Erika', trainingGoal: 'abnehmen' });

    // Get member's userId via admin user list
    const usersRes = await request(app)
      .get('/api/admin/users')
      .set('Cookie', adminCookies);

    const memberEntry = usersRes.body.find(
      (u: { email: string }) => u.email === 'member@example.com',
    );
    expect(memberEntry).toBeDefined();

    const res = await request(app)
      .get(`/api/admin/users/${memberEntry.id}/profile`)
      .set('Cookie', adminCookies);

    expect(res.status).toBe(200);
    expect(res.body.email).toBe('member@example.com');
    expect(res.body.profile.firstName).toBe('Erika');
    expect(res.body.profile.trainingGoal).toBe('abnehmen');
  });

  it('should return 403 for non-admin user', async () => {
    // First user becomes admin
    await createUserAndLogin('admin@example.com');

    // Second user is regular
    const userCookies = await createUserAndLogin('regular@example.com');

    const res = await request(app)
      .get('/api/admin/users/some-user-id/profile')
      .set('Cookie', userCookies);

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Forbidden');
  });

  it('should return 404 for non-existent userId', async () => {
    const adminCookies = await createUserAndLogin('admin@example.com');

    const res = await request(app)
      .get('/api/admin/users/non-existent-id/profile')
      .set('Cookie', adminCookies);

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Benutzer nicht gefunden');
  });

  it('should return 401 without authentication', async () => {
    const res = await request(app)
      .get('/api/admin/users/some-id/profile');

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Not authenticated');
  });
});
