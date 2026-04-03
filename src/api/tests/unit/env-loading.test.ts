import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createEmailService } from '../../src/services/email.js';
import { loadApiEnvironment } from '../../src/config/env.js';

const logger = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
};

const tempRoots: string[] = [];

function createTempProject(envLines: string[]) {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'djtraining-env-'));
  const apiDir = path.join(rootDir, 'src', 'api');
  fs.mkdirSync(apiDir, { recursive: true });
  fs.writeFileSync(path.join(rootDir, '.env'), `${envLines.join('\n')}\n`, 'utf8');
  tempRoots.push(rootDir);
  return { rootDir, apiDir };
}

describe('API environment loading', () => {
  afterEach(() => {
    vi.clearAllMocks();

    while (tempRoots.length > 0) {
      const rootDir = tempRoots.pop();
      if (rootDir) {
        fs.rmSync(rootDir, { recursive: true, force: true });
      }
    }
  });

  it('should load SMTP settings from the repository root .env for verification emails', async () => {
    // Validates: specs/frd-auth.md registration flow + specs/increment-plan.md sec-017
    const { apiDir } = createTempProject([
      'APP_URL=http://localhost:3001',
      'API_URL=http://localhost:5001',
      'SMTP_HOST=smtp.example.com',
      'SMTP_PORT=465',
      'SMTP_USER=mailer@example.com',
      'SMTP_PASS=app-password',
      'EMAIL_FROM=mailer@example.com',
    ]);

    const env = {} as NodeJS.ProcessEnv;
    const sendMail = vi.fn();
    const createTransport = vi.fn(() => ({ sendMail }));

    loadApiEnvironment({ cwd: apiDir, env });

    const emailService = createEmailService(env, {
      logger,
      createTransport: createTransport as typeof createTransport,
    });

    await emailService.sendVerificationEmail('user@example.com', 'verification-token');

    expect(createTransport).toHaveBeenCalledWith(expect.objectContaining({
      host: 'smtp.example.com',
      port: 465,
      auth: {
        user: 'mailer@example.com',
        pass: 'app-password',
      },
    }));
    expect(sendMail).toHaveBeenCalled();
  });

  it('should load Google OAuth settings from the repository root .env when starting from src/api', () => {
    // Validates: specs/frd-auth.md login flow + specs/increment-plan.md sec-001/sec-004
    const { apiDir } = createTempProject([
      'APP_URL=http://localhost:3001',
      'API_URL=http://localhost:5001',
      'GOOGLE_CLIENT_ID=test-client.apps.googleusercontent.com',
      'GOOGLE_CLIENT_SECRET=test-client-secret',
      'JWT_SECRET=test-jwt-secret',
    ]);

    const env = {} as NodeJS.ProcessEnv;

    loadApiEnvironment({ cwd: apiDir, env });

    expect(env.GOOGLE_CLIENT_ID).toBe('test-client.apps.googleusercontent.com');
    expect(env.GOOGLE_CLIENT_SECRET).toBe('test-client-secret');
    expect(env.API_URL).toBe('http://localhost:5001');
  });

  it('should not override explicitly provided runtime env values with local .env defaults', () => {
    const { apiDir } = createTempProject([
      'GOOGLE_CLIENT_ID=checked-in-default',
      'SMTP_HOST=checked-in-smtp.example.com',
    ]);

    const env = {
      GOOGLE_CLIENT_ID: 'runtime-client-id',
      SMTP_HOST: 'runtime-smtp.example.com',
    } as NodeJS.ProcessEnv;

    loadApiEnvironment({ cwd: apiDir, env });

    expect(env.GOOGLE_CLIENT_ID).toBe('runtime-client-id');
    expect(env.SMTP_HOST).toBe('runtime-smtp.example.com');
  });
});
