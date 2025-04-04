import { Page } from 'puppeteer';
import { runTest } from '../helpers/puppeteerUtils.ts';


test('should do an action', async () => {
  console.log('🚀 Starting course creation test...');
  
  await runTest(
    'Do an action', 
    testFn, { 
    headless: false,
    slowMo: 100,
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