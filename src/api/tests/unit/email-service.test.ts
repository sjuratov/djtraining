import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createEmailService } from '../../src/services/email.js';

const sendMailMock = vi.fn();
const createTransportMock = vi.fn(() => ({ sendMail: sendMailMock }));
const logger = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
};

describe('emailService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not emit verification tokens in production-like stub logs', async () => {
    const emailService = createEmailService(
      {
        APP_URL: 'https://app.example.com',
        API_URL: 'https://api.example.com',
      },
      {
        logger,
        createTransport: createTransportMock as typeof createTransportMock,
      }
    );

    await emailService.sendVerificationEmail('user@example.com', 'secret-token');

    expect(logger.debug).not.toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledWith(
      { email: 'user@example.com' },
      'STUB: Verification email would be sent. Account remains pending until verified.'
    );
    expect(JSON.stringify(logger.info.mock.calls)).not.toContain('secret-token');
  });

  it('should allow explicit local-only verification URL diagnostics', async () => {
    const emailService = createEmailService(
      {
        APP_URL: 'http://localhost:3001',
        API_URL: 'http://localhost:5001',
        EMAIL_LOG_VERIFICATION_URLS: 'true',
      },
      {
        logger,
        createTransport: createTransportMock as typeof createTransportMock,
      }
    );

    await emailService.sendVerificationEmail('local@example.com', 'local-token');

    expect(logger.debug).toHaveBeenCalledWith(
      {
        email: 'local@example.com',
        verificationUrl: 'http://localhost:3001/auth/verify?token=local-token',
      },
      'STUB: Verification email — use this URL to confirm manually'
    );
  });

  it('should build the verification URL for SMTP delivery without logging it', async () => {
    const emailService = createEmailService(
      {
        APP_URL: 'https://app.example.com',
        API_URL: 'https://api.example.com',
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

    await emailService.sendVerificationEmail('deliver@example.com', 'smtp-token');

    expect(createTransportMock).toHaveBeenCalled();
    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'deliver@example.com',
        text: expect.stringContaining('https://app.example.com/auth/verify?token=smtp-token'),
        html: expect.stringContaining('https://app.example.com/auth/verify?token=smtp-token'),
      })
    );
    expect(JSON.stringify(logger.info.mock.calls)).not.toContain('smtp-token');
    expect(JSON.stringify(logger.debug.mock.calls)).not.toContain('smtp-token');
  });
});
