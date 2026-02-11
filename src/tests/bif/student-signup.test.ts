import { Page, expect, chromium } from '@playwright/test';
import { test } from '@jest/globals';

import { getTestConfig } from '../../config/test-config.ts';
import { mailSanbox, runTest, TestContext } from '../../helpers/index.ts';
import { escapeUserGuide } from '../../components/index.ts';
import { createCourse, createModule, addTextbook, addAssignment, addStudent } from '../../components/index.ts';

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
      }
    })
  );
  
  console.log('🎉 Test completed successfully!');
}, 120000);

const MODULE_NAME = 'Test Module';

async function prepareFn(ctx: TestContext) {

  if (!ctx.instructorPage) {
    throw new Error('Instructor page not initialized');
  }

  ctx.browser = await chromium.launch({
    headless: false,
    slowMo: 200,
  }); // 👈 create the browser
  ctx.context = await ctx.browser.newContext(); // 👈 create context
  ctx.page = await ctx.context.newPage(); // 👈 create page

  ctx.teardownFns.push(async () => {
    await ctx.browser?.close();
  });

  const generatedEmail = await mailSanbox.generateEmail();
  ctx.email = generatedEmail.content;
  console.log('✅ Generated email:', ctx.email);

  ctx.teardownFns.push(await createCourse(ctx.instructorPage, ctx, {}));

  await addStudent(ctx.instructorPage, ctx, { studentEmail: ctx.email });
}

async function testFn(ctx: TestContext) {
  const signupPage = ctx.page;
  const loginUrl = `https://poc.mathgpt.ai/login`;

  await signupPage.goto(loginUrl);
  // Assert text "Sign up" exists
  await expect(signupPage.getByText('Sign up', { exact: true })).toBeVisible();
  // Click on "Sign up"
  await signupPage.locator('xpath=//button[normalize-space(text())="Sign up"]').waitFor({ state: 'visible' });
  await signupPage.locator('xpath=//button[normalize-space(text())="Sign up"]').click();
  // Click on "input"
  await signupPage.locator('xpath=//input[@name="firstName"]').waitFor({ state: 'visible' });
  await signupPage.locator('xpath=//input[@name="firstName"]').click();

  // Type "Test" into Enter your first name
  await signupPage.locator('xpath=//input[@name="firstName"]').waitFor({ state: 'visible' });
  await signupPage.locator('xpath=//input[@name="firstName"]').fill('Test');

  // Click on "input"
  await signupPage.locator('xpath=//input[@name="lastName"]').waitFor({ state: 'visible' });
  await signupPage.locator('xpath=//input[@name="lastName"]').click();

  // Type "Name" into Enter your last name
  await signupPage.locator('xpath=//input[@name="lastName"]').waitFor({ state: 'visible' });
  await signupPage.locator('xpath=//input[@name="lastName"]').fill('Name');

  // Click on "input"
  await signupPage.locator('xpath=//input[@name="email"]').waitFor({ state: 'visible' });
  await signupPage.locator('xpath=//input[@name="email"]').click();

  // Type ctx.email into Enter your email
  await signupPage.locator('xpath=//input[@name="email"]').waitFor({ state: 'visible' });
  await signupPage.locator('xpath=//input[@name="email"]').fill(ctx.email);

  // Click on "input"
  await signupPage.locator('xpath=//input[@name="password"]').waitFor({ state: 'visible' });
  await signupPage.locator('xpath=//input[@name="password"]').click();

  // Type "Gotit!123" into Enter your password
  await signupPage.locator('xpath=//input[@name="password"]').waitFor({ state: 'visible' });
  await signupPage.locator('xpath=//input[@name="password"]').fill('Gotit!123');

  // Click on "Sign up as a Student"
  await signupPage.locator('xpath=//span[normalize-space(text())="Sign up as a Student"]').waitFor({ state: 'visible' });
  await signupPage.locator('xpath=//span[normalize-space(text())="Sign up as a Student"]').click();

  await signupPage.waitForTimeout(5000);
  // Assert element is visible
  await expect(signupPage.getByText('Welcome, Test!')).toBeVisible(); 
  console.log('✅ Signup successfully');


  
}