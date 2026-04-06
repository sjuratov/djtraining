import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const apiRoot = process.cwd();

function readApiFile(relativePath: string): string {
  return fs.readFileSync(path.join(apiRoot, relativePath), 'utf8');
}

describe('API OpenTelemetry signals', () => {
  it('should bootstrap telemetry before the Express server starts listening', () => {
    const source = readApiFile('src/index.ts');

    expect(source).toMatch(/telemetry/i);
    expect(source).toMatch(/startApiTelemetry|initializeApiTelemetry|registerApiTelemetry/);
  });

  it('should configure OTLP trace and metric exporters for the DJ Training API service', () => {
    const source = readApiFile('src/telemetry.ts');

    expect(source).toContain('@opentelemetry/sdk-node');
    expect(source).toContain('@opentelemetry/exporter-trace-otlp-grpc');
    expect(source).toContain('@opentelemetry/exporter-metrics-otlp-grpc');
    expect(source).toMatch(/OTEL_SERVICE_NAME|dj-training-api/);
  });

  it('should correlate API logs with the active trace and span context', () => {
    const source = readApiFile('src/logger.ts');

    expect(source).toMatch(/trace[_A-Z]*id|traceId/);
    expect(source).toMatch(/span[_A-Z]*id|spanId/);
    expect(source).toMatch(/mixin|context\.active|instrumentation-pino/);
  });

  it('should explicitly protect sensitive auth and verification data from telemetry output', () => {
    const source = readApiFile('src/telemetry.ts');

    expect(source).toMatch(/password/i);
    expect(source).toMatch(/token|verification/i);
    expect(source).toMatch(/authorization|cookie|secret/i);
  });
});
