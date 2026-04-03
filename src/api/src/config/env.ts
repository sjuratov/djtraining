import fs from 'node:fs';
import path from 'node:path';
import { parseEnv } from 'node:util';

interface LoadApiEnvironmentOptions {
  cwd?: string;
  env?: NodeJS.ProcessEnv;
}

function findEnvFile(startDir: string): string | undefined {
  let currentDir = path.resolve(startDir);

  while (true) {
    const envPath = path.join(currentDir, '.env');
    if (fs.existsSync(envPath)) {
      return envPath;
    }

    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      return undefined;
    }

    currentDir = parentDir;
  }
}

export function loadApiEnvironment(options: LoadApiEnvironmentOptions = {}): string | undefined {
  const cwd = options.cwd ?? process.cwd();
  const env = options.env ?? process.env;
  const envPath = findEnvFile(cwd);

  if (!envPath) {
    return undefined;
  }

  const parsed = parseEnv(fs.readFileSync(envPath, 'utf8'));
  for (const [key, value] of Object.entries(parsed)) {
    if (env[key] === undefined) {
      env[key] = value;
    }
  }

  return envPath;
}
