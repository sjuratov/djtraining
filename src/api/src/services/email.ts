import { logger } from '../logger.js';

export interface EmailService {
  sendVerificationEmail(email: string, token: string): Promise<void>;
}

const BASE_URL = process.env.APP_URL || 'http://localhost:3001';

/**
 * Stub email service — logs the verification URL instead of sending.
 * 
 * DEV-ONLY BEHAVIOR: The auth.ts register endpoint auto-confirms users
 * when this stub is active. When connecting a real email provider (e.g., Resend),
 * remove the `activateUser(user.id)` call in auth.ts register handler
 * so users must verify via email before logging in.
 * 
 * Replace with Resend/SMTP implementation for production.
 */
export const emailService: EmailService = {
  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const verificationUrl = `${BASE_URL}/auth/verify?token=${token}`;
    
    // Log at debug level to prevent token leakage in production logs
    logger.debug(
      { email, verificationUrl },
      'STUB: Verification email — use this URL to confirm manually'
    );
    logger.info(
      { email },
      'STUB: Verification email would be sent. User will be auto-confirmed in dev mode.'
    );
  },
};
