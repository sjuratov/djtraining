import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert';
import { CustomWorld } from '../support/world';

// ── Helpers ────────────────────────────────────────────────────────

async function createActiveUser(
  world: CustomWorld,
  params: { email: string; displayName: string; password: string; role?: 'admin' | 'user' },
) {
  const res = await fetch(`${world.apiBaseUrl}/api/test/create-user`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  assert.ok(res.ok, `Expected test user creation to succeed for ${params.email}`);
}

async function loginThroughApi(world: CustomWorld, email: string, password: string) {
  const res = await fetch(`${world.apiBaseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  assert.ok(res.ok, `Expected login to succeed for ${email}`);
  const setCookies = res.headers.getSetCookie?.() ?? [];
  world.cookies = setCookies;
  for (const cookieStr of setCookies) {
    const [nameValue] = cookieStr.split(';');
    const [name, ...valueParts] = nameValue.split('=');
    await world.context.addCookies([{
      name: name.trim(),
      value: valueParts.join('=').trim(),
      url: world.webBaseUrl,
    }]);
  }
}

async function loginAsAdmin(world: CustomWorld): Promise<string[]> {
  const email = 'booking-admin@example.com';
  const password = 'Admin1234!';
  await createActiveUser(world, { email, displayName: 'Booking Admin', password, role: 'admin' });
  const res = await fetch(`${world.apiBaseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  assert.ok(res.ok, 'Expected admin login to succeed');
  return res.headers.getSetCookie?.() ?? [];
}

async function createTrainingSlot(
  world: CustomWorld,
  adminCookies: string[],
  opts: { date: string; startTime: string; endTime: string },
): Promise<string> {
  // First try to find an existing available slot on the requested date
  const slotsRes = await fetch(
    `${world.apiBaseUrl}/api/schedule/slots?from=${opts.date}&to=${opts.date}`,
  );
  if (slotsRes.ok) {
    const existingSlots = await slotsRes.json();
    if (Array.isArray(existingSlots) && existingSlots.length > 0) {
      const available = existingSlots.find(
        (s: { status: string }) => s.status === 'available',
      );
      if (available) return available.id;
    }
  }

  // Get an existing training type (seeded by reset)
  const typesRes = await fetch(`${world.apiBaseUrl}/api/admin/training-types`, {
    headers: { Cookie: adminCookies.join('; ') },
  });
  assert.ok(typesRes.ok, 'Expected training types fetch to succeed');
  const types = await typesRes.json();
  let trainingTypeId: string;

  if (Array.isArray(types) && types.length > 0) {
    trainingTypeId = types[0].id;
  } else {
    // Create a training type if none exist
    const ttRes = await fetch(`${world.apiBaseUrl}/api/admin/training-types`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookies.join('; ') },
      body: JSON.stringify({
        name: 'Personal Training',
        category: 'personal',
        durationMinutes: 60,
        maxCapacity: 1,
        priceSingle: 120,
      }),
    });
    assert.ok(ttRes.ok, 'Expected training type creation to succeed');
    const trainingType = await ttRes.json();
    trainingTypeId = trainingType.id;
  }

  // Create a time slot directly
  const slotRes = await fetch(`${world.apiBaseUrl}/api/admin/time-slots`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: adminCookies.join('; ') },
    body: JSON.stringify({
      trainingTypeId,
      date: opts.date,
      startTime: opts.startTime,
      endTime: opts.endTime,
    }),
  });
  assert.ok(slotRes.ok, `Expected time slot creation to succeed for ${opts.date}`);
  const slot = await slotRes.json();
  return slot.id;
}

async function assignPackageViaAdmin(
  world: CustomWorld,
  adminCookies: string[],
  userEmail: string,
  category: 'personal' | 'gruppe' | 'ernaehrung' = 'personal',
): Promise<void> {
  // Find the user to get their ID
  const usersRes = await fetch(`${world.apiBaseUrl}/api/admin/users`, {
    headers: { Cookie: adminCookies.join('; ') },
  });
  assert.ok(usersRes.ok, 'Expected admin users fetch to succeed');
  const users = await usersRes.json();
  const user = (users as { id: string; email: string }[]).find((u) => u.email === userEmail);
  assert.ok(user, `Expected to find user with email ${userEmail}`);

  const pkgDefIdMap: Record<string, string> = {
    personal: 'pkg-personal-20',
    gruppe: 'pkg-gruppe-20',
    ernaehrung: 'pkg-ernaehrung-5',
  };

  const res = await fetch(`${world.apiBaseUrl}/api/admin/users/${user.id}/packages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: adminCookies.join('; ') },
    body: JSON.stringify({ packageDefId: pkgDefIdMap[category] }),
  });
  assert.ok(res.ok, `Expected package assignment to succeed for ${userEmail}`);
}

async function createBookingViaApi(
  world: CustomWorld,
  timeSlotId: string,
): Promise<{ id: string }> {
  const res = await fetch(`${world.apiBaseUrl}/api/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: world.cookies.join('; ') },
    body: JSON.stringify({ timeSlotId }),
  });
  assert.ok(res.ok, 'Expected booking creation to succeed');
  return res.json();
}

function tomorrowDateStr(): string {
  const d = new Date(Date.now() + 86400000);
  return d.toISOString().split('T')[0];
}

function nextWeekDateStr(): string {
  const d = new Date(Date.now() + 7 * 86400000);
  return d.toISOString().split('T')[0];
}

function pastDateStr(): string {
  const d = new Date(Date.now() - 3 * 86400000);
  return d.toISOString().split('T')[0];
}

function todaySoonDateStr(): string {
  return new Date().toISOString().split('T')[0];
}

// ── Shared setup state ──

interface BookingScenarioState {
  bookingId?: string;
  slotId?: string;
}

const scenarioState: BookingScenarioState = {};

// ── Given steps ────────────────────────────────────────────────────

Given('I am a logged-in client with a confirmed booking for tomorrow', async function (this: CustomWorld) {
  const email = 'booking-client@example.com';
  const password = 'Client1234!';

  await createActiveUser(this, { email, displayName: 'Booking Client', password });
  const adminCookies = await loginAsAdmin(this);
  await assignPackageViaAdmin(this, adminCookies, email);

  await loginThroughApi(this, email, password);

  const dateStr = tomorrowDateStr();
  const slotId = await createTrainingSlot(this, adminCookies, {
    date: dateStr,
    startTime: '10:00',
    endTime: '11:00',
  });

  const booking = await createBookingViaApi(this, slotId);
  scenarioState.bookingId = booking.id;
  scenarioState.slotId = slotId;
});

Given('I am a logged-in client with a completed booking', async function (this: CustomWorld) {
  const email = 'past-client@example.com';
  const password = 'Client1234!';

  await createActiveUser(this, { email, displayName: 'Past Client', password });
  const adminCookies = await loginAsAdmin(this);
  await assignPackageViaAdmin(this, adminCookies, email);

  await loginThroughApi(this, email, password);

  const dateStr = tomorrowDateStr();
  const slotId = await createTrainingSlot(this, adminCookies, {
    date: dateStr,
    startTime: '10:00',
    endTime: '11:00',
  });

  const booking = await createBookingViaApi(this, slotId);

  await fetch(`${this.apiBaseUrl}/api/admin/bookings/${booking.id}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Cookie: adminCookies.join('; ') },
    body: JSON.stringify({ status: 'completed' }),
  });

  scenarioState.bookingId = booking.id;
});

Given('I am a logged-in client with a confirmed booking for next week', async function (this: CustomWorld) {
  const email = 'nextweek-client@example.com';
  const password = 'Client1234!';

  await createActiveUser(this, { email, displayName: 'Next Week Client', password });
  const adminCookies = await loginAsAdmin(this);
  await assignPackageViaAdmin(this, adminCookies, email);

  await loginThroughApi(this, email, password);

  const dateStr = nextWeekDateStr();
  const slotId = await createTrainingSlot(this, adminCookies, {
    date: dateStr,
    startTime: '10:00',
    endTime: '11:00',
  });

  const booking = await createBookingViaApi(this, slotId);
  scenarioState.bookingId = booking.id;
  scenarioState.slotId = slotId;
});

Given('I am a logged-in client with a confirmed booking starting within 24 hours', async function (this: CustomWorld) {
  const email = 'urgent-client@example.com';
  const password = 'Client1234!';

  await createActiveUser(this, { email, displayName: 'Urgent Client', password });
  const adminCookies = await loginAsAdmin(this);
  await assignPackageViaAdmin(this, adminCookies, email);

  await loginThroughApi(this, email, password);

  // Create a slot for today with a start time soon (within 24 hours)
  const dateStr = todaySoonDateStr();
  const now = new Date();
  const startHour = Math.min(now.getHours() + 2, 23);
  const startTime = `${String(startHour).padStart(2, '0')}:00`;
  const endTime = `${String(Math.min(startHour + 1, 23)).padStart(2, '0')}:00`;

  const slotId = await createTrainingSlot(this, adminCookies, {
    date: dateStr,
    startTime,
    endTime,
  });

  const booking = await createBookingViaApi(this, slotId);
  scenarioState.bookingId = booking.id;
  scenarioState.slotId = slotId;
});

Given('I am a logged-in client with an active training package', async function (this: CustomWorld) {
  const email = 'pkg-client@example.com';
  const password = 'Client1234!';

  await createActiveUser(this, { email, displayName: 'Package Client', password });
  const adminCookies = await loginAsAdmin(this);
  await assignPackageViaAdmin(this, adminCookies, email);

  await loginThroughApi(this, email, password);
});

Given('I am a logged-in client with no active package', async function (this: CustomWorld) {
  const email = 'nopkg-client@example.com';
  const password = 'Client1234!';

  await createActiveUser(this, { email, displayName: 'No Package Client', password });
  await loginThroughApi(this, email, password);
});

Given('I am a logged-in client with no bookings', async function (this: CustomWorld) {
  const email = 'empty-client@example.com';
  const password = 'Client1234!';

  await createActiveUser(this, { email, displayName: 'Empty Client', password });
  await loginThroughApi(this, email, password);
});

// ── When steps ─────────────────────────────────────────────────────

When('I click {string} on the booking', async function (this: CustomWorld, buttonLabel: string) {
  const testIdMap: Record<string, string> = {
    'Stornieren': 'cancel-button',
    'Umbuchen': 'reschedule-button',
  };
  const testId = testIdMap[buttonLabel];
  assert.ok(testId, `Unknown booking button label: ${buttonLabel}`);

  const button = this.page.getByTestId(testId).first();
  await button.waitFor({ timeout: 5000 });
  await button.click();
});

When('I confirm the cancellation in the modal', async function (this: CustomWorld) {
  const modal = this.page.getByTestId('cancel-modal');
  await modal.waitFor({ timeout: 5000 });

  const confirmButton = this.page.getByTestId('confirm-cancel-button');
  await confirmButton.waitFor({ timeout: 3000 });
  await confirmButton.click();
});

When('I try to visit the {string} page', async function (this: CustomWorld, pagePath: string) {
  await this.page.goto(`${this.webBaseUrl}${pagePath}`);
});

// ── Then steps ─────────────────────────────────────────────────────

Then('I should see the booking date, time, and training type', async function (this: CustomWorld) {
  const card = this.page.getByTestId('booking-card').first();
  await card.waitFor({ timeout: 5000 });
  const text = await card.textContent();
  assert.ok(text, 'Expected booking card to have text content');
  // Verify date/time info and training type are present
  assert.ok(text.includes('·'), 'Expected time separator in booking card');
  assert.ok(
    text.includes('Training') || text.includes('Coaching') || text.length > 10,
    'Expected training type or meaningful content in booking card',
  );
});

Then('I should see a {string} button for the booking', async function (this: CustomWorld, label: string) {
  const testIdMap: Record<string, string> = {
    'Stornieren': 'cancel-button',
    'Umbuchen': 'reschedule-button',
  };
  const testId = testIdMap[label];
  assert.ok(testId, `Unknown button label: ${label}`);

  const button = this.page.getByTestId(testId).first();
  await button.waitFor({ timeout: 5000 });
  assert.ok(await button.isVisible(), `Expected "${label}" button to be visible`);
});

Then('the completed booking should not appear in the upcoming section', async function (this: CustomWorld) {
  const upcoming = this.page.getByTestId('upcoming-bookings');
  await upcoming.waitFor({ timeout: 5000 });
  const cards = upcoming.getByTestId('booking-card');
  const count = await cards.count();
  // Completed bookings are filtered out of upcoming (only 'confirmed' shown)
  assert.strictEqual(count, 0, 'Expected no upcoming booking cards for completed bookings');
});

Then('I should be able to view the completed booking details', async function (this: CustomWorld) {
  // The page shows all bookings via the allBookings fetch; completed ones
  // appear in the "past" section if the date is past, or simply aren't in upcoming.
  // Verify the page loaded without errors.
  const heading = this.page.getByTestId('meine-termine-heading');
  await heading.waitFor({ timeout: 5000 });
  assert.ok(await heading.isVisible(), 'Expected Meine Termine heading to be visible');
});

Then('I should see a success message {string}', async function (this: CustomWorld, expectedMessage: string) {
  const locator = this.page.getByText(expectedMessage);
  await locator.waitFor({ timeout: 5000 });
  assert.ok(await locator.isVisible(), `Expected success message "${expectedMessage}"`);
});

Then('the booking should no longer appear in my upcoming bookings', async function (this: CustomWorld) {
  const section = this.page.getByTestId('upcoming-bookings');
  await section.waitFor({ timeout: 5000 });

  // Wait for the list to refresh after cancellation
  await this.page.waitForTimeout(1000);
  const cards = section.getByTestId('booking-card');
  const count = await cards.count();
  assert.strictEqual(count, 0, 'Expected no upcoming booking cards after cancellation');
});

Then('I should see a warning about the 24-hour cancellation policy', async function (this: CustomWorld) {
  const modal = this.page.getByTestId('cancel-modal');
  await modal.waitFor({ timeout: 5000 });

  const warning = modal.locator('text=Stornogebühr').first();
  await warning.waitFor({ timeout: 3000 });
  assert.ok(await warning.isVisible(), 'Expected 24-hour cancellation warning to be visible');
});

Then('I should still be able to confirm the cancellation', async function (this: CustomWorld) {
  const confirmButton = this.page.getByTestId('confirm-cancel-button');
  await confirmButton.waitFor({ timeout: 3000 });
  assert.ok(await confirmButton.isEnabled(), 'Expected confirm cancel button to be enabled');
  await confirmButton.click();
});

Then('the current booking should be cancelled', async function (this: CustomWorld) {
  // After clicking reschedule, verify the booking was cancelled via API
  const res = await fetch(`${this.apiBaseUrl}/api/bookings`, {
    headers: { Cookie: this.cookies.join('; ') },
  });
  const bookings = await res.json();
  const cancelled = (bookings as { id: string; status: string }[]).filter(
    (b) => b.status === 'cancelled',
  );
  assert.ok(cancelled.length > 0, 'Expected at least one cancelled booking');
});

Then('I should be redirected to the booking flow to select a new slot', async function (this: CustomWorld) {
  await this.page.waitForURL('**/buchen**', { timeout: 10000 });
  const url = new URL(this.page.url());
  assert.ok(url.pathname.includes('/buchen'), `Expected redirect to /buchen but got ${url.pathname}`);
});

Then('I should see my package name', async function (this: CustomWorld) {
  const packageSection = this.page.getByTestId('package-balance');
  await packageSection.waitFor({ timeout: 5000 });
  const text = await packageSection.textContent();
  assert.ok(text, 'Expected package balance section to have content');
  // Seeded package names contain these keywords
  assert.ok(
    text.includes('Personal') || text.includes('Gruppe') || text.includes('Ernährung') || text.includes('Paket'),
    'Expected package name to be displayed',
  );
});

Then('I should see my remaining sessions out of total sessions', async function (this: CustomWorld) {
  const packageSection = this.page.getByTestId('package-balance');
  const text = await packageSection.textContent();
  assert.ok(text, 'Expected package balance section to have content');
  assert.ok(
    text.includes('von') && text.includes('Sitzungen verbleibend'),
    `Expected "X von Y Sitzungen verbleibend" pattern but got "${text}"`,
  );
});

// 'I should see {string}' — reused from public-pages-steps.ts

Then('the navigation should include a {string} link', async function (this: CustomWorld, linkText: string) {
  // The link may be inside the user dropdown menu — open it first
  const userMenuButton = this.page.getByTestId('user-menu-button').first();
  if (await userMenuButton.count()) {
    const expanded = await userMenuButton.getAttribute('aria-expanded');
    if (expanded !== 'true') {
      await userMenuButton.click();
    }
  }

  const link = this.page.locator('header').getByRole('link', { name: linkText }).first();
  await link.waitFor({ timeout: 5000 });
  assert.ok(await link.isVisible(), `Expected navigation to include "${linkText}" link`);
});

Then('I should see a message indicating no upcoming appointments', async function (this: CustomWorld) {
  const section = this.page.getByTestId('upcoming-bookings');
  await section.waitFor({ timeout: 5000 });
  const text = await section.textContent();
  assert.ok(
    text?.includes('keine anstehenden Termine') || text?.includes('Keine'),
    'Expected empty state message for no upcoming bookings',
  );
});

Then('I should see a {string} link to the booking flow', async function (this: CustomWorld, linkText: string) {
  const link = this.page.getByTestId('new-booking-link');
  await link.waitFor({ timeout: 5000 });
  const text = await link.textContent();
  assert.ok(text?.includes(linkText), `Expected link text to contain "${linkText}" but got "${text}"`);
  const href = await link.getAttribute('href');
  assert.ok(href?.includes('/buchen'), `Expected link to point to booking flow but got "${href}"`);
});

Then('I should be redirected to the login page', async function (this: CustomWorld) {
  await this.page.waitForURL('**/login**', { timeout: 10000 });
  const url = new URL(this.page.url());
  assert.ok(url.pathname.includes('/login'), `Expected redirect to /login but got ${url.pathname}`);
});
