import { expect } from '@playwright/test';

import { runTest, TestContext } from '../../helpers/index.ts';
import { getTestConfig } from '../../config/test-config.ts';
import { createCourse } from '../../components/index.ts';

test('should create a course', async () => {
  console.log('🚀 Starting course creation test...');
  
  await runTest(
    'Create a course', 
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

async function testFn(ctx: TestContext) {
  const { instructorPage } = ctx;

  if (!instructorPage) {
    throw new Error('Instructor page not initialized');
  }

  try {
    await createCourse(instructorPage, ctx, {});
    // Verify successful creation
    console.log('🔍 Verifying course creation...');
    await instructorPage.getByRole('heading', { name: 'Content' }).waitFor({ state: 'visible' });
    await instructorPage.getByLabel('Course details sidebar').getByText('Test course', { exact: true }).waitFor({ state: 'visible' });
    console.log('✅ Course created successfully!');

  } catch (error) {
    console.error('❌ Error during course creation:', error);
    throw error;
  }
}