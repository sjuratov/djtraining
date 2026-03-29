import { type Express } from 'express';
import { logger } from '../logger.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_NAME_LENGTH = 100;
const MAX_MESSAGE_LENGTH = 2000;

export function mapContactEndpoints(app: Express): void {
  app.post('/api/contact', (req, res) => {
    const { name, email, phone, message } = req.body;

    if (!name || !email || !message) {
      res.status(400).json({ error: 'Name, E-Mail und Nachricht sind erforderlich.' });
      return;
    }

    if (typeof name !== 'string' || name.length > MAX_NAME_LENGTH) {
      res.status(400).json({ error: `Name darf maximal ${MAX_NAME_LENGTH} Zeichen lang sein.` });
      return;
    }

    if (!EMAIL_REGEX.test(email)) {
      res.status(400).json({ error: 'Ungültige E-Mail-Adresse.' });
      return;
    }

    if (typeof message !== 'string' || message.length > MAX_MESSAGE_LENGTH) {
      res.status(400).json({ error: `Nachricht darf maximal ${MAX_MESSAGE_LENGTH} Zeichen lang sein.` });
      return;
    }

    logger.info({ name, email, phone }, 'Contact form submission received');

    res.status(200).json({ success: true, message: 'Nachricht erfolgreich gesendet.' });
  });
}
