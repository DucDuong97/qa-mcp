import { Page, expect, chromium } from '@playwright/test';
import { test } from '@jest/globals';

import { getTestConfig } from '../../config/test-config.ts';
import { mailSanbox, runTest, TestContext } from '../../helpers/index.ts';
import { addStudent, createCourse, duplicateCourse, escapeStudentWelcomeModal } from '../../components/index.ts';

test('should signup a student', async () => {
  console.log('🚀 Starting test...');
  
  await runTest(
    'Signup a student', 
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

  if (!ctx.instructorPage) {
    throw new Error('Instructor page not initialized');
  }

  ctx.teardownFns.push(await createCourse(ctx.instructorPage, ctx, {}));

  await ctx.instructorPage.waitForTimeout(2000);
  await addStudent(ctx.instructorPage, ctx, { studentEmail: 'ducdm+student@gotitapp.co' });
}

async function testFn(ctx: TestContext) {
  const { instructorPage, studentPage } = ctx;

  if (!instructorPage) {
    throw new Error('Instructor page not initialized');
  }

  if (!studentPage) {
    throw new Error('Student page not initialized');
  }
  // instructor to publish course
  await instructorPage.goto(ctx.courseUrl);
  console.log('✅ Instructor page loaded');

  await instructorPage.locator('span:has-text("Publish course")').waitFor({ state: 'visible' });
  await instructorPage.locator('span:has-text("Publish course")').click();

  await instructorPage.locator('[data-testid="modal-primary-button"]').waitFor({ state: 'visible' });
  await instructorPage.locator('[data-testid="modal-primary-button"]').click();
  console.log('✅ Course published');
  await expect(instructorPage.getByText('Congratulations!', { exact: true })).toBeVisible();

  // student to open the course
  await studentPage.goto(ctx.courseUrl);
  await escapeStudentWelcomeModal(studentPage);
  console.log('✅ Student page loaded');
  
}