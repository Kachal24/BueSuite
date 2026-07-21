import { Locator, Page, Response, expect } from '@playwright/test';
import { InputFormField } from '../components/input-form-field';
import { NewHireData } from '../data/new-hire.types';

export const DEFAULT_ONBOARDING_PASSWORD = 'bsuite@123';

/**
 * The "One more step before onboarding" dialog opened by the stepper's Save
 * button. Launching goes through a custom confirm modal and then fires
 * POST core/employee/candidate; success shows a "Track Status" dialog that
 * redirects to /app/onboarding/review-flow.
 */
export class LaunchOnboardingDialog {
  readonly root: Locator;

  constructor(private readonly page: Page) {
    // The app stamps the same screenCode id on inner field wrappers too —
    // scope to the dialog wrapper element to stay strict-mode safe.
    this.root = page.locator('.dialog-wrapper#LAUNCH_ONBOARDING_DIALOG');
  }

  get usernameField(): InputFormField {
    return new InputFormField(this.page, 'Username', this.root);
  }

  get passwordField(): InputFormField {
    return new InputFormField(this.page, 'Password', this.root);
  }

  get subjectField(): InputFormField {
    return new InputFormField(this.page, 'Email Subject', this.root);
  }

  /** Quill rich-text editor for the welcome email body. */
  get bodyEditor(): Locator {
    return this.root.locator('app-text-editor .ql-editor');
  }

  get launchButton(): Locator {
    return this.root.getByRole('button', { name: 'Launch Onboarding' });
  }

  async expectOpen(): Promise<void> {
    await expect(this.root).toBeVisible();
  }

  /** The dialog pre-fills username = hire email and a fixed default password. */
  async expectDefaults(hireEmail: string): Promise<void> {
    await expect(this.usernameField.input).toHaveValue(hireEmail);
    await expect(this.passwordField.input).toHaveValue(DEFAULT_ONBOARDING_PASSWORD);
  }

  /**
   * Subject/body come from tenant notification templates and may be empty on a
   * local stack — the Launch button is disabled until both have content, so
   * fill them only when blank.
   */
  async completeEmailContent(data: NewHireData): Promise<void> {
    if (!(await this.subjectField.value())) {
      await this.subjectField.fill(`Welcome aboard, ${data.firstName}!`);
    }
    if (!(await this.bodyEditor.innerText()).trim()) {
      await this.bodyEditor.click();
      await this.bodyEditor.fill(
        `Hi ${data.firstName}, welcome to the team! Your onboarding starts now.`,
      );
    }
  }

  /**
   * Clicks Launch Onboarding, accepts the confirm modal, and returns the
   * response of POST core/employee/candidate for status assertions.
   */
  async launch(): Promise<Response> {
    const candidateResponse = this.page.waitForResponse(
      (r) => r.url().includes('core/employee/candidate') && r.request().method() === 'POST',
      { timeout: 60_000 },
    );
    await expect(this.launchButton).toBeEnabled();
    await this.launchButton.click();

    const confirmModal = this.page.locator('.dialog-wrapper#CONFIRMATION_DIALOG');
    await confirmModal.waitFor({ timeout: 10_000 });
    await confirmModal.locator('button.primary-withBg').click();

    return candidateResponse;
  }

  /** Asserts the success dialog, clicks Track Status, and waits for review-flow. */
  async expectLaunchedAndTrack(): Promise<void> {
    const successDialog = this.page.locator('.dialog-wrapper#LAUNCHED_SUCCESSFULLY_DIALOG');
    await expect(successDialog).toBeVisible({ timeout: 30_000 });
    await successDialog.getByRole('button', { name: 'Track Status' }).click();
    await this.page.waitForURL('**/app/onboarding/review-flow**');
  }
}
