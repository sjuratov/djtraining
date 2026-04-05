import { registerOTel } from '@vercel/otel';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';

export function register() {
  const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
  const serviceName = process.env.OTEL_SERVICE_NAME || 'dj-training-web';

  if (!endpoint) {
    console.warn('[telemetry] Web telemetry disabled: OTEL_EXPORTER_OTLP_ENDPOINT is not set.');
    return;
  }

  try {
    new URL(endpoint);
  } catch {
    console.warn(`[telemetry] Web telemetry disabled: invalid OTEL_EXPORTER_OTLP_ENDPOINT "${endpoint}".`);
    return;
  }

  try {
    registerOTel({
      serviceName,
      traceExporter: new OTLPTraceExporter(),
      metricReaders: [new PeriodicExportingMetricReader({
        exporter: new OTLPMetricExporter(),
        exportIntervalMillis: 60_000,
      })],
    });

    console.log(`[telemetry] Web telemetry started: service=${serviceName} endpoint=${endpoint}`);
  } catch (error) {
    console.error('[telemetry] Web telemetry failed to start; continuing without telemetry.', error);
  }
}
