import { Page } from '@playwright/test';

export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  /**
   * Deep-link navigation that survives the app's bootstrap redirect.
   *
   * On the first full load of a browser session (empty sessionStorage) the app
   * fetches login details, stamps sessionStorage['loginDetail'], and then
   * force-navigates to /app/onboard or /app/pulse, clobbering whatever URL was
   * requested (see buesuite-fe-client/src/main.ts). Later loads honor deep
   * links, so: let the hijack land, then re-issue the navigation.
   */
  protected async navigate(path: string): Promise<void> {
    const primed = await this.page
      .evaluate(() => !!sessionStorage.getItem('loginDetail'))
      .catch(() => false); // about:blank / cross-origin → not primed

    await this.page.goto(path);

    if (!primed) {
      await this.page.waitForFunction(() => !!sessionStorage.getItem('loginDetail'), undefined, {
        timeout: 45_000,
      });
      // The hijack fires right after the stamp — wait for it to land (it may
      // be skipped if the requested path already matches the hijack target).
      await this.page
        .waitForURL(/\/app\/(onboard|pulse)/, { timeout: 10_000 })
        .catch(() => undefined);
      await this.page.goto(path);
    }
  }
}
