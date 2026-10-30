import {
  defineConfig
} from '@playwright/test';
export default defineConfig( {
  testDir: './tests/browser', workers: 1, timeout: 120_000,
  use: {
    baseURL: 'http://127.0.0.1:4187', viewport: {
      width: 1440, height: 960
    }, screenshot: 'only-on-failure', trace: 'retain-on-failure',
    launchOptions: {
      executablePath: process.env.WATERFIGHTER_CHROME, args: process.env.WATERFIGHTER_SOFTWARE_GPU ? ['--enable-unsafe-webgpu','--use-angle=swiftshader','--enable-features=Vulkan','--use-vulkan=swiftshader','--no-sandbox'] : []
    }
  },
  webServer: {
    command: 'bun run preview --port 4187 --strictPort', url: 'http://127.0.0.1:4187', reuseExistingServer: false
  },
});
