import { diag, type DiagLogger, DiagLogLevel } from '@opentelemetry/api';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-grpc';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import { logger } from './logger.js';

// Sensitive path patterns for redaction — password, token, authorization, cookie, secret, auth code
const SENSITIVE_PATH_PATTERNS = [/password/i, /token/i, /authorization/i, /cookie/i, /secret/i, /auth[-_]?code/i];

let sdk: NodeSDK | null = null;
let telemetryStarted = false;

function createDiagLogger(): DiagLogger {
  return {
    debug(message, ...args) { logger.debug({ telemetry: args }, String(message)); },
    error(message, ...args) { logger.warn({ telemetry: args }, String(message)); },
    info(message, ...args) { logger.debug({ telemetry: args }, String(message)); },
    verbose(message, ...args) { logger.debug({ telemetry: args }, String(message)); },
    warn(message, ...args) { logger.warn({ telemetry: args }, String(message)); },
  };
}

export async function startApiTelemetry(): Promise<void> {
  if (telemetryStarted) {
    return;
  }

  const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
  const serviceName = process.env.OTEL_SERVICE_NAME || 'dj-training-api';
  const serviceVersion = process.env.npm_package_version || '1.0.0';
  const environment = process.env.NODE_ENV || 'development';

  if (!endpoint) {
    logger.warn('Telemetry disabled because OTEL_EXPORTER_OTLP_ENDPOINT is not configured.');
    return;
  }

  try {
    new URL(endpoint);
  } catch {
    logger.warn({ endpoint }, 'Telemetry disabled due to invalid OTLP exporter configuration.');
    return;
  }

  diag.setLogger(createDiagLogger(), DiagLogLevel.WARN);

  try {
    const metricExportIntervalMillis = Number.parseInt(process.env.OTEL_METRIC_EXPORT_INTERVAL ?? '60000', 10);

    sdk = new NodeSDK({
      resource: resourceFromAttributes({
        [ATTR_SERVICE_NAME]: serviceName,
        [ATTR_SERVICE_VERSION]: serviceVersion,
        'deployment.environment.name': environment,
      }),
      traceExporter: new OTLPTraceExporter({ url: endpoint }),
      metricReaders: [
        new PeriodicExportingMetricReader({
          exporter: new OTLPMetricExporter({ url: endpoint }),
          exportIntervalMillis: metricExportIntervalMillis,
        }),
      ],
      instrumentations: [
        getNodeAutoInstrumentations({
          '@opentelemetry/instrumentation-fs': { enabled: false },
          '@opentelemetry/instrumentation-http': {
            ignoreIncomingRequestHook: (req) => req.url === '/health',
          },
        }),
      ],
    });

    await sdk.start();
    telemetryStarted = true;
    logger.info({ endpoint, serviceName, protocol: 'grpc' }, 'API telemetry started.');
  } catch (error) {
    logger.warn({ err: error, endpoint }, 'API telemetry failed to start; continuing without telemetry.');
    sdk = null;
    telemetryStarted = false;
  }
}

export async function shutdownApiTelemetry(): Promise<void> {
  if (!sdk) {
    telemetryStarted = false;
    return;
  }

  try {
    await sdk.shutdown();
  } catch (error) {
    logger.warn({ err: error }, 'API telemetry shutdown reported a non-fatal error.');
  } finally {
    sdk = null;
    telemetryStarted = false;
  }
}

export { SENSITIVE_PATH_PATTERNS };
