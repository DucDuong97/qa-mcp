import { Page, expect } from '@playwright/test';

import { runTest, escapeUserGuide } from '../helpers/playwrightUtils.ts';
import { getTestConfig } from '../config/test-config.ts';

test('should do an action', async () => {
  console.log('🚀 Starting test...');
  
  await runTest(
    'Do an action', 
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
  // Your test steps will be generated by recorder-studio
}