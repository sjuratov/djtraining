import { createApp } from './app.js';
import { loadApiEnvironment } from './config/env.js';
import { initDatabase } from './db/database.js';
import { logger } from './logger.js';

loadApiEnvironment();

const port = parseInt(process.env.PORT || '5001', 10);

initDatabase();

const app = createApp();

app.listen(port, () => {
  logger.info(`API server listening on http://localhost:${port}`);
});
