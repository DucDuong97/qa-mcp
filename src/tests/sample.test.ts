import { Page, expect } from '@playwright/test';
import { runTest } from '../helpers/playwrightUtils.ts';


test('should do an action', async () => {
  console.log('🚀 Starting course creation test...');
  
  await runTest(
    'Do an action', 
    testFn, { 
    headless: false,
    recordVideo: true,
    timeout: 60000,
    setupLogin: {
      env: 'poc',
      role: 'educator',
      email: 'ducdm@gotitapp.co',
      password: 'GotIt123'
    }
  });
  
  console.log('🎉 Test completed successfully!');
});


async function testFn(page: Page) {
  // Add your test logic here
}