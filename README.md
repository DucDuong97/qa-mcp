# Test Automation Framework

A lightweight, straightforward test automation framework supporting both Puppeteer and Playwright with video recording and detailed reporting capabilities.

## Features

- 🔄 **Multiple Browser Automation** - Support for both Puppeteer and Playwright
- 📊 **Simplified Design** - Direct, functional approach without complex layers
- 📝 **HTML Reports** - Detailed test execution reports through Jest
- 🎥 **Video Recording** - Records videos of test execution
- 📸 **Screenshots** - Automatically captures screenshots during test failures
- 🏃 **Clean API** - Simple function-based API for testing

## Prerequisites

- Node.js (v14 or later)
- npm or yarn package manager

## Installation

```bash
# Install dependencies
npm install
```

## Project Structure

```
puppeteer-workspace/
├── src/
│   ├── helpers/           # Utility functions and test middleware
│   │   └── testUtils.ts   # Core test utilities and middleware pattern
│   ├── tests/             # Test files
│   │   ├── google-simple.test.ts   # Sample Google search test
│   │   └── todo-simple.test.ts     # Sample TodoMVC test
├── reports/               # Test reports and screenshots
│   └── screenshots/       # Screenshots from test runs
├── videos/                # Recorded videos
├── jest.config.js         # Jest configuration
├── tsconfig.json          # TypeScript configuration
└── package.json           # Project dependencies and scripts
```

## Creating a New Test

Creating a test is straightforward using the recorder-studio extension:

1. **Create Test File**
   - Navigate to `src/tests` directory
   - Duplicate `sample.test.ts`
   - Rename it to reflect your test case (e.g., `login-flow.test.ts`)
   - Update the test description and configure login credentials:
   ```typescript
   test('should [your test description]', async () => {
     await runTest(
       '[Your Test Name]', 
       testFn,
       getTestConfig({
         env: 'your-env',
         role: 'your-role',
         email: 'your-email',
         password: 'your-password'
       })
     );
   });
   ```

2. **Record Test Steps**
   - Open the recorder-studio extension
   - Click "Start Recording"
   - Perform your test actions manually in the browser
   - Use assertion buttons for verifying text, colors, or visibility
   - Click "Pause Recording" when done

3. **Generate Test Code**
   - In the recorder-studio extension:
     - Select "Playwright" from the dropdown (recommended)
     - Click "Generate Test Code"
   - Replace the empty `testFn` in your test file with the generated code

4. **Run Your Test**
   ```bash
   # Run your specific test
   npx jest path/to/your-test.test.ts
   ```

The recorder-studio extension will automatically generate appropriate selectors and assertions based on your recorded actions. The generated code includes proper waits and error handling.

## Running Tests

There are two main use cases for running tests:

### 1. Development Mode (Building Test Scripts)

When building and debugging individual test scripts, use development mode. This mode runs tests with:
- Visible browser for visual feedback
- Slow motion (1000ms) for better observation
- No video recording
- Login credentials configured per test file

```bash
# Run a specific test in development mode
npm run test:dev path/to/test-file.test.ts

# Example:
npm run test:dev src/tests/login-flow.test.ts
```

### 2. Regression Testing Mode

For running multiple tests as part of regression testing. This mode runs with:
- Headless browser for faster execution
- Moderate slow motion (200ms)
- Video recording enabled
- Configurable login credentials

```bash
# Run all tests in a specific folder
npm run test:regression src/tests/folder-name

# Run with specific login credentials
TEST_EMAIL=user@example.com TEST_PASSWORD=pass123 TEST_ENV=app-dev npm run test:regression src/tests/folder-name

# Example:
npm run test:regression src/tests/auth
```

### Additional Commands

```bash
# Clean up test artifacts (reports and videos)
npm run clean
```

## Test Reports

After running the tests, HTML reports will be available in the `reports` directory. Open the `test-report.html` file in a browser to view detailed test results.

## Video Recordings

Test execution videos are automatically saved to the `videos` directory. Each video is named with the test name and timestamp.

## Screenshots

Screenshots are automatically captured when tests fail and saved in the `reports/screenshots` directory.

## Choosing Between Puppeteer and Playwright

Both tools are excellent choices for browser automation, but they have different strengths:

### Puppeteer
- Direct integration with Chrome DevTools Protocol
- Lighter weight if you only need Chrome/Chromium
- Simpler API for basic automation tasks

### Playwright
- Multi-browser support (Chromium, Firefox, WebKit)
- More built-in features for modern web testing
- Better handling of modern web features and auto-waiting

Choose the tool that best fits your specific needs and browser requirements.

## Troubleshooting

- **Issue**: Tests fail with timeout errors
  **Solution**: Increase the timeout value in the test options

- **Issue**: Videos not recording
  **Solution**: Check if the `videos` directory exists and has proper permissions

- **Issue**: Element not found errors
  **Solution**: Use appropriate waits or increase timeouts

## License

MIT 