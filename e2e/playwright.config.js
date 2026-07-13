// @ts-check
require('dotenv').config();
const { defineConfig, devices } = require('@playwright/test');

const { STORAGE_STATE_PATH } = require('./utils/storageStatePath');

const PORT = new URL(process.env.BASE_URL || 'http://localhost:4173').port || '4173';
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;
const APP_DIR = process.env.APP_DIR || '..';

module.exports = defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: { timeout: 8_000 },
  fullyParallel: false, // shared Supabase test account -> avoid race conditions
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [
    ['html', { open: 'never' }],
    ['list'],
  ],

  // Runs once before the whole suite: registers/logs in the shared
  // test account and stores its session in storage/auth.json
  globalSetup: require.resolve('./global-setup.js'),

  use: {
    baseURL: BASE_URL,
    storageState: STORAGE_STATE_PATH,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 8_000,
  },

  projects: [
    // Unauthenticated flows (login/register screens themselves)
    {
      name: 'auth-flows',
      testDir: './tests/auth',
      use: { ...devices['Desktop Chrome'], storageState: { cookies: [], origins: [] } },
    },
    // Everything else assumes an authenticated session
    {
      name: 'chromium',
      testIgnore: ['**/tests/auth/**'],
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-chrome',
      testMatch: ['**/tests/pos/**'],
      use: { ...devices['Pixel 7'] },
    },
  ],

  webServer: {
    command: `npx serve ${APP_DIR} -l ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
