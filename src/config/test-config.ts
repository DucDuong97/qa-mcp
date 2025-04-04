import { TestOptions } from '../helpers/playwrightUtils.js';

const defaultConfig: TestOptions = {
  headless: true,
  slowMo: 200,
  recordVideo: true,
  timeout: 60000,
  viewportWidth: 1280,
  viewportHeight: 800,
  navigationTimeout: 60000
};

const developmentConfig: TestOptions = {
  headless: false,
  slowMo: 1000,
  recordVideo: false,
  timeout: 60000,
  viewportWidth: 1280,
  viewportHeight: 800,
  navigationTimeout: 60000
};

export function getTestConfig(setupLogin?: TestOptions['setupLogin']): TestOptions {
  const mode = process.env.TEST_MODE || 'regression';
  
  if (mode === 'development') {
    return {
      ...developmentConfig,
      setupLogin
    };
  }

  // For regression mode, allow overriding login credentials
  return {
    ...defaultConfig,
    setupLogin: process.env.TEST_EMAIL ? {
      env: process.env.TEST_ENV || 'app-dev',
      role: process.env.TEST_ROLE || 'educator',
      email: process.env.TEST_EMAIL,
      password: process.env.TEST_PASSWORD || ''
    } : undefined
  };
} 