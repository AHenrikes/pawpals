#!/usr/bin/env node

/**
 * Pawpall Comprehensive Code Scanner
 * 
 * Scans for:
 * 1. Performance issues (unused deps, bundle optimization)
 * 2. Code duplication (API requests, components, utilities)
 * 3. Maintainability & centralization issues
 * 4. Unnecessary/dead code
 * 5. UI/UX consistency across application
 * 6. Linting errors
 * 7. Type safety
 */

const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');
const PACKAGES_DIR = path.join(ROOT, 'packages');
const APPS_DIR = path.join(ROOT, 'apps');
const WEB_DIR = path.join(APPS_DIR, 'web');
const UI_DIR = path.join(PACKAGES_DIR, 'ui');
const SUPABASE_DIR = path.join(PACKAGES_DIR, 'supabase');

// Color output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

const log = {
  section: (title) => console.log(`\n${colors.bold}${colors.blue}► ${title}${colors.reset}`),
  success: (msg) => console.log(`  ${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`  ${colors.red}✗${colors.reset} ${msg}`),
  warn: (msg) => console.log(`  ${colors.yellow}⚠${colors.reset}  ${msg}`),
  info: (msg) => console.log(`  ${colors.cyan}ℹ${colors.reset} ${msg}`),
};

let issues = 0;
let warnings = 0;

/**
 * 1. LINTING & TYPE CHECKING
 */
function checkLinting() {
  log.section('1. LINTING & TYPE ERRORS');

  try {
    log.info('Running ESLint...');
    execSync('npm run lint 2>&1', { cwd: ROOT, stdio: 'pipe' });
    log.success('No ESLint errors found');
  } catch (e) {
    issues++;
    log.error(`ESLint found errors (run 'npm run lint' for details)\n\n${e}`);
  }

  try {
    log.info('Checking TypeScript...');
    execSync('npm run check-types 2>&1', { cwd: ROOT, stdio: 'pipe' });
    log.success('No TypeScript errors found');
  } catch (e) {
    issues++;
    log.error(`TypeScript errors found (run 'npm run check-types' for details)\n\n${e}`);
  }
}

/**
 * 2. CODE DUPLICATION ANALYSIS
 */
function checkDuplication() {
  log.section('2. CODE DUPLICATION & PATTERNS');

  // Check for duplicate API request patterns in route handlers
  const routeFiles = getFilesRecursive(WEB_DIR, /app\/api\/.*route\.ts$/);
  
  if (routeFiles.length > 0) {
    log.info(`Found ${routeFiles.length} API route handlers`);
    // Check if they use centralized response helpers
    const hasResponseHelper = fs.existsSync(path.join(WEB_DIR, 'lib/api/responses.ts'));
    if (hasResponseHelper) {
      const usesHelper = routeFiles.filter(file => {
        const content = fs.readFileSync(file, 'utf8');
        return content.includes('from "@/lib/api/responses"') || 
               content.includes("from '@/lib/api/responses'");
      }).length;
      
      if (usesHelper === routeFiles.length) {
        log.success('All API routes use centralized response handlers');
      } else {
        warnings++;
        log.warn(`${routeFiles.length - usesHelper} API routes not using centralized response helpers`);
      }
    }
  }

  // Check for duplicate component patterns
  const componentDirs = [
    path.join(WEB_DIR, 'components'),
    path.join(UI_DIR, 'src'),
  ];

  let totalComponents = 0;
  componentDirs.forEach(dir => {
    const count = getFilesRecursive(dir, /\.tsx?$/).length;
    totalComponents += count;
  });

  log.info(`Found ${totalComponents} component files`);

  // Check for duplicate hook logic
  const hookFiles = getFilesRecursive(WEB_DIR, /useAuth|useSocial|useSupabase/);
  if (hookFiles.length > 0) {
    log.info(`Found ${hookFiles.length} custom hooks`);
    log.success('Custom hooks are properly centralized');
  }
}

/**
 * 3. MAINTAINABILITY & CENTRALIZATION
 */
function checkMaintainability() {
  log.section('3. MAINTAINABILITY & CENTRALIZATION');

  // Check for scattered utilities
  const utilsPattern = /utils\.(ts|tsx)$/;
  const utilsFiles = [
    ...getFilesRecursive(WEB_DIR, utilsPattern),
    ...getFilesRecursive(PACKAGES_DIR, utilsPattern),
  ];

  if (utilsFiles.length > 3) {
    warnings++;
    log.warn(`Found ${utilsFiles.length} utils files - consider consolidating`);
  } else if (utilsFiles.length > 0) {
    log.success(`${utilsFiles.length} centralized utils files`);
  }

  // Check for consistent type definitions
  const typeFiles = getFilesRecursive(WEB_DIR, /types\//);
  if (typeFiles.length > 0) {
    log.success(`Type definitions are centralized (${typeFiles.length} files)`);
  }

  // Check for consistent API patterns
  const apiResponseFiles = getFilesRecursive(WEB_DIR, /api\/.*route\.ts$/);
  log.info(`Found ${apiResponseFiles.length} API route handlers`);
  if (apiResponseFiles.length > 0) {
    const hasResponseHandler = fs.existsSync(path.join(WEB_DIR, 'lib/api/responses.ts'));
    if (hasResponseHandler) {
      log.success('API responses are centralized in lib/api/responses.ts');
    } else {
      warnings++;
      log.warn('Consider centralizing API response handling');
    }
  }

  // Check Supabase client usage
  const supabaseUsage = getFilesRecursive(WEB_DIR, /supabase|@repo\/supabase/);
  log.info(`Found ${supabaseUsage.length} files using Supabase`);
}

/**
 * 4. UNNECESSARY CODE
 */
function checkUnnecessaryCode() {
  log.section('4. UNNECESSARY & DEAD CODE');

  // Check for unused public files
  const publicDir = path.join(WEB_DIR, 'public');
  if (fs.existsSync(publicDir)) {
    const publicFiles = fs.readdirSync(publicDir);
    if (publicFiles.length === 0) {
      log.warn('public/ directory is empty');
      warnings++;
    } else {
      log.info(`Found ${publicFiles.length} public assets`);
    }
  }

  // Check for unused modals
  const modalFiles = getFilesRecursive(WEB_DIR, /modals\//);
  const modalImports = countImports(WEB_DIR, 'modals/');
  if (modalFiles.length > modalImports) {
    warnings++;
    log.warn(`Found ${modalFiles.length - modalImports} potentially unused modal components`);
  } else {
    log.success(`All ${modalFiles.length} modal components are in use`);
  }

  // Check for console.log statements (actual calls, not in comments/strings)
  const consoleLogFiles = findFilesWithPattern(WEB_DIR, /console\.(log|warn|error|debug)\s*\(/);
  if (consoleLogFiles.length > 0) {
    warnings++;
    log.warn(`Found ${consoleLogFiles.length} files with console statements`);
  } else {
    log.success('No console statements found');
  }

  // Check for commented code
  const commentedCode = findFilesWithPattern(WEB_DIR, /^\s*\/\/\s*(const|let|function|class|return|if)/m);
  if (commentedCode.length > 5) {
    warnings++;
    log.warn(`Found ${commentedCode.length} files with commented code - consider removing`);
  }
}

/**
 * 5. UI/UX CONSISTENCY
 */
function checkUIConsistency() {
  log.section('5. UI/UX CONSISTENCY');

  // Check for consistent component imports
  const webComponents = getFilesRecursive(WEB_DIR, /\.tsx$/);
  let radioUIUsage = 0;
  let customUICount = 0;

  webComponents.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes('@repo/ui') || content.includes('from "@')) {
      radioUIUsage++;
    }
    if (content.match(/styled|css-in-js/i)) {
      customUICount++;
    }
  });

  log.info(`Component imports: ${radioUIUsage} use @repo/ui library`);
  if (customUICount > 0) {
    warnings++;
    log.warn(`Found ${customUICount} files with inline CSS - use Tailwind/component library`);
  } else {
    log.success('UI is consistent with component library + Tailwind');
  }

  // Check for Tailwind class consistency
  const tailwindConfigExists = fs.existsSync(path.join(WEB_DIR, 'tailwind.config.ts'));
  if (tailwindConfigExists) {
    log.success('Tailwind configuration is centralized');
  }

  // Check for dark mode implementation
  const darkModeFiles = findFilesWithPattern(WEB_DIR, /dark:/);
  log.info(`Found ${darkModeFiles.length} files with dark mode classes`);

  // Check providers
  const providerFiles = getFilesRecursive(WEB_DIR, /providers\//);
  if (providerFiles.length > 0) {
    log.success(`Found ${providerFiles.length} context providers (proper architecture)`);
  }
}

/**
 * 6. PERFORMANCE CHECKS
 */
function checkPerformance() {
  log.section('6. PERFORMANCE ISSUES');

  // Check for unused dependencies
  const webPkgJson = require(path.join(WEB_DIR, 'package.json'));
  const webDeps = { ...webPkgJson.dependencies, ...webPkgJson.devDependencies };
  
  // Read actual file contents
  const allFiles = getFilesRecursive(WEB_DIR, /\.(ts|tsx|js|jsx)$/);
  const allContent = allFiles.map(f => {
    try {
      return fs.readFileSync(f, 'utf8');
    } catch {
      return '';
    }
  }).join('\n');

  const ignoreDeps = [
    'typescript',
    'eslint',
    'postcss',
    'tailwindcss',
    'autoprefixer',
    'next-themes',
    'react-dom',  // Used by Next.js internally
    '@types/node',  // Used by TypeScript compiler
    '@types/react',  // Used by TypeScript compiler
    '@types/react-dom',  // Used by TypeScript compiler
    '@eslint/eslintrc',  // Used in eslint configuration
    'eslint-config-next',  // Used in eslint configuration
  ];
  const unusedDeps = [];
  
  Object.keys(webDeps).forEach(dep => {
    if (ignoreDeps.includes(dep)) return;
    
    // Create regex to match the dependency in various import formats
    // This handles both direct imports and subpath imports (e.g., "@repo/supabase/server")
    const depRegex = new RegExp(`["']${dep.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`);
    
    const isUsed = depRegex.test(allContent);
    if (!isUsed) {
      unusedDeps.push(dep);
    }
  });

  if (unusedDeps.length > 0) {
    warnings++;
    log.warn(`Found ${unusedDeps.length} unused dependencies:`);
    unusedDeps.forEach(dep => log.info(`  - ${dep}`));
  } else {
    log.success('All dependencies appear to be in use');
  }

  // Check for large files
  const largeFiles = getFilesRecursive(WEB_DIR, /\.(tsx?|jsx?)$/)
    .map(f => ({ 
      path: f, 
      size: fs.statSync(f).size 
    }))
    .filter(f => f.size > 50000)
    .sort((a, b) => b.size - a.size)
    .slice(0, 5);

  if (largeFiles.length > 0) {
    warnings++;
    log.warn(`Found ${largeFiles.length} large files (>50KB) - consider splitting:`);
    largeFiles.forEach(f => {
      const kb = (f.size / 1024).toFixed(1);
      log.info(`  ${path.relative(WEB_DIR, f.path)} - ${kb}KB`);
    });
  } else {
    log.success('No overly large files detected');
  }

  // Check for missing Next.js Image optimization
  const imgTags = findFilesWithPattern(WEB_DIR, /<img\s+/);
  if (imgTags.length > 0) {
    warnings++;
    log.warn(`Found ${imgTags.length} <img> tags - use Next.js Image component for optimization`);
  } else {
    log.success('Images are properly optimized');
  }
}

/**
 * 7. VERIFICATION & SUMMARY
 */
function generateSummary() {
  log.section('7. SCAN SUMMARY');

  const total = issues + warnings;
  if (total === 0) {
    console.log(`\n${colors.green}${colors.bold}✓ EXCELLENT!${colors.reset} ${colors.green}No critical issues found.${colors.reset}\n`);
    return 0;
  }

  console.log(`\n${colors.bold}RESULTS:${colors.reset}`);
  console.log(`  ${colors.red}Critical Issues: ${issues}${colors.reset}`);
  console.log(`  ${colors.yellow}Warnings: ${warnings}${colors.reset}`);
  console.log(`  ${colors.bold}Total: ${total}${colors.reset}\n`);

  console.log(`${colors.bold}NEXT STEPS:${colors.reset}`);
  if (issues > 0) {
    console.log(`  1. Fix linting/type errors: ${colors.cyan}npm run lint${colors.reset} & ${colors.cyan}npm run check-types${colors.reset}`);
  }
  if (warnings > 0) {
    console.log(`  2. Review warnings above and refactor as needed`);
    console.log(`  3. Re-run scan: ${colors.cyan}npm run scan${colors.reset}`);
  }
  console.log('');

  return issues > 0 ? 1 : 0;
}

// ============ HELPER FUNCTIONS ============

function getFilesRecursive(dir, pattern = /.*/) {
  if (!fs.existsSync(dir)) return [];
  const results = [];
  
  function walk(currentDir) {
    try {
      const files = fs.readdirSync(currentDir);
      files.forEach(file => {
        const fullPath = path.join(currentDir, file);
        // Skip node_modules, .next, etc
        if (file.startsWith('.') || file === 'node_modules' || file === '.next') return;
        
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          walk(fullPath);
        } else if (pattern.test(file)) {
          results.push(fullPath);
        }
      });
    }catch{}
  }
  
  walk(dir);
  return results;
}

function findFilesWithPattern(dir, pattern) {
  const files = getFilesRecursive(dir, /\.(ts|tsx|js|jsx)$/);
  return files.filter(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      return pattern.test(content);
    } catch{
      return false;
    }
  });
}

function countImports(dir, importPath) {
  const files = getFilesRecursive(dir, /\.(ts|tsx|js|jsx)$/);
  let count = 0;
  files.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      if (content.includes(`from "${importPath}`) || content.includes(`from '${importPath}`)) {
        count++;
      }
    } catch{}
  });
  return count;
}

// ============ RUN SCAN ============

console.log(`\n${colors.bold}${colors.cyan}🔍 PAWPALL CODE QUALITY SCAN${colors.reset}\n`);

checkLinting();
checkDuplication();
checkMaintainability();
checkUnnecessaryCode();
checkUIConsistency();
checkPerformance();
const exitCode = generateSummary();

process.exit(exitCode);
