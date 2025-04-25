import { expect } from '@playwright/test';
import { runTest, TestContext } from '../../helpers/index.ts';
import { getTestConfig } from '../../config/test-config.ts';
import { selectDateNextMonth, selectDateToday } from '../../components/index.ts';

test('should duplicate a course successfully', async () => {
  async function prepareFn(ctx: TestContext) {
    // prepareFn is optional, so we can skip it
  }
  async function testFn(ctx: TestContext) {
    const { instructorPage } = ctx;
    if (!instructorPage) {
      throw new Error('Instructor page not initialized');
    }
  
    // Step 1: Click "Create new course"
    await expect(instructorPage.getByText('Create new course', { exact: true })).toBeVisible();
    await instructorPage.getByText('Create new course', { exact: true }).click();

    // Step 2: Select "Duplicate a course"
    await expect(instructorPage.getByText('Duplicate a course', { exact: true })).toBeVisible();
    await instructorPage.getByText('Duplicate a course', { exact: true }).click({ force: true });
    // Step 3: Click "Shared with you"
    await expect(instructorPage.getByText('Shared with you', { exact: true })).toBeVisible();
    await instructorPage.getByText('Shared with you', { exact: true }).click();

    // Step 4: Click "Duplicate course"
    const buttons = instructorPage.getByText('Duplicate course', { exact: true });
    await expect(buttons.nth(1)).toBeVisible(); 
    await buttons.nth(1).click();    

    // Step 5: Confirm modal
    const modalPrimaryBtn = instructorPage.locator('[data-testid="modal-primary-button"]');
    await expect(modalPrimaryBtn).toBeVisible();
    await modalPrimaryBtn.click();

    // Step 6: Fill course name
    const courseNameInput = instructorPage.locator('input[placeholder="e.g. MATH 101"]');
    await expect(courseNameInput).toBeVisible();
    await courseNameInput.fill('KITDS');

    // Step 7: Set start and end dates
// Start date
  const startDatePicker = instructorPage.getByTestId('date-picker__startDate');
  await startDatePicker.waitFor({ state: 'visible' });
  await startDatePicker.click();
  await selectDateToday(instructorPage);
  
  // End date
  const endDatePicker = instructorPage.getByTestId('date-picker__endDate');
  await endDatePicker.waitFor({ state: 'visible' });
  await endDatePicker.click();
  await selectDateNextMonth(instructorPage);
    
  // Step 8: Select course plan
    await expect(instructorPage.getByText('Advanced', { exact: true })).toBeVisible();
    await instructorPage.getByText('Advanced', { exact: true }).click();

    // Step 9: Click Create button
    const createBtn = instructorPage.getByTestId('create-course-btn');
    await expect(createBtn).toBeVisible();
    await createBtn.click();

    // Step 10: Confirm final modal
    await expect(modalPrimaryBtn).toBeVisible();
    await modalPrimaryBtn.click();


    // Step 11: Success message
    const successMessage = instructorPage.getByText('Yay! Your course has been created.', { exact: true });
    await expect(successMessage).toBeVisible({ timeout: 10000 });
    await successMessage.click({ force: true }); // Optional
    
    console.log('✅ Course duplicated successfully');
  }

  await runTest(
    'Duplicate a course', 
    prepareFn,
    testFn,
    {
      ...getTestConfig({
        instructorLogin: {
          env: 'poc',
          email: 'ducdm@gotitapp.co',
          password: 'GotIt123'
        }
      })
    }
  );
});
