import { test, expect } from '../../src/fixtures/fixtures';
import { FIELD_LABELS } from '../../src/pages/new-hire-stepper.page';

test.describe('Employee Events — New Hire', () => {
  test('smoke: New Hire stepper is reachable from Employee Events @smoke', async ({
    employeeEventsPage,
    chooseHireCategoryPage,
    newHireStepperPage,
  }) => {
    await employeeEventsPage.open();
    await employeeEventsPage.startNewHire();
    await chooseHireCategoryPage.startEmployeeProcess();

    await expect(newHireStepperPage.stepTitle).toHaveText(/Who.s joining/);
    await expect(newHireStepperPage.field(FIELD_LABELS.hireName).input).toBeVisible();
    await expect(newHireStepperPage.nextButton).toBeVisible();
  });

  test('validation: Next stays disabled until mandatory Basic Info fields are filled', async ({
    newHireStepperPage,
    newHireData,
  }) => {
    await newHireStepperPage.openDirect();

    await newHireStepperPage.expectNextDisabled();

    await newHireStepperPage.field(FIELD_LABELS.hireName).fill(newHireData.fullName);
    await newHireStepperPage.expectNextDisabled();

    await newHireStepperPage.field(FIELD_LABELS.hireEmail).fill(newHireData.email);
    await newHireStepperPage.phoneInput.fill(newHireData.phone);
    await newHireStepperPage.phoneInput.press('Tab');
    await newHireStepperPage.field(FIELD_LABELS.joiningDate).pickToday();

    await newHireStepperPage.expectNextEnabled();
  });

  test('happy path: onboard a new employee end-to-end', async ({
    newHireStepperPage,
    launchDialog,
    newHireData,
  }) => {
    test.slow(); // 5 wizard steps + a real backend submit

    await newHireStepperPage.openDirect();

    await newHireStepperPage.fillBasicInfo(newHireData);
    await newHireStepperPage.next();

    await newHireStepperPage.fillPositionDetails(newHireData);
    await newHireStepperPage.next();

    await newHireStepperPage.fillCompensation();
    await newHireStepperPage.next();

    await newHireStepperPage.fillJustification(newHireData);
    await newHireStepperPage.next();

    await newHireStepperPage.expectConfigureStep();
    await newHireStepperPage.save();

    await launchDialog.expectOpen();
    await launchDialog.expectDefaults(newHireData.email);
    await launchDialog.completeEmailContent(newHireData);

    const response = await launchDialog.launch();
    const body = await response.text().catch(() => '<unreadable body>');
    expect(response.status(), `POST core/employee/candidate → ${response.status()}: ${body}`).toBeLessThan(300);

    await launchDialog.expectLaunchedAndTrack();
  });
});
