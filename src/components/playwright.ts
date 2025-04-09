import { Page, expect, Locator } from "@playwright/test";
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
  instructorPage: Page, 
  ctxt: TestContext,
  {
    courseName = 'Test course',
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

  await escapeUserGuide(instructorPage);

  // save URL
  ctxt.courseUrl = instructorPage.url();

  return async () => {
    await instructorPage.goto(ctxt.courseUrl);

    try {
      await instructorPage.locator('span:has-text("Unpublish course")').waitFor({ state: 'visible' });
      await instructorPage.locator('span:has-text("Unpublish course")').click();
    
      await instructorPage.locator('[data-testid="modal-primary-button"]').waitFor({ state: 'visible' });
      await instructorPage.locator('[data-testid="modal-primary-button"]').click();
    } catch (error) {
      console.log('🔍 No unpublish course button found');
    }

    await instructorPage.getByText('Settings', { exact: true }).waitFor({ state: 'visible' });
    await instructorPage.getByText('Settings', { exact: true }).click();

    await instructorPage.locator('span:has-text("Delete course")').waitFor({ state: 'visible' });
    await instructorPage.locator('span:has-text("Delete course")').click();
  
    await instructorPage.locator('input[placeholder="YES"]').waitFor({ state: 'visible' });
    await instructorPage.locator('input[placeholder="YES"]').click();
  
    await instructorPage.locator('input[placeholder="YES"]').waitFor({ state: 'visible' });
    await instructorPage.locator('input[placeholder="YES"]').fill('YES');
  
    await instructorPage.locator('[data-testid="modal-primary-button"]').waitFor({ state: 'visible' });
    await instructorPage.locator('[data-testid="modal-primary-button"]').click();  
  }
}


export async function createModule(
  instructorPage: Page, 
  context: TestContext,
  { moduleName = 'Magic module', }: { moduleName?: string, },
) {
  await instructorPage.getByRole('button', { name: 'Add new module' }).first().waitFor({ state: 'visible' });
  await instructorPage.getByRole('button', { name: 'Add new module' }).first().click();

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


export async function addTextbook(instructorPage: Page, context: TestContext, { moduleBlock }: { moduleBlock: Locator }) {
  await moduleBlock.locator('span:has-text("Add new item for this module")').waitFor({ state: 'visible' });
  await moduleBlock.locator('span:has-text("Add new item for this module")').click();

  const container = moduleBlock.locator('[data-testid="itemType-selector"]');
  await container.waitFor({ state: 'visible' });
  await container.locator('div:has-text("Select item type")').first().click();

  await instructorPage.getByText("Textbook", {exact: true}).waitFor({ state: 'visible' });
  await instructorPage.getByText("Textbook", {exact: true}).click();
  console.log('✅ Selected Textbook option');

  // Active wait for 3 seconds
  await instructorPage.waitForTimeout(3000);

  const container_book_selector = moduleBlock.locator('[data-testid="book-selector"]');
  await container_book_selector.waitFor({ state: 'visible' });
  await container_book_selector.locator('div:has-text("Select a textbook")').first().click();

  await instructorPage.getByText("Calculus Volume 1", {exact: true}).waitFor({ state: 'visible' });
  await instructorPage.getByText("Calculus Volume 1", {exact: true}).click();

  const container_selection_item = moduleBlock.locator('[data-testid="selection-item"] p:has-text("Chapter 1. Functions and Graphs")');
  await container_selection_item.waitFor({ state: 'visible' });
  await container_selection_item.click();

  await moduleBlock.locator('span:has-text("Add item")').waitFor({ state: 'visible' });
  await moduleBlock.locator('span:has-text("Add item")').click();
}


export async function addAssignment(instructorPage: Page, context: TestContext, { moduleBlock }: { moduleBlock: Locator }) {
  console.log('🚀 Starting assignment creation flow...');
  
  console.log('📝 Finding and clicking "Add new item for this module"...');
  await moduleBlock.locator('span:has-text("Add new item for this module")').waitFor({ state: 'visible' });
  await moduleBlock.locator('span:has-text("Add new item for this module")').click();
  console.log('✅ Clicked add new item button');

  console.log('📝 Selecting item type...');  
  const container = moduleBlock.locator('[data-testid="itemType-selector"]');
  await container.waitFor({ state: 'visible' });
  await container.locator('div:has-text("Select item type")').click();

  console.log('✅ Clicked item type selector');

  console.log('📝 Selecting Assignment option...');
  await instructorPage.getByText("Assignment", {exact: true}).waitFor({ state: 'visible' });
  await instructorPage.getByText("Assignment", {exact: true}).click();
  console.log('✅ Selected Assignment option');

  console.log('📝 Entering assignment title...');
  await moduleBlock.locator('input[placeholder="Enter assignment title"]').waitFor({ state: 'visible' });
  await moduleBlock.locator('input[placeholder="Enter assignment title"]').click();

  await moduleBlock.locator('input[placeholder="Enter assignment title"]').waitFor({ state: 'visible' });
  await moduleBlock.locator('input[placeholder="Enter assignment title"]').fill('Test Assignment');
  console.log('✅ Filled assignment title');

  console.log('📝 Clicking Add item button...');
  await moduleBlock.locator('span:has-text("Add item")').waitFor({ state: 'visible' });
  await moduleBlock.locator('span:has-text("Add item")').click();
  console.log('✅ Clicked Add item button');

  console.log('📝 Finding and clicking created Test Assignment...');
  await moduleBlock.locator('div:has-text("Test Assignment")').click();
  console.log('✅ Clicked on Test Assignment');

  console.log('📝 Navigating to next step...');
  await instructorPage.locator('[data-testid="next-step-button"] span:has-text("Next")').waitFor({ state: 'visible' });
  await instructorPage.locator('[data-testid="next-step-button"] span:has-text("Next")').click();
  console.log('✅ Clicked next step button');

  const container_learning_objective_section_tabs = instructorPage.locator('[data-testid="learning-objective-section-tabs"]');
  await container_learning_objective_section_tabs.waitFor({ state: 'visible' });
  await container_learning_objective_section_tabs.locator('div:has-text("Additional learning objectives")').click();

  await instructorPage.locator('[data-testid="subject-item-title"]').waitFor({ state: 'visible' });
  await instructorPage.locator('[data-testid="subject-item-title"]').click();

  await instructorPage.locator('[data-testid="unit-item-84"]').waitFor({ state: 'visible' });
  await instructorPage.locator('[data-testid="unit-item-84"]').click();

  const container_selection_item = instructorPage.locator('[data-testid="selection-item"] p:has-text("Add and Subtract Integers")');
  await container_selection_item.waitFor({ state: 'visible' });
  await container_selection_item.click();

  await instructorPage.locator('[data-testid="selection-item"] p:has-text("Multiply and Divide Integers")').waitFor({ state: 'visible' });
  await instructorPage.locator('[data-testid="selection-item"] p:has-text("Multiply and Divide Integers")').click();

  console.log('📝 Proceeding to next step...');
  await instructorPage.locator('[data-testid="next-step-button"]').waitFor({ state: 'visible' });
  await instructorPage.locator('[data-testid="next-step-button"]').click();
  console.log('✅ Clicked next step button');

  console.log('📝 Toggling question vary...');
  await instructorPage.locator('[data-testid="question-vary-toggle"]').waitFor({ state: 'visible' });
  await instructorPage.locator('[data-testid="question-vary-toggle"]').click();
  console.log('✅ Toggled question vary');

  console.log('📝 Generating question...');
  await instructorPage.locator('[data-testid="generate-question"]').waitFor({ state: 'visible' });
  await instructorPage.locator('[data-testid="generate-question"]').click();
  console.log('✅ Clicked generate question button');

  console.log('⏱️ Waiting for question generation (5 seconds)...');
  // Active wait for 5 seconds
  await instructorPage.waitForTimeout(5000);
  console.log('✅ Waited for question generation');

  console.log('📝 Moving to next step...');
  const container_next_step_button = instructorPage.locator('[data-testid="next-step-button"]');
  await container_next_step_button.waitFor({ state: 'visible' });
  await container_next_step_button.locator('span:has-text("Next")').click();
  console.log('✅ Clicked next step button');


  console.log('📝 Setting available time...');
  await instructorPage.locator('[data-testid="date-picker__availableDate__input"] div:has-text("Select start date")').waitFor({ state: 'visible' });
  await instructorPage.locator('[data-testid="date-picker__availableDate__input"] div:has-text("Select start date")').click();
  console.log('✅ Clicked available time input');

  console.log('📝 Setting available date...');
  await instructorPage.locator('[aria-label="April 6, 2025"]').waitFor({ state: 'visible' });
  await instructorPage.locator('[aria-label="April 6, 2025"]').click();
  console.log('✅ Set available date');

  await instructorPage.locator('[data-testid="time-picker__availableTime__input"]').waitFor({ state: 'visible' });
  await instructorPage.locator('[data-testid="time-picker__availableTime__input"]').click();

  await instructorPage.locator('[data-testid="time-picker__availableTime__dropdown"] div:has-text("Immediately")').waitFor({ state: 'visible' });
  await instructorPage.locator('[data-testid="time-picker__availableTime__dropdown"] div:has-text("Immediately")').click();
  console.log('✅ Selected immediately option');

  await instructorPage.locator('[data-testid="date-picker__dueDate__input"] div:has-text("Select due date")').waitFor({ state: 'visible' });
  await instructorPage.locator('[data-testid="date-picker__dueDate__input"] div:has-text("Select due date")').click();

  console.log('📝 Setting due date...');
  await instructorPage.locator('[aria-label="April 30, 2025"]').waitFor({ state: 'visible' });
  await instructorPage.locator('[aria-label="April 30, 2025"]').click();
  console.log('✅ Set due date');

  console.log('📝 Setting due time...');
  await instructorPage.locator('[data-testid="time-picker__dueTime__input"]').waitFor({ state: 'visible' });
  await instructorPage.locator('[data-testid="time-picker__dueTime__input"]').click();
  console.log('✅ Clicked due time input');

  await instructorPage.locator('[data-testid="time-picker__dueTime__dropdown"] div:has-text("12:00 AM")').waitFor({ state: 'visible' });
  await instructorPage.locator('[data-testid="time-picker__dueTime__dropdown"] div:has-text("12:00 AM")').click();
  console.log('✅ Selected 12:00 AM option');

  console.log('📝 Finalizing assignment...');
  await instructorPage.locator('button:has-text("Finalize")').waitFor({ state: 'visible' });
  await instructorPage.locator('button:has-text("Finalize")').click();
  console.log('✅ Clicked finalize button');

  console.log('📝 Handling finalizing modal...');
  await instructorPage.locator('[data-testid="publish-assignment-modal"] button:has-text("Finalize")').waitFor({ state: 'visible' });
  await instructorPage.locator('[data-testid="publish-assignment-modal"] button:has-text("Finalize")').click();
  console.log('✅ Clicked on finalizing message');

  console.log('📝 Continuing to course content...');
  await instructorPage.locator('span:has-text("Continue building course content")').waitFor({ state: 'visible' });
  await instructorPage.locator('span:has-text("Continue building course content")').click();
  console.log('🎉 Assignment creation completed successfully');
}

export async function addStudent(instructorPage: Page, context: TestContext, { studentEmail }: { studentEmail: string }) {
  await instructorPage.goto(context.courseUrl);

  await instructorPage.locator('span:has-text("Students")').waitFor({ state: 'visible' });
  await instructorPage.locator('span:has-text("Students")').click();

  await instructorPage.locator('span:has-text("Add student")').first().waitFor({ state: 'visible' });
  await instructorPage.locator('span:has-text("Add student")').first().click();

  await instructorPage.locator('span:has-text("Manually add students")').waitFor({ state: 'visible' });
  await instructorPage.locator('span:has-text("Manually add students")').click();

  await instructorPage.locator('[name="individual.0.email"]').waitFor({ state: 'visible' });
  await instructorPage.locator('[name="individual.0.email"]').click();

  await instructorPage.locator('[name="individual.0.email"]').waitFor({ state: 'visible' });
  await instructorPage.locator('[name="individual.0.email"]').fill('ducdm+student@gotitapp.co');

  await instructorPage.locator("form").getByRole('button', {name: "Add student"}).waitFor({ state: 'visible' });
  await instructorPage.locator("form").getByRole('button', {name: "Add student"}).click();
}