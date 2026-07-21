import { Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';
import { InputFormField } from '../components/input-form-field';
import { MatAutocomplete } from '../components/mat-autocomplete';
import { NewHireData } from '../data/new-hire.types';

/**
 * Visible labels of the stepper's <app-input-form-feild> widgets.
 * "Hire’s ..." labels use the typographic apostrophe U+2019 — matched via regex
 * so nobody ever has to retype the exact character.
 */
export const FIELD_LABELS = {
  hireName: /Hire.s Name/,
  hireEmail: /Hire.s E-mail/,
  joiningDate: 'Joining Date',
  department: 'Department',
  designation: 'Designation',
  location: 'Location',
  workSchedule: 'Work Schedule',
  probationFrequency: 'Probation Frequency',
  probationPeriod: /Probation Period/,
  reason: 'Reason',
  justification: 'Justification',
} as const;

/**
 * The New Hire 5-step wizard (/app/onboarding/new-hire-completion).
 * Single page — steps switch client-side with no URL change, so progress is
 * asserted via the step title (.ob_step_title).
 */
export class NewHireStepperPage extends BasePage {
  static readonly path = '/app/onboarding/new-hire-completion?emp_type=EMPLOYEE&event=NEW_HIRE';

  get stepTitle(): Locator {
    return this.page.locator('.ob_step_title');
  }

  get nextButton(): Locator {
    return this.page.getByRole('button', { name: 'Next' });
  }

  get previousButton(): Locator {
    return this.page.getByRole('button', { name: 'Previous' });
  }

  get saveButton(): Locator {
    return this.page.getByRole('button', { name: 'Save' });
  }

  /** Number input inside the intl-tel widget (<bue-tel-input>). */
  get phoneInput(): Locator {
    return this.page.locator('bue-tel-input').getByRole('textbox').first();
  }

  field(label: string | RegExp): InputFormField {
    return new InputFormField(this.page, label);
  }

  /** Direct navigation — skips the Employee Events list and category chooser. */
  async openDirect(): Promise<void> {
    await this.navigate(NewHireStepperPage.path);
    await expect(this.stepTitle).toBeVisible({ timeout: 90_000 });
  }

  async expectNextDisabled(): Promise<void> {
    await expect(this.nextButton).toBeDisabled();
  }

  async expectNextEnabled(): Promise<void> {
    await expect(this.nextButton).toBeEnabled();
  }

  /** Advances to the next step after the current one's gating passes. */
  async next(): Promise<void> {
    await this.expectNextEnabled();
    await this.nextButton.click();
  }

  // ---- Step 1: Basic Info -------------------------------------------------

  async fillBasicInfo(data: NewHireData): Promise<void> {
    await expect(this.stepTitle).toHaveText(/Who.s joining/);
    await this.field(FIELD_LABELS.hireName).fill(data.fullName);
    await this.field(FIELD_LABELS.hireEmail).fill(data.email);
    await this.phoneInput.fill(data.phone);
    await this.phoneInput.press('Tab'); // triggers the widget's validity check
    await this.field(FIELD_LABELS.joiningDate).pickToday();
  }

  // ---- Step 2: Position Details ------------------------------------------

  /**
   * Picks a position (auto-fills department/designation/location/schedule),
   * then backstops any dropdown the auto-fill left empty and sets the
   * probation period. Only fields checked by the app's disableSubmit() gating
   * are enforced.
   */
  async fillPositionDetails(data: NewHireData): Promise<void> {
    await expect(this.stepTitle).toHaveText(/Tell me about the position/);
    const position = new MatAutocomplete(this.page, this.page.getByPlaceholder('Search Positions'));
    if (data.position) {
      await position.search(data.position);
    } else {
      await position.pickFirst();
    }

    await this.ensureSelected(this.field(FIELD_LABELS.department));
    await this.ensureSelected(this.field(FIELD_LABELS.location));

    // Probation Frequency defaults to "Days"; the period value is mandatory.
    await this.field(FIELD_LABELS.probationPeriod).fill(data.probationPeriodDays);
  }

  /** Waits briefly for position auto-fill; picks the first option if still empty. */
  private async ensureSelected(field: InputFormField): Promise<void> {
    try {
      await expect.poll(() => field.value(), { timeout: 8_000 }).not.toBe('');
    } catch {
      await field.selectFirstOption();
    }
  }

  // ---- Step 3: Compensation ----------------------------------------------

  /**
   * The compensation step (<app-salary-structure>) defaults "Would you like to
   * add Salary?" to Yes. Known app bug: with Yes + the auto-selected salary
   * structure, the component silently emits an empty pay-component row (its
   * payList is rendered nowhere in the UI), and the backend then rejects the
   * final POST with validation errors on pay.detail_list.0.*. Selecting "No"
   * is the only UI-reachable path that submits successfully.
   */
  async fillCompensation(): Promise<void> {
    await expect(this.stepTitle).toHaveText(/The offer, crafted/);
    const salary = this.page.locator('app-salary-structure');
    await expect(salary).toBeVisible();
    await salary.getByRole('radio', { name: 'No' }).check();
  }

  // ---- Step 4: Justification ---------------------------------------------

  async fillJustification(data: NewHireData): Promise<void> {
    await expect(this.stepTitle).toHaveText(/Why are we hiring/);
    const reason = this.field(FIELD_LABELS.reason);
    if (data.reason) {
      await reason.selectOption(data.reason);
    } else {
      await reason.selectFirstOption();
    }
    await this.field(FIELD_LABELS.justification).fill(data.justification);
  }

  // ---- Step 5: Configure --------------------------------------------------

  /** Configure never blocks submission — defaults are accepted. */
  async expectConfigureStep(): Promise<void> {
    await expect(this.stepTitle).toHaveText(/Last touches/);
    await expect(this.page.locator('app-emp-data-event-common-step')).toBeVisible();
  }

  /** Opens the Launch Onboarding dialog from the last step. */
  async save(): Promise<void> {
    await expect(this.saveButton).toBeEnabled();
    await this.saveButton.click();
  }
}
