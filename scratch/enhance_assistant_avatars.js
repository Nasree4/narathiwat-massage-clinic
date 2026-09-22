const fs = require('fs');
const vm = require('vm');

console.log("=== ENHANCING ASSISTANT AVATARS & CLARIFYING NICKNAMES ===");

let content = fs.readFileSync('index.html', 'utf8');

// Add getAssistantAvatarHTML helper function
const avatarHelper = `    // Assistant Avatar & Visual Identifier Helper (v5.2.0)
    function getAssistantAvatarHTML(asst, size = 'w-10 h-10', textSize = 'text-xs') {
      if (!asst) return \`<div class="\${size} rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-400">?</div>\`;
      const isMale = asst.gender === 'male';
      const rawNick = (asst.nickname || asst.name || "").trim();

      const colorPalettes = isMale ? [
        'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800',
        'bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-800',
        'bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-950 dark:text-cyan-300 dark:border-cyan-800',
        'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-800',
        'bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-950 dark:text-teal-300 dark:border-teal-800'
      ] : [
        'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800',
        'bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-950 dark:text-pink-300 dark:border-pink-800',
        'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800',
        'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200 dark:bg-fuchsia-950 dark:text-fuchsia-300 dark:border-fuchsia-800',
        'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800',
        'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
      ];

      let hash = 0;
      for (let i = 0; i < rawNick.length; i++) hash = (hash * 31 + rawNick.charCodeAt(i)) >>> 0;
      const colorClass = colorPalettes[hash % colorPalettes.length];

      // Display up to 3-4 letters of nickname (so 'จวน', 'จอม', 'เนาะ', 'มีมี่', 'ป๊ะ' are fully visible and distinct)
      const label = rawNick.length <= 4 ? rawNick : rawNick.slice(0, 3);

      return \`
        <div class="\${size} rounded-xl flex items-center justify-center font-black \${textSize} shrink-0 border shadow-2xs \${colorClass}" title="\${escapeHtml(rawNick)}">
          \${escapeHtml(label || '?')}
        </div>
      \`;
    }`;

// Insert avatarHelper right above renderManageShifts
content = content.replace(
  `    // ==================== RENDER ASSISTANT SHIFTS TAB ====================`,
  `${avatarHelper}\n\n    // ==================== RENDER ASSISTANT SHIFTS TAB ====================`
);

// Update buildCardHTML avatar
content = content.replace(
  `<div class="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 border shadow-2xs \${isMale ? 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800' : 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800'}">
                    \${asst.nickname ? escapeHtml(asst.nickname.charAt(0)) : '?'}
                  </div>`,
  `\${getAssistantAvatarHTML(asst, 'w-11 h-11', 'text-xs')}`
);

// Update buildListItemHTML avatar
content = content.replace(
  `<div class="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 border shadow-2xs \${isMale ? 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800' : 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800'}">
                \${asst.nickname ? escapeHtml(asst.nickname.charAt(0)) : '?'}
              </div>`,
  `\${getAssistantAvatarHTML(asst, 'w-10 h-10', 'text-xs')}`
);

// Update buildTableRowHTML avatar
content = content.replace(
  `<div class="w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs shrink-0 border \${isMale ? 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800' : 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800'}">
                  \${asst.nickname ? escapeHtml(asst.nickname.charAt(0)) : '?'}
                </div>`,
  `\${getAssistantAvatarHTML(asst, 'w-8 h-8', 'text-[10.5px]')}`
);

// Bump version to v5.2.0
content = content.replace(/v5\.1\.9/g, 'v5.2.0');

// Write back to all 4 HTML files
fs.writeFileSync('index.html', content, 'utf8');
fs.writeFileSync('TTM Booking System.html', content, 'utf8');
fs.writeFileSync('dist/index.html', content, 'utf8');
fs.writeFileSync('dist/TTM Booking System.html', content, 'utf8');
console.log("Synchronized all 4 HTML files to v5.2.0.");

// Update Service Worker cache to v127
let swContent = fs.readFileSync('sw.js', 'utf8');
swContent = swContent.replace('ttm-clinic-cache-v126', 'ttm-clinic-cache-v127');
fs.writeFileSync('sw.js', swContent, 'utf8');
fs.writeFileSync('dist/sw.js', swContent, 'utf8');
console.log("Updated sw.js and dist/sw.js to ttm-clinic-cache-v127.");

// Validate JavaScript syntax in all modified HTML files
const scriptMatches = content.match(/<script[^>]*>([\s\S]*?)<\/script>/gi);
let totalScripts = 0;
if (scriptMatches) {
  scriptMatches.forEach((tag, idx) => {
    const code = tag.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '');
    if (code.trim().length > 50) {
      try {
        new vm.Script(code);
        totalScripts++;
      } catch (err) {
        console.error("JS Syntax Error in script #" + idx + ":", err);
        process.exit(1);
      }
    }
  });
}
console.log("All " + totalScripts + " scripts validated with vm.Script (0 errors)!");
