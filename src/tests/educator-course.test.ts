import { Page } from 'puppeteer';
import { runTest } from '../helpers/testUtils.ts';


test('should create a course', async () => {
  console.log('🚀 Starting course creation test...');
  
  await runTest(
    'Create a course', 
    testFn, { 
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
  
  console.log('🎉 Test completed successfully!');
});


async function testFn(page: Page) {
  // Find the button with text "Create new course" and click this button
  await page.waitForSelector('text/Create new course');
  await page.click('text/Create new course');
  
  // Make sure you see the title "Create Course"
  await page.waitForSelector('text/Create Course');
  
  // Click on the button "Manually create"
  await page.waitForSelector('text/Manually create');
  await page.click('text/Manually create');
  
  // Make sure you see the title "Course information"
  await page.waitForSelector('text/Course information');
  
  // In the field "Course name", type "Magic course"
  await page.waitForSelector('input[placeholder="Enter course name"]');
  await page.type('input[placeholder="Enter course name"]', 'Magic course');
  
  // In the field "Course subject", open the select dropdown and select "Calculus"
  await page.waitForSelector('[data-testid="courseSubject-selector"]');
  await page.click('[data-testid="courseSubject-selector"]');
  await page.waitForSelector('text/Calculus');
  await page.click('text/Calculus');
  
  // In the field "Start date", open the date picker and select the 12nd day of next month
  await page.waitForSelector('[data-testid="date-picker__startDate"]');
  await page.click('[data-testid="date-picker__startDate"]');
  
  // Click on right single chevron to move to next month
  await page.waitForSelector('text/›');
  await page.click('text/›');
  
  // Select the 12th day
  await page.waitForSelector('text/12');
  await page.click('text/12');
  
  // In the field "End date", open the date picker and select the 16th day of next month
  await page.waitForSelector('[data-testid="date-picker__endDate"]');
  await page.click('[data-testid="date-picker__endDate"]');
  
  // Click on right single chevron to move to next month
  await page.waitForSelector('text/›');
  await page.click('text/›');
  
  // Select the 16th day
  await page.waitForSelector('text/16');
  await page.click('text/16');
  
  // For "Course Plan", select "Advanced"
  await page.waitForSelector('text/Advanced');
  await page.click('text/Advanced');
  
  // Click on the button with the testid "manually-create-course-btn"
  await page.waitForSelector('[data-testid="manually-create-course-btn"]');
  await page.click('[data-testid="manually-create-course-btn"]');
  
  // Check if the pop up with title "Confirmation" is displayed
  await page.waitForSelector('text/Confirmation');
  
  // Click on "Confirm" button
  await page.waitForSelector('[data-testid="modal-primary-button"]');
  await page.click('[data-testid="modal-primary-button"]');
  
  // Wait until the action is executed successfully
  // Check if the page contains the title "Add textbooks to your course"
  await page.waitForSelector('text/Add textbooks to your course');
  
  // Click on the "Do later" button
  await page.waitForSelector('text/Do later');
  await page.click('text/Do later');
  
  // Confirm that you see a welcome banner (checking if we're on the course page)
  await page.waitForSelector('text/Content');
  
  // Additional check to verify we're on the right page by looking for course name
  await page.waitForSelector('text/Magic course');
}