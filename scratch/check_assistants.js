const fs = require('fs');
const content = fs.readFileSync('index.html', 'utf8');
const lines = content.split('\n');

lines.forEach((line, idx) => {
  if (line.includes('.from("assistants")') || line.includes(".from('assistants')")) {
    console.log('LINE:', idx + 1);
    console.log(lines.slice(Math.max(0, idx - 2), Math.min(lines.length, idx + 15)).join('\n'));
    console.log('--------------------------------------------------');
  }
});
