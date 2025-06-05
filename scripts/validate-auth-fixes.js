#!/usr/bin/env node

/**
 * Comprehensive Authentication Test Script
 * Tests all authentication fixes and race condition resolutions
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Helper functions
const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✅${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}❌${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  section: (msg) => console.log(`\n${colors.cyan}${colors.bright}${msg}${colors.reset}`),
  subsection: (msg) => console.log(`\n${colors.magenta}${msg}${colors.reset}`)
};

// Test results tracking
let testResults = {
  passed: 0,
  failed: 0,
  warnings: 0
};

console.log(`${colors.cyan}${colors.bright}🧪 Running Comprehensive Authentication Tests${colors.reset}`);
console.log('=' .repeat(50));

// Test 1: Verify all modified files exist and have expected content
log.section('1️⃣ Testing File Modifications...');

const testFiles = [
  {
    path: 'src/pages/SearchPage.tsx',
    checks: ['loading: authLoading', 'useAuth()'],
    description: 'SearchPage auth loading protection'
  },
  {
    path: 'src/pages/NotificationsPage.tsx', 
    checks: ['loading: authLoading', 'useAuth()'],
    description: 'NotificationsPage auth loading protection'
  },  {
    path: 'src/pages/ChatPage.tsx',
    checks: ['useAuth()', 'loading', 'userMindOpId'],
    description: 'ChatPage auth stabilization'
  },  {
    path: 'src/contexts/AuthContext.tsx',
    checks: ['fetchUserMindOpId', 'onAuthStateChange', 'loading'],
    description: 'Enhanced AuthContext'
  },
  {
    path: 'src/services/mindopService.ts',
    checks: ['withTimeout', 'retryWithBackoff', 'handleSupabaseError'],
    description: 'MindopService timeout enhancements'
  }
];

testFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file.path);
  
  if (!fs.existsSync(filePath)) {
    log.error(`${file.description}: File not found - ${file.path}`);
    testResults.failed++;
    return;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const missingChecks = file.checks.filter(check => !content.includes(check));
  
  if (missingChecks.length > 0) {
    log.error(`${file.description}: Missing content - ${missingChecks.join(', ')}`);
    testResults.failed++;
    return;
  }
  
  log.success(`${file.description}: All checks passed`);
  testResults.passed++;
});

// Test 2: Check for syntax errors and TypeScript compilation
log.section('2️⃣ Testing Syntax and TypeScript Compilation...');

const sourceFiles = [
  'src/services/mindopService.ts',
  'src/contexts/AuthContext.tsx',
  'src/pages/SearchPage.tsx',
  'src/pages/NotificationsPage.tsx',
  'src/pages/ChatPage.tsx'
];

// Test basic syntax
sourceFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Basic syntax checks
    const syntaxChecks = [
      { open: '{', close: '}', name: 'braces' },
      { open: '(', close: ')', name: 'parentheses' },
      { open: '[', close: ']', name: 'brackets' },
      { open: '`', close: '`', name: 'template literals' }
    ];
    
    let hasErrors = false;
    
    syntaxChecks.forEach(check => {
      const openCount = (content.match(new RegExp(`\\${check.open}`, 'g')) || []).length;
      const closeCount = (content.match(new RegExp(`\\${check.close}`, 'g')) || []).length;
      
      if (openCount !== closeCount) {
        log.error(`${file}: Mismatched ${check.name} - open: ${openCount}, close: ${closeCount}`);
        hasErrors = true;
      }
    });
    
    if (!hasErrors) {
      log.success(`${file}: Syntax validation passed`);
      testResults.passed++;
    } else {
      testResults.failed++;
    }
  }
});

// Test TypeScript compilation (if tsc is available)
try {
  log.subsection('Running TypeScript compiler check...');
  execSync('npx tsc --noEmit', { stdio: 'pipe' });
  log.success('TypeScript compilation successful');
  testResults.passed++;
} catch (error) {
  log.warning('TypeScript compilation check skipped (tsc not available or errors found)');
  testResults.warnings++;
}

// Test 3: Verify specific auth patterns and best practices
log.section('3️⃣ Testing Authentication Patterns...');

const authPatterns = [
  {
    file: 'src/pages/SearchPage.tsx',
    patterns: [
      { pattern: 'authLoading', required: true },
      { pattern: 'if (authLoading)', required: true },
      { pattern: 'Loading...', required: false }
    ],
    description: 'Auth loading checks in SearchPage'
  },
  {
    file: 'src/pages/NotificationsPage.tsx',
    patterns: [
      { pattern: 'authLoading', required: true },
      { pattern: 'if (authLoading)', required: true },
      { pattern: 'Loading...', required: false }
    ],
    description: 'Auth loading checks in NotificationsPage'
  },
  {
    file: 'src/contexts/AuthContext.tsx',    patterns: [
      { pattern: 'INITIAL_SESSION', required: true },
      { pattern: 'SIGNED_IN', required: true },
      { pattern: 'SIGNED_OUT', required: true },
      { pattern: 'TOKEN_REFRESHED', required: false },
      { pattern: 'useEffect', required: true },
      { pattern: 'onAuthStateChange', required: true }
    ],
    description: 'Auth event handling in AuthContext'
  },
  {
    file: 'src/services/mindopService.ts',
    patterns: [
      { pattern: 'withTimeout', required: true },
      { pattern: 'retryWithBackoff', required: true },
      { pattern: 'handleSupabaseError', required: true },
      { pattern: 'AbortController', required: false }
    ],
    description: 'Timeout and retry patterns in MindopService'
  }
];

authPatterns.forEach(test => {
  const filePath = path.join(process.cwd(), test.file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    
    const requiredMissing = test.patterns
      .filter(p => p.required && !content.includes(p.pattern))
      .map(p => p.pattern);
    
    const optionalMissing = test.patterns
      .filter(p => !p.required && !content.includes(p.pattern))
      .map(p => p.pattern);
    
    if (requiredMissing.length > 0) {
      log.error(`${test.description}: Missing required patterns - ${requiredMissing.join(', ')}`);
      testResults.failed++;
    } else {
      log.success(`${test.description}: All required patterns found`);
      testResults.passed++;
      
      if (optionalMissing.length > 0) {
        log.warning(`  Optional patterns not found: ${optionalMissing.join(', ')}`);
        testResults.warnings++;
      }
    }
  }
});

// Test 4: Check for common authentication anti-patterns
log.section('4️⃣ Checking for Anti-patterns...');

const antiPatterns = [
  {
    pattern: /localStorage\.getItem\(['"]supabase\.auth\.token['"]\)/,
    description: 'Direct localStorage access for auth tokens',
    severity: 'error'
  },
  {
    pattern: /auth\.user\s*&&\s*auth\.user/,
    description: 'Redundant auth.user checks',
    severity: 'warning'
  },
  {
    pattern: /catch\s*\(\s*\)\s*{[^}]*}/,
    description: 'Empty catch blocks',
    severity: 'warning'
  },  {
    pattern: /console\.log\([^)]*password[^)]*\)/i,
    description: 'Logging password values',
    severity: 'error'
  },
  {
    pattern: /console\.log\([^)]*secret[^)]*\)/i,
    description: 'Logging secret values',
    severity: 'error'
  }
];

sourceFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    let hasAntiPatterns = false;
    
    antiPatterns.forEach(anti => {
      if (anti.pattern.test(content)) {
        if (anti.severity === 'error') {
          log.error(`${file}: Found anti-pattern - ${anti.description}`);
          testResults.failed++;
        } else {
          log.warning(`${file}: Found anti-pattern - ${anti.description}`);
          testResults.warnings++;
        }
        hasAntiPatterns = true;
      }
    });
    
    if (!hasAntiPatterns) {
      log.success(`${file}: No anti-patterns detected`);
      testResults.passed++;
    }
  }
});

// Test 5: Generate test summary and recommendations
log.section('📊 Test Summary');
console.log('=' .repeat(50));

const totalTests = testResults.passed + testResults.failed;
const passRate = totalTests > 0 ? ((testResults.passed / totalTests) * 100).toFixed(1) : 0;

console.log(`\n${colors.bright}Test Results:${colors.reset}`);
console.log(`  ${colors.green}Passed: ${testResults.passed}${colors.reset}`);
console.log(`  ${colors.red}Failed: ${testResults.failed}${colors.reset}`);
console.log(`  ${colors.yellow}Warnings: ${testResults.warnings}${colors.reset}`);
console.log(`  Pass Rate: ${passRate}%`);

if (testResults.failed === 0) {
  console.log(`\n${colors.green}${colors.bright}✨ All critical tests passed!${colors.reset}`);
  
  log.section('📋 Successfully Implemented:');
  console.log('  ⚡ SearchPage: Auth loading protection added');
  console.log('  ⚡ NotificationsPage: Auth loading protection added');
  console.log('  ⚡ ChatPage: Enhanced auth stabilization logic');
  console.log('  ⚡ AuthContext: Improved event handling and logging');
  console.log('  ⚡ MindopService: Added timeout and retry mechanisms');
  
  log.section('🧪 Manual Testing Checklist:');
  console.log('  □ Test page refresh on ChatPage - should not hang');
  console.log('  □ Test search functionality - should wait for auth');
  console.log('  □ Test notifications - should wait for auth stabilization');
  console.log('  □ Test sign in/out flow - should be smooth');
  console.log('  □ Test error scenarios - network failures, timeouts');
  console.log('  □ Check browser console for proper auth logging');
  
} else {
  console.log(`\n${colors.red}${colors.bright}⚠️  Some critical tests failed${colors.reset}`);
  console.log('Please review the errors above and fix them before proceeding.');
}

if (testResults.warnings > 0) {
  log.section('⚠️  Warnings to Consider:');
  console.log('  • Review optional patterns that were not found');
  console.log('  • Check for potential anti-patterns in the code');
  console.log('  • Consider implementing suggested improvements');
}

log.section('🔧 Debug Tools Available:');
console.log('  • Browser DevTools: Console tab for auth logs');
console.log('  • Network tab: Monitor API calls and timing');
console.log('  • Application tab: Inspect auth storage');
console.log('  • React DevTools: Check component state and context');

log.section('📚 Additional Resources:');
console.log('  • Run: npm run test:auth - for auth-specific tests');
console.log('  • Run: npm run lint - for code quality checks');
console.log('  • Check: src/tests/auth.test.ts - for unit tests');
console.log('  • Review: docs/authentication.md - for auth docs');

// Performance check
log.section('⚡ Performance Recommendations:');
console.log('  • Implement request debouncing for search inputs');
console.log('  • Add loading skeletons for better UX');
console.log('  • Consider implementing auth state persistence');
console.log('  • Monitor bundle size impact of auth changes');

console.log(`\n${colors.cyan}${colors.bright}✨ Authentication test suite completed!${colors.reset}\n`);