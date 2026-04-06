import { Before, After, AfterStep, BeforeAll, AfterAll, setDefaultTimeout } from '@cucumber/cucumber';
import { CustomWorld } from './world';
import * as fs from 'fs';
import * as path from 'path';
import { execFileSync } from 'child_process';

setDefaultTimeout(30_000);

const SCREENSHOT_BASE_DIR = path.resolve(process.cwd(), 'docs', 'screenshots');
const GENERATE_SCREENSHOTS = process.env.GENERATE_SCREENSHOTS === 'true';
const WEB_URL = process.env.WEB_URL || 'http://localhost:3001';
const API_URL = process.env.API_URL || 'http://localhost:5001';
const WEB_CONNECT_URL = WEB_URL.replace('localhost', '127.0.0.1');
const API_CONNECT_URL = API_URL.replace('localhost', '127.0.0.1');

let aspireStarted = false;
const currentAppHostPath = path.resolve(process.cwd(), 'apphost.cs');
let startedServicePids: number[] = [];

function runAspireCommand(args: string[], timeout: number): string {
  return execFileSync('aspire', [...args, '--nologo'], {
    cwd: process.cwd(),
    encoding: 'utf-8',
    timeout,
  });
}

function getListeningPids(port: number): number[] {
  try {
    const output = execFileSync('lsof', [`-tiTCP:${port}`, '-sTCP:LISTEN'], {
      cwd: process.cwd(),
      encoding: 'utf-8',
      timeout: 5000,
    });

    return output
      .split(/\s+/)
      .map((value) => Number.parseInt(value, 10))
      .filter((value) => Number.isInteger(value));
  } catch {
    return [];
  }
}

function stopCurrentAspireAppHost(): void {
  for (const pid of startedServicePids) {
    try {
      process.kill(pid, 'SIGTERM');
    } catch {
      // Process may already be gone.
    }
  }

  startedServicePids = [];
}

async function isServerRunning(url: string): Promise<boolean> {
  try {
    await fetch(url);
    return true;
  } catch {
    return false;
  }
}

BeforeAll(async function () {
  fs.mkdirSync(SCREENSHOT_BASE_DIR, { recursive: true });

  // Use this repo's Aspire AppHost to orchestrate all services (API + Web).
  // Another Aspire app may already be running on the machine, so only the
  // health of DJ Training itself determines whether we need to start it.
  if (!(await isServerRunning(`${API_CONNECT_URL}/health`)) || !(await isServerRunning(WEB_CONNECT_URL))) {
    console.log('Starting Aspire AppHost...');
    runAspireCommand(['start'], 60000);
    aspireStarted = true;

    // Wait for API to be healthy
    console.log('Waiting for API to be healthy...');
    runAspireCommand(['wait', 'api', '--status', 'healthy', '--timeout', '60'], 70000);

    console.log('Waiting for Web to be healthy...');
    runAspireCommand(['wait', 'web', '--status', 'healthy', '--timeout', '60'], 70000);
    startedServicePids = [...new Set([3101, 5101, 8100].flatMap((port) => getListeningPids(port)))];
  }
});

Before(async function (this: CustomWorld, { pickle, gherkinDocument }) {
  // Reset stores for test isolation
  try {
    await fetch(`${API_CONNECT_URL}/api/test/reset`, { method: 'POST' });
  } catch { /* server may not be ready yet */ }

  this.featureName = gherkinDocument?.feature?.name || 'unknown-feature';
  this.scenarioName = pickle.name || 'unknown-scenario';
  this.stepIndex = 0;
  this.apiBaseUrl = API_CONNECT_URL;
  this.webBaseUrl = WEB_CONNECT_URL;

  await this.openBrowser();
  // Navigate to the actual app so UI-first scenarios have a live page context
  if (this.page) {
    try {
      await this.page.goto(WEB_CONNECT_URL, { waitUntil: 'networkidle', timeout: 15000 });
    } catch {
      try { await this.page.goto(WEB_CONNECT_URL, { waitUntil: 'domcontentloaded', timeout: 10000 }); } catch { /* best effort */ }
    }
  }
});

AfterStep(async function (this: CustomWorld, { pickleStep, result }) {
  this.stepIndex++;
  if (this.page) {
    const stepText = pickleStep?.text || `step-${this.stepIndex}`;
    // Extract Gherkin keyword from the step text (Given/When/Then/And)
    const keyword = (pickleStep as any)?.keyword?.trim() ||
      (stepText.match(/^(Given|When|Then|And|But)\b/)?.[1] ?? 'Step');
    const status = result?.status?.toString() || 'PASSED';
    // Inject visual overlay showing current step context
    await this.injectStepOverlay(keyword, stepText, status);
    await this.takeStepScreenshot(stepText);
  }
});

After(async function (this: CustomWorld, { result }) {
  if (this.page) {
    // Only mark as failure for actually FAILED tests — not pending or skipped
    let status: string;
    switch (result?.status) {
      case 'PASSED':
        status = 'final';
        break;
      case 'FAILED':
        status = 'failure';
        break;
      case 'PENDING':
      case 'SKIPPED':
      case 'UNDEFINED':
        status = 'skipped';
        break;
      default:
        status = 'final';
    }
    const dir = this.screenshotDir;
    fs.mkdirSync(dir, { recursive: true });
    try {
      await this.page.screenshot({
        path: path.join(dir, `999-${status}.png`),
        fullPage: true,
      });
    } catch { /* Browser may already be closed */ }
  }
  await this.closeBrowser();
});

AfterAll(async function () {
  if (aspireStarted) {
    stopCurrentAspireAppHost();
    aspireStarted = false;
  }
});
