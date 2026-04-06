import nodemailer from 'nodemailer';
import { logger } from '../logger.js';

export interface EmailService {
  sendVerificationEmail(email: string, token: string): Promise<void>;
}

interface LoggerLike {
  debug: (obj: object, msg: string) => void;
  info: (obj: object, msg: string) => void;
  warn: (obj: object, msg: string) => void;
}

interface EmailServiceDeps {
  logger: LoggerLike;
  createTransport: typeof nodemailer.createTransport;
}

interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
}

type EmailDeliveryMode = 'auto' | 'smtp' | 'stub';

function isLoopbackHostname(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
}

function isLocalRuntime(env: NodeJS.ProcessEnv): boolean {
  const appUrl = env.APP_URL;
  const apiUrl = env.API_URL;

  if (!appUrl || !apiUrl) {
    return false;
  }

  try {
    return isLoopbackHostname(new URL(appUrl).hostname) && isLoopbackHostname(new URL(apiUrl).hostname);
  } catch {
    return false;
  }
}

function getSmtpConfig(env: NodeJS.ProcessEnv): SmtpConfig | null {
  const host = env.SMTP_HOST;
  const port = env.SMTP_PORT;
  const user = env.SMTP_USER;
  const pass = env.SMTP_PASS;
  const from = env.EMAIL_FROM;

  const anyConfigured = [host, port, user, pass, from].some(Boolean);
  if (!anyConfigured) {
    return null;
  }

  if (!host || !port || !user || !pass || !from) {
    throw new Error('SMTP email configuration is incomplete');
  }

  const parsedPort = Number(port);
  if (!Number.isInteger(parsedPort) || parsedPort <= 0) {
    throw new Error('SMTP_PORT must be a positive integer');
  }

  return { host, port: parsedPort, user, pass, from };
}

function getEmailDeliveryMode(env: NodeJS.ProcessEnv): EmailDeliveryMode {
  const mode = env.EMAIL_DELIVERY_MODE;
  if (!mode) {
    return 'auto';
  }

  if (mode === 'auto' || mode === 'smtp' || mode === 'stub') {
    return mode;
  }

  throw new Error('EMAIL_DELIVERY_MODE must be one of: auto, smtp, stub');
}

export function createEmailService(
  env: NodeJS.ProcessEnv = process.env,
  deps: EmailServiceDeps = {
    logger,
    createTransport: nodemailer.createTransport,
  }
): EmailService {
  const baseUrl = env.APP_URL || 'http://localhost:3101';

  return {
    async sendVerificationEmail(email: string, token: string): Promise<void> {
      const verificationUrl = `${baseUrl}/auth/verify?token=${token}`;
      const deliveryMode = getEmailDeliveryMode(env);
      const isTestHarness = env.NODE_ENV === 'test';
      const logVerificationUrls = env.EMAIL_LOG_VERIFICATION_URLS === 'true';
      const localRuntime = isLocalRuntime(env);
      const smtpConfig = getSmtpConfig(env);

      if (deliveryMode === 'stub' || (deliveryMode === 'auto' && isTestHarness)) {
        deps.logger.info(
          { email, deliveryMode, testHarness: isTestHarness },
          'Verification email suppressed in stub mode. Account remains pending until verified.'
        );
        return;
      }

      if (!smtpConfig) {
        if (logVerificationUrls && localRuntime) {
          deps.logger.debug(
            { email, verificationUrl },
            'STUB: Verification email — use this URL to confirm manually'
          );
        } else if (logVerificationUrls && !localRuntime) {
          deps.logger.warn(
            { email },
            'EMAIL_LOG_VERIFICATION_URLS was ignored because verification URL logging is restricted to local runtimes.'
          );
        }
        deps.logger.info(
          { email },
          'STUB: Verification email would be sent. Account remains pending until verified.'
        );
        return;
      }

      const transport = deps.createTransport({
        host: smtpConfig.host,
        port: smtpConfig.port,
        secure: smtpConfig.port === 465,
        auth: {
          user: smtpConfig.user,
          pass: smtpConfig.pass,
        },
      });

      await transport.sendMail({
        from: smtpConfig.from,
        to: email,
        subject: 'Bitte bestätige deine E-Mail-Adresse',
        text: [
          'Willkommen bei DJ Training.',
          '',
          'Bitte bestätige deine E-Mail-Adresse über diesen Link:',
          verificationUrl,
          '',
          'Wenn du dich nicht registriert hast, kannst du diese E-Mail ignorieren.',
        ].join('\n'),
        html: `
        <p>Willkommen bei DJ Training.</p>
        <p>Bitte bestätige deine E-Mail-Adresse über diesen Link:</p>
        <p><a href="${verificationUrl}">${verificationUrl}</a></p>
        <p>Wenn du dich nicht registriert hast, kannst du diese E-Mail ignorieren.</p>
      `,
      });

      deps.logger.info({ email }, 'Verification email sent');
    },
  };
}

/**
 * SMTP-backed verification email service with a stub fallback for local/test use.
 */
export const emailService: EmailService = createEmailService();
