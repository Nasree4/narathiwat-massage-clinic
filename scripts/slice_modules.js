const fs = require('fs');
const path = require('path');

const slices = [
  { name: '01_constants_and_state.js', start: 5802, end: 6048, desc: 'Constants, LocalStorage keys, App State defaults' },
  { name: '02_notifications_and_alerts.js', start: 6049, end: 6538, desc: 'Notifications, Toasts, Realtime Alerts & Sounds' },
  { name: '03_time_tracking_and_lifecycle.js', start: 6539, end: 7265, desc: 'Patient Treatment Timer & Lifecycle Engine' },
  { name: '04_settings_theme_and_shifts.js', start: 7266, end: 8144, desc: 'System Settings, 3D Theme, Shift Config, Rate Limiting' },
  { name: '05_supabase_and_sync.js', start: 8145, end: 9850, desc: 'Supabase Integration, Cloud Sync & Slot Configs' },
  { name: '06_auth_and_rbac.js', start: 9851, end: 10939, desc: 'Authentication, Login/Logout, Roles & RBAC' },
  { name: '07_ui_components_and_reviews.js', start: 10940, end: 12146, desc: 'Hero Clock, Booking Toggle, Audit Logs, Patient Reviews' },
  { name: '08_staff_selection_and_schemes.js', start: 12147, end: 13553, desc: 'Staff Quick Chips, Availability & Treatment Schemes' },
  { name: '09_appointment_desk_and_queue.js', start: 13554, end: 16385, desc: 'Desk Queue, Calling Voice, Edit Gender/Time/Services' },
  { name: '10_canvas_slip_generator.js', start: 16386, end: 17038, desc: 'Fast Canvas Slip Generator & Printing' },
  { name: '11_patients_directory.js', start: 17039, end: 18778, desc: 'Patients Directory, Search & Treatment History' },
  { name: '12_assistant_shifts_and_roster.js', start: 18779, end: 22338, desc: 'Assistant Shifts, Duty Roster, Modal & Monthly History' },
  { name: '13_services_crud.js', start: 22339, end: 23207, desc: 'Main & Extra Treatment Services Management' },
  { name: '14_pwa_and_lifecycle.js', start: 23208, end: 23488, desc: 'PWA Service Worker, Auto-Update & Online Status' },
  { name: '15_booking_wizard_and_app_init.js', start: 23489, end: 24969, desc: '5-Step Booking Wizard Logic & App Init' }
];

function sliceModules() {
  const rootDir = path.resolve(__dirname, '..');
  const indexHtmlPath = path.join(rootDir, 'index.html');
  const srcDir = path.join(rootDir, 'src');
  const jsDir = path.join(srcDir, 'js');

  if (!fs.existsSync(srcDir)) fs.mkdirSync(srcDir, { recursive: true });
  if (!fs.existsSync(jsDir)) fs.mkdirSync(jsDir, { recursive: true });

  const content = fs.readFileSync(indexHtmlPath, 'utf8');
  const lines = content.split('\n');

  console.log('📦 Splitting monolithic script into src/js/ modules...');

  // 1. Create template.html
  const htmlBefore = lines.slice(0, 5800).join('\n'); // Up to line 5800
  const htmlAfter = lines.slice(24970).join('\n');    // From line 24971 (</body>...)
  const templateContent = `${htmlBefore}\n\n  <!-- [[APP_SCRIPTS]] -->\n\n${htmlAfter}`;
  fs.writeFileSync(path.join(srcDir, 'template.html'), templateContent, 'utf8');
  console.log('✅ Created src/template.html');

  // 2. Extract each slice
  slices.forEach((s, idx) => {
    const sliceLines = lines.slice(s.start - 1, s.end);
    const filePath = path.join(jsDir, s.name);
    const fileHeader = `/**\n * Module ${idx + 1}: ${s.name}\n * Description: ${s.desc}\n * Generated from lines ${s.start} to ${s.end} of original index.html\n */\n\n`;
    fs.writeFileSync(filePath, fileHeader + sliceLines.join('\n') + '\n', 'utf8');
    console.log(`   📄 Created src/js/${s.name} (${sliceLines.length} lines)`);
  });

  // 3. Create manifest of modules
  const manifest = {
    version: '5.3.0',
    generatedAt: new Date().toISOString(),
    modules: slices.map(s => ({ file: s.name, desc: s.desc }))
  };
  fs.writeFileSync(path.join(jsDir, 'modules.json'), JSON.stringify(manifest, null, 2), 'utf8');
  console.log('✅ Created src/js/modules.json');

  // 4. Create a dev runner HTML (src/index.dev.html) with separate script tags
  const scriptTags = slices.map(s => `  <script src="js/${s.name}"></script>`).join('\n');
  const devHtml = `${htmlBefore}\n\n${scriptTags}\n\n${htmlAfter}`;
  fs.writeFileSync(path.join(srcDir, 'index.dev.html'), devHtml, 'utf8');
  console.log('✅ Created src/index.dev.html (for direct unbundled dev testing)');

  console.log('🎉 Slicing completed successfully!');
}

if (require.main === module) {
  sliceModules();
}

module.exports = { sliceModules, slices };
