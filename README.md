# Test Automation Framework

A lightweight, straightforward test automation framework supporting both Puppeteer and Playwright with video recording and detailed reporting capabilities.

## Features

- 🔄 **Multiple Browser Automation** - Support for both Puppeteer and Playwright
- 👥 **Multi-Role Testing** - Support for simultaneous testing with multiple user roles
- 🧩 **Component-Based** - Reusable UI components with built-in teardown
- 🧪 **Structured Test Setup** - Separation of preparation and test execution
- 📝 **HTML Reports, Video Recording, Screenshots** - Detailed execution reports, screenshots and videos

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
│   ├── components/         # Reusable UI components
│   │   └── playwright.ts   # Component functions for common UI interactions
│   ├── helpers/            # Utility functions and test middleware
│   │   └── playwrightUtils.ts # Core test utilities and middleware pattern
│   ├── tests/              # Test files
│   │   ├── bif/            # Business functionality tests
│   │   │   └── educator-module.test.ts # Module management test
│   │   └── todo-simple.test.ts     # Sample TodoMVC test
├── reports/               # Test reports and screenshots
│   ├── screenshots/       # Screenshots from test runs
│   └── videos/            # Recorded videos
├── jest.config.js         # Jest configuration
├── tsconfig.json          # TypeScript configuration
└── package.json           # Project dependencies and scripts
```

## Component-Based Architecture

The framework now features a component-based architecture that:

1. **Separates Concerns** - Preparation, test execution, and teardown are clearly separated
2. **Promotes Reusability** - Common UI interactions are encapsulated in reusable components
3. **Ensures Clean Teardown** - Each component returns its own teardown function
4. **Simplifies Test Structure** - Clear distinction between setup and actual testing

### Component Functions

Components are reusable functions that:
- Perform a specific UI interaction
- Return a teardown function that cleans up the created resources
- Accept a context object with page references
- Accept configuration options

Example component:

```typescript
// Creating a course component with teardown
export async function createCourse(
  { instructorPage }: TestContext,
) {
  // Implementation that creates a course
  
  // Return teardown function that cleans up the course
  return async () => {
    // Logic to delete the course
  };
}
```

## Creating a New Test

### Test Structure with prepareFn and testFn

Tests now follow a clear structure with separate preparation and test functions:

```typescript
test('should create and delete a module', async () => {
  await runTest(
    'Create and delete module', 
    prepareFn,    // Sets up test environment
    testFn,       // Performs the actual test
    getTestConfig({
      ...
    })
  );
});

// Setup function that prepares the environment
async function prepareFn(ctx: TestContext) {
  ...
}

// Test function that performs the actual test
async function testFn(ctx: TestContext) {
  ...
}
```

### Single-Role Test

Creating a test with a single user role:

1. **Create Test File**
   - Navigate to `src/tests` directory
   - Create a new test file (e.g., `feature-test.ts`)
   - Configure login credentials:
   ```typescript
   test('should [your test description]', async () => {
     await runTest(
       '[Your Test Name]', 
       prepareFn,
       testFn,
       getTestConfig({
         instructorLogin: {
           env: 'your-env',
           email: 'instructor@example.com',
           password: 'your-password'
         }
       })
     );
   });
   
   async function prepareFn(ctx: TestContext) {
     // Set up the test environment
     const cleanup = await createCourse(ctx, {
       courseName: 'Test Course'
     });
     ctx.teardownFns.push(cleanup);
   }
   
   async function testFn(ctx: TestContext) {
     const { instructorPage } = ctx;
     if (!instructorPage) {
       throw new Error('Instructor page not initialized');
     }
     
     // Your test code here using instructorPage
   }
   ```

### Multi-Role Test

Creating a test with multiple user roles (e.g., instructor and student):

```typescript
test('instructor and student interaction', async () => {
  await runTest(
    'Test with multiple roles', 
    prepareFn,
    testFn,
    getTestConfig({
      instructorLogin: {
        env: 'your-env',
        email: 'instructor@example.com',
        password: 'instructor-password'
      },
      studentLogin: {
        env: 'your-env',
        email: 'student@example.com',
        password: 'student-password'
      }
    })
  );
});

async function prepareFn(ctx: TestContext) {
  const { instructorPage } = ctx;
  
  // Set up course for test
  const cleanupCourse = await createCourse(ctx, {
    courseName: 'Shared Course'
  });
  
  // Store teardown function
  ctx.teardownFns.push(cleanupCourse);
}

async function testFn(ctx: TestContext) {
  const { instructorPage, studentPage } = ctx;
  
  if (!instructorPage || !studentPage) {
    throw new Error('Required pages not initialized');
  }
  
  // Instructor creates an assignment
  await instructorPage.getByText('Create Assignment').click();
  // ...more instructor actions
  
  // Student views and submits the assignment
  await studentPage.getByText('View Assignments').click();
  // ...more student actions
}
```

### Available User Roles

The framework supports the following roles:

- **Instructor**: For educator/teacher login
- **Student**: For student login
- **SuperAdmin**: For admin login
- **CollegeInstructor**: For college educator login

Each role is automatically set up with the appropriate role type:
- Student role uses 'student'
- All other roles use 'educator'

## Teardown Mechanism

The framework now includes an automatic teardown mechanism:

1. **Component-Level Teardown** - Each component function returns a teardown function
2. **Collection in Context** - Teardown functions are collected in the `ctx.teardownFns` array
3. **Reverse Order Execution** - During test cleanup, teardown functions are executed in reverse order (LIFO)
4. **Automatic Error Handling** - Teardown executes even if the test fails, with proper error handling

Example of registering a teardown function:

```typescript
// In a component function
return async () => {
  // Cleanup logic here
  await page.click('Delete button');
  await page.click('Confirm');
};

// In a test function
const cleanupResource = await createResource(ctx, options);
ctx.teardownFns.push(cleanupResource);
```

## Creating Reusable Components

To create a new component function:

1. Add it to the appropriate file in `src/components/`
2. Follow the pattern of accepting context and options
3. Implement the UI interaction
4. Return a teardown function that cleans up any created resources

Example component template:

```typescript
export async function createSomething(
  ctx: TestContext,
  {
    optionOne = 'default value',
    optionTwo = 'default value'
  }: {
    optionOne?: string,
    optionTwo?: string
  }
) {
  const { instructorPage } = ctx;
  if (!instructorPage) {
    throw new Error('Instructor page not initialized');
  }
  
  // Implementation code here
  await instructorPage.click('Create button');
  await instructorPage.fill('Name field', optionOne);
  
  // Return teardown function
  return async () => {
    // Cleanup code here
    await instructorPage.click('Delete button');
    await instructorPage.click('Confirm');
  };
}
```

## Recording Test Steps

### Installing the Recorder Studio Extension

Since the Recorder Studio extension is not available on the Chrome Web Store, you'll need to install it manually:

1. **Install in Chrome**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" using the toggle in the top-right corner
   - Click "Load unpacked" button
   - Select the `recorder-studio-extension` directory from this project
   - The Recorder Studio extension should now appear in your extensions list
   - Click the Extensions icon in Chrome toolbar and pin the Recorder Studio for easy access

2. **Usage**
   - Click the Recorder Studio icon in your Chrome toolbar to open the side panel
   - The extension is now ready for recording test steps

3. **Notes**
   - If some changes are made to the extension or it's not working properly, you can reload it:
     - Navigate to `chrome://extensions/`
     - Find the Recorder Studio extension
     - Click the refresh/reload icon or toggle the extension off and on
     - Restart Chrome if the reload doesn't resolve issues

### Using the Recorder Studio

You can use the recorder-studio extension to create test steps for different user roles:

1. **Record Test Steps**
   - Open the recorder-studio extension
   - Click "Start Recording"
   - Perform your test actions manually in the browser
   - Use assertion buttons for verifying text, colors, or visibility
   - Click "Pause Recording" when done

2. **Generate Role-Specific Test Code**
   - In the recorder-studio extension:
     - Select "Playwright" from the tool dropdown
     - Select the appropriate page from the page dropdown:
       - `instructorPage` for educator/teacher actions
       - `studentPage` for student actions
       - `superAdminPage` for admin actions
       - `collegeInstructorPage` for college instructor actions
     - Click "Generate Test Code"
   - Integrate the generated code into your testFn for the appropriate role

3. **Combining Multi-Role Tests**
   - Record steps separately for each role
   - Generate code for each role using the appropriate page selector
   - Combine the generated code into a single test function, organizing the flow as needed

You can interleave actions between roles in your test to create complex multi-user workflows and interactions.

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
npm run test:dev src/tests/multi-role-example.test.ts
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
INSTRUCTOR_EMAIL=teacher@example.com INSTRUCTOR_PASSWORD=pass123 STUDENT_EMAIL=student@example.com STUDENT_PASSWORD=pass123 TEST_ENV=app-dev npm run test:regression src/tests/folder-name

# Example:
npm run test:regression src/tests/auth
```

## Test Reports

After running the tests, HTML reports will be available in the `reports` directory. Open the `test-report.html` file in a browser to view detailed test results.

## Video Recordings

Test execution videos are automatically saved to the `reports/videos` directory. Each video is named with the test name and timestamp.

## Screenshots

Screenshots are automatically captured when tests fail and saved in the `reports/screenshots` directory. For multi-role tests, screenshots will be captured for each browser page with the role name included in the filename.

## Troubleshooting

- **Issue**: Tests fail with timeout errors
  **Solution**: Increase the timeout value in the test options

- **Issue**: Videos not recording
  **Solution**: Check if the `reports/videos` directory exists and has proper permissions

- **Issue**: Element not found errors
  **Solution**: Use appropriate waits or increase timeouts

- **Issue**: Role-specific page is undefined
  **Solution**: Make sure you've configured the correct login for that role in getTestConfig

- **Issue**: Teardown functions not executing
  **Solution**: Ensure you're properly adding the teardown functions to ctx.teardownFns

## License

MIT 