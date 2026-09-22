const fs = require('fs');
const vm = require('vm');

console.log("=== FIXING TDZ FOR ALL_WORKING_SLOTS & TESTING LOGIN ===");

let content = fs.readFileSync('index.html', 'utf8');

// Slot constants definition
const slotConstants = `    // Working Slots & Duty Hours Constants (Defined top-level to prevent TDZ)
    const IN_HOURS_SLOTS = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"];
    const OUT_OF_HOURS_SLOTS = ["17:00", "18:00", "19:00"];
    const ALL_WORKING_SLOTS = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"];`;

// Place slotConstants right before DEFAULT_USERS
const targetBefore = `    const DEFAULT_USERS = [`;

if (!content.includes(targetBefore)) {
  console.error("Error: targetBefore not found in index.html");
  process.exit(1);
}

// Remove old duplicate declarations at line 7284 if present
content = content.replace(
  `    // ==================== SHIFTS & WORKING HOURS CONFIGURATION ====================
    const IN_HOURS_SLOTS = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"];
    const OUT_OF_HOURS_SLOTS = ["17:00", "18:00", "19:00"];
    const ALL_WORKING_SLOTS = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"];`,
  `    // ==================== SHIFTS & WORKING HOURS CONFIGURATION ====================`
);

// Add slotConstants before DEFAULT_USERS
if (!content.includes("Working Slots & Duty Hours Constants")) {
  content = content.replace(targetBefore, `${slotConstants}\n\n${targetBefore}`);
}

// Ensure deduplicateAssistants uses safe fallback
content = content.replace(
  `slots: Array.isArray(asst.slots) ? asst.slots : (asst.active !== false ? [...ALL_WORKING_SLOTS] : []),`,
  `slots: Array.isArray(asst.slots) ? asst.slots : (asst.active !== false ? [...(typeof ALL_WORKING_SLOTS !== 'undefined' ? ALL_WORKING_SLOTS : ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"])] : []),`
);

// Save to index.html and all synced files
fs.writeFileSync('index.html', content, 'utf8');
fs.writeFileSync('TTM Booking System.html', content, 'utf8');
fs.writeFileSync('dist/index.html', content, 'utf8');
fs.writeFileSync('dist/TTM Booking System.html', content, 'utf8');

console.log("Successfully moved ALL_WORKING_SLOTS to top and synchronized all files.");
