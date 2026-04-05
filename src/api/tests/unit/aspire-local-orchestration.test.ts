import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = path.resolve(process.cwd(), '..', '..');

function readRepoFile(relativePath: string): string {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function readRootPackageJson(): { scripts?: Record<string, string> } {
  return JSON.parse(readRepoFile('package.json')) as { scripts?: Record<string, string> };
}

describe('Aspire local orchestration and OTLP endpoint', () => {
  it('should use aspire run for the interactive local orchestration command', () => {
    const packageJson = readRootPackageJson();

    expect(packageJson.scripts?.['dev:aspire']).toBe('aspire run');
  });

  it('should declare a dedicated OTLP resource in the Aspire app host', () => {
    const source = readRepoFile('apphost.cs');

    expect(source).toMatch(/otel/i);
    expect(source).toContain('OTEL_EXPORTER_OTLP_ENDPOINT');
  });

  it('should wire the OTLP exporter endpoint into both application services', () => {
    const source = readRepoFile('apphost.cs');
    const occurrences = source.match(/OTEL_EXPORTER_OTLP_ENDPOINT/g) ?? [];

    expect(occurrences.length).toBeGreaterThanOrEqual(2);
  });

  it('should expose the OTLP resource on non-default local ports', () => {
    const source = readRepoFile('apphost.cs');

    expect(source).toContain('4319');
    expect(source).toContain('4320');
    expect(source).not.toContain('4317');
    expect(source).not.toContain('4318');
  });
});
