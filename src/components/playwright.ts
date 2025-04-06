import { Page, expect } from "@playwright/test";
import { TestContext } from "../helpers/playwrightUtils.ts";

export async function escapeUserGuide(page: Page) {
  let okGotIt = page.getByText('OK, got it', { exact: true });
  while (true) {
    try {
      await okGotIt.waitFor({ state: 'visible', timeout: 3000 });
      await okGotIt.click();
      // Re-query the button after clicking as the previous reference might be stale
      okGotIt = page.getByText('OK, got it', { exact: true });
    } catch (error) {
      // No more buttons found, break the loop
      console.log('No more OK, got it buttons found');
      break;
    }
  }
}


export async function createCourse(
  { instructorPage }: TestContext, 
  {
    courseName = 'Magic course',
    subject = 'Calculus',
    startDay = '12',
    endDay = '16',
    plan = 'Advanced',
  }: {
    courseName?: string,
    subject?: string,
    startDay?: string,
    endDay?: string,
    plan?: string,
  },
) {
  console.log('📝 Starting course creation flow...');
  if (!instructorPage) {
    throw new Error('Instructor page not initialized');
  }

  // Find and click "Create new course" button
  console.log('🔍 Looking for "Create new course" button...');
  const createButton = instructorPage.getByText('Create new course', { exact: true });
  await createButton.waitFor({ state: 'visible' });
  await createButton.click();
  console.log('✅ Clicked create new course button');
  
  // Verify "Create Course" title is visible
  console.log('🔍 Verifying create course page...');
  await instructorPage.getByText('Create Course', { exact: true }).waitFor({ state: 'visible' });
  console.log('✅ On create course page');
  
  // Click "Manually create" button
  console.log('🖱️ Selecting manual creation...');
  const manualButton = instructorPage.getByText('Manually create', { exact: true });
  await manualButton.waitFor({ state: 'visible' });
  await manualButton.click({ force: true });
  console.log('✅ Manual creation selected');
  
  // Verify "Course information" title is visible
  console.log('🔍 Verifying course information form...');
  await instructorPage.getByText('Course information', { exact: true }).waitFor({ state: 'visible' });
  console.log('✅ Course information form loaded');
  
  // Fill in course details
  console.log('📝 Filling course details...');
  
  // Course name
  const courseNameInput = instructorPage.getByPlaceholder('Enter course name', { exact: true });
  await courseNameInput.waitFor({ state: 'visible' });
  await courseNameInput.fill(courseName);
  console.log('✅ Course name filled');
  
  // Course subject
  const subjectSelector = instructorPage.getByTestId('courseSubject-selector');
  await subjectSelector.waitFor({ state: 'visible' });
  await subjectSelector.click();
  const calculusOption = instructorPage.getByText(subject, { exact: true });
  await calculusOption.waitFor({ state: 'visible' });
  await calculusOption.click();
  console.log('✅ Course subject selected');
  
  // Date selection
  console.log('📅 Setting course dates...');
  // Start date
  const startDatePicker = instructorPage.getByTestId('date-picker__startDate');
  await startDatePicker.waitFor({ state: 'visible' });
  await startDatePicker.click();
  const nextMonthButton = instructorPage.getByText('›', { exact: true });
  if (!startDay) {
    await nextMonthButton.waitFor({ state: 'visible' });
    await nextMonthButton.click();
  }
  const startDate = instructorPage.getByText(startDay || '12', { exact: true });
  await startDate.waitFor({ state: 'visible' });
  await startDate.click();
  console.log('✅ Start date set');
  
  // End date
  const endDatePicker = instructorPage.getByTestId('date-picker__endDate');
  await endDatePicker.waitFor({ state: 'visible' });
  await endDatePicker.click();
  if (!endDay) {
    await nextMonthButton.waitFor({ state: 'visible' });
    await nextMonthButton.click();
  }
  const endDate = instructorPage.getByText(endDay || '16', { exact: true });
  await endDate.waitFor({ state: 'visible' });
  await endDate.click();
  console.log('✅ End date set');
  
  // Course plan
  const advancedPlan = instructorPage.getByText(plan, { exact: true });
  await advancedPlan.waitFor({ state: 'visible' });
  await advancedPlan.click();
  console.log('✅ Course plan selected');
  
  // Submit form
  console.log('📤 Submitting course creation...');
  const submitButton = instructorPage.getByTestId('manually-create-course-btn');
  await submitButton.waitFor({ state: 'visible' });
  await submitButton.click();
  
  // Handle confirmation
  console.log('🔍 Waiting for confirmation dialog...');
  await instructorPage.getByText('Confirmation', { exact: true }).waitFor({ state: 'visible' });
  const confirmButton = instructorPage.getByTestId('modal-primary-button');
  await confirmButton.waitFor({ state: 'visible' });
  await confirmButton.click();
  console.log('✅ Confirmed course creation');
  
  // Handle textbook setup
  console.log('📚 Handling textbook setup...');
  await instructorPage.getByText('Add textbooks to your course', { exact: true }).waitFor({ state: 'visible' });
  const skipButton = instructorPage.getByText('Do later', { exact: true });
  await skipButton.waitFor({ state: 'visible' });
  await skipButton.click();
  console.log('✅ Skipped textbook setup');

  // save URL
  const url = instructorPage.url();

  return async () => {
    await instructorPage.goto(url);

    await instructorPage.waitForSelector('text/Settings');
    await instructorPage.click('text/Settings');

    await instructorPage.waitForSelector('text/Delete course');
    await instructorPage.click('text/Delete course');

    await instructorPage.waitForSelector('input[placeholder="YES"]');
    await instructorPage.click('input[placeholder="YES"]');

    await instructorPage.waitForSelector('input[placeholder="YES"]');
    await instructorPage.type('input[placeholder="YES"]', 'YES');

    await instructorPage.waitForSelector('[data-testid="modal-primary-button"]');
    await instructorPage.click('[data-testid="modal-primary-button"]');
  }
}


export async function createModule(
  { instructorPage }: TestContext, 
  { moduleName = 'Magic module', }: { moduleName?: string, },
) {
  if (!instructorPage) {
    throw new Error('Instructor page not initialized');
  }

  await instructorPage.getByText('Add new module', { exact: true }).first().waitFor({ state: 'visible' });
  await instructorPage.getByText('Add new module', { exact: true }).first().click();

  await instructorPage.locator('[data-testid="add-new-module-option"]').waitFor({ state: 'visible' });
  await instructorPage.locator('[data-testid="add-new-module-option"]').click();

  await instructorPage.locator('input[placeholder="Enter module name"]').waitFor({ state: 'visible' });
  await instructorPage.locator('input[placeholder="Enter module name"]').click();

  await instructorPage.locator('input[placeholder="Enter module name"]').waitFor({ state: 'visible' });
  await instructorPage.locator('input[placeholder="Enter module name"]').fill(moduleName);

  await instructorPage.getByText('Create module', { exact: true }).waitFor({ state: 'visible' });
  await instructorPage.getByText('Create module', { exact: true }).click();

  await escapeUserGuide(instructorPage);

  const module = instructorPage.getByText(moduleName, { exact: true });
  await expect(module).toBeVisible();

  const moduleBlock = instructorPage.locator(`[data-testid^="module-"]`).filter({ has: module });
  
  return async () => {
    await moduleBlock.locator('[data-testid="vertical-dots-dropdown-btn"]').waitFor({ state: 'visible' });
    await moduleBlock.locator('[data-testid="vertical-dots-dropdown-btn"]').click();
  
    await instructorPage.getByText('Delete permanently', { exact: true }).waitFor({ state: 'visible' });
    await instructorPage.getByText('Delete permanently', { exact: true }).click();
  
    await instructorPage.locator('[data-testid="modal-primary-button"]').waitFor({ state: 'visible' });
    await instructorPage.locator('[data-testid="modal-primary-button"]').click();
  }
}