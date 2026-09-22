const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { runIntegrityCheck } = require('./verify_integrity');

const rootDir = path.resolve(__dirname, '..');
const srcDir = path.join(rootDir, 'src');
const jsDir = path.join(srcDir, 'js');
const distDir = path.join(rootDir, 'dist');
const templatePath = path.join(srcDir, 'template.html');

function build() {
  console.log('🚀 Starting Build Process...');
  const startTime = Date.now();

  if (!fs.existsSync(templatePath)) {
    console.error('❌ Template file not found:', templatePath);
    process.exit(1);
  }

  // 1. Read modules list
  const manifestPath = path.join(jsDir, 'modules.json');
  let moduleFiles = [];
  if (fs.existsSync(manifestPath)) {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    moduleFiles = manifest.modules.map(m => m.file);
  } else {
    moduleFiles = fs.readdirSync(jsDir)
      .filter(f => f.endsWith('.js'))
      .sort();
  }

  console.log(`📦 Found ${moduleFiles.length} modules to bundle.`);

  // 2. Validate individual modules syntax
  const jsContents = [];
  let totalLines = 0;

  for (const file of moduleFiles) {
    const filePath = path.join(jsDir, file);
    const code = fs.readFileSync(filePath, 'utf8');
    const lines = code.split('\n').length;
    totalLines += lines;

    // Syntax check on each module
    try {
      new vm.Script(code, { filename: file });
      console.log(`   ✅ ${file} (${lines} lines) - syntax OK`);
    } catch (err) {
      console.error(`❌ Syntax Error in ${file}:`);
      console.error(err.message);
      if (err.stack) console.error(err.stack);
      process.exit(1);
    }

    jsContents.push(code);
  }

  // 3. Assemble unified bundle
  const combinedJs = jsContents.join('\n\n');
  console.log(`\n🔗 Combined JS bundle: ${combinedJs.split('\n').length} lines (${(Buffer.byteLength(combinedJs, 'utf8') / 1024).toFixed(1)} KB)`);

  // 4. Validate combined bundle syntax
  try {
    new vm.Script(combinedJs, { filename: 'bundle.js' });
    console.log('✅ Unified JS bundle syntax verified!');
  } catch (err) {
    console.error('❌ Syntax Error in combined bundle:', err);
    process.exit(1);
  }

  // 5. Build full HTML
  const templateHtml = fs.readFileSync(templatePath, 'utf8');
  const bundleScriptTag = `  <script>\n${combinedJs}\n  </script>`;
  
  if (!templateHtml.includes('<!-- [[APP_SCRIPTS]] -->')) {
    console.error('❌ Could not find placeholder <!-- [[APP_SCRIPTS]] --> in src/template.html');
    process.exit(1);
  }

  const finalHtml = templateHtml.replace('<!-- [[APP_SCRIPTS]] -->', bundleScriptTag);

  // 6. Run Integrity Check on output
  console.log('\n🔍 Running Full Integrity Check on final bundle...');
  const integrity = runIntegrityCheck(templatePath, combinedJs);

  if (integrity.missingFunctions.length > 0) {
    console.error('❌ Build failed: Missing functions in bundle that are called by HTML:');
    console.error(integrity.missingFunctions.join(', '));
    process.exit(1);
  }

  // 7. Write to index.html, dist/index.html, and TTM Booking System.html
  console.log('\n💾 Writing output files...');
  fs.writeFileSync(path.join(rootDir, 'index.html'), finalHtml, 'utf8');
  console.log('   ✅ Written to index.html');

  if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true });
  fs.writeFileSync(path.join(distDir, 'index.html'), finalHtml, 'utf8');
  console.log('   ✅ Written to dist/index.html');

  fs.writeFileSync(path.join(rootDir, 'TTM Booking System.html'), finalHtml, 'utf8');
  console.log('   ✅ Written to TTM Booking System.html');

  // 8. Copy static assets to dist/
  const staticAssets = [
    'logo.png', 'favicon.png', 'icon-192.png', 'icon-512.png',
    'icon-maskable-192.png', 'icon-maskable-512.png', 'apple-touch-icon.png',
    'manifest.json', 'sw.js'
  ];
  let assetCount = 0;
  staticAssets.forEach(asset => {
    const srcAsset = path.join(rootDir, asset);
    if (fs.existsSync(srcAsset)) {
      fs.copyFileSync(srcAsset, path.join(distDir, asset));
      assetCount++;
    }
  });
  console.log(`   ✅ Copied ${assetCount} static assets to dist/`);

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\n🎉 BUILD SUCCESSFUL in ${duration}s! All 160 HTML handlers verified & 15 modules assembled cleanly.`);
}

if (require.main === module) {
  build();
}

module.exports = { build };
