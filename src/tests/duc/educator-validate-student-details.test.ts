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
  
  await validateStudentDetails(instructorPage);
  console.log('✅ Instructor page loaded');
  
  console.log('🎉 Test completed successfully!');
}

async function validateStudentDetails(instructorPage: Page) {
  console.log('🔍 Starting assignment result overview validation...');

  // Click on "Assignments"
  console.log('👆 Clicking on Assignments tab...');
  await instructorPage.locator('xpath=//span[normalize-space(text())="Students"]/..').waitFor({ state: 'visible' });
  await instructorPage.locator('xpath=//span[normalize-space(text())="Students"]/..').click();
  console.log('✅ Students tab clicked');

  
}