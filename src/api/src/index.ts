import { loadApiEnvironment } from './config/env.js';
import { logger } from './logger.js';
import { shutdownApiTelemetry, startApiTelemetry } from './telemetry.js';

async function main() {
  loadApiEnvironment();
  await startApiTelemetry();

  const [{ createApp }, { initDatabase }] = await Promise.all([
    import('./app.js'),
    import('./db/database.js'),
  ]);

  const port = parseInt(process.env.PORT || '5101', 10);

  initDatabase();

  const app = createApp();
  const server = app.listen(port, () => {
    logger.info({ port }, `API server listening on http://localhost:${port}`);
  });

  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Shutting down API server.');
    server.close(async () => {
      await shutdownApiTelemetry();
      process.exit(0);
    });
  };

  process.once('SIGINT', () => { void shutdown('SIGINT'); });
  process.once('SIGTERM', () => { void shutdown('SIGTERM'); });
}

void main().catch((error) => {
  logger.error({ err: error }, 'Failed to start API server.');
  process.exit(1);
});
