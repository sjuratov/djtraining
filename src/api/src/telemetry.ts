import { context, diag, metrics, type DiagLogger, DiagLogLevel, SpanStatusCode, trace } from '@opentelemetry/api';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { AggregationTemporality, PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { logger } from './logger.js';

type TelemetryConfig = {
  endpoint: string | null;
  serviceName: string;
  serviceVersion: string;
  environment: string;
};

const SENSITIVE_PATH_PATTERNS = [/password/i, /token/i, /authorization/i, /cookie/i, /secret/i, /auth[-_]?code/i];
const TRACE_FLUSH_DELAY_MILLIS = 200;

let sdk: NodeSDK | null = null;
let telemetryStarted = false;

const tracer = trace.getTracer('dj-training-api');
const meter = metrics.getMeter('dj-training-api');
const requestCounter = meter.createCounter('dj_training.api.requests', {
  description: 'Total API requests handled by the DJ Training API.',
});
const errorCounter = meter.createCounter('dj_training.api.errors', {
  description: 'Total API requests that completed with an error status code.',
});
const durationHistogram = meter.createHistogram('dj_training.api.request.duration', {
  description: 'API request duration in milliseconds.',
  unit: 'ms',
});

function createDiagLogger(): DiagLogger {
  return {
    debug(message, ...args) {
      logger.debug({ telemetry: args }, String(message));
    },
    error(message, ...args) {
      logger.warn({ telemetry: args }, String(message));
    },
    info(message, ...args) {
      logger.info({ telemetry: args }, String(message));
    },
    verbose(message, ...args) {
      logger.debug({ telemetry: args }, String(message));
    },
    warn(message, ...args) {
      logger.warn({ telemetry: args }, String(message));
    },
  };
}

function buildTelemetryConfig(): TelemetryConfig | null {
  const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
  const serviceName = process.env.OTEL_SERVICE_NAME || 'dj-training-api';
  const serviceVersion = process.env.npm_package_version || '1.0.0';
  const environment = process.env.NODE_ENV || 'development';

  if (!endpoint) {
    logger.warn('Telemetry disabled because OTEL_EXPORTER_OTLP_ENDPOINT is not configured.');
    return null;
  }

  try {
    new URL(endpoint);
  } catch {
    logger.warn({ endpoint }, 'Telemetry disabled due to invalid OTLP exporter configuration.');
    return null;
  }

  return {
    endpoint,
    serviceName,
    serviceVersion,
    environment,
  };
}

function sanitizePath(pathname: string): string {
  if (!pathname) {
    return '/';
  }

  const segments = pathname.split('/').map((segment) => {
    if (!segment) {
      return segment;
    }

    if (SENSITIVE_PATH_PATTERNS.some((pattern) => pattern.test(segment))) {
      return ':redacted';
    }

    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(segment)) {
      return ':redacted';
    }

    if (segment.length > 24 && /[A-Za-z0-9\-_]/.test(segment)) {
      return ':redacted';
    }

    return segment;
  });

  return segments.join('/') || '/';
}

function buildRequestAttributes(req: Request, res?: Response<Record<string, unknown>>): Record<string, string | number> {
  const route = sanitizePath(req.route?.path ? `${req.baseUrl || ''}${req.route.path}` : req.path);
  const attributes: Record<string, string | number> = {
    'http.request.method': req.method,
    'http.route': route,
    'url.path': route,
  };

  if (res) {
    attributes['http.response.status_code'] = res.statusCode;
  }

  return attributes;
}

export async function startApiTelemetry(): Promise<void> {
  if (telemetryStarted) {
    return;
  }

  const config = buildTelemetryConfig();
  if (!config) {
    return;
  }

  diag.setLogger(createDiagLogger(), DiagLogLevel.WARN);

  try {
    const metricExportIntervalMillis = Number.parseInt(process.env.OTEL_METRIC_EXPORT_INTERVAL ?? '60000', 10);

    sdk = new NodeSDK({
      resource: resourceFromAttributes({
        [ATTR_SERVICE_NAME]: config.serviceName,
        [ATTR_SERVICE_VERSION]: config.serviceVersion,
        'deployment.environment.name': config.environment,
      }),
      spanProcessors: [
        new BatchSpanProcessor(new OTLPTraceExporter(), {
          scheduledDelayMillis: TRACE_FLUSH_DELAY_MILLIS,
        }),
      ],
      metricReaders: [
        new PeriodicExportingMetricReader({
          exporter: new OTLPMetricExporter({
            temporalityPreference: AggregationTemporality.DELTA,
          }),
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
    logger.info({ endpoint: config.endpoint, serviceName: config.serviceName }, 'API telemetry started.');
  } catch (error) {
    logger.warn({ err: error, endpoint: config.endpoint }, 'API telemetry failed to start; continuing without telemetry.');
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

export function createApiTelemetryMiddleware(): RequestHandler {
  return function apiTelemetryMiddleware(req: Request, res: Response, next: NextFunction) {
    const startTime = performance.now();
    const spanName = `${req.method} ${sanitizePath(req.path)}`;

    tracer.startActiveSpan(spanName, { attributes: buildRequestAttributes(req) }, (span) => {
      let finished = false;

      const finishSpan = () => {
        if (finished) {
          return;
        }

        finished = true;
        const durationMs = performance.now() - startTime;
        const attributes = buildRequestAttributes(req, res);

        requestCounter.add(1, attributes);
        durationHistogram.record(durationMs, attributes);

        if (res.statusCode >= 400) {
          errorCounter.add(1, attributes);
        }

        span.setAttributes(attributes);

        if (res.statusCode >= 500) {
          span.setStatus({ code: SpanStatusCode.ERROR });
        } else {
          span.setStatus({ code: SpanStatusCode.OK });
        }

        span.end();
      };

      res.on('finish', finishSpan);
      res.on('close', finishSpan);

      context.with(trace.setSpan(context.active(), span), next);
    });
  };
}
