export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.ts'],
  verbose: true,
  setupFilesAfterEnv: ["dotenv/config"],
  reporters: [
    'default',
    [
      'jest-html-reporter',
      {
        pageTitle: 'Puppeteer Test Report',
        outputPath: './reports/test-report.html',
        includeFailureMsg: true,
        includeConsoleLog: true,
        dateFormat: 'yyyy-mm-dd HH:MM:ss',
        sort: 'status'
      }
    ]
  ],
  testTimeout: 120000
}; 