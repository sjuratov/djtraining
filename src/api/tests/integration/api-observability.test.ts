import http from 'node:http';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';

type CollectorRequest = {
  path: string;
  body: Buffer;
};

type CollectorHandle = {
  baseUrl: string;
  requests: CollectorRequest[];
  close: () => Promise<void>;
};

const originalEnv = { ...process.env };

async function importTelemetryModule() {
  const modulePath = path.join(process.cwd(), 'src', 'telemetry.ts');
  return import(pathToFileURL(modulePath).href);
}

async function createCollector(): Promise<CollectorHandle> {
  const requests: CollectorRequest[] = [];
  const server = http.createServer((req, res) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    req.on('end', () => {
      requests.push({
        path: req.url ?? '',
        body: Buffer.concat(chunks),
      });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end('{}');
    });
  });

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();

  if (!address || typeof address === 'string') {
    throw new Error('Expected collector to bind to an ephemeral TCP port');
  }

  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    requests,
    close: () => new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    }),
  };
}

async function waitForCollectorRequest(
  requests: CollectorRequest[],
  matcher: (requestPath: string) => boolean,
  timeoutMs = 5000,
) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    if (requests.some((entry) => matcher(entry.path))) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  throw new Error(`Timed out waiting for collector request. Received paths: ${requests.map((entry) => entry.path).join(', ')}`);
}

function restoreEnv() {
  for (const key of Object.keys(process.env)) {
    if (!(key in originalEnv)) {
      delete process.env[key];
    }
  }

  Object.assign(process.env, originalEnv);
}

describe('API observability integration', () => {
  afterEach(async () => {
    try {
      const telemetryModule = await importTelemetryModule();
      if (typeof telemetryModule.shutdownApiTelemetry === 'function') {
        await telemetryModule.shutdownApiTelemetry();
      }
    } catch {
      // Red-baseline scaffolding may not provide the telemetry module yet.
    }

    restoreEnv();
  });

  it('should export traces and metrics to the configured OTLP endpoint for a successful request', async () => {
    const collector = await createCollector();

    try {
      process.env.OTEL_EXPORTER_OTLP_ENDPOINT = collector.baseUrl;
      process.env.OTEL_EXPORTER_OTLP_PROTOCOL = 'http/protobuf';
      process.env.OTEL_SERVICE_NAME = 'dj-training-api';
      process.env.OTEL_METRIC_EXPORT_INTERVAL = '1000';

      const telemetryModule = await importTelemetryModule();

      expect(typeof telemetryModule.startApiTelemetry).toBe('function');
      expect(typeof telemetryModule.shutdownApiTelemetry).toBe('function');

      await telemetryModule.startApiTelemetry();

      const app = createApp();
      await request(app).get('/health').expect(200);

      await waitForCollectorRequest(collector.requests, (requestPath) => requestPath === '/v1/traces');
      await waitForCollectorRequest(collector.requests, (requestPath) => requestPath === '/v1/metrics', 10000);
    } finally {
      await collector.close();
    }
  }, 20000);

  it('should keep the API reachable when the telemetry collector is unavailable', async () => {
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT = 'http://127.0.0.1:9';
    process.env.OTEL_EXPORTER_OTLP_PROTOCOL = 'http/protobuf';
    process.env.OTEL_SERVICE_NAME = 'dj-training-api';

    const telemetryModule = await importTelemetryModule();

    expect(typeof telemetryModule.startApiTelemetry).toBe('function');
    await telemetryModule.startApiTelemetry();

    const app = createApp();
    await request(app).get('/health').expect(200);
  });
});
