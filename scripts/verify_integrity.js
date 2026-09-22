const fs = require('fs');
const path = require('path');
const vm = require('vm');

function extractMainScript(htmlContent) {
  const lines = htmlContent.split('\n');
  let startLine = -1;
  let endLine = -1;

  // Search from after line 100 for the main standalone <script> tag
  for (let i = 100; i < lines.length; i++) {
    if (lines[i].trim() === '<script>') {
      startLine = i;
      break;
    }
  }

  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].trim() === '</script>') {
      endLine = i;
      break;
    }
  }

  if (startLine === -1 || endLine === -1 || endLine <= startLine) {
    throw new Error(`Could not locate main <script> tag boundaries. startLine: ${startLine}, endLine: ${endLine}`);
  }

  const htmlBefore = lines.slice(0, startLine).join('\n');
  const jsCode = lines.slice(startLine + 1, endLine).join('\n');
  const htmlAfter = lines.slice(endLine + 1).join('\n');

  return { htmlBefore, jsCode, htmlAfter, startLine: startLine + 1, endLine: endLine + 1 };
}

function runIntegrityCheck(htmlFilePath, jsCodeToCheck = null) {
  console.log('🔍 Starting Integrity & Syntax Validation...');
  console.log('Target HTML:', htmlFilePath);

  if (!fs.existsSync(htmlFilePath)) {
    console.error('❌ File not found:', htmlFilePath);
    process.exit(1);
  }

  const fullHtml = fs.readFileSync(htmlFilePath, 'utf8');
  let htmlBefore = fullHtml;
  let jsCode = jsCodeToCheck;

  if (fullHtml.includes('<!-- [[APP_SCRIPTS]] -->')) {
    htmlBefore = fullHtml.substring(0, fullHtml.indexOf('<!-- [[APP_SCRIPTS]] -->'));
  } else if (!jsCode) {
    const extracted = extractMainScript(fullHtml);
    htmlBefore = extracted.htmlBefore;
    jsCode = extracted.jsCode;
    console.log(`📍 Main script located at lines ${extracted.startLine} to ${extracted.endLine} (${jsCode.split('\n').length} lines)`);
  } else {
    // If jsCode was passed and fullHtml doesn't have placeholder, find boundary
    try {
      const extracted = extractMainScript(fullHtml);
      htmlBefore = extracted.htmlBefore;
    } catch (e) {
      htmlBefore = fullHtml;
    }
  }

  if (!jsCode) {
    console.error('❌ No JavaScript code provided or extracted to check');
    process.exit(1);
  }

  // 1. Syntax Check with vm.Script
  console.log('⏱️ 1. Checking JavaScript Syntax with Node VM...');
  try {
    new vm.Script(jsCode, { filename: 'app_bundle.js' });
    console.log('✅ JavaScript Syntax is 100% valid!');
  } catch (err) {
    console.error('❌ Syntax Error detected in JavaScript:');
    console.error(err.message);
    if (err.stack) console.error(err.stack);
    process.exit(1);
  }

  // 2. Scan HTML for inline event handlers
  console.log('⏱️ 2. Scanning HTML for event handler functions...');
  const handlerRegex = /\b(on[a-z]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/gi;
  let match;
  let handlerCount = 0;
  const invokedFunctions = new Set();
  const builtins = new Set([
    'alert', 'confirm', 'prompt', 'console', 'log', 'Math', 'encodeURIComponent',
    'decodeURIComponent', 'event', 'Date', 'parseInt', 'parseFloat', 'Boolean',
    'String', 'Array', 'Object', 'JSON', 'isNaN', 'isFinite', 'setTimeout',
    'clearTimeout', 'setInterval', 'clearInterval', 'focus', 'blur', 'submit',
    'reset', 'select', 'click', 'scrollIntoView', 'stopPropagation', 'preventDefault',
    'if', 'for', 'while', 'switch', 'return'
  ]);

  while ((match = handlerRegex.exec(htmlBefore)) !== null) {
    handlerCount++;
    const code = match[2] || match[3] || '';
    const fnRegex = /([a-zA-Z0-9_$]+)\s*\(/g;
    let fnMatch;
    while ((fnMatch = fnRegex.exec(code)) !== null) {
      const fnName = fnMatch[1];
      if (!builtins.has(fnName)) {
        invokedFunctions.add(fnName);
      }
    }
  }

  console.log(`Found ${handlerCount} event handler attributes and ${invokedFunctions.size} distinct function calls.`);

  // 3. Find function definitions in JS
  console.log('⏱️ 3. Verifying definitions in JavaScript...');
  const missingFunctions = [];
  const foundFunctions = [];

  for (const fn of invokedFunctions) {
    const patterns = [
      new RegExp(`(?:async\\s+)?function\\s+${fn}\\b`),
      new RegExp(`(?:const|let|var|window\\.)\\s*${fn}\\s*=`),
      new RegExp(`\\b${fn}\\s*=\\s*(?:async\\s*)?(?:function|\\()`),
      new RegExp(`window\\[['"]${fn}['"]\\]\\s*=`)
    ];

    const isDefined = patterns.some(p => p.test(jsCode));
    if (isDefined) {
      foundFunctions.push(fn);
    } else {
      missingFunctions.push(fn);
    }
  }

  console.log(`✅ Verified defined functions: ${foundFunctions.length} / ${invokedFunctions.size}`);

  if (missingFunctions.length > 0) {
    console.warn(`⚠️ Warning: ${missingFunctions.length} function(s) called in HTML were not matched by standard declaration patterns:`);
    missingFunctions.forEach(fn => console.warn(`   - ${fn}`));
  } else {
    console.log('🎉 100% of HTML event handlers are verified and present in JavaScript!');
  }

  return {
    validSyntax: true,
    handlerCount,
    invokedCount: invokedFunctions.size,
    foundCount: foundFunctions.length,
    missingFunctions,
    extractMainScript
  };
}

if (require.main === module) {
  const target = process.argv[2] || 'index.html';
  runIntegrityCheck(target);
}

module.exports = { runIntegrityCheck, extractMainScript };
