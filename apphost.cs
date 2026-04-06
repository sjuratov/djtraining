#:sdk Aspire.AppHost.Sdk@13.2.0
#:package Aspire.Hosting.JavaScript@13.2.0
var builder = DistributedApplication.CreateBuilder(args);

// API — Express.js / TypeScript backend
var api = builder.AddJavaScriptApp("api", "./src/api")
    .WithEnvironment("JWT_SECRET", "aspire-local-dev-jwt-secret")
    .WithEnvironment("APP_URL", "http://localhost:3001")
    .WithEnvironment("API_URL", "http://localhost:5001")
    .WithEnvironment("ENABLE_TEST_ROUTES", "true")
    .WithEnvironment("OTEL_SERVICE_NAME", "dj-training-api")
    .WithHttpEndpoint(port: 5001, env: "PORT")
    .WithHttpHealthCheck("/health");

// Web — Next.js frontend
builder.AddJavaScriptApp("web", "./src/web")
    .WithBuildScript("build")
    .WithRunScript("start")
    .WithEnvironment("NEXT_PUBLIC_API_URL", "http://localhost:5001")
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
