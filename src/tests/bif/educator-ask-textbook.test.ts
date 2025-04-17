import { Page, expect } from '@playwright/test';

import { getTestConfig } from '../../config/test-config.ts';
import { runTest, TestContext } from '../../helpers/playwrightUtils.ts';
import { escapeUserGuide } from '../../components/playwright.ts';

test('should do an action', async () => {
  console.log('🚀 Starting test...');
  
  await runTest(
    'Do an action', 
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
});


async function prepareFn(ctx: TestContext) {
  // prepareFn is optional, so we can skip it
}

async function testFn({ instructorPage }: TestContext) {
  if (!instructorPage) {
    throw new Error('instructorPage is undefined');
  }
  await instructorPage.locator('[aria-label="My Library"]').waitFor({ state: 'visible' });
  await instructorPage.locator('[aria-label="My Library"]').click();

// Click on "Book details"
  await instructorPage.locator('[aria-label="View details of Calculus Volume 1 book"]').waitFor({ state: 'visible' });
  await instructorPage.locator('[aria-label="View details of Calculus Volume 1 book"]').click();

// Click on "3. Derivatives"
  await instructorPage.getByText('3. Derivatives').waitFor({ state: 'visible' });
  await instructorPage.getByText('3. Derivatives').click();

// Click on "3.2. The Derivative as a Function"
  await instructorPage.getByText('3.2. The Derivative as a Function').waitFor({ state: 'visible' });
  await instructorPage.getByText('3.2. The Derivative as a Function').click();

  await instructorPage.waitForTimeout(2000);

// Click on "Widget 163194"
  await instructorPage.locator('#widget-12269').waitFor({ state: 'visible' });
  await instructorPage.locator('#widget-12269').click();

// Click on "Ask a Question"
  await instructorPage.getByText('Ask a Question').waitFor({ state: 'visible' });
  await instructorPage.getByText('Ask a Question').click();

// Click on "Ask MathGPT..."
  await instructorPage.locator('div').filter({ hasText: /^Ask MathGPT\.\.\.$/ }).first().waitFor({ state: 'visible' });
  await instructorPage.locator('.editor-input').fill('What is the annual revenue of Tesla?');

// Click on "div"
  await instructorPage.locator('[aria-label="Send message"]').waitFor({ state: 'visible' });
  await instructorPage.locator('[aria-label="Send message"]').click();

  await instructorPage.getByText('MathGPT is designed to only focus on math-related queries for your course').waitFor({ state: 'visible' });
  expect(instructorPage.getByText('MathGPT is designed to only focus on math-related queries for your course')).toBeVisible();

}