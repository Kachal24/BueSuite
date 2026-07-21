import { Browser, Page, expect, test as setup } from '@playwright/test';
import { STORAGE_STATE } from '../../playwright.config';
import { env } from '../../src/config/env';

/**
 * The app bootstraps keycloak-js with onLoad:'login-required', so any
 * unauthenticated visit is redirected to the Keycloak hosted login page.
 * This setup test logs in through that page as the manager (the persona that
 * initiates New Hire) and saves the browser state (Keycloak SSO cookies on
 * :8090) so specs start already authenticated. Add further roles here only
 * when a spec actually needs them.
 */
async function keycloakLogin(page: Page, username: string, statePath: string): Promise<void> {
  await page.goto('/');
  await page.waitForURL(/\/realms\/.+\/protocol\/openid-connect\/auth/, { timeout: 60_000 });
  await page.locator('#username').fill(username);
  await page.locator('#password').fill(env.password);
  await page.locator('#kc-login').click();
  // Token exchange done → app shell loads (lands on /app/pulse or /app/onboard).
  await page.waitForURL('**/app/**', { timeout: 90_000 });
  await page.context().storageState({ path: statePath });
}

/**
 * Go/no-go gate for the storageState strategy: a fresh context restored from
 * the saved state must silently re-authenticate via the Keycloak SSO cookie
 * (keycloak-js keeps tokens in memory, so cookies are all the state we have).
 * Failing here beats confusing downstream failures in every spec.
 */
async function verifySilentReLogin(browser: Browser, statePath: string): Promise<void> {
  const context = await browser.newContext({ storageState: statePath });
  const page = await context.newPage();
  await page.goto(env.baseUrl);
  // Landing on an /app/** URL (instead of the Keycloak login form) is the
  // proof of silent re-auth. The app keeps client-side navigating right after,
  // so don't query the DOM here — element assertions race the redirects.
  await page.waitForURL('**/app/**', { timeout: 60_000 });
  await expect(page).not.toHaveURL(/openid-connect/);
  await context.close();
}

setup('authenticate as manager', async ({ page, browser }) => {
  await keycloakLogin(page, env.managerEmail, STORAGE_STATE.manager);
  await verifySilentReLogin(browser, STORAGE_STATE.manager);
});
