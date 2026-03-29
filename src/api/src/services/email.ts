import { logger } from '../logger.js';

export interface EmailService {
  sendVerificationEmail(email: string, token: string): Promise<void>;
}

const BASE_URL = process.env.APP_URL || 'http://localhost:3001';

/**
 * Stub email service — logs the verification URL instead of sending.
 * Replace with Resend/SMTP implementation later.
 */
export const emailService: EmailService = {
  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const verificationUrl = `${BASE_URL}/auth/verify?token=${token}`;
    
    logger.info(
      { email, verificationUrl },
      'STUB: Verification email would be sent. Auto-confirming user.'
    );
    
    // In production, this would send an actual email via Resend/SMTP:
    // await resend.emails.send({
    //   from: 'DJ Training <noreply@dj-training.com>',
    //   to: email,
    //   subject: 'Bestätige deine E-Mail-Adresse — DJ\'s Training',
    //   html: `<p>Hallo! Klicke <a href="${verificationUrl}">hier</a> um deine E-Mail zu bestätigen.</p>`,
    // });
  },
};
