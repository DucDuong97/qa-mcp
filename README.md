# Test Automation Framework

A lightweight, straightforward test automation framework using Puppeteer with video recording and detailed reporting capabilities.

## Features

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

# Build MCP
npm run build
```

## Configure Claude MCP
1. Open Claude Desktop.
2. Use "Cmd + ," to open the settings, open the "Developer" tab.
3. Click on "Edit Config".
4. Open `claude_desktop_config.json` with VS Code.
5. Add the following configuration:
```json
{
  "mcpServers": {
    "puppeteer": {
      "command": "node",
      "args": ["/Users/<YOU>/projects/puppeteer-workspace/dist/mcp.js"]
    }
  }
}
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
  await runTest('My Test Name', async (ctx: TestContext) => {
    const { page } = ctx;
    
    // Navigate to a website
    await navigateTo(page, 'https://example.com');
    
    // Interact with page elements
    await typeText(page, '.search-input', 'search term');
    await clickElement(page, '.submit-button');
    
    // Make assertions
    const title = await page.title();
    expect(title).toContain('Expected Text');
  }, {
    // Test configuration options
    headless: true,
    slowMo: 50,
    recordVideo: true,
    timeout: 30000
  });
});
```

## Helper Functions

The framework provides these simple helper functions:

- `navigateTo(page, url)` - Navigate to a URL
- `clickElement(page, selector)` - Click on an element
- `typeText(page, selector, text)` - Type text into an input field
- `getText(page, selector)` - Get text from an element

## Running Tests

```bash
# Run all tests
npx jest

# Run a specific test file
npx jest path/to/test-file.test.ts

# Build the project
npm run build

# Clean reports and videos
npm run clean
```

## Test Reports

After running the tests, HTML reports will be available in the `reports` directory. Open the `test-report.html` file in a browser to view detailed test results.

## Video Recordings

Test execution videos are automatically saved to the `videos` directory. Each video is named with the test name and timestamp.

## Screenshots

Screenshots are automatically captured when tests fail and saved in the `reports/screenshots` directory.

## Advantages of This Approach

1. **Simplicity** - Function-based approach is easier to understand and maintain
2. **No Complex Abstractions** - Direct access to Puppeteer API without multiple layers
3. **Middleware Pattern** - Clean way to handle test setup and teardown
4. **Focused Tests** - Tests focus on actions and assertions, not on complex page objects
5. **Easier Debugging** - Simpler stack traces and more direct error messages

## Troubleshooting

- **Issue**: Tests fail with timeout errors
  **Solution**: Increase the timeout value in the test options

- **Issue**: Videos not recording
  **Solution**: Check if the `videos` directory exists and has proper permissions

- **Issue**: Element not found errors
  **Solution**: Use appropriate waits or increase timeouts

## License

MIT 