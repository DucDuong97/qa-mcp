import { runTest } from '../helpers/playwrightUtils';
import { Page } from '@playwright/test';


test('should create a course', async () => {
  console.log('🚀 Starting course creation test...');
  
  await runTest(
    'Create a course', 
    testFn, { 
    headless: false,
    slowMo: 1000,
    recordVideo: true,
    timeout: 30000,
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
  try {
    console.log('📝 Starting course creation flow...');

    // Find and click "Create new course" button
    console.log('🔍 Looking for "Create new course" button...');
    const createButton = page.getByText('Create new course', { exact: true });
    await createButton.waitFor({ state: 'visible' });
    await createButton.click();
    console.log('✅ Clicked create new course button');
    
    // Verify "Create Course" title is visible
    console.log('🔍 Verifying create course page...');
    await page.getByText('Create Course', { exact: true }).waitFor({ state: 'visible' });
    console.log('✅ On create course page');
    
    // Click "Manually create" button
    console.log('🖱️ Selecting manual creation...');
    const manualButton = page.getByText('Manually create', { exact: true });
    await manualButton.waitFor({ state: 'visible' });
    await manualButton.click({ force: true });
    console.log('✅ Manual creation selected');
    
    // Verify "Course information" title is visible
    console.log('🔍 Verifying course information form...');
    await page.getByText('Course information', { exact: true }).waitFor({ state: 'visible' });
    console.log('✅ Course information form loaded');
    
    // Fill in course details
    console.log('📝 Filling course details...');
    
    // Course name
    const courseNameInput = page.getByPlaceholder('Enter course name', { exact: true });
    await courseNameInput.waitFor({ state: 'visible' });
    await courseNameInput.fill('Magic course');
    console.log('✅ Course name filled');
    
    // Course subject
    const subjectSelector = page.getByTestId('courseSubject-selector');
    await subjectSelector.waitFor({ state: 'visible' });
    await subjectSelector.click();
    const calculusOption = page.getByText('Calculus', { exact: true });
    await calculusOption.waitFor({ state: 'visible' });
    await calculusOption.click();
    console.log('✅ Course subject selected');
    
    // Date selection
    console.log('📅 Setting course dates...');
    // Start date
    const startDatePicker = page.getByTestId('date-picker__startDate');
    await startDatePicker.waitFor({ state: 'visible' });
    await startDatePicker.click();
    const nextMonthButton = page.getByText('›', { exact: true });
    await nextMonthButton.waitFor({ state: 'visible' });
    await nextMonthButton.click();
    const day12 = page.getByText('12', { exact: true });
    await day12.waitFor({ state: 'visible' });
    await day12.click();
    console.log('✅ Start date set');
    
    // End date
    const endDatePicker = page.getByTestId('date-picker__endDate');
    await endDatePicker.waitFor({ state: 'visible' });
    await endDatePicker.click();
    await nextMonthButton.waitFor({ state: 'visible' });
    await nextMonthButton.click();
    const day16 = page.getByText('16', { exact: true });
    await day16.waitFor({ state: 'visible' });
    await day16.click();
    console.log('✅ End date set');
    
    // Course plan
    const advancedPlan = page.getByText('Advanced', { exact: true });
    await advancedPlan.waitFor({ state: 'visible' });
    await advancedPlan.click();
    console.log('✅ Course plan selected');
    
    // Submit form
    console.log('📤 Submitting course creation...');
    const submitButton = page.getByTestId('manually-create-course-btn');
    await submitButton.waitFor({ state: 'visible' });
    await submitButton.click();
    
    // Handle confirmation
    console.log('🔍 Waiting for confirmation dialog...');
    await page.getByText('Confirmation', { exact: true }).waitFor({ state: 'visible' });
    const confirmButton = page.getByTestId('modal-primary-button');
    await confirmButton.waitFor({ state: 'visible' });
    await confirmButton.click();
    console.log('✅ Confirmed course creation');
    
    // Handle textbook setup
    console.log('📚 Handling textbook setup...');
    await page.getByText('Add textbooks to your course', { exact: true }).waitFor({ state: 'visible' });
    const skipButton = page.getByText('Do later', { exact: true });
    await skipButton.waitFor({ state: 'visible' });
    await skipButton.click();
    console.log('✅ Skipped textbook setup');
    
    // Verify successful creation
    console.log('🔍 Verifying course creation...');
    await page.getByText('Content', { exact: true }).waitFor({ state: 'visible' });
    await page.getByText('Magic course', { exact: true }).waitFor({ state: 'visible' });
    console.log('✅ Course created successfully!');

  } catch (error) {
    console.error('❌ Error during course creation:', error);
    throw error;
  }
}