#:sdk Aspire.AppHost.Sdk@13.2.0
#:package Aspire.Hosting.JavaScript@13.2.0
var builder = DistributedApplication.CreateBuilder(args);

var otel = builder.AddContainer("otel", "mcr.microsoft.com/dotnet/aspire-dashboard", "latest")
    .WithEnvironment("ASPIRE_DASHBOARD_UNSECURED_ALLOW_ANONYMOUS", "true")
    .WithEnvironment("DOTNET_DASHBOARD_OTLP_ENDPOINT_URL", "http://0.0.0.0:18889")
    .WithEnvironment("DOTNET_DASHBOARD_OTLP_HTTP_ENDPOINT_URL", "http://0.0.0.0:18890")
    .WithHttpEndpoint(name: "dashboard", port: 18898, targetPort: 18888)
    .WithEndpoint(name: "otlp-grpc", port: 4319, targetPort: 18889)
    .WithHttpEndpoint(name: "otlp-http", port: 4320, targetPort: 18890)
    .WithExternalHttpEndpoints();

// API — Express.js / TypeScript backend
var api = builder.AddJavaScriptApp("api", "./src/api")
    .WithEnvironment("JWT_SECRET", "aspire-local-dev-jwt-secret")
    .WithEnvironment("APP_URL", "http://localhost:3001")
    .WithEnvironment("API_URL", "http://localhost:5001")
    .WithEnvironment("ENABLE_TEST_ROUTES", "true")
    .WithEnvironment("OTEL_EXPORTER_OTLP_ENDPOINT", "http://localhost:4319")
    .WithEnvironment("OTEL_EXPORTER_OTLP_PROTOCOL", "grpc")
    .WithEnvironment("OTEL_SERVICE_NAME", "dj-training-api")
    .WithHttpEndpoint(port: 5001, env: "PORT")
    .WithHttpHealthCheck("/health");

// Web — Next.js frontend
builder.AddJavaScriptApp("web", "./src/web")
    .WithBuildScript("build")
    .WithRunScript("start")
    .WithEnvironment("NEXT_PUBLIC_API_URL", "http://localhost:5001")
    .WithEnvironment("OTEL_EXPORTER_OTLP_ENDPOINT", "http://localhost:4319")
    .WithEnvironment("OTEL_EXPORTER_OTLP_PROTOCOL", "grpc")
    .WithEnvironment("OTEL_SERVICE_NAME", "dj-training-web")
    .WithHttpEndpoint(port: 3001, env: "PORT")
    .WithExternalHttpEndpoints()
    .WithReference(api)
    .WaitFor(api);

// Docs — static docs container built from the repo Dockerfile
builder.AddDockerfile("docs", ".", "docs.Dockerfile")
    .WithHttpEndpoint(port: 8100, targetPort: 8080)
    .WithExternalHttpEndpoints();

builder.Build().Run();
