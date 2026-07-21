export interface NewHireData {
  firstName: string;
  lastName: string;
  /** "First Last" — the stepper has a single name field. */
  fullName: string;
  /** Must be unique per run: the backend creates a real candidate + user from it. */
  email: string;
  /** National (Indian) mobile number without country code; the widget validates it. */
  phone: string;
  /** Probation period value typed into the Position Details step. */
  probationPeriodDays: string;
  justification: string;
  /**
   * Optional exact picks for environment-seeded dropdowns. When omitted, the
   * page object picks the first available option (or keeps position auto-fill),
   * so the flow works on any local seed data.
   */
  position?: string;
  reason?: string;
}
