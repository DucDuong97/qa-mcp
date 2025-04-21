import { chromium } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

(async () => {
  const browser = await chromium.launch({ headless: false }); // Set to true in CI
  const page = await browser.newPage();

  const loginUrl = process.env.LOGIN_URL!;
  const homepageUrl = process.env.HOMEPAGE_URL!;
  const email = process.env.LOGIN_EMAIL!;
  const password = process.env.LOGIN_PASSWORD!;

  await page.goto(loginUrl);

  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button:has-text("Log in as an Instructor")');

  // Wait until we land on the homepage (adjust this if your app behaves differently)
  await page.waitForURL(homepageUrl);

  // Save the login session
  await page.context().storageState({ path: 'auth.json' });

  console.log('✅ Login session saved to auth.json');

  await browser.close();
})();
