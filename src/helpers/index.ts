import { Browser, BrowserContext, Page, chromium, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import MailSanbox from './mail.ts';

export const mailSanbox = new MailSanbox();
/**
 * Simple test context that holds test resources
 */
export interface TestContext {
  browsers: {[key: string]: Browser};
  contexts: {[key: string]: BrowserContext};
  instructorPage?: Page;
  studentPage?: Page;
  superAdminPage?: Page;
  collegeInstructorPage?: Page;
  teardownFns: (() => Promise<void>)[];
  [key: string]: any;
}

/**
 * Options for test setup
 */
export interface TestOptions {
  headless?: boolean;
  slowMo?: number;
  recordVideo?: boolean;
  timeout?: number;
  viewportWidth?: number;
  viewportHeight?: number;
  navigationTimeout?: number;
  setupInstructorLogin?: {
    env: string;
    role: string;
    email: string;
    password: string;
  };
  setupStudentLogin?: {
    env: string;
    role: string;
    email: string;
    password: string;
  };
  setupSuperAdminLogin?: {
    env: string;
    role: string;
    email: string;
    password: string;
  };
  setupCollegeInstructorLogin?: {
    env: string;
    role: string;
    email: string;
    password: string;
  };
}

/**
 * Run a test with all middleware
 */
export async function runTest(
  testName: string,
  prepareFn: (ctx: TestContext) => Promise<void>,
  testFn: (ctx: TestContext) => Promise<void>,
  options: TestOptions = {},
): Promise<void> {
  // Default options
  const opts = {
    headless: true,
    slowMo: 500,
    recordVideo: true,
    timeout: 60000,
    viewportWidth: 1280,
    viewportHeight: 800,
    navigationTimeout: 60000,
    ...options
  };

  // Create test context
  const ctx: TestContext = { 
    browsers: {}, 
    contexts: {},
    teardownFns: []
  };
  
  try {
    // Create pages for each role that's configured
    const setupRoles = [];

    // Setup instructor login if provided
    if (opts.setupInstructorLogin) {
      const browser = await chromium.launch({
        headless: opts.headless,
        slowMo: opts.slowMo,
        args: [
          '--disable-gpu',
          '--disable-web-security',
        ]
      });
      
      ctx.browsers['instructor'] = browser;
      
      const context = await browser.newContext({
        viewport: {
          width: opts.viewportWidth,
          height: opts.viewportHeight
        },
        recordVideo: opts.recordVideo ? {
          dir: path.join(process.cwd(), 'reports', 'videos'),
          size: { width: 1280, height: 720 }
        } : undefined,
      });
      
      context.setDefaultTimeout(opts.timeout);
      context.setDefaultNavigationTimeout(opts.navigationTimeout);
      ctx.contexts['instructor'] = context;
      
      ctx.instructorPage = await context.newPage();
      setupPageErrorHandling(ctx.instructorPage);
      setupRoles.push({
        role: 'instructor',
        page: ctx.instructorPage,
        setup: setupLogin(
          opts.setupInstructorLogin.env,
          opts.setupInstructorLogin.role,
          opts.setupInstructorLogin.email,
          opts.setupInstructorLogin.password
        )
      });
    }

    // Setup student login if provided
    if (opts.setupStudentLogin) {
      const browser = await chromium.launch({
        headless: opts.headless,
        slowMo: opts.slowMo,
        args: [
          '--disable-gpu',
          '--disable-web-security',
        ]
      });
      
      ctx.browsers['student'] = browser;
      
      const context = await browser.newContext({
        viewport: {
          width: opts.viewportWidth,
          height: opts.viewportHeight
        },
        recordVideo: opts.recordVideo ? {
          dir: path.join(process.cwd(), 'reports', 'videos'),
          size: { width: 1280, height: 720 }
        } : undefined,
      });
      
      context.setDefaultTimeout(opts.timeout);
      context.setDefaultNavigationTimeout(opts.navigationTimeout);
      ctx.contexts['student'] = context;
      
      ctx.studentPage = await context.newPage();
      setupPageErrorHandling(ctx.studentPage);
      setupRoles.push({
        role: 'student',
        page: ctx.studentPage,
        setup: setupLogin(
          opts.setupStudentLogin.env,
          opts.setupStudentLogin.role,
          opts.setupStudentLogin.email,
          opts.setupStudentLogin.password
        )
      });
    }

    // Setup super admin login if provided
    if (opts.setupSuperAdminLogin) {
      const browser = await chromium.launch({
        headless: opts.headless,
        slowMo: opts.slowMo,
        args: [
          '--disable-gpu',
          '--disable-web-security',
        ]
      });
      
      ctx.browsers['superAdmin'] = browser;
      
      const context = await browser.newContext({
        viewport: {
          width: opts.viewportWidth,
          height: opts.viewportHeight
        },
        recordVideo: opts.recordVideo ? {
          dir: path.join(process.cwd(), 'reports', 'videos'),
          size: { width: 1280, height: 720 }
        } : undefined,
      });
      
      context.setDefaultTimeout(opts.timeout);
      context.setDefaultNavigationTimeout(opts.navigationTimeout);
      ctx.contexts['superAdmin'] = context;
      
      ctx.superAdminPage = await context.newPage();
      setupPageErrorHandling(ctx.superAdminPage);
      setupRoles.push({
        role: 'superAdmin',
        page: ctx.superAdminPage,
        setup: setupLogin(
          opts.setupSuperAdminLogin.env,
          opts.setupSuperAdminLogin.role,
          opts.setupSuperAdminLogin.email,
          opts.setupSuperAdminLogin.password
        )
      });
    }

    // Setup college instructor login if provided
    if (opts.setupCollegeInstructorLogin) {
      const browser = await chromium.launch({
        headless: opts.headless,
        slowMo: opts.slowMo,
        args: [
          '--disable-gpu',
          '--disable-web-security',
        ]
      });
      
      ctx.browsers['collegeInstructor'] = browser;
      
      const context = await browser.newContext({
        viewport: {
          width: opts.viewportWidth,
          height: opts.viewportHeight
        },
        recordVideo: opts.recordVideo ? {
          dir: path.join(process.cwd(), 'reports', 'videos'),
          size: { width: 1280, height: 720 }
        } : undefined,
      });
      
      context.setDefaultTimeout(opts.timeout);
      context.setDefaultNavigationTimeout(opts.navigationTimeout);
      ctx.contexts['collegeInstructor'] = context;
      
      ctx.collegeInstructorPage = await context.newPage();
      setupPageErrorHandling(ctx.collegeInstructorPage);
      setupRoles.push({
        role: 'collegeInstructor',
        page: ctx.collegeInstructorPage,
        setup: setupLogin(
          opts.setupCollegeInstructorLogin.env,
          opts.setupCollegeInstructorLogin.role,
          opts.setupCollegeInstructorLogin.email,
          opts.setupCollegeInstructorLogin.password
        )
      });
    }

    // Run login setup for all configured roles
    for (const roleSetup of setupRoles) {
      console.log(`Running login setup for ${roleSetup.role}...`);
      await roleSetup.setup(roleSetup.page);
    }

    // Run prepareFn if provided to set up test context
    if (prepareFn) {
      console.log(`Running preparation function for test '${testName}'...`);
      await prepareFn(ctx);
      console.log(`Preparation completed for test '${testName}'`);
    }

    // Run the actual test with the context containing all pages
    await testFn(ctx);

  } catch (error) {
    console.error(`Test '${testName}' failed:`, error);
    
    // Take screenshot on error for all pages
    for (const key in ctx) {
      if (ctx[key] && typeof ctx[key] === 'object' && 'screenshot' in ctx[key]) {
        const page = ctx[key] as Page;
        try {
          const screenshotDir = path.join(process.cwd(), 'reports', 'screenshots');
          if (!fs.existsSync(screenshotDir)) {
            fs.mkdirSync(screenshotDir, { recursive: true });
          }
          
          const pageName = key.replace('Page', '');
          const screenshotPath = path.join(
            screenshotDir, 
            `error-${pageName}-${testName.replace(/\s+/g, '-')}-${Date.now()}.png`
          );
          
          await page.screenshot({ path: screenshotPath, fullPage: true });
          console.log(`Error screenshot for ${pageName} saved to: ${screenshotPath}`);
        } catch (screenshotError) {
          console.error(`Failed to take screenshot for ${key}:`, screenshotError);
        }
      }
    }
    
    throw error;
  } finally {
    // Teardown phase - clean up resources
    await teardown(ctx);
  }
}

/**
 * Setup error handling for a page
 */
function setupPageErrorHandling(page: Page): void {
  page.on('console', (message: { type: () => string; text: () => string }) => {
    if (message.type() === 'error') {
      console.log(`Browser console error: ${message.text()}`);
    }
  });
}

export function setupLogin(
  env: string, 
  role: string, 
  email: string, 
  password: string
): (page: Page) => Promise<void> {
  return async (page: Page) => {
    console.log(`🔑 Attempting login to ${env} environment as ${role}...`);
    
    const loginUrl = `https://${env}.mathgpt.ai/login?role=${role}`;
    console.log(`📍 Navigating to: ${loginUrl}`);
    await page.goto(loginUrl);
    
    console.log('⏳ Waiting for page to be fully loaded...');
    // Wait for network to be idle and a minimum time to ensure full page load
    await Promise.all([
      page.waitForLoadState('networkidle'),
      page.waitForLoadState('domcontentloaded'),
      page.waitForTimeout(2000)
    ]);
    
    console.log('🔍 Checking for login form...');
    const emailInput = page.getByPlaceholder(role === 'educator' ? 'Enter your institutional email' : 'Enter your email', { exact: true });
    const exists = await emailInput.isVisible().catch((error) => {
      console.error('❌ Error checking for email input:', error);
      return false;
    });
    
    if (exists) {
      console.log('✅ Login form found, filling credentials...');
      
      try {
        // Fill login credentials
        await emailInput.fill(email);
        console.log('📝 Email filled');
        
        const passwordInput = page.getByPlaceholder('Enter your password', { exact: true });
        await passwordInput.fill(password);
        console.log('📝 Password filled');
        
        // Click login button and wait for navigation
        console.log('🖱️ Clicking login button...');
        await Promise.all([
          page.waitForLoadState('networkidle'),
          page.getByText(role === 'educator' ? 'Log in as an Instructor' : 'Log in as a Student', { exact: true }).click()
        ]);
        
        // Verify successful login
        await expect(page.getByText('My Courses', { exact: true })).toBeVisible();
        
      } catch (error) {
        console.error('❌ Error during login process:', error);
        throw error;
      }
    } else {
      console.log('ℹ️ No login form found - assuming already logged in');
      
      // Verify we're actually logged in
      const isLoggedIn = await page.getByText('Create new course', { exact: true }).isVisible()
        .catch(() => false);
      
      if (isLoggedIn) {
        console.log('✅ Confirmed already logged in');
      } else {
        console.warn('⚠️ Warning: Cannot find dashboard content despite being "logged in"');
      }
    }
  }
}

/**
 * Teardown resources
 */
async function teardown(ctx: TestContext): Promise<void> {
  try {
    // Execute collected teardown functions in reverse order
    if (ctx.teardownFns && Array.isArray(ctx.teardownFns)) {
      console.log(`Executing ${ctx.teardownFns.length} teardown functions...`);
      
      // Execute in reverse order (last-in-first-out)
      for (let i = ctx.teardownFns.length - 1; i >= 0; i--) {
        try {
          await ctx.teardownFns[i]();
          console.log(`Successfully executed teardown function ${i + 1}/${ctx.teardownFns.length}`);
        } catch (teardownError) {
          console.error(`Error executing teardown function ${i + 1}/${ctx.teardownFns.length}:`, teardownError);
        }
      }
    }
    
    // Context closing will automatically close all pages
    for (const key in ctx.contexts) {
      const context = ctx.contexts[key];
      if (context) {
        await context.close();
      }
    }
    
    // Close browsers
    for (const key in ctx.browsers) {
      const browser = ctx.browsers[key];
      if (browser) {
        await browser.close();
      }
    }
  } catch (error) {
    console.error('Error during test teardown:', error);
  }
}