import { Locator, Page, expect } from '@playwright/test';

const OVERLAY_OPTIONS = '.cdk-overlay-container mat-option';

/**
 * Picks a mat-option from the Material overlay (autocomplete panels render there,
 * detached from the triggering input). Returns the visible text of the picked option.
 */
export async function pickOverlayOption(page: Page, text?: string | RegExp): Promise<string> {
  const options = page.locator(OVERLAY_OPTIONS);
  const target = (text ? options.filter({ hasText: text }) : options).first();
  await expect(target).toBeVisible({ timeout: 15_000 });
  const label = (await target.innerText()).trim();
  await target.click();
  // Wait for the panel to close so the next action doesn't hit a stale overlay.
  await options.first().waitFor({ state: 'hidden', timeout: 5_000 }).catch(() => undefined);
  return label;
}

/**
 * Helper for standalone Material autocomplete inputs (e.g. the "Search Positions"
 * field), which are not wrapped in the app's <app-input-form-feild> widget.
 */
export class MatAutocomplete {
  constructor(
    private readonly page: Page,
    readonly input: Locator,
  ) {}

  /** Types to filter the server-backed list, then picks the matching option. */
  async search(text: string, option?: string | RegExp): Promise<string> {
    await this.input.click();
    await this.input.fill(text);
    return pickOverlayOption(this.page, option ?? text);
  }

  /** Opens the panel and picks the first option — for environment-specific seed data. */
  async pickFirst(): Promise<string> {
    await this.input.click();
    return pickOverlayOption(this.page);
  }
}
