import { Locator, Page } from '@playwright/test';
import { pickOverlayOption } from './mat-autocomplete';
import { MatDatePicker } from './date-picker';

/**
 * Wrapper around the app's custom <app-input-form-feild> widget.
 *
 * The widget renders no unique ids and hardcoded, non-unique `name` attributes
 * (name="name", name="selectedValue", ...), so a field is located by its visible
 * label: the `.input-feild-common` wrapper containing a matching
 * `span.input-form-field-label`.
 *
 * Beware: labels such as "Hire’s Name" use the typographic apostrophe U+2019 —
 * match them with a regex like /Hire.s Name/ instead of retyping the quote.
 */
export class InputFormField {
  readonly root: Locator;

  constructor(
    private readonly page: Page,
    label: string | RegExp,
    scope?: Locator,
  ) {
    this.root = (scope ?? page.locator('body'))
      .locator('.input-feild-common')
      .filter({ has: page.locator('span.input-form-field-label', { hasText: label }) })
      .first();
  }

  /** The native input/textarea inside the wrapper. */
  get input(): Locator {
    return this.root.locator('input, textarea').first();
  }

  async fill(value: string): Promise<void> {
    await this.input.fill(value);
  }

  async value(): Promise<string> {
    return this.input.inputValue();
  }

  /**
   * SELECT-type fields are Material autocompletes: focusing the input opens the
   * overlay panel, typing filters it, and a mat-option must be clicked (typed
   * text alone fails the widget's "select from dropdown" validation).
   */
  async selectOption(optionText: string | RegExp): Promise<string> {
    await this.input.click();
    if (typeof optionText === 'string') {
      await this.input.fill(optionText);
    }
    return pickOverlayOption(this.page, optionText);
  }

  /** Opens the panel and picks the first option — for environment-specific seed data. */
  async selectFirstOption(): Promise<string> {
    await this.input.click();
    return pickOverlayOption(this.page);
  }

  /** DATE fields: opens the mat-datepicker via its toggle and clicks today's cell. */
  async pickToday(): Promise<void> {
    await this.root.locator('mat-datepicker-toggle button').click();
    await new MatDatePicker(this.page).pickToday();
  }
}
