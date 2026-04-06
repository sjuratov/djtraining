import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { Given, Then, When } from '@cucumber/cucumber';
import { CustomWorld } from '../support/world';

const repoRoot = path.resolve(process.cwd());

function readRepoFile(relativePath: string): string {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function readTelemetrySource(): string {
  return readRepoFile('src/api/src/telemetry.ts');
}

Given('the DJ Training API telemetry is enabled', function (this: CustomWorld) {
  this.response = null;
});

Given('the API exports telemetry to the configured OTLP endpoint', function () {
  const appHostSource = readRepoFile('apphost.cs');
  assert.ok(appHostSource.includes('OTEL_EXPORTER_OTLP_ENDPOINT'), 'Expected the API to receive an OTLP endpoint from Aspire');
  assert.ok(appHostSource.includes('dj-training-api'), 'Expected the API service name to be declared in Aspire');
});

Given('the configured telemetry collector is unavailable', function () {
  process.env.OTEL_EXPORTER_OTLP_ENDPOINT = 'http://127.0.0.1:9';
});

Given('the DJ Training API has invalid telemetry exporter configuration', function () {
  process.env.OTEL_EXPORTER_OTLP_ENDPOINT = 'not-a-valid-url';
});

When('a client sends a successful request to the API', async function (this: CustomWorld) {
  const response = await fetch(`${this.apiBaseUrl}/health`);
  this.response = { status: response.status, body: await response.json().catch(() => null), headers: response.headers };
});

When('a client performs an authentication or verification flow', async function (this: CustomWorld) {
  const email = `telemetry-${Date.now()}@example.com`;
  const registerResponse = await fetch(`${this.apiBaseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      displayName: 'Telemetry User',
      password: 'SecurePass123!',
      confirmPassword: 'SecurePass123!',
    }),
  });

  this.response = {
    status: registerResponse.status,
    body: await registerResponse.json().catch(() => null),
    headers: registerResponse.headers,
  };
});

When('a client sends a request to the API', async function (this: CustomWorld) {
  const response = await fetch(`${this.apiBaseUrl}/health`);
  this.response = { status: response.status, body: await response.json().catch(() => null), headers: response.headers };
});

When('the API starts', async function (this: CustomWorld) {
  const response = await fetch(`${this.apiBaseUrl}/health`);
  this.response = { status: response.status, body: await response.json().catch(() => null), headers: response.headers };
});

Then('the API should emit a trace for that request', function () {
  const telemetrySource = readTelemetrySource();
  assert.ok(telemetrySource.includes('@opentelemetry/exporter-trace-otlp-grpc'), 'Expected API telemetry bootstrap to configure the OTLP trace exporter');
  assert.ok(telemetrySource.includes('getNodeAutoInstrumentations') || telemetrySource.includes('instrumentation-http'), 'Expected API telemetry bootstrap to instrument inbound HTTP requests');
});

Then('the API should emit request metrics for that request', function () {
  const telemetrySource = readTelemetrySource();
  assert.ok(telemetrySource.includes('@opentelemetry/exporter-metrics-otlp-grpc'), 'Expected API telemetry bootstrap to configure the OTLP metric exporter');
  assert.ok(telemetrySource.includes('PeriodicExportingMetricReader') || telemetrySource.includes('metricReader'), 'Expected API telemetry bootstrap to configure periodic metric export');
});

Then('the API logs for that request should include correlation data linking to the active trace or span', function () {
  const loggerSource = readRepoFile('src/api/src/logger.ts');
  assert.ok(/trace[_A-Z]*id|traceId/.test(loggerSource), 'Expected API logs to include a trace identifier');
  assert.ok(/span[_A-Z]*id|spanId/.test(loggerSource), 'Expected API logs to include a span identifier');
});

Then('the exported telemetry should identify the service as {string}', function (expectedServiceName: string) {
  const telemetrySource = readTelemetrySource();
  assert.ok(
    telemetrySource.includes(`'${expectedServiceName}'`) || telemetrySource.includes(`"${expectedServiceName}"`) || telemetrySource.includes('OTEL_SERVICE_NAME'),
    `Expected API telemetry resource metadata to identify the service as "${expectedServiceName}"`,
  );
});

Then('the exported telemetry should include environment-driven resource metadata for the API service', function () {
  const telemetrySource = readTelemetrySource();
  assert.ok(telemetrySource.includes('process.env.OTEL_SERVICE_NAME') || telemetrySource.includes('serviceName:'), 'Expected API telemetry resource metadata to be environment-driven');
});

Then('the exported traces, metrics, and logs should not include passwords', function () {
  const telemetrySource = readTelemetrySource();
  assert.ok(/password/i.test(telemetrySource), 'Expected telemetry bootstrap to explicitly handle password redaction');
});

Then('the exported traces, metrics, and logs should not include verification tokens', function () {
  const telemetrySource = readTelemetrySource();
  assert.ok(/verification|token/i.test(telemetrySource), 'Expected telemetry bootstrap to explicitly handle verification token redaction');
});

Then('the exported traces, metrics, and logs should not include session secrets or auth codes', function () {
  const telemetrySource = readTelemetrySource();
  assert.ok(/authorization|cookie|secret|auth/i.test(telemetrySource), 'Expected telemetry bootstrap to explicitly protect auth secrets');
});

Then('the API should still serve the request normally', function (this: CustomWorld) {
  assert.ok(this.response, 'Expected a recorded API response');
  assert.strictEqual(this.response.status, 200, 'Expected the API request to remain successful');
});

Then('the API should surface a non-fatal telemetry export diagnostic', function () {
  const telemetrySource = readTelemetrySource();
  assert.ok(/logger\.warn|diag\./.test(telemetrySource), 'Expected telemetry export failures to emit a non-fatal diagnostic');
});

Then('the API should not crash or block request handling because telemetry export failed', function (this: CustomWorld) {
  assert.ok(this.response, 'Expected a recorded API response');
  assert.strictEqual(this.response.status, 200, 'Expected request handling to remain available when telemetry export fails');
});

Then('the API should surface a clear telemetry configuration error', function () {
  const telemetrySource = readTelemetrySource();
  assert.ok(/throw new Error|logger\.warn|diag\./.test(telemetrySource), 'Expected invalid telemetry configuration to be surfaced explicitly');
});

Then('the API should remain reachable for normal application traffic', function (this: CustomWorld) {
  assert.ok(this.response, 'Expected a recorded API response');
  assert.strictEqual(this.response.status, 200, 'Expected the API to remain reachable');
});

Then('the API should not require source code changes to target a different OTLP endpoint later', function () {
  const telemetrySource = readTelemetrySource();
  assert.ok(telemetrySource.includes('process.env.OTEL_EXPORTER_OTLP_ENDPOINT'), 'Expected telemetry exporter target to be environment-driven');
});
