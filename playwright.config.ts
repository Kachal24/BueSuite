import * as path from 'path';
import { defineConfig, devices } from '@playwright/test';
import { env } from './src/config/env';

/**
 * storageState files produced by tests/auth/auth.setup.ts. Only the manager
 * persona is logged in today (it drives the New Hire flow); add more roles
 * here and in auth.setup.ts when a spec needs another perspective.
 */
export const STORAGE_STATE = {
  manager: path.join(__dirname, 'playwright', '.auth', 'manager.json'),
};

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  // Parallel Chromium instances overwhelm the dev-served Angular app (slow
  // loads, occasional worker crashes), so run serially by default locally.
  // Override with --workers=N; CI against a built app can raise this.
  workers: process.env.CI ? undefined : 1,
  // Generous budgets: the app is dev-served (ng serve) and slow on first paint.
  timeout: 120_000,
  expect: { timeout: 10_000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: env.baseUrl,
    actionTimeout: 15_000,
    navigationTimeout: 45_000,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    viewport: { width: 1440, height: 900 },
  },
  projects: [
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
      // Login + silent-re-login verification against a dev-served app can be
      // slow when ng serve is rebuilding — give it extra headroom.
      timeout: 240_000,
    },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
        storageState: STORAGE_STATE.manager,
      },
      dependencies: ['setup'],
    },
  ],
  // No webServer block on purpose: the app needs the docker stack from buesuite-be-core
  // (Keycloak :8090, FastAPI :8000, Postgres :5432) plus the Angular dev server started
  // manually in buesuite-fe-client with:
  //   NODE_OPTIONS=--max-old-space-size=8192 npm start
});
