export interface AspireHealthResponse {
  status: 'healthy';
  timestamp: string;
}

export interface AspireWebReadinessResponse {
  html: string;
}

export interface OtlpExporterConfig {
  endpoint: string;
  protocol: 'http/protobuf';
}

export interface LocalTelemetryPorts {
  grpcPort: 4319;
  httpPort: 4320;
}

export interface LocalTelemetryResource {
  name: 'otel';
  exporter: OtlpExporterConfig;
  ports: LocalTelemetryPorts;
}

export interface OtlpTraceExportRequest {
  resourceSpans?: Array<Record<string, unknown>>;
}

export interface OtlpMetricExportRequest {
  resourceMetrics?: Array<Record<string, unknown>>;
}

export interface OtlpLogExportRequest {
  resourceLogs?: Array<Record<string, unknown>>;
}

export interface OtlpCollectorAcceptedResponse {
  accepted: true;
}

export interface AspireLocalOrchestrationContract {
  webBaseUrl: 'http://localhost:3001';
  apiBaseUrl: 'http://localhost:5001';
  docsBaseUrl: 'http://localhost:8100';
  telemetry: LocalTelemetryResource;
}
