import { defineConfig } from '@playwright/test';

const port = 4187;
export default defineConfig({
  testDir: './tests/browser',
  workers: 1,
  timeout: 45_000,
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    viewport: { width: 1440, height: 960 },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    launchOptions: process.env.WATERFIGHTER_CHROME ? { executablePath: process.env.WATERFIGHTER_CHROME } : {},
  },
  webServer: {
    command: `bun run preview --port ${port} --strictPort`,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: false,
  },
});
