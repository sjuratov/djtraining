import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import { logger } from './logger.js';
import { mapHealthEndpoints } from './routes/health.js';
import { mapChatEndpoints } from './routes/chat.js';
import { mapAuthEndpoints } from './routes/auth.js';
import { mapAdminEndpoints } from './routes/admin.js';
import { mapContactEndpoints } from './routes/contact.js';
import { mapProfileEndpoints } from './routes/profile.js';
import { mapScheduleEndpoints } from './routes/schedule.js';
import { mapBookingEndpoints } from './routes/booking.js';
import { mapPackageEndpoints } from './routes/packages.js';
import { clearUsers, createUser, getUserByEmail, deleteUser, activateUser, setUserRole } from './models/user-store.js';
import { clearScheduleData } from './services/schedule.js';
import { clearBookings } from './services/booking.js';
import { clearPackages } from './services/packages.js';

function isLoopbackHostname(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
}

function isLocalUrl(url: string | undefined): boolean {
  if (!url) {
    return false;
  }

  try {
    return isLoopbackHostname(new URL(url).hostname);
  } catch {
    return false;
  }
}

export function shouldEnableTestRoutes(env: NodeJS.ProcessEnv = process.env): boolean {
  if (env.NODE_ENV === 'test') {
    return true;
  }

  if (env.NODE_ENV !== 'development' || env.ENABLE_TEST_ROUTES !== 'true') {
    return false;
  }

  return isLocalUrl(env.APP_URL) && isLocalUrl(env.API_URL);
}

export function createApp(): express.Express {
  const app = express();

  // Middleware
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        frameSrc: ["'self'", "https://www.google.com", "https://maps.google.com"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'", "https:", "data:"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
    },
  }));
  const allowedOrigins = [
    process.env.APP_URL || 'http://localhost:3001',
    'http://localhost:3001',
    'http://localhost:3000',
  ].filter(Boolean);

  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (same-origin, curl, Postman)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  }));
  app.use(express.json());
  app.use(cookieParser());
  app.use(pinoHttp({ logger }));

  // Routes
  mapHealthEndpoints(app);
  mapChatEndpoints(app);
  mapAuthEndpoints(app);
  mapAdminEndpoints(app);
  mapContactEndpoints(app);
  mapProfileEndpoints(app);
  mapScheduleEndpoints(app);
  mapBookingEndpoints(app);
  mapPackageEndpoints(app);

  // Test-only: reset endpoint for e2e test isolation
  if (shouldEnableTestRoutes()) {
    app.post('/api/test/reset', (_req, res) => {
      clearBookings();
      clearPackages();
      clearScheduleData();
      clearUsers();
      res.json({ message: 'Store cleared' });
    });

    app.post('/api/test/create-user', async (req, res) => {
      const { email, displayName, password, role } = req.body;
      const bcrypt = await import('bcryptjs');
      const passwordHash = await bcrypt.default.hash(password, 10);
      const user = createUser({
        email,
        displayName: displayName || email,
        passwordHash,
        authProvider: 'local',
        confirmationToken: null,
        googleId: null,
      });
      if (role) { setUserRole(user.id, role); }
      activateUser(user.id);
      res.json({ message: 'User created' });
    });

    app.delete('/api/test/users/:email', (req, res) => {
      const user = getUserByEmail(req.params.email);
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }
      deleteUser(user.id);
      res.json({ message: 'User deleted' });
    });
  } else if (process.env.ENABLE_TEST_ROUTES === 'true') {
    logger.warn(
      { nodeEnv: process.env.NODE_ENV, appUrl: process.env.APP_URL, apiUrl: process.env.API_URL },
      'ENABLE_TEST_ROUTES was ignored because test routes are restricted to test mode or localhost development.'
    );
  }

  // Centralized error handler — must be last middleware
  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    logger.error({ err: err.message, stack: err.stack }, 'Unhandled error');
    res.status(500).json({ error: 'Interner Serverfehler' });
  });

  return app;
}
