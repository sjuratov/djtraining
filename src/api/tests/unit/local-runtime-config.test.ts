import fs from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { createEmailService } from '../../src/services/email.js';

const originalEnv = { ...process.env };
const repoRoot = path.resolve(process.cwd(), '..', '..');

const logger = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
};

function restoreProcessEnv() {
  for (const key of Object.keys(process.env)) {
    if (!(key in originalEnv)) {
      delete process.env[key];
    }
  }

  Object.assign(process.env, originalEnv);
}

function readRepoFile(relativePath: string): string {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

describe('local runtime config rebase', () => {
  afterEach(() => {
    vi.clearAllMocks();
    restoreProcessEnv();
  });

  it('should declare the rebased default web origin in the API runtime config', () => {
    expect(readRepoFile('src/api/src/app.ts')).toContain("process.env.APP_URL || 'http://localhost:3001'");
  });

  it('should default Google auth callback redirects to the rebased web URL when APP_URL is not set', async () => {
    delete process.env.APP_URL;

    const app = createApp();

    const res = await request(app)
      .get('/api/auth/google/callback?state=local-state')
      .set('Cookie', ['oauth_state=local-state']);

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('http://localhost:3001/login?error=google_failed');
  });

  it('should default verification email links to the rebased web URL when APP_URL is not set', async () => {
    delete process.env.APP_URL;

    const sendMailMock = vi.fn();
    const createTransportMock = vi.fn(() => ({ sendMail: sendMailMock }));
    const emailService = createEmailService(
      {
        API_URL: 'http://localhost:5001',
        SMTP_HOST: 'smtp.example.com',
        SMTP_PORT: '465',
        SMTP_USER: 'mailer@example.com',
        SMTP_PASS: 'secret',
        EMAIL_FROM: 'mailer@example.com',
      },
      {
        logger,
        createTransport: createTransportMock as typeof createTransportMock,
      }
    );

    await emailService.sendVerificationEmail('deliver@example.com', 'rebase-token');

    expect(sendMailMock).toHaveBeenCalledWith(expect.objectContaining({
      text: expect.stringContaining('http://localhost:3001/auth/verify?token=rebase-token'),
      html: expect.stringContaining('http://localhost:3001/auth/verify?token=rebase-token'),
    }));
  });

  it('should align local tooling defaults with the rebased web and API URLs', () => {
    expect(readRepoFile('src/api/src/index.ts')).toContain("process.env.PORT || '5101'");
    expect(readRepoFile('src/api/src/routes/auth.ts')).toContain("process.env.APP_URL || 'http://localhost:3001'");
    expect(readRepoFile('src/api/src/services/email.ts')).toContain("env.APP_URL || 'http://localhost:3001'");

    expect(readRepoFile('src/web/next.config.ts')).toContain("http://localhost:5001");
    expect(readRepoFile('src/web/src/app/hooks/useChat.ts')).toContain("http://localhost:5001");
    expect(readRepoFile('src/web/src/app/kontakt/page.tsx')).toContain("http://localhost:5001");

    expect(readRepoFile('e2e/playwright.config.ts')).toContain("http://localhost:3001");
    expect(readRepoFile('e2e/fixtures.ts')).toContain("replace(':3001', ':5001')");
    expect(readRepoFile('tests/features/support/hooks.ts')).toContain("const WEB_URL = process.env.WEB_URL || 'http://localhost:3001'");
    expect(readRepoFile('tests/features/support/hooks.ts')).toContain("const API_URL = process.env.API_URL || 'http://localhost:5001'");
    expect(readRepoFile('tests/features/support/world.ts')).toContain("apiBaseUrl = 'http://localhost:5001'");
    expect(readRepoFile('tests/features/support/world.ts')).toContain("webBaseUrl = 'http://localhost:3001'");
  });

  it('should document that local runtime wiring must target the rebased URLs without a silent fallback', () => {
    const envSource = readRepoFile('src/api/src/config/env.ts');

    expect(envSource).toContain('throw new Error');
    expect(envSource).toContain('APP_URL');
    expect(envSource).toContain('API_URL');
  });

  it('should move the docs dev script to a local port higher than 8000', () => {
    const packageJson = JSON.parse(readRepoFile('package.json')) as { scripts: Record<string, string> };
    const docsScript = packageJson.scripts['dev:docs'];
    const portMatch = docsScript.match(/0\.0\.0\.0:(\d+)/);

    expect(portMatch).not.toBeNull();
    expect(Number(portMatch?.[1])).toBeGreaterThan(8000);
  });
});
