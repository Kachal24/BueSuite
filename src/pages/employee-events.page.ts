import { Locator } from '@playwright/test';
import { BasePage } from './base.page';

/** The Employee Events landing page (/app/all-events). */
export class EmployeeEventsPage extends BasePage {
  static readonly path = '/app/all-events';

  /** "New Hire" card in the START A TRANSITION grid. */
  get newHireCard(): Locator {
    return this.page
      .locator('.start_transition_wrap .st_card')
      .filter({ hasText: 'New Hire' })
      .first();
  }

  async open(): Promise<void> {
    await this.navigate(EmployeeEventsPage.path);
    // First paint of this page is slow on the dev server — allow extra time.
    await this.page.locator('.start_transition_wrap').waitFor({ timeout: 90_000 });
  }

  /** Clicks the New Hire card → hire-category chooser. */
  async startNewHire(): Promise<void> {
    await this.newHireCard.click();
    await this.page.waitForURL('**/app/onboarding/new-hire**');
  }
}
