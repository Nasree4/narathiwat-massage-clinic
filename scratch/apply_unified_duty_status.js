const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

// 1. Add getAssistantDutyStatusForDate helper function
const helperFunc = `
    // Unified Assistant Duty Status for Date Helper (v5.2.5)
    function getAssistantDutyStatusForDate(asst, dateStr) {
      if (!asst) return { isOff: true, type: 'off', label: '⚪ ลาเวร / พัก (Off Duty)', shortLabel: '⚪ ลาเวร / พัก', badgeClass: 'bg-slate-100 text-slate-500 border-slate-200' };

      const targetDate = dateStr || (typeof currentRosterDate !== "undefined" && currentRosterDate) || (typeof getTodayDateString === "function" ? getTodayDateString() : "");
      const rosterObj = (typeof assistantDutyRosters !== "undefined" && assistantDutyRosters[targetDate]) ? assistantDutyRosters[targetDate] : null;
      const rEntry = rosterObj && rosterObj[asst.id] ? (typeof normalizeAssistantRosterEntry === "function" ? normalizeAssistantRosterEntry(rosterObj[asst.id]) : rosterObj[asst.id]) : null;

      // 1. If explicit roster entry exists for this date
      if (rEntry) {
        if (rEntry.isExplicitlyEmpty || !rEntry.slots || rEntry.slots.length === 0) {
          return {
            isOff: true,
            type: 'off',
            label: '⚪ ลาเวร / พัก (Off Duty)',
            shortLabel: '⚪ ลาเวร / พัก',
            badgeClass: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700',
            slots: [],
            checkInTime: rEntry.checkInTime || ''
          };
        }

        const count = rEntry.slots.length;
        if (count >= ALL_WORKING_SLOTS.length) {
          return {
            isOff: false,
            type: 'full',
            label: '⭐ เข้าเวรทั้งวัน (08:00 - 19:00)',
            shortLabel: '⭐ ทั้งวัน',
            badgeClass: 'bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800',
            slots: rEntry.slots,
            checkInTime: rEntry.checkInTime || ''
          };
        }
        if (count === IN_HOURS_SLOTS.length && IN_HOURS_SLOTS.every(s => rEntry.slots.includes(s))) {
          return {
            isOff: false,
            type: 'official',
            label: '☀️ เวรในเวลา (08:00 - 16:00)',
            shortLabel: '☀️ ในเวลา',
            badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
            slots: rEntry.slots,
            checkInTime: rEntry.checkInTime || ''
          };
        }
        if (count === OUT_OF_HOURS_SLOTS.length && OUT_OF_HOURS_SLOTS.every(s => rEntry.slots.includes(s))) {
          return {
            isOff: false,
            type: 'ot',
            label: '🌙 เวรนอกเวลา / OT (17:00 - 19:00)',
            shortLabel: '🌙 นอกเวลา (OT)',
            badgeClass: 'bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800',
            slots: rEntry.slots,
            checkInTime: rEntry.checkInTime || ''
          };
        }
        return {
          isOff: false,
          type: 'custom',
          label: \`⚙️ กำหนดรอบเอง (\${count} รอบ)\`,
          shortLabel: \`⚙️ \${count} รอบ\`,
          badgeClass: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
          slots: rEntry.slots,
          checkInTime: rEntry.checkInTime || ''
        };
      }

      // 2. Fallback to assistant object's own default properties
      if (asst.active === false || asst.shiftType === 'off') {
        return {
          isOff: true,
          type: 'off',
          label: '⚪ ลาเวร / พัก (Off Duty)',
          shortLabel: '⚪ ลาเวร / พัก',
          badgeClass: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700',
          slots: [],
          checkInTime: ''
        };
      }

      const shiftInfo = getShiftBadgeInfo(asst);
      return {
        isOff: false,
        type: shiftInfo.type,
        label: shiftInfo.label,
        shortLabel: shiftInfo.shortLabel,
        badgeClass: shiftInfo.badgeClass,
        slots: asst.slots || [],
        checkInTime: ''
      };
    }
`;

if (!html.includes('function getAssistantDutyStatusForDate')) {
  html = html.replace('function openAssistantDetailModal(asstId, defaultTab = \'history\') {', helperFunc + '\n    function openAssistantDetailModal(asstId, defaultTab = \'history\') {');
}

// 2. Update openAssistantDetailModal duty badge
const oldModalDutyBadge = `      const isOff = asst.active === false || asst.shiftType === 'off';
      const dutyEl = document.getElementById("asst-detail-duty-badge");
      if (dutyEl) {
        dutyEl.textContent = isOff ? '⚪ ลาเวร / พัก (Off Duty)' : '🟢 กำลังเข้าเวรวันนี้';
        dutyEl.className = \`font-semibold \${isOff ? 'text-slate-400' : 'text-emerald-600 dark:text-emerald-400'}\`;
      }`;

const newModalDutyBadge = `      const targetRosterDate = (typeof currentRosterDate !== "undefined" && currentRosterDate) || (typeof getTodayDateString === "function" ? getTodayDateString() : "");
      const dutyStatus = getAssistantDutyStatusForDate(asst, targetRosterDate);
      const dutyEl = document.getElementById("asst-detail-duty-badge");
      if (dutyEl) {
        dutyEl.textContent = dutyStatus.isOff ? '⚪ ลาเวร / พัก (Off Duty)' : \`🟢 \${dutyStatus.shortLabel}\`;
        dutyEl.className = \`font-semibold \${dutyStatus.isOff ? 'text-slate-400' : 'text-emerald-600 dark:text-emerald-400'}\`;
      }`;

html = html.replace(oldModalDutyBadge, newModalDutyBadge);

// 3. Update buildCardHTML and buildListItemHTML to use getAssistantDutyStatusForDate
const oldCardStatus = `        const isOff = asst.active === false || asst.shiftType === 'off';
        const shiftInfo = getShiftBadgeInfo(asst);
        
        // Count total cases and today's cases for this assistant
        const asstApts = getAssistantAppointmentsList(asst.id);
        const totalCases = asstApts.length;
        const todayStr = targetRosterDate || (typeof getTodayDateString === "function" ? getTodayDateString() : "");
        const todayCases = asstApts.filter(a => (a.bookDate || a.book_date) === todayStr).length;

        const statusDot = isOff 
          ? '<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">⚪ ลาเวร/พัก</span>'
          : \`<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-bold \${shiftInfo.badgeClass}">🟢 \${shiftInfo.shortLabel}</span>\`;`;

const newCardStatus = `        const dutyStatus = getAssistantDutyStatusForDate(asst, targetRosterDate);
        const isOff = dutyStatus.isOff;
        
        // Count total cases and today's cases for this assistant
        const asstApts = getAssistantAppointmentsList(asst.id);
        const totalCases = asstApts.length;
        const todayStr = targetRosterDate || (typeof getTodayDateString === "function" ? getTodayDateString() : "");
        const todayCases = asstApts.filter(a => (a.bookDate || a.book_date) === todayStr).length;

        const statusDot = isOff 
          ? '<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">⚪ ลาเวร / พัก</span>'
          : \`<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-bold \${dutyStatus.badgeClass}">🟢 \${dutyStatus.shortLabel}</span>\`;`;

html = html.replace(oldCardStatus, newCardStatus);

const oldListStatus = `        const isOff = asst.active === false || asst.shiftType === 'off';
        const shiftInfo = getShiftBadgeInfo(asst);
        
        // Count total cases and today's cases for this assistant
        const asstApts = getAssistantAppointmentsList(asst.id);
        const totalCases = asstApts.length;
        const todayStr = targetRosterDate || (typeof getTodayDateString === "function" ? getTodayDateString() : "");
        const todayCases = asstApts.filter(a => (a.bookDate || a.book_date) === todayStr).length;

        const statusBadge = isOff 
          ? '<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">⚪ ลาเวร / พัก</span>'
          : \`<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-bold \${shiftInfo.badgeClass}">🟢 \${shiftInfo.shortLabel}</span>\`;`;

const newListStatus = `        const dutyStatus = getAssistantDutyStatusForDate(asst, targetRosterDate);
        const isOff = dutyStatus.isOff;
        
        // Count total cases and today's cases for this assistant
        const asstApts = getAssistantAppointmentsList(asst.id);
        const totalCases = asstApts.length;
        const todayStr = targetRosterDate || (typeof getTodayDateString === "function" ? getTodayDateString() : "");
        const todayCases = asstApts.filter(a => (a.bookDate || a.book_date) === todayStr).length;

        const statusBadge = isOff 
          ? '<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">⚪ ลาเวร / พัก</span>'
          : \`<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-bold \${dutyStatus.badgeClass}">🟢 \${dutyStatus.shortLabel}</span>\`;`;

html = html.replace(oldListStatus, newListStatus);

// 4. Update metrics count in renderManageShifts
const oldMetrics = `      const inHoursCount = (assistants || []).filter(a => a.active !== false && (a.shiftType === 'official' || (!a.shiftType && isAssistantOnDutyForSlot(a, '08:00')) || (a.shiftType === 'custom' && (a.slots || []).some(s => IN_HOURS_SLOTS.includes(s))))).length;
      const otCount = (assistants || []).filter(a => a.active !== false && (a.shiftType === 'ot' || (a.shiftType === 'custom' && (a.slots || []).some(s => OUT_OF_HOURS_SLOTS.includes(s))))).length;
      const fullDayCount = (assistants || []).filter(a => a.active !== false && (!a.shiftType || a.shiftType === 'full')).length;
      const inactiveCount = (assistants || []).filter(a => a.active === false || a.shiftType === 'off').length;`;

const newMetrics = `      const inHoursCount = (assistants || []).filter(a => {
        const st = getAssistantDutyStatusForDate(a, targetRosterDate);
        return !st.isOff && st.type === 'official';
      }).length;
      const fullDayCount = (assistants || []).filter(a => {
        const st = getAssistantDutyStatusForDate(a, targetRosterDate);
        return !st.isOff && (st.type === 'full' || st.type === 'custom');
      }).length;
      const inactiveCount = (assistants || []).filter(a => {
        const st = getAssistantDutyStatusForDate(a, targetRosterDate);
        return st.isOff;
      }).length;`;

html = html.replace(oldMetrics, newMetrics);

// 5. Update filtering in renderManageShifts
const oldFiltering = `        const isOff = asst.active === false || asst.shiftType === 'off';
        const shiftType = asst.shiftType || 'full';`;

const newFiltering = `        const dutyStatus = getAssistantDutyStatusForDate(asst, targetRosterDate);
        const isOff = dutyStatus.isOff;
        const shiftType = dutyStatus.type;`;

html = html.replace(oldFiltering, newFiltering);

// 6. Update saveAssistantShiftFromModal to sync active to Supabase assistants table
const oldSupabaseSyncMarker = `      persistAssistants();`;
const newSupabaseSyncMarker = `      persistAssistants();

      if (supabaseClient) {
        try {
          supabaseClient.from("assistants").update({
            active: asst.active
          }).eq("id", asst.id).then(() => {}).catch(err => {
            console.warn("Supabase assistant active status sync warning:", err);
          });
        } catch(e) {}
      }`;

html = html.replace(oldSupabaseSyncMarker, newSupabaseSyncMarker);

// Bump version
html = html.replace(/v5\.2\.4/g, 'v5.2.5');
html = html.replace(/ttm-clinic-cache-v131/g, 'ttm-clinic-cache-v132');

fs.writeFileSync('index.html', html);
console.log('Unified duty status applied successfully and bumped to v5.2.5 (ttm-clinic-cache-v132)');
