import { defineConfig } from '@playwright/test';

const e2ePort = process.env.PYLOTPD_E2E_PORT || '10801';
const e2eHost = '127.0.0.1';
const e2eBaseUrl = `http://${e2eHost}:${e2ePort}`;

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  fullyParallel: false,
  retries: 0,
  use: {
    baseURL: e2eBaseUrl,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    headless: true,
  },
  webServer: {
    command: `conda run -n test_env python -m pyplotdesigner.gui.main --no-browser --port ${e2ePort}`,
    url: `${e2eBaseUrl}/ui`,
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
  },
});
