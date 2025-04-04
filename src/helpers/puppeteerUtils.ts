import puppeteer, { Browser, Page } from 'puppeteer';
import { PuppeteerScreenRecorder } from 'puppeteer-screen-recorder';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Simple test context that holds test resources
 */
export interface TestContext {
  browser: Browser;
  page: Page;
  recorder?: PuppeteerScreenRecorder;
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
    slowMo: 100, // Increase default slowMo for more reliable tests
    recordVideo: true,
    timeout: 60000, // Increase default timeout
    viewportWidth: 1280,
    viewportHeight: 800,
    navigationTimeout: 60000, // Separate navigation timeout
    ...options
  };

  // Create test context
  const ctx: TestContext = { browser: null as any, page: null as any };
  
  try {
    // Setup phase - launch browser
    ctx.browser = await puppeteer.launch({
      headless: opts.headless,
      slowMo: opts.slowMo,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-web-security', // Add this to help with CORS issues
        '--disable-features=IsolateOrigins,site-per-process' // Can help with frames
      ],
      defaultViewport: {
        width: opts.viewportWidth,
        height: opts.viewportHeight
      }
    });

    // Create a new page
    ctx.page = await ctx.browser.newPage();
    
    // Set timeouts
    ctx.page.setDefaultNavigationTimeout(opts.navigationTimeout);
    ctx.page.setDefaultTimeout(opts.timeout);

    // Add error handling for console errors
    ctx.page.on('console', message => {
      if (message.type() === 'error') {
        console.log(`Browser console error: ${message.text()}`);
      }
    });

    // Setup video recording if enabled
    if (opts.recordVideo) {
      await setupRecording(ctx, testName);
    }

    // Run beforeRun if provided
    if (opts.setupLogin) {
      console.log('Running setupLogin...');
      const loginFn = setupLogin(opts.setupLogin.env, opts.setupLogin.role, opts.setupLogin.email, opts.setupLogin.password);
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
    
    // Re-throw the error
    throw error;
  } finally {
    // Teardown phase - clean up resources
    await teardown(ctx);
  }
}

/**
 * Set up video recording
 */
async function setupRecording(ctx: TestContext, testName: string): Promise<void> {
  // Ensure videos directory exists
  const videoDir = path.join(process.cwd(), 'videos');
  if (!fs.existsSync(videoDir)) {
    fs.mkdirSync(videoDir, { recursive: true });
  }

  // Configure recorder
  const config = {
    followNewTab: true,
    fps: 25,
    videoFrame: {
      width: 1280,
      height: 720
    },
    aspectRatio: '16:9'
  };

  // Initialize recorder
  ctx.recorder = new PuppeteerScreenRecorder(ctx.page, config);
  
  // Create unique filename
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  ctx.recordingPath = path.join(videoDir, `${testName.replace(/\s+/g, '-')}_${timestamp}.mp4`);
  
  // Start recording
  console.log(`Starting recording for test: ${testName}`);
  await ctx.recorder.start(ctx.recordingPath);
}

export function setupLogin(env: string, role: string, email: string, password: string): (page: Page) => Promise<void> {
  return async (page: Page) => {
    await page.goto(`https://${env}.mathgpt.ai/login?role=${role}`, { waitUntil: 'networkidle2' });
  
    const loginFormExists = await page
      .waitForSelector('input[placeholder="Enter your institutional email"]', { timeout: 5000 })
      .then(() => true)
      .catch(() => false);
    
    if (loginFormExists) {
      console.log('Login page detected, proceeding with login...');
      
      // Step 2: Fill login credentials
      await page.type('input[placeholder="Enter your institutional email"]', email);
      await page.type('input[placeholder="Enter your password"]', password);
      
      // Step 3: Click login button
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2' }),
        page.click('text/Log in as an Instructor')
      ]);
      
      console.log('Login successful.');
    } else {
      console.log('Already logged in, proceeding to test...');
    }
  }
}


/**
 * Teardown resources
 */
async function teardown(ctx: TestContext): Promise<void> {
  try {
    // Stop recording if it exists
    if (ctx.recorder && ctx.recordingPath) {
      await ctx.recorder.stop();
      console.log(`Video saved to: ${ctx.recordingPath}`);
    }
    
    // Close browser
    if (ctx.browser) {
      await ctx.browser.close();
    }
  } catch (error) {
    console.error('Error during test teardown:', error);
  }
}