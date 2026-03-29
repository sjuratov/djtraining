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
import { clearUsers, createUser, getUserByEmail, deleteUser, activateUser } from './models/user-store.js';

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

  // Test-only: reset endpoint for e2e test isolation
  if (process.env.NODE_ENV !== 'production' && process.env.ENABLE_TEST_ROUTES === 'true') {
    app.post('/api/test/reset', (_req, res) => {
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
      if (role) { user.role = role; }
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
  }

  // Centralized error handler — must be last middleware
  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    logger.error({ err: err.message, stack: err.stack }, 'Unhandled error');
    res.status(500).json({ error: 'Interner Serverfehler' });
  });

  return app;
}
