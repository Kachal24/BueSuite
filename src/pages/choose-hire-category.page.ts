import { Locator } from '@playwright/test';
import { BasePage } from './base.page';

/** The "Choose how you hire" category page (/app/onboarding/new-hire). */
export class ChooseHireCategoryPage extends BasePage {
  /** Category card for regular employees (heading is "Regular Employee" on the local seed). */
  get employeeCard(): Locator {
    return this.page
      .locator('.new_hire_choose_grid')
      .filter({ has: this.page.locator('.heading_choose', { hasText: /^\s*(Regular\s+)?Employee\s*$/ }) })
      .first();
  }

  /** Clicks "Start Process" on the Employee card → the New Hire stepper. */
  async startEmployeeProcess(): Promise<void> {
    await this.employeeCard.locator('button.common-btn').click();
    await this.page.waitForURL('**/app/onboarding/new-hire-completion**');
  }
}
