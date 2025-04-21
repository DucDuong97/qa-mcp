import { expect } from '@playwright/test';

import { runTest, TestContext } from '../../helpers/playwrightUtils.ts';
import { getTestConfig } from '../../config/test-config.ts';
import { createCourse, createModule, addAssignment, addStudent } from '../../components/playwright.ts';

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
  
  console.log('🎉 Test completed successfully!');
});

const MODULE_NAME = 'Test Module';

async function prepareFn(ctx: TestContext) {
  const { instructorPage } = ctx;

  if (!instructorPage) {
    throw new Error('Instructor page not initialized');
  }

  const cleanupCourse = await createCourse(instructorPage, ctx, {});
  ctx.teardownFns.push(cleanupCourse);

  await createModule(instructorPage, ctx, { moduleName: MODULE_NAME });

  const module = instructorPage.getByText(MODULE_NAME, { exact: true });
  const moduleBlock = instructorPage.locator(`[data-testid^="module-"]`).filter({ has: module });

  await addAssignment(instructorPage, ctx, { moduleBlock });

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
  await instructorPage.locator('span:has-text("Publish course")').waitFor({ state: 'visible' });
  await instructorPage.locator('span:has-text("Publish course")').click();

  await instructorPage.locator('[data-testid="modal-primary-button"]').waitFor({ state: 'visible' });
  await instructorPage.locator('[data-testid="modal-primary-button"]').click();

  await expect(instructorPage.getByText('Congratulations!', { exact: true })).toBeVisible();

  // student to open the course
  await studentPage.goto(ctxt.courseUrl);

  try {
    await expect(studentPage.getByText('Welcome to your Test course course!', { exact: true })).toBeVisible();
  
    await studentPage.locator('[data-testid="modal-secondary-button"]').waitFor({ state: 'visible' });
    await studentPage.locator('[data-testid="modal-secondary-button"]').click();
  } catch (error) {
    console.log('🔴 Welcome modal not found');
  }

  // student to do assignment
  // Click on "Test Assignment"
  await studentPage.locator('xpath=//h4[normalize-space(text())="Test Assignment"]').waitFor({ state: 'visible' });
  await studentPage.locator('xpath=//h4[normalize-space(text())="Test Assignment"]').click();

  // Click on "Start"
  await studentPage.locator('xpath=//span[normalize-space(text())="Start"]').waitFor({ state: 'visible' });
  await studentPage.locator('xpath=//span[normalize-space(text())="Start"]').click();

  // Click on "math-field"
  await studentPage.locator('xpath=//*[@data-testid="undefined-preview-state"]/div[1]/div[1]/math-field').waitFor({ state: 'visible' });
  await studentPage.locator('xpath=//*[@data-testid="undefined-preview-state"]/div[1]/div[1]/math-field').click();

  await studentPage.locator('xpath=//*[@data-testid="undefined-preview-state"]/div[1]/div[1]/math-field').fill('6');

  // Click on "Submitting"
  await studentPage.locator('xpath=//*[@data-testid="submit-answer-button"]').waitFor({ state: 'visible' });
  await studentPage.locator('xpath=//*[@data-testid="submit-answer-button"]').click();

  // Click on "Submit assignment"
  await studentPage.locator('xpath=//span[normalize-space(text())="Submit assignment"]').waitFor({ state: 'visible' });
  await studentPage.locator('xpath=//span[normalize-space(text())="Submit assignment"]').click();

  // Click on "Yes, submit assignment"
  await studentPage.locator('xpath=//*[@data-testid="modal-primary-button"]').waitFor({ state: 'visible' });
  await studentPage.locator('xpath=//*[@data-testid="modal-primary-button"]').click();
}