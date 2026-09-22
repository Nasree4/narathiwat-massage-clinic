const fs = require('fs');
const content = fs.readFileSync('index.html', 'utf8');

const matches = content.match(/nickname:\s*["'][^"']+["']/g);
console.log('Unique Nicknames found in index.html:');
console.log([...new Set(matches)]);
