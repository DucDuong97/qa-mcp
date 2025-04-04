import { Browser, BrowserContext, Page, chromium } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Simple test context that holds test resources
 */
export interface TestContext {
  browser: Browser;
  context: BrowserContext;
  page: Page;
  recordingPath?: string;
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
  setupLogin?: {
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
  testFn: (page: Page, ctx?: TestContext) => Promise<void>,
  options: TestOptions = {}
): Promise<void> {
  // Default options
  const opts = {
    headless: true,
    slowMo: 100,
    recordVideo: true,
    timeout: 60000,
    viewportWidth: 1280,
    viewportHeight: 800,
    navigationTimeout: 60000,
    ...options
  };

  // Create test context
  const ctx: TestContext = { 
    browser: null as any, 
    context: null as any, 
    page: null as any 
  };
  
  try {
    // Setup phase - launch browser
    ctx.browser = await chromium.launch({
      headless: opts.headless,
      args: [
        '--disable-gpu',
        '--disable-web-security',
      ]
    });

    // Create a new context with viewport and recording settings
    ctx.context = await ctx.browser.newContext({
      viewport: {
        width: opts.viewportWidth,
        height: opts.viewportHeight
      },
      recordVideo: opts.recordVideo ? {
        dir: path.join(process.cwd(), 'reports', 'videos'),
        size: { width: 1280, height: 720 }
      } : undefined
    });

    // Set timeouts and add artificial delay between actions
    ctx.context.setDefaultTimeout(opts.timeout);
    ctx.context.setDefaultNavigationTimeout(opts.navigationTimeout);
    if (opts.slowMo) {
      await ctx.context.addInitScript(`
        window.addEventListener('DOMContentLoaded', () => {
          const originalClick = HTMLElement.prototype.click;
          HTMLElement.prototype.click = function() {
            return new Promise(resolve => {
              setTimeout(() => {
                originalClick.call(this);
                resolve();
              }, ${opts.slowMo});
            });
          };
        });
      `);
    }

    // Create a new page
    ctx.page = await ctx.context.newPage();

    // Add error handling for console errors
    ctx.page.on('console', (message: { type: () => string; text: () => string }) => {
      if (message.type() === 'error') {
        console.log(`Browser console error: ${message.text()}`);
      }
    });

    // Run setupLogin if provided
    if (opts.setupLogin) {
      console.log('Running setupLogin...');
      const loginFn = setupLogin(
        opts.setupLogin.env, 
        opts.setupLogin.role, 
        opts.setupLogin.email, 
        opts.setupLogin.password
      );
      await loginFn(ctx.page);
    }

    // Run the actual test
    await testFn(ctx.page, ctx);

  } catch (error) {
    console.error(`Test '${testName}' failed:`, error);
    
    // Take screenshot on error
    if (ctx.page) {
      const screenshotDir = path.join(process.cwd(), 'reports', 'screenshots');
      if (!fs.existsSync(screenshotDir)) {
        fs.mkdirSync(screenshotDir, { recursive: true });
      }

      const screenshotPath = path.join(
        screenshotDir, 
        `error-${testName.replace(/\s+/g, '-')}-${Date.now()}.png`
      );
      
      await ctx.page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`Error screenshot saved to: ${screenshotPath}`);
    }
    
    throw error;
  } finally {
    // Teardown phase - clean up resources
    await teardown(ctx);
  }
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
      page.waitForTimeout(3000)
    ]);
    
    console.log('🔍 Checking for login form...');
    const emailInput = page.getByPlaceholder('Enter your institutional email', { exact: true });
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
          page.getByText('Log in as an Instructor', { exact: true }).click()
        ]);
        
        // Verify successful login
        const dashboardContent = await page.getByText('Create new course', { exact: true }).isVisible()
          .catch(() => false);
        
        if (dashboardContent) {
          console.log('✅ Login successful - dashboard loaded');
        } else {
          console.warn('⚠️ Login might have failed - cannot find dashboard content');
        }
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
    // Context closing will automatically close all pages
    if (ctx.context) {
      await ctx.context.close();
    }
    
    // Close browser
    if (ctx.browser) {
      await ctx.browser.close();
    }
  } catch (error) {
    console.error('Error during test teardown:', error);
  }
} 