import { expect } from '@playwright/test';

import { runTest, TestContext } from '../../helpers/playwrightUtils.ts';
import { getTestConfig } from '../../config/test-config.ts';
import { createCourse, createModule, addTextbook, addAssignment, addStudent } from '../../components/playwright.ts';

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

  await addStudent(instructorPage, ctx, { studentEmail: 'ducdm+student@gotitapp.co' });
  // await addAssignment(instructorPage, { moduleBlock });
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
  await instructorPage.locator('span:has-text("Publish course")').first().waitFor({ state: 'visible' });
  await instructorPage.locator('span:has-text("Publish course")').first().click();

  await instructorPage.locator('[data-testid="modal-primary-button"]').first().waitFor({ state: 'visible' });
  await instructorPage.locator('[data-testid="modal-primary-button"]').first().click();

  await expect(instructorPage.getByText('Congratulations!', { exact: true })).toBeVisible();

  // student to open the course
  await studentPage.goto(ctxt.courseUrl);
  await expect(studentPage.getByText('Welcome to your Test course course!', { exact: true })).toBeVisible();

  await studentPage.locator('[data-testid="modal-secondary-button"]').first().waitFor({ state: 'visible' });
  await studentPage.locator('[data-testid="modal-secondary-button"]').first().click();

  // student to ask textbook
  await studentPage.locator('h4:has-text("1.2 Basic Classes of Functions")').first().waitFor({ state: 'visible' });
  await studentPage.locator('h4:has-text("1.2 Basic Classes of Functions")').first().click();
  
  await instructorPage.locator('[data-widget-id="11848"]').first().waitFor({ state: 'visible' });
  await instructorPage.locator('[data-widget-id="11848"]').first().click();

  await instructorPage.locator('span:has-text("Ask a Question")').first().waitFor({ state: 'visible' });
  await instructorPage.locator('span:has-text("Ask a Question")').first().click();

  await instructorPage.locator('//div/div[1]/div/div/div[2]/div/div[2]/div/div[1]/div[2]/div/div[1]/div/div/div[1]/div[1]/p').first().waitFor({ state: 'visible' });
  await instructorPage.locator('//div/div[1]/div/div/div[2]/div/div[2]/div/div[1]/div[2]/div/div[1]/div/div/div[1]/div[1]/p').first().evaluate(el => { el.innerHTML = '<p class="LexicalTheme__paragraph LexicalTheme__ltr" dir="ltr"><span data-lexical-text="true">hello</span></p>'; });

  await studentPage.locator('[aria-label="Send message"]').first().waitFor({ state: 'visible' });
  await studentPage.locator('[aria-label="Send message"]').first().click();

  await expect(instructorPage.locator('//div/div[1]/div/div/div[2]/div/div[2]/div/div[1]/div[1]/div/div[2]/div/ul/div[4]/div/div')).toBeVisible();
}