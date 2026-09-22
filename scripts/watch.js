const fs = require('fs');
const path = require('path');
const { build } = require('./build');

const rootDir = path.resolve(__dirname, '..');
const srcDir = path.join(rootDir, 'src');

console.log('👀 Starting watch mode on src/...');
console.log('Any changes to files in src/ will automatically trigger build.');

let debounceTimer = null;
function triggerRebuild(event, filename) {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    console.log(`\n🔄 Change detected in ${filename} (${event}). Rebuilding...`);
    try {
      build();
    } catch (err) {
      console.error('❌ Build error during watch:', err);
    }
  }, 200);
}

fs.watch(srcDir, { recursive: true }, triggerRebuild);

// Initial build
build();
