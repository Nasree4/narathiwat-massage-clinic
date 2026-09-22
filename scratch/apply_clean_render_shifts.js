const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

// Replace buildCardHTML, buildListItemHTML, buildTableRowHTML inside renderManageShifts
const oldStartMarker = '      // Helper function to build card HTML\n      const buildCardHTML = (asst) => {';
const oldEndMarker = '      // 4. Render by Current View Mode';

const startIdx = html.indexOf(oldStartMarker);
const endIdx = html.indexOf(oldEndMarker);

if (startIdx === -1 || endIdx === -1) {
  console.error('Could not find markers:', { startIdx, endIdx });
  process.exit(1);
}

const newRenderers = `      // Helper function to build clean name-focused card HTML
      const buildCardHTML = (asst) => {
        const isMale = asst.gender === 'male';
        const isOff = asst.active === false || asst.shiftType === 'off';
        const shiftInfo = getShiftBadgeInfo(asst);
        
        // Count total cases and today's cases for this assistant
        const asstApts = getAssistantAppointmentsList(asst.id);
        const totalCases = asstApts.length;
        const todayStr = targetRosterDate || (typeof getTodayDateString === "function" ? getTodayDateString() : "");
        const todayCases = asstApts.filter(a => (a.bookDate || a.book_date) === todayStr).length;

        const statusDot = isOff 
          ? '<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">⚪ ลาเวร/พัก</span>'
          : \`<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-bold \${shiftInfo.badgeClass}">🟢 \${shiftInfo.shortLabel}</span>\`;

        return \`
          <div onclick="openAssistantDetailModal('\${asst.id}')" class="p-3.5 bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-herbal-500 dark:hover:border-emerald-500 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between gap-3 group">
            <div class="flex items-center space-x-3 min-w-0">
              \${getAssistantAvatarHTML(asst, 'w-11 h-11', 'text-xs')}
              <div class="min-w-0 flex-1">
                <div class="flex items-center space-x-1.5 flex-wrap">
                  <span class="font-bold text-sm text-slate-800 dark:text-white group-hover:text-herbal-700 dark:group-hover:text-emerald-400 transition truncate">\${escapeHtml(asst.name)}</span>
                </div>
                <div class="flex items-center space-x-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  <span class="font-semibold text-herbal-800 dark:text-emerald-300">ชื่อเล่น: \${escapeHtml(asst.nickname)}</span>
                  <span>•</span>
                  <span>\${isMale ? '👨 ชาย' : '👩 หญิง'}</span>
                </div>
              </div>
            </div>

            <div class="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
              <div>\${statusDot}</div>
              <div class="flex items-center space-x-2">
                <span class="text-[11px] font-bold text-herbal-800 dark:text-emerald-300">💆‍♂️ \${totalCases} เคส</span>
                <span class="text-slate-400 group-hover:text-herbal-600 dark:group-hover:text-emerald-400 font-bold transition">➔</span>
              </div>
            </div>
          </div>
        \`;
      };

      // Helper function to build clean name-focused list item HTML
      const buildListItemHTML = (asst, idx) => {
        const isMale = asst.gender === 'male';
        const isOff = asst.active === false || asst.shiftType === 'off';
        const shiftInfo = getShiftBadgeInfo(asst);
        
        // Count total cases and today's cases for this assistant
        const asstApts = getAssistantAppointmentsList(asst.id);
        const totalCases = asstApts.length;
        const todayStr = targetRosterDate || (typeof getTodayDateString === "function" ? getTodayDateString() : "");
        const todayCases = asstApts.filter(a => (a.bookDate || a.book_date) === todayStr).length;

        const statusBadge = isOff 
          ? '<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">⚪ ลาเวร / พัก</span>'
          : \`<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-bold \${shiftInfo.badgeClass}">🟢 \${shiftInfo.shortLabel}</span>\`;

        return \`
          <div onclick="openAssistantDetailModal('\${asst.id}')" class="p-3 bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200/90 dark:border-slate-700 hover:border-herbal-500 dark:hover:border-emerald-500 hover:shadow-md transition-all duration-150 flex items-center justify-between gap-3 cursor-pointer group">
            <div class="flex items-center space-x-3 min-w-0">
              <span class="text-xs font-mono text-slate-400 w-5 text-center hidden sm:inline-block">\${idx + 1}</span>
              \${getAssistantAvatarHTML(asst, 'w-10 h-10', 'text-xs')}
              <div class="min-w-0">
                <div class="flex items-center space-x-2 flex-wrap">
                  <span class="font-bold text-sm text-slate-800 dark:text-white group-hover:text-herbal-700 dark:group-hover:text-emerald-400 transition truncate">\${escapeHtml(asst.name)}</span>
                  <span class="text-xs font-semibold text-herbal-700 dark:text-emerald-300">(\${escapeHtml(asst.nickname)})</span>
                  \${statusBadge}
                </div>
                <div class="flex items-center space-x-2 text-[11px] text-slate-400 mt-0.5">
                  <span>\${isMale ? '👨 ชาย' : '👩 หญิง'}</span>
                  <span>•</span>
                  <span class="font-mono">\${asst.phone ? escapeHtml(asst.phone) : 'ไม่มีเบอร์'}</span>
                  \${asst.role === 'admin' ? '<span class="text-purple-600 font-bold">• 🛡️ Admin</span>' : ''}
                </div>
              </div>
            </div>

            <div class="flex items-center space-x-3 shrink-0">
              <div class="hidden sm:flex flex-col items-end text-right">
                <span class="text-xs font-bold text-herbal-800 dark:text-emerald-300">💆‍♂️ \${totalCases} เคส</span>
                <span class="text-[10px] text-slate-400">วันนี้ \${todayCases} เคส</span>
              </div>
              <button type="button" class="px-3 py-1.5 rounded-xl bg-herbal-50 dark:bg-emerald-950/50 group-hover:bg-herbal-700 group-hover:text-white text-herbal-700 dark:text-emerald-300 text-xs font-bold transition flex items-center space-x-1 border border-herbal-200/80 dark:border-emerald-800 shadow-2xs cursor-pointer">
                <span>ดูประวัติ & จัดการ</span>
                <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
              </button>
            </div>
          </div>
        \`;
      };

      // Helper function to build clean name-focused table row HTML
      const buildTableRowHTML = (asst, idx) => {
        const isMale = asst.gender === 'male';
        const isOff = asst.active === false || asst.shiftType === 'off';
        const shiftInfo = getShiftBadgeInfo(asst);
        const asstApts = getAssistantAppointmentsList(asst.id);
        const totalCases = asstApts.length;
        const todayStr = targetRosterDate || (typeof getTodayDateString === "function" ? getTodayDateString() : "");
        const todayCases = asstApts.filter(a => (a.bookDate || a.book_date) === todayStr).length;

        const statusBadge = isOff 
          ? '<span class="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-slate-100 text-slate-500 border border-slate-200">⚪ ลาเวร</span>'
          : \`<span class="px-2 py-0.5 rounded-full text-[10.5px] font-bold \${shiftInfo.badgeClass}">🟢 \${shiftInfo.shortLabel}</span>\`;

        return \`
          <tr onclick="openAssistantDetailModal('\${asst.id}')" class="hover:bg-herbal-50/60 dark:hover:bg-slate-800/80 transition text-slate-700 dark:text-slate-200 cursor-pointer group">
            <td class="px-3.5 py-3 text-center text-xs text-slate-400 font-mono">\${idx + 1}</td>
            <td class="px-3.5 py-3">
              <div class="flex items-center space-x-2.5">
                \${getAssistantAvatarHTML(asst, 'w-8 h-8', 'text-[10.5px]')}
                <div>
                  <div class="font-bold text-xs sm:text-sm text-slate-800 dark:text-white group-hover:text-herbal-700 transition flex items-center gap-1.5">
                    <span>\${escapeHtml(asst.name)}</span>
                    <span class="text-xs text-herbal-700">(\${escapeHtml(asst.nickname)})</span>
                  </div>
                  <div class="text-[11px] text-slate-400">\${isMale ? 'ชาย' : 'หญิง'} • \${asst.phone ? escapeHtml(asst.phone) : 'ไม่มีเบอร์'}</div>
                </div>
              </div>
            </td>
            <td class="px-3.5 py-3">\${statusBadge}</td>
            <td class="px-3.5 py-3">
              <span class="font-bold text-herbal-800 text-xs">💆‍♂️ \${totalCases} เคส</span>
              <span class="text-[10.5px] text-slate-400 ml-1">(วันนี้ \${todayCases})</span>
            </td>
            <td class="px-3.5 py-3 text-right">
              <span class="text-xs font-bold text-herbal-700 group-hover:underline inline-flex items-center gap-1">
                ดูประวัติ & จัดการ <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
              </span>
            </td>
          </tr>
        \`;
      };

`;

html = html.slice(0, startIdx) + newRenderers + html.slice(endIdx);

// Also update today's cases calculation in statOtEl
const statOtReplaceFrom = '      const statOtEl = document.getElementById("asst-stat-ot");\n      if (statOtEl) statOtEl.innerHTML = `${otCount} <span class="text-[11px] font-normal text-purple-500">คน</span>`;';
const statOtReplaceTo = `      const todayCasesCount = (Array.isArray(appointments) ? appointments : []).filter(a => {
        const d = a.bookDate || a.book_date;
        return d === targetRosterDate && (a.assistantId || a.assistant_id || a.assistantNick);
      }).length;
      const statOtEl = document.getElementById("asst-stat-ot");
      if (statOtEl) statOtEl.innerHTML = \`\${todayCasesCount} <span class="text-[11px] font-normal text-purple-500">เคส</span>\`;`;

html = html.replace(statOtReplaceFrom, statOtReplaceTo);

fs.writeFileSync('index.html', html);
console.log('Step 3 complete: Clean name-focused renderers applied to renderManageShifts');
