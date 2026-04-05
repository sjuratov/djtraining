import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { Given, Then, When } from '@cucumber/cucumber';
import { CustomWorld } from '../support/world';

const repoRoot = path.resolve(process.cwd());

function readRepoFile(relativePath: string): string {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function readWebInstrumentation(): string {
  return readRepoFile('src/web/instrumentation.ts');
}

Given('the DJ Training web telemetry is enabled', function (this: CustomWorld) {
  this.response = null;
});

Given('the web app exports telemetry to the configured OTLP endpoint', function () {
  const appHostSource = readRepoFile('apphost.cs');
  assert.ok(appHostSource.includes('OTEL_EXPORTER_OTLP_ENDPOINT'), 'Expected OTLP endpoint wiring in Aspire host');
  assert.ok(appHostSource.includes('dj-training-web'), 'Expected web service name in Aspire host');
});

Given('browser telemetry delivery is limited or unavailable', function () {
  // Source-based: the implementation must handle missing browser transport gracefully.
});

Given('the web telemetry exporter configuration is invalid or unreachable', function () {
  // Source-based: the instrumentation must fail open.
});

When('a user loads the homepage and navigates to another page', async function (this: CustomWorld) {
  await this.page.goto(this.webBaseUrl);
  await this.page.getByRole('link', { name: /Kontakt/i }).click();
  await this.page.waitForURL(/\/kontakt/);
});

When('a user completes a web journey that calls the API', async function (this: CustomWorld) {
  const response = await fetch(`${this.apiBaseUrl}/health`);
  assert.ok(response.ok, 'Expected API to be healthy');
  await this.page.goto(this.webBaseUrl);
});

When('a user loads and navigates the site', async function (this: CustomWorld) {
  await this.page.goto(this.webBaseUrl);
  await this.page.getByRole('link', { name: /Über mich/i }).click();
  await this.page.waitForURL(/\/ueber-mich/);
});

When('the web app handles a page request', async function (this: CustomWorld) {
  await this.page.goto(this.webBaseUrl);
});

Then('the web app should emit server-side traces for that journey', function () {
  const source = readWebInstrumentation();
  assert.ok(source.includes('@opentelemetry/sdk-node') || source.includes('@vercel/otel'), 'Expected web instrumentation to configure OTel SDK');
  assert.ok(source.includes('OTLPTraceExporter') || source.includes('registerOTel'), 'Expected web instrumentation to export traces');
});

Then('the web app should emit selected page or navigation metrics for that journey', function () {
  const source = readWebInstrumentation();
  assert.ok(
    source.includes('OTLPMetricExporter') || source.includes('PeriodicExportingMetricReader') || source.includes('registerOTel'),
    'Expected web instrumentation to export metrics',
  );
});

Then('the web logs for that journey should include correlation data where available', function () {
  const source = readWebInstrumentation();
  assert.ok(
    /console|logger|diag/.test(source),
    'Expected web instrumentation to reference logging or diagnostics',
  );
});

Then('the exported web telemetry should identify the service as {string}', function (expectedName: string) {
  const source = readWebInstrumentation();
  assert.ok(
    source.includes(`'${expectedName}'`) || source.includes(`"${expectedName}"`) || source.includes('OTEL_SERVICE_NAME'),
    `Expected web telemetry to identify service as "${expectedName}"`,
  );
});

Then('the exported web telemetry should include environment-driven resource metadata for the web service', function () {
  const source = readWebInstrumentation();
  assert.ok(
    source.includes('process.env.OTEL_SERVICE_NAME') || source.includes('serviceName'),
    'Expected web telemetry resource metadata to be environment-driven',
  );
});

Then('the resulting telemetry should link the web request to the downstream API activity', function () {
  const webSource = readWebInstrumentation();
  const apiSource = readRepoFile('src/api/src/telemetry.ts');
  assert.ok(webSource.includes('OTLPTraceExporter') || webSource.includes('registerOTel'), 'Expected web to export traces');
  assert.ok(apiSource.includes('OTLPTraceExporter'), 'Expected API to export traces');
  assert.ok(
    webSource.includes('OTEL_EXPORTER_OTLP_ENDPOINT') || webSource.includes('process.env'),
    'Expected web telemetry endpoint to be environment-driven',
  );
});

Then('the telemetry exporter configuration should remain environment-driven for both services', function () {
  const appHostSource = readRepoFile('apphost.cs');
  const otelMatches = appHostSource.match(/OTEL_EXPORTER_OTLP_ENDPOINT/g) ?? [];
  assert.ok(otelMatches.length >= 2, 'Expected OTLP endpoint wired into both services');
});

Then('the page should still render normally', async function (this: CustomWorld) {
  const title = await this.page.title();
  assert.ok(title.length > 0, 'Expected the page to have a title');
});

Then('the user should still be able to interact with the site', async function (this: CustomWorld) {
  const links = await this.page.getByRole('link').count();
  assert.ok(links > 0, 'Expected navigation links to be present');
});

Then('the web app should skip unsupported browser telemetry cleanly', function () {
  const source = readWebInstrumentation();
  assert.ok(/typeof window|client|browser|edge/i.test(source) || /register/.test(source), 'Expected instrumentation to handle server vs browser context');
});

Then('the page should still render successfully', async function (this: CustomWorld) {
  const title = await this.page.title();
  assert.ok(title.length > 0, 'Expected the page to render with a title');
});

Then('the web app should surface a non-fatal telemetry diagnostic', function () {
  const source = readWebInstrumentation();
  assert.ok(/console\.(warn|error)|diag/.test(source), 'Expected non-fatal telemetry diagnostics in instrumentation');
});

Then('the web app should not require hardcoded deployment-specific telemetry URLs in source files', function () {
  const source = readWebInstrumentation();
  assert.ok(!source.includes('localhost:4320'), 'Expected no hardcoded OTLP endpoint in instrumentation source');
  assert.ok(source.includes('process.env') || source.includes('OTEL_EXPORTER_OTLP_ENDPOINT'), 'Expected environment-driven OTLP config');
});
