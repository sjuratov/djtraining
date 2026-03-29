import { type Express, type Request, type Response } from 'express';
import rateLimit from 'express-rate-limit';
import { authMiddleware } from '../middleware/auth.js';

const isTest = process.env.NODE_ENV === 'test' || process.env.ENABLE_TEST_ROUTES === 'true';

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isTest ? 1000 : 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Zu viele Anfragen. Bitte versuche es später erneut.' },
});

// Placeholder implementation — replaced during spec2cloud Phase 4
export function mapChatEndpoints(app: Express): void {
  app.post('/api/chat/sessions', authMiddleware, chatLimiter, (_req: Request, res: Response) => {
    res.status(201).json({ sessionId: crypto.randomUUID(), createdAt: new Date().toISOString() });
  });

  app.get('/api/chat/sessions/:sessionId', authMiddleware, (req: Request, res: Response) => {
    res.json({ sessionId: req.params.sessionId, messages: [] });
  });

  app.post('/api/chat/sessions/:sessionId/messages', authMiddleware, chatLimiter, (req: Request, res: Response) => {
    const { message } = req.body as { message?: string };
    if (!message) {
      res.status(400).json({ error: 'Message is required' });
      return;
    }
    res.json({
      sessionId: req.params.sessionId,
      reply: 'This is a placeholder response. Implement during Phase 4.',
    });
  });
}
