import { expect, Page } from '@playwright/test';
import OpenAI from 'openai';
import 'dotenv/config';

import { runTest, TestContext } from '../../helpers/index.ts';
import { getTestConfig } from '../../config/test-config.ts';
import { addStudent, duplicateCourse, selectDateToday, selectDateNextMonth, escapeStudentWelcomeModal } from '../../components/index.ts';

test('should create and delete a module', async () => {
  console.log('🚀 Starting module management test...');
  
  await runTest(
    'Create and delete module', 
    prepareFn,
    testFn,
    getTestConfig({
      instructorLogin: {
        env: 'app-hotfix',
        email: 'ducdm@gotitapp.co',
        password: 'GotIt123'
      },
      studentLogin: {
        env: 'app-hotfix',
        email: 'ducdm+student1@gotitapp.co',
        password: 'GotIt123'
      }
    }),
  );
}, 300000);

async function prepareFn(ctx: TestContext) {
  const { instructorPage } = ctx;

  if (!instructorPage) {
    throw new Error('Instructor page not initialized');
  }

  const cleanupCourse = await duplicateCourse(instructorPage, ctx, {
    newCourseName: 'Student Do Assignment Copy - ' + Date.now(),
    courseNameToCopy: 'Automation Test - Student Do Assignment',
  });
  ctx.teardownFns.push(cleanupCourse);

  await instructorPage.waitForTimeout(2000);
  await addStudent(instructorPage, ctx, { studentEmail: 'ducdm+student1@gotitapp.co' });
}

async function testFn(ctxt: TestContext) {
  const { instructorPage, studentPage } = ctxt;

  if (!instructorPage) {
    throw new Error('Instructor page not initialized');
  }

  if (!studentPage) {
    throw new Error('Student page not initialized');
  }
  // instructor to publish course
  await instructorPage.goto(ctxt.courseUrl);
  console.log('✅ Instructor page loaded');

  // instructor finalize all assignments
  await finalizeAssignment(instructorPage, 'makeAllAttemptsCorrect');
  console.log('✅ Assignment finalized');

  await instructorPage.locator('span:has-text("Publish course")').waitFor({ state: 'visible' });
  await instructorPage.locator('span:has-text("Publish course")').click();

  await instructorPage.locator('[data-testid="modal-primary-button"]').waitFor({ state: 'visible' });
  await instructorPage.locator('[data-testid="modal-primary-button"]').click();
  console.log('✅ Course published');
  await expect(instructorPage.getByText('Congratulations!', { exact: true })).toBeVisible();

  // student to open the course
  await studentPage.goto(ctxt.courseUrl);
  await escapeStudentWelcomeModal(studentPage);
  console.log('✅ Student page loaded');

  console.log('🔍 Student starting makeAllAttemptsCorrect assignment...');
  // Click on "Test Assignment"
  await studentPage.locator('xpath=//h4[normalize-space(text())="makeAllAttemptsCorrect"]').waitFor({ state: 'visible' });
  console.log('✅ Assignment title visible');
  await studentPage.locator('xpath=//h4[normalize-space(text())="makeAllAttemptsCorrect"]').click();
  console.log('✅ Clicked on assignment');

  // Click on "Start"
  await studentPage.locator('xpath=//span[normalize-space(text())="Start"]').waitFor({ state: 'visible' });
  console.log('✅ Start button visible');
  await studentPage.locator('xpath=//span[normalize-space(text())="Start"]').click();
  console.log('✅ Clicked on Start button');

  // Click on "Ask MathGPT"
  await studentPage.locator('xpath=//*[@data-testid="ask-mathgpt-button"]').waitFor({ state: 'visible' });
  console.log('✅ Ask MathGPT button visible');

  // Assert first bot message does not exist
  await expect(studentPage.locator('//*[@id="chat-list"]/div[2]')).toHaveCount(0);

  await studentPage.locator('xpath=//*[@data-testid="ask-mathgpt-button"]').click();
  console.log('✅ Clicked on Ask MathGPT button');

  // Assert first bot message exists
  const specificPTagLocator = studentPage.locator('xpath=//*[@id="chat-list"]/div[2]/div/div/div[2]/div/div/p');
  await expect(specificPTagLocator).toBeVisible();
  console.log('✅ First bot message P tag visible');

  // Wait for text to be streamed
  await studentPage.waitForTimeout(5000);

  const botMessageText = await specificPTagLocator.textContent();
  console.log('First bot message text:', botMessageText);
  
  // Start of OpenAI API call logic
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY, // Ensure OPENAI_API_KEY is set in your environment
  });

  const systemPrompt = `You are an earnest but not too smart student. Your current task is to evaluate the message you just received from your AI tutor and then formulate a response. The tutor's message is provided as user input. Read it carefully, understand what the tutor is saying or asking, and then write a natural and relevant response from the perspective of a student engaging with the tutor. For example, if the tutor explains something, you might acknowledge it or ask a follow-up question. If the tutor asks you a question, try to answer it.`;

  if (botMessageText && botMessageText.trim() !== "") {
    try {
      console.log('📞 Calling OpenAI API to get student response...');
      const completion = await openai.chat.completions.create({
        model: "gpt-4.1-nano",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: botMessageText }
        ],
        temperature: 0,
      });

      const studentResponse = completion.choices[0]?.message?.content;
      console.log('🤖 Student (AI) Response:', studentResponse);

      if (studentResponse && typeof studentResponse === 'string') {
        console.log('⌨️ Filling student response into editor...');
        await studentPage.locator('.editor-input').fill(studentResponse);
      } else {
        throw new Error('OpenAI API returned an empty or invalid student response.');
      }

    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      throw error;
    }
  } else {
    console.log('⏩ botMessageText is empty or null, skipping OpenAI call.');
  }
  // End of OpenAI API call logic

  await studentPage.locator('[aria-label="Send message"]').waitFor({ state: 'visible' });
  await studentPage.locator('[aria-label="Send message"]').click();

  // Assert first bot message exists
  const secondBotMessagePTag = studentPage.locator('xpath=//*[@id="chat-list"]/div[4]/div/div/div[2]/div/div/p');
  await expect(secondBotMessagePTag).toBeVisible();
  console.log('✅ Second bot message P tag visible');

  // Wait for text to be streamed
  await studentPage.waitForTimeout(5000);

  const secondBotMessageText = await secondBotMessagePTag.textContent();
  console.log('Second bot message text:', secondBotMessageText);
  console.log('🎉 Test completed successfully!');
}

async function finalizeAssignment(instructorPage: Page, assignmentName: string) {
  // Click on "Home"
  await instructorPage.locator('xpath=//*[@id="sidebar-wrapper"]/div[2]/div[2]/div/div/div[1]/div[2]/div/span').waitFor({ state: 'visible' });
  await instructorPage.locator('xpath=//*[@id="sidebar-wrapper"]/div[2]/div[2]/div/div/div[1]/div[2]/div/span').click();

  // Click on "makeAllAttemptsCorrect"
  await instructorPage.locator(`xpath=//div[normalize-space(text())="${assignmentName}"]/..`).waitFor({ state: 'visible' });
  await instructorPage.locator(`xpath=//div[normalize-space(text())="${assignmentName}"]/..`).click();

  console.log('📝 Setting available date...');
  await instructorPage.locator('xpath=//*[@data-testid="date-picker__availableDate__input"]').waitFor({ state: 'visible' });
  await instructorPage.locator('xpath=//*[@data-testid="date-picker__availableDate__input"]').click();
  await selectDateToday(instructorPage);

  // Click on "input"
  await instructorPage.locator('xpath=//*[@data-testid="time-picker__availableTime__input"]').waitFor({ state: 'visible' });
  await instructorPage.locator('xpath=//*[@data-testid="time-picker__availableTime__input"]').click();

  // Click on "Immediately"
  await instructorPage.locator('xpath=//div[normalize-space(text())="Immediately"]').waitFor({ state: 'visible' });
  await instructorPage.locator('xpath=//div[normalize-space(text())="Immediately"]').click();

  console.log('📝 Setting due date...');
  await instructorPage.locator('xpath=//*[@data-testid="date-picker__dueDate__input"]').waitFor({ state: 'visible' });
  await instructorPage.locator('xpath=//*[@data-testid="date-picker__dueDate__input"]').click();
  await selectDateNextMonth(instructorPage);

  // Toggle "Vary questions"
  const questionVaryToggle = instructorPage.locator('xpath=//*[@data-testid="question-vary-toggle"]');
  await questionVaryToggle.waitFor({ state: 'visible' });
  if (await questionVaryToggle.evaluate((el) => el.classList.contains('checked'))) {
    await questionVaryToggle.click();
  }

  // Click on "Finalize"
  await instructorPage.waitForTimeout(1000);
  await instructorPage.locator('xpath=//button[normalize-space(text())="Finalize"]').waitFor({ state: 'visible' });
  await instructorPage.locator('xpath=//button[normalize-space(text())="Finalize"]').click();

  // Click on "Finalizing..."
  await instructorPage.locator('[data-testid="publish-assignment-modal"] button:has-text("Finalize")').waitFor({ state: 'visible' });
  await instructorPage.locator('[data-testid="publish-assignment-modal"] button:has-text("Finalize")').click();
}