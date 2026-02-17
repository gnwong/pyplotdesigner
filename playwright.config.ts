import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  fullyParallel: false,
  retries: 0,
  use: {
    baseURL: 'http://127.0.0.1:10801',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    headless: true,
  },
  webServer: {
    command: 'conda run -n test_env python -m pyplotdesigner.gui.main --no-browser --port 10801',
    url: 'http://127.0.0.1:10801/ui',
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
  },
});
