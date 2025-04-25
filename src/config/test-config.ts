import { TestOptions } from '../helpers/index.ts';

interface LoginOptions {
  instructorLogin?: {
    env: string;
    email: string;
    password: string;
  };
  studentLogin?: {
    env: string;
    email: string;
    password: string;
  };
  superAdminLogin?: {
    env: string;
    email: string;
    password: string;
  };
  collegeInstructorLogin?: {
    env: string;
    email: string;
    password: string;
  };
}

const defaultConfig: TestOptions = {
  headless: true,
  slowMo: 100,
  recordVideo: true,
  timeout: 60000,
  viewportWidth: 1280,
  viewportHeight: 800,
  navigationTimeout: 60000
};

const developmentConfig: TestOptions = {
  headless: false,
  slowMo: 100,
  recordVideo: false,
  timeout: 60000,
  viewportWidth: 1280,
  viewportHeight: 800,
  navigationTimeout: 60000
};

export function getTestConfig(loginOptions?: LoginOptions): TestOptions {
  const mode = process.env.TEST_MODE || 'regression';
  
  if (mode === 'development') {
    return {
      ...developmentConfig,
      ...(loginOptions?.instructorLogin && { 
        setupInstructorLogin: {
          ...loginOptions.instructorLogin,
          role: 'educator'
        }
      }),
      ...(loginOptions?.studentLogin && { 
        setupStudentLogin: {
          ...loginOptions.studentLogin,
          role: 'student'
        }
      }),
      ...(loginOptions?.superAdminLogin && { 
        setupSuperAdminLogin: {
          ...loginOptions.superAdminLogin,
          role: 'educator'
        }
      }),
      ...(loginOptions?.collegeInstructorLogin && { 
        setupCollegeInstructorLogin: {
          ...loginOptions.collegeInstructorLogin,
          role: 'educator'
        }
      })
    };
  }

  // For regression mode, allow overriding login credentials from environment variables
  const baseConfig = {
    ...defaultConfig
  };

  // Add instructor login if provided in env vars or options
  if (process.env.INSTRUCTOR_EMAIL) {
    baseConfig.setupInstructorLogin = {
      env: process.env.TEST_ENV || 'app-dev',
      role: 'educator',
      email: process.env.INSTRUCTOR_EMAIL,
      password: process.env.INSTRUCTOR_PASSWORD || ''
    };
  } else if (loginOptions?.instructorLogin) {
    baseConfig.setupInstructorLogin = {
      ...loginOptions.instructorLogin,
      role: 'educator'
    };
  }

  // Add student login if provided in env vars or options
  if (process.env.STUDENT_EMAIL) {
    baseConfig.setupStudentLogin = {
      env: process.env.TEST_ENV || 'app-dev',
      role: 'student',
      email: process.env.STUDENT_EMAIL,
      password: process.env.STUDENT_PASSWORD || ''
    };
  } else if (loginOptions?.studentLogin) {
    baseConfig.setupStudentLogin = {
      ...loginOptions.studentLogin,
      role: 'student'
    };
  }

  // Add super admin login if provided in env vars or options
  if (process.env.SUPER_ADMIN_EMAIL) {
    baseConfig.setupSuperAdminLogin = {
      env: process.env.TEST_ENV || 'app-dev',
      role: 'educator',
      email: process.env.SUPER_ADMIN_EMAIL,
      password: process.env.SUPER_ADMIN_PASSWORD || ''
    };
  } else if (loginOptions?.superAdminLogin) {
    baseConfig.setupSuperAdminLogin = {
      ...loginOptions.superAdminLogin,
      role: 'educator'
    };
  }

  // Add college instructor login if provided in env vars or options
  if (process.env.COLLEGE_INSTRUCTOR_EMAIL) {
    baseConfig.setupCollegeInstructorLogin = {
      env: process.env.TEST_ENV || 'app-dev',
      role: 'educator',
      email: process.env.COLLEGE_INSTRUCTOR_EMAIL,
      password: process.env.COLLEGE_INSTRUCTOR_PASSWORD || ''
    };
  } else if (loginOptions?.collegeInstructorLogin) {
    baseConfig.setupCollegeInstructorLogin = {
      ...loginOptions.collegeInstructorLogin,
      role: 'educator'
    };
  }

  return baseConfig;
} 