import { Page, expect } from '@playwright/test';

import { runTest, escapeUserGuide, TestContext } from '../../helpers/playwrightUtils.ts';
import { getTestConfig } from '../../config/test-config.ts';

test('should create and delete a module', async () => {
  console.log('🚀 Starting module management test...');
  
  await runTest(
    'Create and delete module', 
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

async function testFn({ instructorPage }: TestContext) {
  if (!instructorPage) {
    throw new Error('Instructor page not initialized');
  }

  await openFirstCourse(instructorPage);

  await instructorPage.getByText('Add new module', { exact: true }).first().waitFor({ state: 'visible' });
  await instructorPage.getByText('Add new module', { exact: true }).first().click();

  await instructorPage.locator('[data-testid="add-new-module-option"]').waitFor({ state: 'visible' });
  await instructorPage.locator('[data-testid="add-new-module-option"]').click();

  await instructorPage.locator('input[placeholder="Enter module name"]').waitFor({ state: 'visible' });
  await instructorPage.locator('input[placeholder="Enter module name"]').click();

  await instructorPage.locator('input[placeholder="Enter module name"]').waitFor({ state: 'visible' });
  await instructorPage.locator('input[placeholder="Enter module name"]').fill('magice module');

  await instructorPage.getByText('Create module', { exact: true }).waitFor({ state: 'visible' });
  await instructorPage.getByText('Create module', { exact: true }).click();

  await escapeUserGuide(instructorPage);

  await expect(instructorPage.getByText('magice module', { exact: true })).toBeVisible();

  await instructorPage.locator('[data-testid="vertical-dots-dropdown-btn"]').waitFor({ state: 'visible' });
  await instructorPage.locator('[data-testid="vertical-dots-dropdown-btn"]').click();

  await instructorPage.getByText('Delete permanently', { exact: true }).waitFor({ state: 'visible' });
  await instructorPage.getByText('Delete permanently', { exact: true }).click();

  await instructorPage.locator('[data-testid="modal-primary-button"]').waitFor({ state: 'visible' });
  await instructorPage.locator('[data-testid="modal-primary-button"]').click();
}

async function openFirstCourse(page: Page) {
  await page.getByText('Continue editing', { exact: true }).first().waitFor({ state: 'visible' });
  await page.getByText('Continue editing', { exact: true }).first().click();

  await escapeUserGuide(page);
}