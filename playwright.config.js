import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30 * 1000,
  expect: {
    timeout: 5000
  },
  use: {
    headless: true,
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        browserName: 'chromium',
        // We need to launch chrome with the extension loaded
        launchOptions: {
            args: [
                `--disable-extensions-except=${process.cwd()}`,
                `--load-extension=${process.cwd()}`
            ],
            headless: true 
        }
      },
    },
  ],
});