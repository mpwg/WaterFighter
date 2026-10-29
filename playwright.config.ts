import { defineConfig } from '@playwright/test';
const useDev=process.env.WATERFIGHTER_TEST_DEV==='1';
const port=useDev?5173:4173;
export default defineConfig({ testDir:'./tests/browser', use:{baseURL:`http://127.0.0.1:${port}`, launchOptions:process.env.WATERFIGHTER_CHROME ? { executablePath:process.env.WATERFIGHTER_CHROME } : {}}, webServer:{command:useDev?'pnpm dev':'pnpm preview',port,reuseExistingServer:true} });
