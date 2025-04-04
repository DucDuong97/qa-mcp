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

Creating a test is straightforward and doesn't require complex abstractions:

```typescript
import { runTest, navigateTo, clickElement, typeText, TestContext } from '../helpers/testUtils';

// Define your test
test('should perform a task', async () => {
  await runTest('My Test Name', async (page) => {
    // Navigate to a website
    await navigateTo(page, 'https://example.com');
    
    // Interact with page elements
    await typeText(page, '.search-input', 'search term');
    await clickElement(page, '.submit-button');
    
    // Make assertions
    const title = await page.title();
    expect(title).toContain('Expected Text');
  }, {
    headless: true,
    slowMo: 50,
    recordVideo: true,
    timeout: 30000
  });
});
```

## Running Tests

```bash
# Run all tests
npx jest

# Run a specific test file
npx jest path/to/test-file.test.ts

# Clean reports and videos
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