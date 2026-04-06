import { type Express } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import rateLimit from 'express-rate-limit';
import { getUserByEmail, getUserById, getUserByGoogleId, getUserByConfirmationToken, createUser, activateUser, deleteUser } from '../models/user-store.js';
import { authMiddleware } from '../middleware/auth.js';
import { emailService } from '../services/email.js';
import { logger } from '../logger.js';

const getSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET environment variable is required');
  return secret;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function shouldUseSecureCookies(req: { protocol?: string; get?: (name: string) => string | undefined }): boolean {
  if (process.env.NODE_ENV === 'test') {
    return true;
  }

  if (process.env.NODE_ENV === 'production') {
    return true;
  }

  const appUrl = process.env.APP_URL;
  const apiUrl = process.env.API_URL;
  if (appUrl?.startsWith('https://') || apiUrl?.startsWith('https://')) {
    return true;
  }

  const forwardedProto = req.get?.('x-forwarded-proto');
  return req.protocol === 'https' || forwardedProto === 'https';
}

function setAuthCookie(res: any, token: string) {
  const secure = shouldUseSecureCookies(res.req ?? {});
  res.cookie('token', token, {
    httpOnly: true,
    secure,
    sameSite: 'strict',
    path: '/',
    maxAge: 86400 * 1000,
  });
}

export function mapAuthEndpoints(app: Express): void {

  const isTest = process.env.NODE_ENV === 'test' || process.env.ENABLE_TEST_ROUTES === 'true';

  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isTest ? 1000 : 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Zu viele Anmeldeversuche. Bitte versuche es in 15 Minuten erneut.' },
  });

  const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: isTest ? 1000 : 3,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Zu viele Registrierungsversuche. Bitte versuche es in einer Stunde erneut.' },
  });

  const oauthLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isTest ? 1000 : 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Zu viele Anfragen. Bitte versuche es später erneut.' },
  });

  // REGISTER (local, email-based)
  app.post('/api/auth/register', registerLimiter, async (req, res) => {
    const { email, password, displayName } = req.body;

    // Validate email
    if (!email) { res.status(400).json({ error: 'E-Mail ist erforderlich' }); return; }
    if (!EMAIL_REGEX.test(email)) { res.status(400).json({ error: 'Ungültige E-Mail-Adresse' }); return; }

    // Validate password
    if (!password) { res.status(400).json({ error: 'Passwort ist erforderlich' }); return; }
    if (password.length < 8) { res.status(400).json({ error: 'Passwort muss mindestens 8 Zeichen lang sein' }); return; }

    // Validate displayName
    if (!displayName || displayName.trim().length < 2) { res.status(400).json({ error: 'Name muss mindestens 2 Zeichen lang sein' }); return; }

    // Check uniqueness
    if (getUserByEmail(email)) { res.status(409).json({ error: 'E-Mail-Adresse ist bereits registriert' }); return; }

    const passwordHash = await bcrypt.hash(password, 10);
    const confirmationToken = crypto.randomUUID();

    const user = createUser({
      email,
      displayName: displayName.trim(),
      passwordHash,
      authProvider: 'local',
      confirmationToken,
      googleId: null,
    });

    try {
      await emailService.sendVerificationEmail(email, confirmationToken);
    } catch (error) {
      deleteUser(user.id);
      logger.error({ err: error, email }, 'Failed to send verification email');
      res.status(500).json({ error: 'Bestätigungs-E-Mail konnte nicht gesendet werden. Bitte versuche es erneut.' });
      return;
    }

    res.status(201).json({
      message: 'Registrierung erfolgreich. Bitte bestätige deine E-Mail-Adresse.',
      role: user.role,
      verificationRequired: true,
    });
  });

  // VERIFY EMAIL
  app.get('/api/auth/verify/:token', (req, res) => {
    const user = getUserByConfirmationToken(req.params.token);
    if (!user) { res.status(400).json({ error: 'Ungültiger oder abgelaufener Bestätigungslink' }); return; }

    if (user.tokenExpiresAt && new Date(user.tokenExpiresAt) < new Date()) {
      res.status(400).json({ error: 'Bestätigungslink ist abgelaufen. Bitte registriere dich erneut.' });
      return;
    }

    activateUser(user.id);
    res.status(200).json({ message: 'E-Mail-Adresse erfolgreich bestätigt' });
  });

  // LOGIN (local, email-based)
  app.post('/api/auth/login', loginLimiter, async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) { res.status(400).json({ error: 'E-Mail und Passwort sind erforderlich' }); return; }

    const user = getUserByEmail(email);
    if (!user || !user.passwordHash) { res.status(401).json({ error: 'Ungültige Anmeldedaten' }); return; }

    if (user.status !== 'active') { res.status(403).json({ error: 'Bitte bestätige zuerst deine E-Mail-Adresse' }); return; }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) { res.status(401).json({ error: 'Ungültige Anmeldedaten' }); return; }

    const token = jwt.sign({ sub: user.id, email: user.email, role: user.role }, getSecret(), { expiresIn: '24h' });
    setAuthCookie(res, token);
    res.status(200).json({ message: 'Anmeldung erfolgreich' });
  });

  // GOOGLE OAUTH - redirect to Google
  app.get('/api/auth/google', oauthLimiter, (req, res) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) { res.status(500).json({ error: 'Google OAuth not configured' }); return; }

    const state = crypto.randomUUID();
    res.cookie('oauth_state', state, {
      httpOnly: true,
      secure: shouldUseSecureCookies(req),
      sameSite: 'lax',
      maxAge: 5 * 60 * 1000,
    });

    const apiBaseUrl = process.env.API_URL || `${req.protocol}://${req.get('host')}`;
    const redirectUri = encodeURIComponent(`${apiBaseUrl}/api/auth/google/callback`);
    const scope = encodeURIComponent('openid email profile');
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&access_type=offline&prompt=consent&state=${state}`;

    res.redirect(authUrl);
  });

  // GOOGLE OAUTH - callback
  app.get('/api/auth/google/callback', async (req, res) => {
    const { code, state } = req.query;
    const frontendUrl = process.env.APP_URL || 'http://localhost:3001';
    const expectedState = req.cookies?.oauth_state;

    if (!state || !expectedState || state !== expectedState) {
      res.clearCookie('oauth_state');
      res.redirect(`${frontendUrl}/login?error=invalid_state`);
      return;
    }
    res.clearCookie('oauth_state');

    if (!code) { res.redirect(`${frontendUrl}/login?error=google_failed`); return; }

    try {
      const clientId = process.env.GOOGLE_CLIENT_ID!;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
      const apiBaseUrl = process.env.API_URL || `${req.protocol}://${req.get('host')}`;
      const redirectUri = `${apiBaseUrl}/api/auth/google/callback`;

      // Exchange code for tokens
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code: code as string,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }),
      });

      if (!tokenRes.ok) {
        logger.error({ status: tokenRes.status }, 'Google token exchange failed');
        res.redirect(`${frontendUrl}/login?error=google_failed`);
        return;
      }

      const tokenData = await tokenRes.json() as { access_token: string };

      // Get user info from Google
      const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });

      if (!userInfoRes.ok) { res.redirect(`${frontendUrl}/login?error=google_failed`); return; }

      const googleUser = await userInfoRes.json() as { id: string; email: string; name: string };

      // Find or create user
      let user = getUserByGoogleId(googleUser.id);
      if (!user) {
        // Check if email already registered with local auth
        const existingByEmail = getUserByEmail(googleUser.email);
        if (existingByEmail) {
          // Link Google to existing account
          existingByEmail.googleId = googleUser.id;
          existingByEmail.authProvider = 'google';
          existingByEmail.status = 'active';
          existingByEmail.confirmationToken = null;
          user = existingByEmail;
        } else {
          user = createUser({
            email: googleUser.email,
            displayName: googleUser.name || googleUser.email,
            passwordHash: null,
            authProvider: 'google',
            confirmationToken: null,
            googleId: googleUser.id,
          });
        }
      }

      const jwtToken = jwt.sign({ sub: user.id, email: user.email, role: user.role }, getSecret(), { expiresIn: '24h' });
      setAuthCookie(res, jwtToken);
      res.redirect(frontendUrl);

    } catch (err) {
      logger.error({ err }, 'Google OAuth error');
      res.redirect(`${frontendUrl}/login?error=google_failed`);
    }
  });

  // LOGOUT
  app.post('/api/auth/logout', (req, res) => {
    res.cookie('token', '', {
      httpOnly: true,
      secure: shouldUseSecureCookies(req),
      sameSite: 'strict',
      path: '/',
      maxAge: 0,
    });
    res.status(200).json({ message: 'Abmeldung erfolgreich' });
  });

  // GET CURRENT USER
  app.get('/api/auth/me', authMiddleware, (req, res) => {
    const user = getUserById(req.user!.sub);
    if (!user) { res.status(401).json({ error: 'Nicht authentifiziert' }); return; }
    res.status(200).json({
      sub: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      authProvider: user.authProvider,
      createdAt: user.createdAt,
    });
  });
}
