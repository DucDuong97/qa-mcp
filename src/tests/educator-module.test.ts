import { Page, expect } from '@playwright/test';

import { runTest, escapeUserGuide } from '../helpers/playwrightUtils.ts';
import { getTestConfig } from '../config/test-config.ts';

test('should create and delete a module', async () => {
  console.log('🚀 Starting module management test...');
  
  await runTest(
    'Create and delete module', 
    testFn,
    getTestConfig({
      env: 'poc',
      role: 'educator',
      email: 'ducdm@gotitapp.co',
      password: 'GotIt123'
    })
  );
  
  console.log('🎉 Test completed successfully!');
});

async function testFn(page: Page) {
  await openFirstCourse(page);

  await page.getByText('Add new module', { exact: true }).first().waitFor({ state: 'visible' });
  await page.getByText('Add new module', { exact: true }).first().click();

  await page.locator('[data-testid="add-new-module-option"]').waitFor({ state: 'visible' });
  await page.locator('[data-testid="add-new-module-option"]').click();

  await page.locator('input[placeholder="Enter module name"]').waitFor({ state: 'visible' });
  await page.locator('input[placeholder="Enter module name"]').click();

  await page.locator('input[placeholder="Enter module name"]').waitFor({ state: 'visible' });
  await page.locator('input[placeholder="Enter module name"]').fill('magice module');

  await page.getByText('Create module', { exact: true }).waitFor({ state: 'visible' });
  await page.getByText('Create module', { exact: true }).click();

  await escapeUserGuide(page);

  await expect(page.getByText('magice module', { exact: true })).toBeVisible();

  await page.locator('[data-testid="vertical-dots-dropdown-btn"]').waitFor({ state: 'visible' });
  await page.locator('[data-testid="vertical-dots-dropdown-btn"]').click();

  await page.getByText('Delete permanently', { exact: true }).waitFor({ state: 'visible' });
  await page.getByText('Delete permanently', { exact: true }).click();

  await page.locator('[data-testid="modal-primary-button"]').waitFor({ state: 'visible' });
  await page.locator('[data-testid="modal-primary-button"]').click();
}

async function openFirstCourse(page: Page) {
  await page.getByText('Continue editing', { exact: true }).first().waitFor({ state: 'visible' });
  await page.getByText('Continue editing', { exact: true }).first().click();

  await escapeUserGuide(page);
}