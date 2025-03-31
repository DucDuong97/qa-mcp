import { 
  runTest
} from '../helpers/testUtils.js';
import { Page } from 'puppeteer';

// Set a global Jest timeout
jest.setTimeout(60000);


// Test 1: Search for Puppeteer
test('should do an action', async () => {
  await runTest('Test Name', async function(page: Page) {
    // put the code here
  }, { 
    headless: false,
    slowMo: 100,
    recordVideo: true,
    timeout: 30000,
    setupLogin: {
      env: 'poc',
      role: 'educator',
      email: 'ducdm@gotitapp.co',
      password: 'GotIt123'
    }
  });
});
