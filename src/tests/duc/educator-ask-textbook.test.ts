import { expect } from '@playwright/test';

import { runTest, TestContext } from '../../helpers/index.ts';
import { getTestConfig } from '../../config/test-config.ts';
import { createCourse, createModule, addTextbook, addAssignment, addStudent } from '../../components/index.ts';

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

  await addTextbook(instructorPage, ctx, { moduleBlock });
  // await addAssignment(instructorPage, { moduleBlock });

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

  // student to ask textbook
  await studentPage.locator('h4:has-text("1.2 Basic Classes of Functions")').waitFor({ state: 'visible' });
  await studentPage.locator('h4:has-text("1.2 Basic Classes of Functions")').click();
  
  await instructorPage.locator('[data-widget-id="11848"]').waitFor({ state: 'visible' });
  await instructorPage.locator('[data-widget-id="11848"]').click();

  await instructorPage.locator('span:has-text("Ask a Question")').waitFor({ state: 'visible' });
  await instructorPage.locator('span:has-text("Ask a Question")').click();

  await instructorPage.locator('//div/div[1]/div/div/div[2]/div/div[2]/div/div[1]/div[2]/div/div[1]/div/div/div[1]/div[1]/p').waitFor({ state: 'visible' });
  await instructorPage.locator('//div/div[1]/div/div/div[2]/div/div[2]/div/div[1]/div[2]/div/div[1]/div/div/div[1]/div[1]/p').evaluate(el => { el.innerHTML = '<p class="LexicalTheme__paragraph LexicalTheme__ltr" dir="ltr"><span data-lexical-text="true">hello</span></p>'; });

  await studentPage.locator('[aria-label="Send message"]').waitFor({ state: 'visible' });
  await studentPage.locator('[aria-label="Send message"]').click();

  // student to do assignment

}