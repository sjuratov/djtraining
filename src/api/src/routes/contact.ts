import { type Express } from 'express';
import { logger } from '../logger.js';

export function mapContactEndpoints(app: Express): void {
  app.post('/api/contact', (req, res) => {
    const { name, email, phone, message } = req.body;

    if (!name || !email || !message) {
      res.status(400).json({ error: 'Name, E-Mail und Nachricht sind erforderlich.' });
      return;
    }

    logger.info({ name, email, phone }, 'Contact form submission received');

    res.status(200).json({ success: true, message: 'Nachricht erfolgreich gesendet.' });
  });
}
