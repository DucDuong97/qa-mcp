import { expect, Page } from '@playwright/test';

import { runTest, TestContext } from '../../helpers/playwrightUtils.ts';
import { getTestConfig } from '../../config/test-config.ts';
import { createCourse, createModule } from '../../components/playwright.ts';

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
    }),
  );
  
  console.log('🎉 Test completed successfully!');
});

// Variables shared between prepareFn and testFn
const moduleName = 'Test Module';

async function prepareFn(ctx: TestContext) {
  if (!ctx.instructorPage) {
    throw new Error('Instructor page not initialized');
  }

  console.log('🔧 Preparing test environment...');

  ctx.teardownFns.push(await createCourse(ctx, {}));
  
  console.log('✅ Test environment preparation complete');
}

async function testFn(ctx: TestContext) {
  const { instructorPage } = ctx;
  if (!instructorPage) {
    throw new Error('Instructor page not initialized');
  }

  console.log('🧪 Starting module creation test...');

  // Create a module
  const cleanupModule = await createModule(ctx, {
    moduleName,
  });
  
  // Add teardown function to the context
  ctx.teardownFns = ctx.teardownFns || [];
  ctx.teardownFns.push(cleanupModule);
  
  // Verify module was created
  await expect(instructorPage.getByText(moduleName, { exact: true })).toBeVisible();
  
  console.log('✅ Module creation verified');
}
