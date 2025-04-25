import { expect, Page } from '@playwright/test';

import { runTest, TestContext } from '../../helpers/index.ts';
import { getTestConfig } from '../../config/test-config.ts';
import { addStudent, duplicateCourse, selectDateToday, selectDateNextMonth, escapeStudentWelcomeModal } from '../../components/index.ts';

test('should create and delete a module', async () => {
  console.log('🚀 Starting module management test...');
  
  await runTest(
    'Create and delete module', 
    prepareFn,
    testFn,
    getTestConfig({
      instructorLogin: {
        env: 'poc',
        email: 'ducdm@gotitapp.co',
        password: 'GotIt123'
      },
      studentLogin: {
        env: 'poc',
        email: 'ducdm+student@gotitapp.co',
        password: 'GotIt123'
      }
    })
  );
});

async function prepareFn(ctx: TestContext) {
  const { instructorPage } = ctx;

  if (!instructorPage) {
    throw new Error('Instructor page not initialized');
  }

  const cleanupCourse = await duplicateCourse(instructorPage, ctx, {
    newCourseName: 'Student Do Assignment Copy - ' + Date.now(),
    courseNameToCopy: 'Automation Test - Student Do Assignment',
  });
  ctx.teardownFns.push(cleanupCourse);

  await instructorPage.waitForTimeout(2000);
  await addStudent(instructorPage, ctx, { studentEmail: 'ducdm+student@gotitapp.co' });
}

async function testFn(ctxt: TestContext) {
  const { instructorPage, studentPage } = ctxt;

  if (!instructorPage) {
    throw new Error('Instructor page not initialized');
  }

  if (!studentPage) {
    throw new Error('Student page not initialized');
  }
  // instructor to publish course
  await instructorPage.goto(ctxt.courseUrl);
  console.log('✅ Instructor page loaded');

  // instructor finalize all assignments
  await finalizeAssignment(instructorPage, 'makeAllAttemptsCorrect');
  await finalizeAssignment(instructorPage, 'makeAttemptsPartiallyCorrect');
  console.log('✅ Assignment finalized');

  await instructorPage.locator('span:has-text("Publish course")').waitFor({ state: 'visible' });
  await instructorPage.locator('span:has-text("Publish course")').click();

  await instructorPage.locator('[data-testid="modal-primary-button"]').waitFor({ state: 'visible' });
  await instructorPage.locator('[data-testid="modal-primary-button"]').click();
  console.log('✅ Course published');
  await expect(instructorPage.getByText('Congratulations!', { exact: true })).toBeVisible();

  // student to open the course
  await studentPage.goto(ctxt.courseUrl);
  await escapeStudentWelcomeModal(studentPage);
  console.log('✅ Student page loaded');

  // student to do assignment
  await makeAllAttemptsCorrect(studentPage);
  await makeAttemptsPartiallyCorrect(studentPage);
  
  console.log('🎉 Test completed successfully!');
}

async function finalizeAssignment(instructorPage: Page, assignmentName: string) {
  // Click on "Home"
  await instructorPage.locator('xpath=//*[@id="sidebar-wrapper"]/div[2]/div[2]/div/div/div[1]/div[2]/div/span').waitFor({ state: 'visible' });
  await instructorPage.locator('xpath=//*[@id="sidebar-wrapper"]/div[2]/div[2]/div/div/div[1]/div[2]/div/span').click();

  // Click on "makeAllAttemptsCorrect"
  await instructorPage.locator(`xpath=//div[normalize-space(text())="${assignmentName}"]/..`).waitFor({ state: 'visible' });
  await instructorPage.locator(`xpath=//div[normalize-space(text())="${assignmentName}"]/..`).click();

  console.log('📝 Setting available date...');
  await instructorPage.locator('xpath=//*[@data-testid="date-picker__availableDate__input"]').waitFor({ state: 'visible' });
  await instructorPage.locator('xpath=//*[@data-testid="date-picker__availableDate__input"]').click();
  await selectDateToday(instructorPage);

  // Click on "input"
  await instructorPage.locator('xpath=//*[@data-testid="time-picker__availableTime__input"]').waitFor({ state: 'visible' });
  await instructorPage.locator('xpath=//*[@data-testid="time-picker__availableTime__input"]').click();

  // Click on "Immediately"
  await instructorPage.locator('xpath=//div[normalize-space(text())="Immediately"]').waitFor({ state: 'visible' });
  await instructorPage.locator('xpath=//div[normalize-space(text())="Immediately"]').click();

  console.log('📝 Setting due date...');
  await instructorPage.locator('xpath=//*[@data-testid="date-picker__dueDate__input"]').waitFor({ state: 'visible' });
  await instructorPage.locator('xpath=//*[@data-testid="date-picker__dueDate__input"]').click();
  await selectDateNextMonth(instructorPage);

  // Toggle "Vary questions"
  const questionVaryToggle = instructorPage.locator('xpath=//*[@data-testid="question-vary-toggle"]');
  await questionVaryToggle.waitFor({ state: 'visible' });
  if (await questionVaryToggle.evaluate((el) => el.classList.contains('checked'))) {
    await questionVaryToggle.click();
  }

  // Click on "Finalize"
  await instructorPage.waitForTimeout(1000);
  await instructorPage.locator('xpath=//button[normalize-space(text())="Finalize"]').waitFor({ state: 'visible' });
  await instructorPage.locator('xpath=//button[normalize-space(text())="Finalize"]').click();

  // Click on "Finalizing..."
  await instructorPage.locator('[data-testid="publish-assignment-modal"] button:has-text("Finalize")').waitFor({ state: 'visible' });
  await instructorPage.locator('[data-testid="publish-assignment-modal"] button:has-text("Finalize")').click();
}

async function makeAllAttemptsCorrect(studentPage: Page) {
  console.log('🔍 Student starting makeAllAttemptsCorrect assignment...');
  // Click on "Test Assignment"
  await studentPage.locator('xpath=//h4[normalize-space(text())="makeAllAttemptsCorrect"]').waitFor({ state: 'visible' });
  console.log('✅ Assignment title visible');
  await studentPage.locator('xpath=//h4[normalize-space(text())="makeAllAttemptsCorrect"]').click();
  console.log('✅ Clicked on assignment');

  // Click on "Start"
  await studentPage.locator('xpath=//span[normalize-space(text())="Start"]').waitFor({ state: 'visible' });
  console.log('✅ Start button visible');
  await studentPage.locator('xpath=//span[normalize-space(text())="Start"]').click();
  console.log('✅ Clicked on Start button');

  // Enter answers
  console.log('🔢 Entering first answer (6)...');
  await studentPage.locator('xpath=//*[@data-testid="undefined-preview-state"]/div[1]/div[1]/math-field').waitFor({ state: 'visible' });
  await studentPage.locator('xpath=//*[@data-testid="undefined-preview-state"]/div[1]/div[1]/math-field').fill('1');
  console.log('✅ Entered first answer');

  console.log('🔢 Entering second answer (-16)...');
  await studentPage.locator('xpath=//*[@data-testid="undefined-preview-state"]/div[2]/div[1]/math-field').waitFor({ state: 'visible' });
  await studentPage.locator('xpath=//*[@data-testid="undefined-preview-state"]/div[2]/div[1]/math-field').fill('-27');
  console.log('✅ Entered second answer');

  console.log('🔢 Entering third answer (16)...');
  await studentPage.locator('xpath=//*[@data-testid="undefined-preview-state"]/div[3]/div[1]/math-field').waitFor({ state: 'visible' });
  await studentPage.locator('xpath=//*[@data-testid="undefined-preview-state"]/div[3]/div[1]/math-field').fill('27');
  console.log('✅ Entered third answer');

  console.log('🔢 Entering fourth answer (-6)...');
  await studentPage.locator('xpath=//*[@data-testid="undefined-preview-state"]/div[4]/div[1]/math-field').waitFor({ state: 'visible' });
  await studentPage.locator('xpath=//*[@data-testid="undefined-preview-state"]/div[4]/div[1]/math-field').fill('-1');
  console.log('✅ Entered fourth answer');
  
  // Click on "Submitting"
  await studentPage.locator('xpath=//*[@data-testid="submit-answer-button"]').waitFor({ state: 'visible' });
  await studentPage.locator('xpath=//*[@data-testid="submit-answer-button"]').click();
  console.log('✅ Submitted answer');

  // Assert text "Correct!" exists
  await expect(studentPage.getByText('Correct!', { exact: true })).toBeVisible();

  // Click on "Next"
  console.log('⏭️ Moving to next question...');
  await studentPage.locator('xpath=//*[@data-testid="next-question-button"]').waitFor({ state: 'visible' });
  await studentPage.locator('xpath=//*[@data-testid="next-question-button"]').click();
  console.log('✅ Moved to next question');

  // Enter answers
  console.log('🔢 Entering first answer in second question (-16)...');
  await studentPage.locator('xpath=//*[@data-testid="undefined-preview-state"]/div[1]/div[1]/math-field').waitFor({ state: 'visible' });
  await studentPage.locator('xpath=//*[@data-testid="undefined-preview-state"]/div[1]/div[1]/math-field').fill('-72');
  console.log('✅ Entered first answer in second question');

  console.log('🔢 Entering second answer in second question (24)...');
  await studentPage.locator('xpath=//*[@data-testid="undefined-preview-state"]/div[2]/div[1]/math-field').waitFor({ state: 'visible' });
  await studentPage.locator('xpath=//*[@data-testid="undefined-preview-state"]/div[2]/div[1]/math-field').fill('21');
  console.log('✅ Entered second answer in second question');

  // Click on "Submitting"
  console.log('📝 Submitting answer...');
  await studentPage.locator('xpath=//*[@data-testid="submit-answer-button"]').waitFor({ state: 'visible' });
  await studentPage.locator('xpath=//*[@data-testid="submit-answer-button"]').click();
  console.log('✅ Answer submitted');

  // Assert text "Correct!" exists
  await expect(studentPage.getByText('Correct!', { exact: true })).toBeVisible();

  // Assert text "You've answered all the questions. Take a moment.." exists
  await expect(studentPage.getByText('You\'ve answered all the questions. Take a moment to review your responses, then click "Submit Assignment".', { exact: true })).toBeVisible();

  // Click on "Submit assignment"
  console.log('📥 Submitting entire assignment...');
  await studentPage.locator('xpath=//span[normalize-space(text())="Submit assignment"]').waitFor({ state: 'visible' });
  await studentPage.locator('xpath=//span[normalize-space(text())="Submit assignment"]').click();
  console.log('✅ Clicked on Submit assignment button');

  // Click on "Yes, submit assignment"
  console.log('✅ Confirming assignment submission...');
  await studentPage.locator('xpath=//*[@data-testid="modal-primary-button"]').waitFor({ state: 'visible' });
  await studentPage.locator('xpath=//*[@data-testid="modal-primary-button"]').click();
  console.log('🎉 Assignment successfully submitted!');

  // Assert text "2/2" exists
  await expect(studentPage.locator('xpath=//div[normalize-space(text())="points"]/..').getByText('2/2', { exact: true })).toBeVisible();
}

async function makeAttemptsPartiallyCorrect(studentPage: Page) {
  // Click on "Home"
  await studentPage.locator('xpath=//*[@id="sidebar-wrapper"]/div[2]/div[2]/div/div/div[1]/div[2]/div/span').waitFor({ state: 'visible' });
  await studentPage.locator('xpath=//*[@id="sidebar-wrapper"]/div[2]/div[2]/div/div/div[1]/div[2]/div/span').click();

  console.log('🔍 Student starting makeAttemptsPartiallyCorrect assignment...');
  // Click on "Test Assignment"
  await studentPage.locator('xpath=//h4[normalize-space(text())="makeAttemptsPartiallyCorrect"]').waitFor({ state: 'visible' });
  console.log('✅ Assignment title visible');
  await studentPage.locator('xpath=//h4[normalize-space(text())="makeAttemptsPartiallyCorrect"]').click();
  console.log('✅ Clicked on assignment');

  // Click on "Start"
  await studentPage.locator('xpath=//span[normalize-space(text())="Start"]').waitFor({ state: 'visible' });
  console.log('✅ Start button visible');
  await studentPage.locator('xpath=//span[normalize-space(text())="Start"]').click();
  console.log('✅ Clicked on Start button');

  // Enter answers
  console.log('🔢 Entering first answer (1)...');
  await studentPage.locator('xpath=//*[@data-testid="undefined-preview-state"]/div[1]/div[1]/math-field').waitFor({ state: 'visible' });
  await studentPage.locator('xpath=//*[@data-testid="undefined-preview-state"]/div[1]/div[1]/math-field').fill('1');
  console.log('✅ Entered first answer');

  console.log('🔢 Entering second answer (2)...');
  await studentPage.locator('xpath=//*[@data-testid="undefined-preview-state"]/div[2]/div[1]/math-field').waitFor({ state: 'visible' });
  await studentPage.locator('xpath=//*[@data-testid="undefined-preview-state"]/div[2]/div[1]/math-field').fill('2');
  console.log('✅ Entered second answer');

  console.log('🔢 Entering third answer (3)...');
  await studentPage.locator('xpath=//*[@data-testid="undefined-preview-state"]/div[3]/div[1]/math-field').waitFor({ state: 'visible' });
  await studentPage.locator('xpath=//*[@data-testid="undefined-preview-state"]/div[3]/div[1]/math-field').fill('3');
  console.log('✅ Entered third answer');

  console.log('🔢 Entering fourth answer (4)...');
  await studentPage.locator('xpath=//*[@data-testid="undefined-preview-state"]/div[4]/div[1]/math-field').waitFor({ state: 'visible' });
  await studentPage.locator('xpath=//*[@data-testid="undefined-preview-state"]/div[4]/div[1]/math-field').fill('4');
  console.log('✅ Entered fourth answer');
  
  // Click on "Submitting"
  await studentPage.locator('xpath=//*[@data-testid="submit-answer-button"]').waitFor({ state: 'visible' });
  await studentPage.locator('xpath=//*[@data-testid="submit-answer-button"]').click();
  console.log('✅ Submitted answer');

  // Assert text "Almost there!" exists
  await expect(studentPage.getByText('Almost there!', { exact: true })).toBeVisible();
  // Assert text "0.25" exists
  await expect(studentPage.getByText('0.25', { exact: true })).toBeVisible();

  // Assert text "Attempts: 1/3" exists
  await expect(studentPage.getByText('Attempts: 1/3', { exact: true })).toBeVisible();

  // Click on "Try again"
  await studentPage.locator('xpath=//*[@data-testid="try-again-button"]').waitFor({ state: 'visible' });
  await studentPage.locator('xpath=//*[@data-testid="try-again-button"]').click();

  // Enter answers
  console.log('🔢 Entering first answer (1)...');
  await studentPage.locator('xpath=//*[@data-testid="undefined-preview-state"]/div[1]/div[1]/math-field').waitFor({ state: 'visible' });
  await studentPage.locator('xpath=//*[@data-testid="undefined-preview-state"]/div[1]/div[1]/math-field').fill('1');
  console.log('✅ Entered first answer');

  // Click on "Submitting"
  await studentPage.locator('xpath=//*[@data-testid="submit-answer-button"]').waitFor({ state: 'visible' });
  await studentPage.locator('xpath=//*[@data-testid="submit-answer-button"]').click();
  console.log('✅ Submitted answer');

  // Assert text "Incorrect!" exists
  await expect(studentPage.getByText('Incorrect!', { exact: true })).toBeVisible();
  // Assert text "0/2 points" exists
    await expect(studentPage.getByText('0/2 points', { exact: true })).toBeVisible();

  // Assert text "Attempts: 2/3" exists
  await expect(studentPage.getByText('Attempts: 2/3', { exact: true })).toBeVisible();

  // Click on "Next"
  console.log('⏭️ Moving to next question...');
  await studentPage.locator('xpath=//*[@data-testid="next-question-button"]').waitFor({ state: 'visible' });
  await studentPage.locator('xpath=//*[@data-testid="next-question-button"]').click();
  console.log('✅ Moved to next question');

  // Enter answers
  console.log('🔢 Entering first answer in second question (-16)...');
  await studentPage.locator('xpath=//*[@data-testid="undefined-preview-state"]/div[1]/div[1]/math-field').waitFor({ state: 'visible' });
  await studentPage.locator('xpath=//*[@data-testid="undefined-preview-state"]/div[1]/div[1]/math-field').fill('-72');
  console.log('✅ Entered first answer in second question');

  console.log('🔢 Entering second answer in second question (24)...');
  await studentPage.locator('xpath=//*[@data-testid="undefined-preview-state"]/div[2]/div[1]/math-field').waitFor({ state: 'visible' });
  await studentPage.locator('xpath=//*[@data-testid="undefined-preview-state"]/div[2]/div[1]/math-field').fill('21');
  console.log('✅ Entered second answer in second question');

  // Click on "Submitting"
  console.log('📝 Submitting answer...');
  await studentPage.locator('xpath=//*[@data-testid="submit-answer-button"]').waitFor({ state: 'visible' });
  await studentPage.locator('xpath=//*[@data-testid="submit-answer-button"]').click();
  console.log('✅ Answer submitted');

  // Assert text "Correct!" exists
  await expect(studentPage.getByText('Correct!', { exact: true })).toBeVisible();

  // Assert text "You've answered all the questions. Take a moment.." exists
  await expect(studentPage.getByText('You\'ve answered all the questions. Take a moment to review your responses, then click "Submit Assignment".', { exact: true })).toBeVisible();

  // Click on "Submit assignment"
  console.log('📥 Submitting entire assignment...');
  await studentPage.locator('xpath=//span[normalize-space(text())="Submit assignment"]').waitFor({ state: 'visible' });
  await studentPage.locator('xpath=//span[normalize-space(text())="Submit assignment"]').click();
  console.log('✅ Clicked on Submit assignment button');

  // Click on "Yes, submit assignment"
  console.log('✅ Confirming assignment submission...');
  await studentPage.locator('xpath=//*[@data-testid="modal-primary-button"]').waitFor({ state: 'visible' });
  await studentPage.locator('xpath=//*[@data-testid="modal-primary-button"]').click();
  console.log('🎉 Assignment successfully submitted!');

  // Assert text "2/2" exists
  await expect(studentPage.locator('xpath=//div[normalize-space(text())="points"]/..').getByText('1/2', { exact: true })).toBeVisible();
}