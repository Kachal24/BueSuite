import { test as base, expect } from '@playwright/test';
import { EmployeeEventsPage } from '../pages/employee-events.page';
import { ChooseHireCategoryPage } from '../pages/choose-hire-category.page';
import { NewHireStepperPage } from '../pages/new-hire-stepper.page';
import { LaunchOnboardingDialog } from '../pages/launch-onboarding.dialog';
import { NewHireData } from '../data/new-hire.types';
import { buildNewHire } from '../data/new-hire.factory';

interface Fixtures {
  employeeEventsPage: EmployeeEventsPage;
  chooseHireCategoryPage: ChooseHireCategoryPage;
  newHireStepperPage: NewHireStepperPage;
  launchDialog: LaunchOnboardingDialog;
  /** Fresh, unique hire data per test. */
  newHireData: NewHireData;
}

export const test = base.extend<Fixtures>({
  employeeEventsPage: async ({ page }, use) => {
    await use(new EmployeeEventsPage(page));
  },
  chooseHireCategoryPage: async ({ page }, use) => {
    await use(new ChooseHireCategoryPage(page));
  },
  newHireStepperPage: async ({ page }, use) => {
    await use(new NewHireStepperPage(page));
  },
  launchDialog: async ({ page }, use) => {
    await use(new LaunchOnboardingDialog(page));
  },
  newHireData: async ({}, use) => {
    await use(buildNewHire());
  },
});

export { expect };
