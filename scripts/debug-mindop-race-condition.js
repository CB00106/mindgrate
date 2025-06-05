#!/usr/bin/env node

/**
 * Debug MindOp Race Condition Script
 * Focused on identifying why mindop loading hangs after page refresh
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m'
};

// Helper functions
const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✅${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}❌${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  section: (msg) => console.log(`\n${colors.cyan}${colors.bold}${msg}${colors.reset}`),
  subsection: (msg) => console.log(`\n${colors.magenta}${msg}${colors.reset}`),
  code: (msg) => console.log(`${colors.dim}  ${msg}${colors.reset}`)
};

console.log(`${colors.cyan}${colors.bold}🔍 Debugging MindOp Race Condition${colors.reset}`);
console.log('=' .repeat(50));

// Configuration
const authFiles = [
  'src/contexts/AuthContext.tsx',
  'src/pages/ChatPage.tsx',
  'src/services/mindopService.ts',
  'src/hooks/useAuth.ts',
  'src/components/MindOpLoading.tsx',
  'src/hooks/useMindOp.ts'
];

// Analysis results
let issues = {
  critical: [],
  warnings: [],
  info: []
};

log.section('📋 Analyzing Auth Flow Patterns...');

authFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (!fs.existsSync(filePath)) {
    log.warning(`File not found: ${file}`);
    return;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  log.subsection(`🔸 ${file}:`);
  
  // Pattern analysis
  const patterns = {
    stateManagement: {
      'useState': { regex: /useState[<(]/g, category: 'State Management' },
      'useEffect': { regex: /useEffect\s*\(/g, category: 'Side Effects' },
      'useCallback': { regex: /useCallback\s*\(/g, category: 'Memoization' },
      'useMemo': { regex: /useMemo\s*\(/g, category: 'Memoization' }
    },
    authPatterns: {
      'loading': { regex: /loading/gi, category: 'Loading State' },
      'initialized': { regex: /initialized/gi, category: 'Init State' },
      'userMindOpId': { regex: /userMindOpId/g, category: 'MindOp ID' },
      'fetchUserMindOpId': { regex: /fetchUserMindOpId/g, category: 'MindOp Fetch' },
      'session': { regex: /session/gi, category: 'Session' },
      'authenticated': { regex: /authenticated/gi, category: 'Auth State' }
    },
    asyncPatterns: {
      'async/await': { regex: /async\s+[\w\s]*\(/g, category: 'Async Functions' },
      'Promise': { regex: /Promise[<.\s]/g, category: 'Promises' },
      '.then': { regex: /\.then\s*\(/g, category: 'Promise Chains' },
      '.catch': { regex: /\.catch\s*\(/g, category: 'Error Handling' }
    },
    timeoutPatterns: {
      'setTimeout': { regex: /setTimeout/g, category: 'Timeouts' },
      'setInterval': { regex: /setInterval/g, category: 'Intervals' },
      'clearTimeout': { regex: /clearTimeout/g, category: 'Cleanup' },
      'AbortController': { regex: /AbortController/g, category: 'Abort Control' }
    }
  };
  
  // Analyze patterns
  Object.entries(patterns).forEach(([groupName, group]) => {
    const found = [];
    Object.entries(group).forEach(([patternName, pattern]) => {
      const matches = content.match(pattern.regex);
      if (matches && matches.length > 0) {
        found.push(`${patternName} (${matches.length})`);
      }
    });
    
    if (found.length > 0) {
      console.log(`  ${colors.green}✓${colors.reset} ${groupName}: ${found.join(', ')}`);
    }
  });
  
  // Check for specific race condition indicators
  analyzeRaceConditions(file, content);
  
  // Check for error handling
  analyzeErrorHandling(file, content);
  
  // Check for memory leaks
  analyzeMemoryLeaks(file, content);
});

// Analyze race conditions
function analyzeRaceConditions(file, content) {
  const raceConditionPatterns = [
    {
      pattern: /setLoading\(false\)[\s\S]*?setUserMindOpId/,
      issue: 'Loading state set to false before MindOpId is set',
      severity: 'critical'
    },
    {
      pattern: /useState.*null.*\)[\s\S]*?useEffect.*\[\]/,
      issue: 'Empty useEffect dependency array with nullable state',
      severity: 'warning'
    },
    {
      pattern: /if\s*\(\s*!.*loading.*\)[\s\S]*?fetch/,
      issue: 'Fetch called immediately after loading check',
      severity: 'warning'
    },
    {
      pattern: /useEffect[\s\S]*?return[\s\S]*?useEffect/,
      issue: 'Multiple useEffect hooks without cleanup',
      severity: 'warning'
    },
    {
      pattern: /async[\s\S]*?setState[\s\S]*?await/,
      issue: 'State update before async operation completes',
      severity: 'critical'
    }
  ];
  
  raceConditionPatterns.forEach(check => {
    if (check.pattern.test(content)) {
      const message = `${file}: ${check.issue}`;
      if (check.severity === 'critical') {
        issues.critical.push(message);
        log.error(check.issue);
      } else {
        issues.warnings.push(message);
        log.warning(check.issue);
      }
    }
  });
}

// Analyze error handling
function analyzeErrorHandling(file, content) {
  const errorPatterns = [
    {
      pattern: /catch\s*\(\s*\)\s*{\s*}/,
      issue: 'Empty catch block - errors swallowed silently'
    },
    {
      pattern: /\.then\([^)]*\)(?![\s\S]*?\.catch)/,
      issue: 'Promise chain without error handling'
    },
    {
      pattern: /async[\s\S]*?{[\s\S]*?await[\s\S]*?}(?![\s\S]*?catch)/,
      issue: 'Async function without try-catch'
    }
  ];
  
  errorPatterns.forEach(check => {
    if (check.pattern.test(content)) {
      issues.warnings.push(`${file}: ${check.issue}`);
    }
  });
}

// Analyze memory leaks
function analyzeMemoryLeaks(file, content) {
  const leakPatterns = [
    {
      pattern: /useEffect[\s\S]*?subscribe[\s\S]*?return\s*\}/,
      issue: 'Subscription without cleanup in useEffect'
    },
    {
      pattern: /addEventListener[\s\S]*?useEffect[\s\S]*?(?!removeEventListener)/,
      issue: 'Event listener without cleanup'
    },
    {
      pattern: /setInterval[\s\S]*?useEffect[\s\S]*?(?!clearInterval)/,
      issue: 'Interval without cleanup'
    }
  ];
  
  leakPatterns.forEach(check => {
    if (check.pattern.test(content)) {
      issues.warnings.push(`${file}: ${check.issue}`);
    }
  });
}

// Extract specific configurations
log.section('📊 Timeout & Retry Configuration:');

const mindopServicePath = path.join(process.cwd(), 'src/services/mindopService.ts');
if (fs.existsSync(mindopServicePath)) {
  const content = fs.readFileSync(mindopServicePath, 'utf8');
  
  // Extract timeout values
  const configs = {
    timeout: content.match(/timeout:\s*(\d+)/g),
    maxRetries: content.match(/maxRetries:\s*(\d+)/g),
    initialDelay: content.match(/initialDelay:\s*(\d+)/g),
    backoffMultiplier: content.match(/backoffMultiplier:\s*(\d+\.?\d*)/g)
  };
  
  Object.entries(configs).forEach(([key, matches]) => {
    if (matches) {
      log.success(`${key}: ${matches.join(', ')}`);
    } else {
      log.warning(`${key}: Not configured`);
    }
  });
}

// Check for specific race condition scenarios
log.section('🔍 Detecting Specific Race Condition Scenarios:');

const scenarios = [
  {
    name: 'Double Initialization',
    description: 'Multiple auth initialization attempts',
    check: (content) => {
      const initCount = (content.match(/fetchUserMindOpId/g) || []).length;
      return initCount > 1;
    }
  },
  {
    name: 'Premature Loading Complete',
    description: 'Loading set to false before data fetched',
    check: (content) => {
      return /setLoading\(false\)[\s\S]{0,50}fetch/.test(content);
    }
  },
  {
    name: 'Missing Abort Controller',
    description: 'Async operations without cancellation',
    check: (content) => {
      return content.includes('fetch') && !content.includes('AbortController');
    }
  },
  {
    name: 'Stale Closure',
    description: 'UseEffect with missing dependencies',
    check: (content) => {
      return /useEffect\([^,]*,\s*\[\s*\]\s*\)/.test(content);
    }
  }
];

scenarios.forEach(scenario => {
  const hasIssue = authFiles.some(file => {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      return scenario.check(content);
    }
    return false;
  });
  
  if (hasIssue) {
    log.error(`${scenario.name}: ${scenario.description}`);
    issues.critical.push(scenario.name);
  } else {
    log.success(`${scenario.name}: Not detected`);
  }
});

// Generate issue summary
log.section('📊 Issue Summary:');

if (issues.critical.length > 0) {
  console.log(`\n${colors.red}${colors.bold}Critical Issues (${issues.critical.length}):${colors.reset}`);
  issues.critical.forEach(issue => log.error(issue));
}

if (issues.warnings.length > 0) {
  console.log(`\n${colors.yellow}${colors.bold}Warnings (${issues.warnings.length}):${colors.reset}`);
  issues.warnings.forEach(issue => log.warning(issue));
}

// Generate debugging steps
log.section('🧪 Debugging Steps:');

console.log(`
${colors.green}1. Enable Detailed Logging:${colors.reset}
${colors.dim}   // Add to AuthContext.tsx
   console.log('[AuthContext] State:', { loading, initialized, userMindOpId });
   
   // Add to ChatPage.tsx
   console.log('[ChatPage] Render:', { authLoading, currentUserId });${colors.reset}

${colors.green}2. Add Timing Measurements:${colors.reset}
${colors.dim}   // Add to auth initialization
   console.time('auth-init');
   await fetchUserMindOpId();
   console.timeEnd('auth-init');${colors.reset}

${colors.green}3. Monitor Network Requests:${colors.reset}
   • Open DevTools → Network tab
   • Filter by "mindop" or "auth"
   • Check for hanging requests (status: pending)
   • Look for 406 errors or timeouts

${colors.green}4. Test Sequence:${colors.reset}
   ${colors.cyan}a)${colors.reset} Clear browser storage (Application → Clear Storage)
   ${colors.cyan}b)${colors.reset} Open http://localhost:3005 in incognito mode
   ${colors.cyan}c)${colors.reset} Sign in and navigate to ChatPage
   ${colors.cyan}d)${colors.reset} Open console and clear it
   ${colors.cyan}e)${colors.reset} Refresh page (F5) and watch console logs
   ${colors.cyan}f)${colors.reset} Note where the process hangs
`);

// Generate fix recommendations
log.section('🔧 Recommended Fixes:');

console.log(`
${colors.cyan}1. Add Proper Cleanup:${colors.reset}
${colors.dim}   useEffect(() => {
     let cancelled = false;
     
     const init = async () => {
       if (!cancelled) {
         await fetchUserMindOpId();
       }
     };
     
     init();
     
     return () => {
       cancelled = true;
     };
   }, []);${colors.reset}

${colors.cyan}2. Implement Abort Controller:${colors.reset}
${colors.dim}   const controller = new AbortController();
   
   try {
     const response = await fetch(url, {
       signal: controller.signal
     });
   } catch (error) {
     if (error.name === 'AbortError') {
       console.log('Request cancelled');
     }
   }${colors.reset}

${colors.cyan}3. Add Loading States:${colors.reset}
${colors.dim}   const [authState, setAuthState] = useState({
     loading: true,
     initialized: false,
     error: null,
     userMindOpId: null
   });${colors.reset}

${colors.cyan}4. Implement Retry Logic:${colors.reset}
${colors.dim}   const fetchWithRetry = async (fn, retries = 3) => {
     try {
       return await fn();
     } catch (error) {
       if (retries > 0) {
         await new Promise(r => setTimeout(r, 1000));
         return fetchWithRetry(fn, retries - 1);
       }
       throw error;
     }
   };${colors.reset}
`);

// Quick fix check
log.section('🚀 Quick Fix Check:');

const quickFixes = [
  {
    issue: 'Auth loading hangs on refresh',
    fix: 'Ensure fetchUserMindOpId is called only once and properly awaited'
  },
  {
    issue: 'MindOp ID is null after auth',
    fix: 'Check if user has a mindop created during signup'
  },
  {
    issue: 'Multiple re-renders causing loops',
    fix: 'Review useEffect dependencies and add proper memoization'
  }
];

quickFixes.forEach(qf => {
  console.log(`\n${colors.yellow}Issue:${colors.reset} ${qf.issue}`);
  console.log(`${colors.green}Fix:${colors.reset} ${qf.fix}`);
});

// Final recommendations
log.section('✨ Next Steps:');

console.log(`
1. ${colors.cyan}Run the app with React DevTools open${colors.reset}
   - Monitor AuthContext state changes
   - Check for infinite re-renders
   
2. ${colors.cyan}Add breakpoints in key locations:${colors.reset}
   - AuthContext: fetchUserMindOpId function
   - ChatPage: useEffect hooks
   - MindopService: API calls
   
3. ${colors.cyan}Test with different scenarios:${colors.reset}
   - Fresh login (no existing session)
   - Page refresh with active session
   - Token expiration during usage
   
4. ${colors.cyan}Monitor console for patterns:${colors.reset}
   - Look for repeated log messages
   - Check timing between auth events
   - Watch for error messages

${colors.green}${colors.bold}Debug script completed! Check the issues above for potential race conditions.${colors.reset}
`);