import { Page, expect } from '@playwright/test';

/**
 * Interacts with an already-open mat-datepicker calendar. Clicking calendar cells
 * is locale-independent, unlike typing text that the date adapter must parse.
 */
export class MatDatePicker {
  constructor(private readonly page: Page) {}

  private get calendar() {
    return this.page.locator('mat-calendar');
  }

  /** Picks today's date (always present in the initial calendar view). */
  async pickToday(): Promise<void> {
    const today = this.calendar.locator('.mat-calendar-body-today');
    await expect(today).toBeVisible();
    await today.click();
    await this.calendar.waitFor({ state: 'hidden', timeout: 5_000 }).catch(() => undefined);
  }

  /** Picks a specific day cell by its aria-label (e.g. "July 30, 2026"). */
  async pickByAriaLabel(label: string | RegExp): Promise<void> {
    const target = this.calendar.getByLabel(label).first();
    await expect(target).toBeVisible();
    await target.click();
    await this.calendar.waitFor({ state: 'hidden', timeout: 5_000 }).catch(() => undefined);
  }
}
