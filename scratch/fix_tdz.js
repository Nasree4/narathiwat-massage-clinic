const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

// 1. Move targetRosterDate and rosterForDate to top of renderManageShifts
const oldHeader = `    function renderManageShifts(dateStr) {
      const container = document.getElementById("assistants-shifts-list");
      if (!container) return;
      assistants = deduplicateAssistants(assistants);`;

const newHeader = `    function renderManageShifts(dateStr) {
      const container = document.getElementById("assistants-shifts-list");
      if (!container) return;
      assistants = deduplicateAssistants(assistants);

      const targetRosterDate = dateStr || (typeof currentRosterDate !== "undefined" && currentRosterDate) || (typeof getTodayDateString === "function" ? getTodayDateString() : "");
      const rosterForDate = (typeof assistantDutyRosters !== "undefined" && assistantDutyRosters[targetRosterDate]) ? assistantDutyRosters[targetRosterDate] : {};`;

if (!html.includes(oldHeader)) {
  console.error('Could not find oldHeader');
  process.exit(1);
}

html = html.replace(oldHeader, newHeader);

// 2. Remove duplicate declaration later in the function
const oldDup = `      // 3. Filter and Sort Assistants List
      const targetRosterDate = dateStr || (typeof currentRosterDate !== "undefined" && currentRosterDate) || (typeof getTodayDateString === "function" ? getTodayDateString() : "");
      const rosterForDate = (typeof assistantDutyRosters !== "undefined" && assistantDutyRosters[targetRosterDate]) ? assistantDutyRosters[targetRosterDate] : {};`;

const newDup = `      // 3. Filter and Sort Assistants List`;

if (!html.includes(oldDup)) {
  console.error('Could not find oldDup');
  process.exit(1);
}

html = html.replace(oldDup, newDup);

// Bump version badge and cache
html = html.replace(/v5\.2\.1/g, 'v5.2.2');
html = html.replace(/ttm-clinic-cache-v128/g, 'ttm-clinic-cache-v129');

fs.writeFileSync('index.html', html);
console.log('Fixed targetRosterDate TDZ error and bumped to v5.2.2 (ttm-clinic-cache-v129)');
