import { chromium, expect } from '@playwright/test';
import { runTest, TestContext } from '../../helpers/playwrightUtils.ts';

test('Educator onboarding skip test', async () => {
  await runTest('Educator onboarding skip test', prepareFn, testFn);
});

async function prepareFn(ctx: TestContext) {
  ctx.browser = await chromium.launch(); // 👈 create the browser
  ctx.context = await ctx.browser.newContext(); // 👈 create context
  ctx.page = await ctx.context.newPage(); // 👈 create page
}

async function testFn(ctx: TestContext) {
  const page = ctx.page;
  if (!page) throw new Error('❌ Page was not initialized.');

  try {
    await page.goto('https://app-hotfix.mathgpt.ai/');
    console.log('✅ Navigated to educator signup page:', page.url());

    // Sign up button
    await page
      .getByText('Sign up for free', { exact: true })
      .waitFor({ state: 'visible' });
    await page.getByText('Sign up for free', { exact: true }).click();
    console.log('✅ Clicked Sign up for free button');

    // Click “I'm an Instructor”
    await page
      .getByText("I'm an Instructor", { exact: true })
      .waitFor({ state: 'visible' });
    await page.getByText("I'm an Instructor", { exact: true }).click();
    console.log('✅ Selected signup as Instructor button');

    // Fill first name
    const firstNameInput = page.getByLabel('First name');
    await firstNameInput.waitFor({ state: 'visible' });
    await firstNameInput.fill('daisy');
    console.log('✅ Filled first name');

    // Fill last name
    const timestamp = Date.now();
    const lastNameInput = page.getByLabel('Last name');
    await lastNameInput.waitFor({ state: 'visible' });
    await lastNameInput.fill(`test+${timestamp}`);
    console.log('✅ Filled last name');

    // Fill Institutional email
    const emailInput = page.getByLabel('Institutional email');
    await emailInput.waitFor({ state: 'visible' });
    await emailInput.fill(`daisy+test+${timestamp}@gotitapp.co`);
    console.log('✅ Filled Institutional email');

    // Submit form
    await page
      .getByText('Sign up as an Instructor', { exact: true })
      .waitFor({ state: 'visible' });
    await page.getByText('Sign up as an Instructor', { exact: true }).click();
    console.log('✅ Submitted sign up form');

    // Expect confirmation
    await expect(page.getByText('Email sent', { exact: true })).toBeVisible();
    console.log('✅ Verified email sent');

    console.log('✅ Signup flow completed successfully.');
  } catch (err) {
    console.error('❌ Error during signup test:', err);
    throw err;
  } finally {
    await ctx.browser?.close(); // 👈 ensure we clean upßßß
  }
}
