import { expect, Page } from '@playwright/test';

import { runTest, TestContext } from '../../helpers/index.ts';
import { getTestConfig } from '../../config/test-config.ts';
import { addStudent, duplicateCourse, selectDateToday, selectDateNextMonth, escapeStudentWelcomeModal, escapeUserGuide } from '../../components/index.ts';

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
    })
  );
});

async function prepareFn(ctx: TestContext) {
}

async function testFn(ctxt: TestContext) {
  const { instructorPage } = ctxt;

  if (!instructorPage) {
    throw new Error('Instructor page not initialized');
  }

  // instructor to check the assignment
  await instructorPage.goto("https://poc.mathgpt.ai/courses/2923");

  console.log('🚫 Escaping any user guide popups...');
  await escapeUserGuide(instructorPage);
  console.log('✅ User guide escaped');
  
  await validateAssignmentResultOverview(instructorPage);
  console.log('✅ Instructor page loaded');
  
  console.log('🎉 Test completed successfully!');
}

async function validateAssignmentResultOverview(instructorPage: Page) {
  console.log('🔍 Starting assignment result overview validation...');

  // Click on "Assignments"
  console.log('👆 Clicking on Assignments tab...');
  await instructorPage.locator('xpath=//span[normalize-space(text())="Assignments"]/..').waitFor({ state: 'visible' });
  await instructorPage.locator('xpath=//span[normalize-space(text())="Assignments"]/..').click();
  console.log('✅ Assignments tab clicked');

  console.log('🚫 Escaping any user guide popups...');
  await escapeUserGuide(instructorPage);
  console.log('✅ User guide escaped');

  // Click on "makeAttemptsPartiallyCorrect"
  console.log('👆 Opening makeAttemptsPartiallyCorrect assignment...');
  await instructorPage.locator('div').filter({ hasText: /^makeAttemptsPartiallyCorrect$/ }).first().waitFor({ state: 'visible' });
  await instructorPage.locator('div').filter({ hasText: /^makeAttemptsPartiallyCorrect$/ }).first().click();
  console.log('✅ Assignment opened');

  // Click on "Result overview"
  console.log('👆 Opening Result overview section...');
  await instructorPage.locator('xpath=//div[normalize-space(text())="Result overview"]').waitFor({ state: 'visible' });
  await instructorPage.locator('xpath=//div[normalize-space(text())="Result overview"]').click();
  console.log('✅ Result overview section opened');

  // Assert text "1m" exists
  console.log('✨ Validating average time spent...');
  await expect(instructorPage.locator('xpath=//*[@data-testid="avg-time-spent"]')).toHaveText('1m');
  console.log('✅ Average time spent validated: 1m');

  // Assert text "1/2" exists
  console.log('✨ Validating average score...');
  await expect(instructorPage.locator('xpath=//*[@data-testid="avg-score"]')).toHaveText('1/2');
  console.log('✅ Average score validated: 1/2');

  // Assert text "1/1" exists
  console.log('✨ Validating total submissions...');
  await expect(instructorPage.locator('xpath=//*[@data-testid="total-submissions"]')).toHaveText('1/1');
  console.log('✅ Total submissions validated: 1/1');

  // Click on "View details"
  console.log('👆 Opening detailed view...');
  await instructorPage.locator('xpath=//*[@data-testid="row"]').waitFor({ state: 'visible' });
  await instructorPage.locator('xpath=//*[@data-testid="row"]').click();
  console.log('✅ Detailed view opened');

  // Click on "Student’s work"
  await instructorPage.locator('xpath=//div[normalize-space(text())="Student’s work"]').waitFor({ state: 'visible' });
  await instructorPage.locator('xpath=//div[normalize-space(text())="Student’s work"]').click();
  // Assert text "View details" exists
  // await expect(instructorPage.locator('xpath=//button[normalize-space(text())="Hide details"]')).toHaveText('Hide details');

  // Click on "div"
  await instructorPage.locator('xpath=//*[@data-testid="toggle-show-correct-answer-button"]').waitFor({ state: 'visible' });
  await instructorPage.locator('xpath=//*[@data-testid="toggle-show-correct-answer-button"]').click();

  // Assert text "QUESTION AND CORRECT ANSWER(S):" exists
  await expect(instructorPage.locator('xpath=//div[normalize-space(text())="QUESTION AND CORRECT ANSWER(S):"]')).toHaveText('QUESTION AND CORRECT ANSWER(S):');

  // Assert color is "rgb(240, 68, 56)"
  await expect(instructorPage.locator('xpath=//*[@data-testid="attempt-item-2"]/*[local-name()="svg"]')).toHaveCSS('color', 'rgb(240, 68, 56)');

// Assert color is "rgb(247, 144, 9)"
  await expect(instructorPage.locator('xpath=//*[@data-testid="attempt-item-1"]/*[local-name()="svg"]')).toHaveCSS('color', 'rgb(247, 144, 9)');

// Click on "1"
  await instructorPage.locator('xpath=//*[@data-testid="attempt-item-1"]').waitFor({ state: 'visible' });
  await instructorPage.locator('xpath=//*[@data-testid="attempt-item-1"]').click();

// Assert color is "rgb(16, 24, 40)"
  await expect(instructorPage.locator('xpath=//*[@data-testid="undefined-preview-state"]/div[1]/div[1]/div[1]')).toHaveCSS('color', 'rgb(16, 24, 40)');

  console.log('🎉 Assignment result overview validation completed successfully!');
}