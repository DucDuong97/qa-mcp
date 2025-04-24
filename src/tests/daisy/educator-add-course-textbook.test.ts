import { expect } from '@playwright/test';

import { runTest, TestContext } from '../../helpers/index.ts';
import { getTestConfig } from '../../config/test-config.ts';
import {
  selectDateNextMonth,
  selectDateToday,
  escapeUserGuide,
} from '../../components/index.ts';

test('should create a course', async () => {
  console.log('🚀 Starting course creation test...');

  await runTest(
    'Create a course',
    prepareFn,
    testFn,
    getTestConfig({
      instructorLogin: {
        env: 'app-hotfix',
        email: 'daisy+devhf_educator_01@gotitapp.co',
        password: '123456aA@',
      },
    })
  );

  console.log('🎉 Test completed successfully!');
});

async function prepareFn(ctx: TestContext) {
  // prepareFn is optional, so we can skip it
}

async function testFn(ctx: TestContext): Promise<void> {
  const today = new Date();
  const startDay = today.getDate().toString();
  const endDate = new Date();
  endDate.setDate(today.getDate() + 30);
  const endDay = endDate.getDate().toString();

  const { instructorPage } = ctx;

  if (!instructorPage) {
    throw new Error('Instructor page not initialized');
  }

  try {
    // Click on "Create new course"
    const createButton = instructorPage.getByText('Create new course', {
      exact: true,
    });
    await createButton.waitFor({ state: 'visible' });
    await createButton.click();

    // Click on "Manually create"
    const manualButton = instructorPage.getByText('Manually create', {
      exact: true,
    });
    await manualButton.waitFor({ state: 'visible' });
    await manualButton.click({ force: true });

    // Type "Daisy test course " into Enter course name
    await instructorPage
      .getByLabel('Course name', { exact: true })
      .waitFor({ state: 'visible' });
    await instructorPage.getByLabel('Course name', { exact: true }).click();
    await instructorPage
      .getByLabel('Course name', { exact: true })
      .fill('Daisy test course ');

    // Click on "Select course subject"
    await instructorPage
      .locator('#react-select-2-placeholder')
      .waitFor({ state: 'visible' });
    await instructorPage.locator('#react-select-2-placeholder').click();

    // Click on "College Algebra"
    await instructorPage
      .locator('#react-select-2-option-2')
      .waitFor({ state: 'visible' });
    await instructorPage.locator('#react-select-2-option-2').click();

    // Select Start date
    const startDatePicker = instructorPage.getByTestId(
      'date-picker__startDate'
    );
    await startDatePicker.waitFor({ state: 'visible' });
    await startDatePicker.click();
    if (!startDay) {
      await selectDateToday(instructorPage);
    } else {
      const startDate = instructorPage.getByText(startDay || '12', {
        exact: true,
      });
      await startDate.waitFor({ state: 'visible' });
      await startDate.click();
    }
    console.log('✅ Start date set');

    // Select End date
    const endDatePicker = instructorPage.getByTestId('date-picker__endDate');
    await endDatePicker.waitFor({ state: 'visible' });
    await endDatePicker.click();
    if (!endDay) {
      await selectDateNextMonth(instructorPage);
    } else {
      const endDate = instructorPage.getByText(endDay || '16', { exact: true });
      await endDate.waitFor({ state: 'visible' });
      await endDate.click();
    }
    console.log('✅ End date set');

    // Select Course plan: Advanced
    await instructorPage
      .getByText('Advanced', { exact: true })
      .waitFor({ state: 'visible' });
    await instructorPage.getByText('Advanced', { exact: true }).click();
    console.log('✅ Advanced plan selected');

    // Click on "Manually create"
    await instructorPage
      .locator('[data-testid="manually-create-course-btn"]')
      .waitFor({ state: 'visible' });
    await instructorPage
      .locator('[data-testid="manually-create-course-btn"]')
      .click();
    console.log('✅ Manually create course button clicked');

    // Click on "Create course"
    await instructorPage
      .locator('[data-testid="modal-primary-button"]')
      .waitFor({ state: 'visible' });
    await instructorPage
      .locator('[data-testid="modal-primary-button"]')
      .click();
    console.log('✅ Confirmed create course');

    // Select "College Algebra 2e" textbook
    await instructorPage
      .getByText('College Algebra 2e', { exact: true })
      .waitFor({ state: 'visible' });
    await instructorPage
      .getByText('College Algebra 2e', { exact: true })
      .click();
    console.log('✅ College Algebra 2e textbook selected');

    // Click on "Add selected textbooks"
    await instructorPage
      .getByText('Add selected textbooks', { exact: true })
      .waitFor({ state: 'visible' });
    await instructorPage
      .getByText('Add selected textbooks', { exact: true })
      .click();
    console.log('✅ Clicked add selected textbook');

    // Click on "Chapter 2. Equations and Inequalities"
    await instructorPage
      .getByText('Chapter 2. Equations and Inequalities', { exact: true })
      .waitFor({ state: 'visible' });
    await instructorPage
      .getByText('Chapter 2. Equations and Inequalities', { exact: true })
      .click();
    console.log('✅ Selected Chapter 2');

    // Click on "Add to course content"
    await instructorPage
      .getByText('Add to course content', { exact: true })
      .waitFor({ state: 'visible' });
    await instructorPage
      .getByText('Add to course content', { exact: true })
      .click();
    console.log('✅ Clicked Add to course content');

    // Assert text "Chapter 2. Equations and Inequalities" exists
    await expect(
      instructorPage.getByText('Chapter 2. Equations and Inequalities', {
        exact: true,
      })
    ).toBeVisible();
    console.log('✅ Chapter 2 is added to course content successfully');

    await escapeUserGuide(instructorPage);

    /// Verify College Algebra 2e textbook selected in Course settings
    // Click on "Settings"
    await instructorPage
      .getByText('Settings', { exact: true })
      .waitFor({ state: 'visible' });
    await instructorPage.getByText('Settings', { exact: true }).click();
    console.log('✅ Settings page is clicked');

    // Assert text "College Algebra 2e" exists
    await expect(
      instructorPage.getByText('College Algebra 2e', { exact: true })
    ).toBeVisible();
  } catch (error) {
    console.error('❌ An error during course creation:', error);
    throw error;
  }
}
