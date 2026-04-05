import pino from 'pino';
import { context, trace } from '@opentelemetry/api';

function getActiveTraceContext() {
  const activeSpan = trace.getSpan(context.active());
  if (!activeSpan) {
    return {};
  }

  const spanContext = activeSpan.spanContext();
  return {
    trace_id: spanContext.traceId,
    span_id: spanContext.spanId,
    trace_flags: spanContext.traceFlags.toString(16).padStart(2, '0'),
  };
}

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV !== 'production'
    ? { target: 'pino/file', options: { destination: 1 } }
    : undefined,
  mixin: getActiveTraceContext,
  redact: {
    paths: [
      'authorization',
      '*.authorization',
      'cookie',
      '*.cookie',
      'headers.authorization',
      'headers.cookie',
      'req.headers.authorization',
      'req.headers.cookie',
      'password',
      '*.password',
      'token',
      '*.token',
      'secret',
      '*.secret',
    ],
    censor: '[Redacted]',
  },
});
