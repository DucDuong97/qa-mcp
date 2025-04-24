import { chromium, expect, Page } from '@playwright/test';
import { runTest, TestContext, mailSanbox } from '../../helpers/index.ts';
import { InboxItem, EmailMessage } from '../../types/easy-yopmail-types.ts';
import { getTestConfig } from '../../config/test-config.ts';

test('Educator onboarding skip test', async () => {
  await runTest('Educator onboarding skip test', prepareFn, testFn, getTestConfig({}));
});

async function prepareFn(ctx: TestContext) {
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
}

async function testFn(ctx: TestContext) {
  const page = ctx.page;
  if (!page) throw new Error('❌ Page was not initialized.');

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
  await emailInput.fill(ctx.email);
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

  // Read email
  await page.waitForTimeout(5000);
  const inbox = await mailSanbox.readInbox(ctx.email);
  const latestInbox: InboxItem | null = inbox.content.inbox?.[0];
  if (!latestInbox) throw new Error('❌ No inbox item found', { cause: inbox });
  const subject = latestInbox.subject;

  expect(subject).toContain('Welcome to MathGPT, instructor! Verify your email to get started');

  const messageId = latestInbox.id;
  console.log('✅ Read inbox:', inbox);

  const message = await mailSanbox.readMessage(ctx.email, messageId, 'HTML');
  const messageContent = message.content?.content;
  if (!messageContent) throw new Error('❌ No message content found');
  if (typeof messageContent !== 'string') throw new Error('❌ Message content is not a string');
  
  console.log('✅ Read message:', message);

  const link = messageContent.match(/https:\/\/.*\.mathgpt\.ai\/signup\?request_code=.*&amp;role\=educator/)?.[0];
  if (!link) throw new Error('❌ No link found');
  console.log('✅ Extracted link:', link);

  // Signup Completion Form
  await page.goto(decodeHtml(decodeURIComponent(link)));
  console.log('✅ Navigated to verify email page:', page.url());

  await fillSignUpForm(page);
  await onboardingSkipFull(page);
}

async function fillSignUpForm(signUpPage: Page) {
  // Click on "input"
  await signUpPage.locator('xpath=//input[@name="institutionName"]').waitFor({ state: 'visible' });
  await signUpPage.locator('xpath=//input[@name="institutionName"]').click();

// Type "GotIt" into Enter your institution name
  await signUpPage.locator('xpath=//input[@name="institutionName"]').waitFor({ state: 'visible' });
  await signUpPage.locator('xpath=//input[@name="institutionName"]').fill('GotIt');

// Click on "Select your role"
  await signUpPage.locator('xpath=//*[@id="react-select-2-placeholder"]').waitFor({ state: 'visible' });
  await signUpPage.locator('xpath=//*[@id="react-select-2-placeholder"]').click();

// Click on "Instructor"
  await signUpPage.locator('xpath=//*[@id="react-select-2-option-0"]').waitFor({ state: 'visible' });
  await signUpPage.locator('xpath=//*[@id="react-select-2-option-0"]').click();

// Click on "input"
  await signUpPage.locator('xpath=//input[@name="password"]').waitFor({ state: 'visible' });
  await signUpPage.locator('xpath=//input[@name="password"]').click();

// Type "GotIt123" into Create a password
  await signUpPage.locator('xpath=//input[@name="password"]').waitFor({ state: 'visible' });
  await signUpPage.locator('xpath=//input[@name="password"]').fill('GotIt123');

// Click on "Select an option"
  await signUpPage.locator('xpath=//*[@id="react-select-3-placeholder"]').waitFor({ state: 'visible' });
  await signUpPage.locator('xpath=//*[@id="react-select-3-placeholder"]').click();

// Click on "Google"
  await signUpPage.locator('xpath=//*[@id="react-select-3-option-0"]').waitFor({ state: 'visible' });
  await signUpPage.locator('xpath=//*[@id="react-select-3-option-0"]').click();

// Click on "Sign up as an Instructor"
  await signUpPage.locator('xpath=//span[normalize-space(text())="Sign up as an Instructor"]').waitFor({ state: 'visible' });
  await signUpPage.locator('xpath=//span[normalize-space(text())="Sign up as an Instructor"]').click();
}

async function onboardingSkipFull(instructorPage: Page) {
  // Assert text "We're excited to have you here!" exists
  await expect(instructorPage.getByText('We\'re excited to have you here!', { exact: true })).toBeVisible();

// Click on "I'd like some help setting up my course."
  await instructorPage.locator('xpath=//div[normalize-space(text())="I\'d like some help setting up my course."]').waitFor({ state: 'visible' });
  await instructorPage.locator('xpath=//div[normalize-space(text())="I\'d like some help setting up my course."]').click();

// Assert text "Application menu" exists
  await expect(instructorPage.getByText('Application menu', { exact: true })).toBeVisible();

// Click on "Next"
  await instructorPage.locator('xpath=//span[normalize-space(text())="Next"]/..').waitFor({ state: 'visible' });
  await instructorPage.locator('xpath=//span[normalize-space(text())="Next"]/..').click();

// Assert text "Sample course" exists
  await expect(instructorPage.getByText('Sample course', { exact: true })).toBeVisible();

// Click on "Next"
  await instructorPage.locator('xpath=//span[normalize-space(text())="Next"]/..').waitFor({ state: 'visible' });
  await instructorPage.locator('xpath=//span[normalize-space(text())="Next"]/..').click();

// Assert text "Create your own courses" exists
  await expect(instructorPage.getByText('Create your own courses', { exact: true })).toBeVisible();

// Click on "Next"
  await instructorPage.locator('xpath=//span[normalize-space(text())="Next"]/..').waitFor({ state: 'visible' });
  await instructorPage.locator('xpath=//span[normalize-space(text())="Next"]/..').click();

// Assert text "Need assistance?" exists
  await expect(instructorPage.getByText('Need assistance?', { exact: true })).toBeVisible();

// Click on "Finish"
  await instructorPage.locator('xpath=//button[normalize-space(text())="Finish"]').waitFor({ state: 'visible' });
  await instructorPage.locator('xpath=//button[normalize-space(text())="Finish"]').click();

// Assert text "Instructor" exists
  await expect(instructorPage.getByText('Instructor', { exact: true })).toBeVisible();
}

function decodeHtml(html: string) {
  return html.replace(/&amp;/g, '&');
}