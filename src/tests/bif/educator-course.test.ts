import { Page, expect } from '@playwright/test';

import { runTest, TestContext } from '../../helpers/playwrightUtils.ts';
import { getTestConfig } from '../../config/test-config.ts';

test('should create a course', async () => {
  console.log('🚀 Starting course creation test...');
  
  await runTest(
    'Create a course', 
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

  try {
    console.log('📝 Starting course creation flow...');

    // Find and click "Create new course" button
    console.log('🔍 Looking for "Create new course" button...');
    const createButton = instructorPage.getByText('Create new course', { exact: true });
    await createButton.waitFor({ state: 'visible' });
    await createButton.click();
    console.log('✅ Clicked create new course button');
    
    // Verify "Create Course" title is visible
    console.log('🔍 Verifying create course page...');
    await instructorPage.getByText('Create Course', { exact: true }).waitFor({ state: 'visible' });
    console.log('✅ On create course page');
    
    // Click "Manually create" button
    console.log('🖱️ Selecting manual creation...');
    const manualButton = instructorPage.getByText('Manually create', { exact: true });
    await manualButton.waitFor({ state: 'visible' });
    await manualButton.click({ force: true });
    console.log('✅ Manual creation selected');
    
    // Verify "Course information" title is visible
    console.log('🔍 Verifying course information form...');
    await instructorPage.getByText('Course information', { exact: true }).waitFor({ state: 'visible' });
    console.log('✅ Course information form loaded');
    
    // Fill in course details
    console.log('📝 Filling course details...');
    
    // Course name
    const courseNameInput = instructorPage.getByPlaceholder('Enter course name', { exact: true });
    await courseNameInput.waitFor({ state: 'visible' });
    await courseNameInput.fill('Magic course');
    console.log('✅ Course name filled');
    
    // Course subject
    const subjectSelector = instructorPage.getByTestId('courseSubject-selector');
    await subjectSelector.waitFor({ state: 'visible' });
    await subjectSelector.click();
    const calculusOption = instructorPage.getByText('Calculus', { exact: true });
    await calculusOption.waitFor({ state: 'visible' });
    await calculusOption.click();
    console.log('✅ Course subject selected');
    
    // Date selection
    console.log('📅 Setting course dates...');
    // Start date
    const startDatePicker = instructorPage.getByTestId('date-picker__startDate');
    await startDatePicker.waitFor({ state: 'visible' });
    await startDatePicker.click();
    const nextMonthButton = instructorPage.getByText('›', { exact: true });
    await nextMonthButton.waitFor({ state: 'visible' });
    await nextMonthButton.click();
    const day12 = instructorPage.getByText('12', { exact: true });
    await day12.waitFor({ state: 'visible' });
    await day12.click();
    console.log('✅ Start date set');
    
    // End date
    const endDatePicker = instructorPage.getByTestId('date-picker__endDate');
    await endDatePicker.waitFor({ state: 'visible' });
    await endDatePicker.click();
    await nextMonthButton.waitFor({ state: 'visible' });
    await nextMonthButton.click();
    const day16 = instructorPage.getByText('16', { exact: true });
    await day16.waitFor({ state: 'visible' });
    await day16.click();
    console.log('✅ End date set');
    
    // Course plan
    const advancedPlan = instructorPage.getByText('Advanced', { exact: true });
    await advancedPlan.waitFor({ state: 'visible' });
    await advancedPlan.click();
    console.log('✅ Course plan selected');
    
    // Submit form
    console.log('📤 Submitting course creation...');
    const submitButton = instructorPage.getByTestId('manually-create-course-btn');
    await submitButton.waitFor({ state: 'visible' });
    await submitButton.click();
    
    // Handle confirmation
    console.log('🔍 Waiting for confirmation dialog...');
    await instructorPage.getByText('Confirmation', { exact: true }).waitFor({ state: 'visible' });
    const confirmButton = instructorPage.getByTestId('modal-primary-button');
    await confirmButton.waitFor({ state: 'visible' });
    await confirmButton.click();
    console.log('✅ Confirmed course creation');
    
    // Handle textbook setup
    console.log('📚 Handling textbook setup...');
    await instructorPage.getByText('Add textbooks to your course', { exact: true }).waitFor({ state: 'visible' });
    const skipButton = instructorPage.getByText('Do later', { exact: true });
    await skipButton.waitFor({ state: 'visible' });
    await skipButton.click();
    console.log('✅ Skipped textbook setup');
    
    // Verify successful creation
    console.log('🔍 Verifying course creation...');
    await instructorPage.getByText('Content', { exact: true }).waitFor({ state: 'visible' });
    await instructorPage.getByText('Magic course', { exact: true }).waitFor({ state: 'visible' });
    console.log('✅ Course created successfully!');

  } catch (error) {
    console.error('❌ Error during course creation:', error);
    throw error;
  }
}