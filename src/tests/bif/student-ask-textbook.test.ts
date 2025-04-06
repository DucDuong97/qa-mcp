import { expect } from '@playwright/test';

import { runTest, TestContext } from '../../helpers/playwrightUtils.ts';
import { getTestConfig } from '../../config/test-config.ts';
import { escapeUserGuide } from '../../components/playwright.ts';

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
      }
    })
  );
  
  console.log('🎉 Test completed successfully!');
});

async function prepareFn(ctx: TestContext) {
  // prepareFn is optional, so we can skip it
}

async function testFn({ instructorPage }: TestContext) {
}
