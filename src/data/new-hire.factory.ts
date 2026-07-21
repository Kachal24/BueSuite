import { faker } from '@faker-js/faker';
import { NewHireData } from './new-hire.types';

/**
 * Builds a unique new-hire payload. The timestamp in the email guarantees
 * uniqueness across runs — the happy-path test creates a real candidate.
 */
export function buildNewHire(overrides: Partial<NewHireData> = {}): NewHireData {
  const firstName = faker.person.firstName().replace(/[^a-zA-Z]/g, '');
  const lastName = faker.person.lastName().replace(/[^a-zA-Z]/g, '');
  return {
    firstName,
    lastName,
    fullName: `${firstName} ${lastName}`,
    email: `e2e.${firstName}.${lastName}.${Date.now()}@acme.com`.toLowerCase(),
    // Valid-looking Indian mobile: 10 digits starting with 9.
    phone: `9${faker.string.numeric(9)}`,
    probationPeriodDays: '90',
    justification: `E2E automation: backfill for ${firstName} ${lastName} (safe to ignore).`,
    ...overrides,
  };
}
