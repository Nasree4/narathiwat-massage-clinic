const fs = require('fs');
const vm = require('vm');

let content = fs.readFileSync('index.html', 'utf8');

// 1. Add SheetJS CDN in <head>
const oldHeadPart = `  <!-- html2canvas for PDF / Image Slip Export -->
  <script src="https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js"></script>`;

const newHeadPart = `  <!-- html2canvas for PDF / Image Slip Export -->
  <script src="https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js"></script>

  <!-- SheetJS for Professional Excel (.xlsx) Export -->
  <script src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"></script>`;

if (!content.includes(oldHeadPart)) {
  console.error('Could not find oldHeadPart');
  process.exit(1);
}
content = content.replace(oldHeadPart, newHeadPart);

// 2. Add Export Excel button in view-desk toolbar
const oldDeskToolbar = `              <div class="flex items-center space-x-1.5 text-xs">
                <button type="button" id="btn-desk-refresh" onclick="refreshDeskFromCloud()" class="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg font-medium transition flex items-center space-x-1 shadow-2xs cursor-pointer" title="ดึงข้อมูลล่าสุดจาก Supabase Cloud">
                  <i data-lucide="refresh-cw" id="icon-desk-refresh" class="w-3.5 h-3.5 text-slate-500"></i>
                  <span class="hidden sm:inline">ดึงข้อมูล Cloud</span>
                </button>
              </div>`;

const newDeskToolbar = `              <div class="flex items-center space-x-1.5 text-xs">
                <button type="button" onclick="exportDeskAppointmentsToExcel()" class="px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg font-bold transition flex items-center space-x-1 shadow-2xs cursor-pointer" title="ส่งออกรายงานคิวนวดเป็นไฟล์ Excel (.xlsx / CSV)">
                  <i data-lucide="file-spreadsheet" class="w-3.5 h-3.5 text-emerald-200"></i>
                  <span>Export Excel คิวนวด</span>
                </button>
                <button type="button" id="btn-desk-refresh" onclick="refreshDeskFromCloud()" class="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg font-medium transition flex items-center space-x-1 shadow-2xs cursor-pointer" title="ดึงข้อมูลล่าสุดจาก Supabase Cloud">
                  <i data-lucide="refresh-cw" id="icon-desk-refresh" class="w-3.5 h-3.5 text-slate-500"></i>
                  <span class="hidden sm:inline">ดึงข้อมูล Cloud</span>
                </button>
              </div>`;

if (!content.includes(oldDeskToolbar)) {
  console.error('Could not find oldDeskToolbar');
  process.exit(1);
}
content = content.replace(oldDeskToolbar, newDeskToolbar);

// 3. Add Export Excel button in view-manage -> shifts toolbar
const oldShiftsToolbar = `                <button type="button" onclick="openAssistantRosterModal()" class="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition flex items-center space-x-1 shadow-2xs cursor-pointer" title="เปิดตารางจัดคิวและเช็คชื่อ Matrix รายรอบ">
                  <i data-lucide="calendar-check" class="w-3.5 h-3.5 text-emerald-400"></i>
                  <span>ตารางจัดคิว</span>
                </button>
              </div>`;

const newShiftsToolbar = `                <button type="button" onclick="openAssistantRosterModal()" class="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition flex items-center space-x-1 shadow-2xs cursor-pointer" title="เปิดตารางจัดคิวและเช็คชื่อ Matrix รายรอบ">
                  <i data-lucide="calendar-check" class="w-3.5 h-3.5 text-emerald-400"></i>
                  <span>ตารางจัดคิว</span>
                </button>
                <button type="button" onclick="exportDutyRosterToExcel()" class="px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl font-bold transition flex items-center space-x-1 shadow-2xs cursor-pointer" title="ส่งออกตารางเวรผู้ช่วยฯ เป็นไฟล์ Excel (.xlsx / CSV)">
                  <i data-lucide="file-spreadsheet" class="w-3.5 h-3.5 text-emerald-200"></i>
                  <span>Export Excel ตารางเวร</span>
                </button>
              </div>`;

if (!content.includes(oldShiftsToolbar)) {
  console.error('Could not find oldShiftsToolbar');
  process.exit(1);
}
content = content.replace(oldShiftsToolbar, newShiftsToolbar);

// 4. Update modal-assistant-roster export button to exportAssistantRosterExcel
content = content.replace(
  'onclick="exportAssistantRosterCSV()" class="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer" title="ส่งออกข้อมูลเป็น CSV">',
  'onclick="exportAssistantRosterExcel()" class="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer" title="ส่งออกข้อมูลตารางเวรเป็นไฟล์ Excel">'
);

// 5. Enhance modal-assistant-detail Tab 1 with Month Selector & Export Excel button
const oldHistoryFilterBar = `          <!-- History Filter Pills -->
          <div class="flex items-center justify-between gap-2 flex-wrap pt-1">
            <span class="text-xs font-bold text-slate-700 dark:text-slate-300">รายการประวัติการให้บริการ:</span>
            <div class="inline-flex rounded-xl p-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold">
              <button type="button" id="history-filter-btn-all" onclick="filterAssistantHistory('all')" class="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-2xs cursor-pointer">ทั้งหมด</button>
              <button type="button" id="history-filter-btn-today" onclick="filterAssistantHistory('today')" class="px-2.5 py-1 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 cursor-pointer">วันนี้</button>
              <button type="button" id="history-filter-btn-month" onclick="filterAssistantHistory('month')" class="px-2.5 py-1 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 cursor-pointer">เดือนนี้</button>
            </div>
          </div>`;

const newHistoryFilterBar = `          <!-- History Filter & Monthly Partition Selector -->
          <div class="bg-slate-50 dark:bg-slate-850 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2 flex-wrap text-xs">
            <div class="flex items-center space-x-1.5 flex-wrap gap-y-1">
              <span class="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <i data-lucide="calendar" class="w-3.5 h-3.5 text-herbal-700 dark:text-emerald-400"></i>
                <span>เลือกช่วงเดือน:</span>
              </span>
              <select id="asst-history-month-select" onchange="onAssistantHistoryMonthSelect(this.value)" class="px-2 py-1 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-herbal-500 cursor-pointer">
                <option value="all">📅 ทุกช่วงเวลา (ทั้งหมด)</option>
              </select>
            </div>

            <div class="flex items-center space-x-1.5">
              <div class="inline-flex rounded-xl p-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold shadow-2xs">
                <button type="button" id="history-filter-btn-all" onclick="filterAssistantHistory('all')" class="px-2.5 py-1 rounded-lg bg-herbal-50 dark:bg-slate-700 text-herbal-900 dark:text-white font-bold cursor-pointer">ทั้งหมด</button>
                <button type="button" id="history-filter-btn-today" onclick="filterAssistantHistory('today')" class="px-2.5 py-1 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 cursor-pointer">วันนี้</button>
                <button type="button" id="history-filter-btn-month" onclick="filterAssistantHistory('month')" class="px-2.5 py-1 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 cursor-pointer">เดือนนี้</button>
              </div>
              <button type="button" onclick="exportCurrentAssistantHistoryToExcel()" class="px-2.5 py-1 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold transition flex items-center space-x-1 shadow-2xs cursor-pointer" title="ส่งออกประวัตินวดของผู้ช่วยท่านนี้เป็น Excel">
                <i data-lucide="file-spreadsheet" class="w-3.5 h-3.5 text-emerald-200"></i>
                <span class="hidden sm:inline">Export Excel</span>
              </button>
            </div>
          </div>`;

if (!content.includes(oldHistoryFilterBar)) {
  console.error('Could not find oldHistoryFilterBar');
  process.exit(1);
}
content = content.replace(oldHistoryFilterBar, newHistoryFilterBar);

// 6. Add Excel Export Helper and logic in scripts
const oldPeriodVar = `    let currentDetailAssistantId = null;
    let currentDetailHistoryPeriod = 'all';`;

const newPeriodVar = `    let currentDetailAssistantId = null;
    let currentDetailHistoryPeriod = 'all';
    let currentDetailHistoryMonth = 'all';
    const THAI_FULL_MONTHS = [
      "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
      "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
    ];

    // Universal Excel (.xlsx) / UTF-8 BOM CSV Exporter
    function exportDataToExcel(filename, sheetName, headers, rows) {
      const cleanFilename = (filename || "export").replace(/[\\\\/:*?\"<>|]+/g, "_");

      // 1. SheetJS Native XLSX
      if (typeof XLSX !== "undefined" && XLSX.utils && XLSX.writeFile) {
        try {
          const aoa = [headers, ...rows];
          const ws = XLSX.utils.aoa_to_sheet(aoa);

          // Auto-calculate column widths
          const colWidths = headers.map((h, colIdx) => {
            let maxLen = (h ? String(h).length : 6);
            rows.forEach(r => {
              const val = r[colIdx];
              if (val !== undefined && val !== null) {
                const len = String(val).length;
                if (len > maxLen) maxLen = len;
              }
            });
            return { wch: Math.min(Math.max(maxLen + 3, 10), 45) };
          });
          ws['!cols'] = colWidths;

          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, (sheetName || "Sheet1").slice(0, 31));
          XLSX.writeFile(wb, \`\${cleanFilename}.xlsx\`);
          showToast(\`ส่งออกไฟล์ Excel "\${cleanFilename}.xlsx" สำเร็จแล้ว\`, "success");
          return;
        } catch(err) {
          console.warn("SheetJS export error, falling back to CSV:", err);
        }
      }

      // 2. Fallback to UTF-8 BOM CSV (Opens cleanly in Excel)
      const csvRows = [headers, ...rows].map(row => 
        row.map(val => {
          if (val === null || val === undefined) return '""';
          const s = String(val).replace(/"/g, '""');
          return \`"\${s}"\`;
        }).join(",")
      );
      const csvContent = "\\uFEFF" + csvRows.join("\\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", \`\${cleanFilename}.csv\`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast(\`ส่งออกไฟล์ "\${cleanFilename}.csv" สำเร็จแล้ว\`, "success");
    }

    function exportDutyRosterToExcel(targetDate) {
      const dateStr = targetDate || (document.getElementById("manage-selected-date")?.value) || (typeof currentRosterDate !== "undefined" && currentRosterDate) || (typeof getTodayDateString === "function" ? getTodayDateString() : "");
      const effectiveSlots = (typeof getEffectiveSlotsForRoster === "function") ? getEffectiveSlotsForRoster(dateStr) : [...ALL_WORKING_SLOTS];
      const rosterObj = (typeof assistantDutyRosters !== "undefined" && assistantDutyRosters[dateStr]) ? assistantDutyRosters[dateStr] : {};

      const list = (assistants || []).slice();
      if (list.length === 0) {
        showToast("ไม่มีข้อมูลผู้ช่วยฯ สำหรับส่งออก", "warning");
        return;
      }

      const headers = [
        "ลำดับ",
        "ชื่อ-นามสกุล ผู้ช่วยแพทย์แผนไทย",
        "ชื่อเล่น",
        "เพศ",
        "เบอร์โทรศัพท์",
        "สิทธิ์การใช้งาน",
        "สถานะเวร",
        "เวลาเช็คชื่อเข้างาน",
        ...effectiveSlots.map(s => \`รอบ \${s} น.\`),
        "รวมจำนวนรอบที่เข้าเวร"
      ];

      const rows = list.map((asst, idx) => {
        const dutyStatus = getAssistantDutyStatusForDate(asst, dateStr);
        const rEntry = rosterObj[asst.id] ? (typeof normalizeAssistantRosterEntry === "function" ? normalizeAssistantRosterEntry(rosterObj[asst.id]) : rosterObj[asst.id]) : null;
        const workingSlots = dutyStatus.slots || [];
        const slotCols = effectiveSlots.map(s => workingSlots.includes(s) ? "✓" : "-");
        const checkinTime = (rEntry && rEntry.checkInTime) ? rEntry.checkInTime : (dutyStatus.checkInTime || "-");

        return [
          idx + 1,
          asst.name || "-",
          asst.nickname || "-",
          asst.gender === "male" ? "ชาย" : "หญิง",
          asst.phone || "-",
          asst.role === "admin" ? "Admin" : (asst.role === "user" ? "User" : "Staff"),
          dutyStatus.isOff ? "⚪ ลาเวร / พัก (Off Duty)" : dutyStatus.label,
          checkinTime,
          ...slotCols,
          dutyStatus.isOff ? 0 : workingSlots.length
        ];
      });

      exportDataToExcel(\`ตารางเวรผู้ช่วยแพทย์แผนไทย_\${dateStr}\`, "ตารางเวร", headers, rows);
    }

    function exportAssistantRosterExcel() {
      const dateStr = (typeof currentRosterDate !== "undefined" && currentRosterDate) || (typeof getTodayDateString === "function" ? getTodayDateString() : "");
      exportDutyRosterToExcel(dateStr);
    }

    function exportDeskAppointmentsToExcel() {
      const startInput = document.getElementById("desk-filter-date-start")?.value;
      const endInput = document.getElementById("desk-filter-date-end")?.value;
      const statusFilter = document.getElementById("desk-filter-status")?.value || "all";
      const slotFilter = document.getElementById("desk-filter-slot")?.value || "all";
      const searchFilter = (document.getElementById("desk-filter-search")?.value || "").trim().toLowerCase();

      let apts = Array.isArray(appointments) ? appointments.slice() : [];

      if (startInput && endInput) {
        apts = apts.filter(a => {
          const d = a.bookDate || a.book_date;
          return d && d >= startInput && d <= endInput;
        });
      } else if (startInput) {
        apts = apts.filter(a => (a.bookDate || a.book_date) === startInput);
      }

      if (statusFilter && statusFilter !== "all") {
        if (statusFilter === "room") {
          apts = apts.filter(a => a.room && a.room !== "-" && a.room !== "");
        } else if (statusFilter.startsWith("ห้อง")) {
          apts = apts.filter(a => a.room === statusFilter);
        } else {
          apts = apts.filter(a => a.status === statusFilter || (a.statusDesc && a.statusDesc.includes(statusFilter)));
        }
      }

      if (slotFilter && slotFilter !== "all") {
        apts = apts.filter(a => (a.timeSlot || a.time_slot) === slotFilter);
      }

      if (searchFilter) {
        apts = apts.filter(a => {
          const name = (a.patientName || a.name || "").toLowerCase();
          const phone = (a.phone || "").toLowerCase();
          const hn = (a.citizenOrHn || a.hn || "").toLowerCase();
          const asstNick = (a.assistantNick || a.assistant_nick || "").toLowerCase();
          return name.includes(searchFilter) || phone.includes(searchFilter) || hn.includes(searchFilter) || asstNick.includes(searchFilter);
        });
      }

      if (apts.length === 0) {
        showToast("ไม่พบคิวนัดหมายในช่วงเวลาหรือเงื่อนไขที่เลือก", "warning");
        return;
      }

      apts.sort((a, b) => {
        const dCmp = (a.bookDate || a.book_date || "").localeCompare(b.bookDate || b.book_date || "");
        if (dCmp !== 0) return dCmp;
        return (a.timeSlot || a.time_slot || "").localeCompare(b.timeSlot || b.time_slot || "");
      });

      const headers = [
        "ลำดับ",
        "รหัสคิว (ID)",
        "วันที่นัดหมาย",
        "รอบเวลา (น.)",
        "ชื่อ-นามสกุล ผู้รับบริการ",
        "เบอร์โทรศัพท์",
        "สิทธิ์การรักษา",
        "เลขประจำตัว (HN / บัตรประชาชน)",
        "หัตถการ / บริการหลัก",
        "บริการเสริม",
        "ห้องหัตถการ",
        "ผู้ช่วยแพทย์แผนไทยที่ดูแล",
        "สถานะคิวการบริการ",
        "เวลาเริ่มนวด",
        "เวลาเสร็จสิ้น",
        "หมายเหตุ / อาการ"
      ];

      const rows = apts.map((a, idx) => {
        const dateStr = a.bookDate || a.book_date || "-";
        const dateThai = (typeof formatThaiDisplayDate === "function") ? formatThaiDisplayDate(dateStr) : dateStr;
        const extraServ = Array.isArray(a.extraServices) ? a.extraServices.join(", ") : (a.extra_services || "-");

        return [
          idx + 1,
          a.id || "-",
          dateThai,
          a.timeSlot || a.time_slot || "-",
          a.patientName || a.name || "-",
          a.phone || "-",
          a.medicalScheme || a.medical_scheme || "บัตรทอง (UC)",
          a.citizenOrHn || a.citizen_id || a.hn || "-",
          a.mainService || a.service || a.serviceName || "นวดแผนไทยเพื่อการรักษา",
          extraServ || "-",
          a.room || "-",
          a.assistantNick || a.assistant_nick || "-",
          a.status || "รอรับบริการ",
          a.startTime || a.start_time || "-",
          a.finishTime || a.finish_time || "-",
          a.symptom || a.notes || "-"
        ];
      });

      const datePart = (startInput && endInput) ? \`\${startInput}_ถึง_\${endInput}\` : (startInput || "all");
      exportDataToExcel(\`รายงานคิวนวดแพทย์แผนไทย_\${datePart}\`, "รายงานคิวนวด", headers, rows);
    }`;

if (!content.includes(oldPeriodVar)) {
  console.error('Could not find oldPeriodVar');
  process.exit(1);
}
content = content.replace(oldPeriodVar, newPeriodVar);

// 7. Replace renderAssistantMassageHistory with monthly partitioning support
const oldRenderHistoryFn = `    function renderAssistantMassageHistory(asstId, period = 'all') {
      currentDetailHistoryPeriod = period;
      const asst = (assistants || []).find(a => a.id === asstId);
      if (!asst) return;

      const apts = getAssistantAppointmentsList(asstId);
      const todayStr = (typeof getTodayDateString === "function") ? getTodayDateString() : new Date().toISOString().slice(0, 10);
      const currentYearMonth = todayStr.slice(0, 7); // YYYY-MM

      const todayCases = apts.filter(a => (a.bookDate || a.book_date) === todayStr).length;
      const monthCases = apts.filter(a => (a.bookDate || a.book_date || '').startsWith(currentYearMonth)).length;
      const totalCases = apts.length;

      // Update stat pills
      const statTodayEl = document.getElementById("asst-stat-history-today");
      if (statTodayEl) statTodayEl.innerHTML = \`\${todayCases} <span class="text-xs font-normal">เคส</span>\`;
      const statMonthEl = document.getElementById("asst-stat-history-month");
      if (statMonthEl) statMonthEl.innerHTML = \`\${monthCases} <span class="text-xs font-normal">เคส</span>\`;
      const statAllEl = document.getElementById("asst-stat-history-all");
      if (statAllEl) statAllEl.innerHTML = \`\${totalCases} <span class="text-xs font-normal">เคส</span>\`;
      const casesCountBadge = document.getElementById("asst-detail-cases-count");
      if (casesCountBadge) casesCountBadge.textContent = totalCases;

      // Update active filter pill button
      ['all', 'today', 'month'].forEach(p => {
        const btn = document.getElementById("history-filter-btn-" + p);
        if (btn) {
          if (p === period) {
            btn.className = "px-2.5 py-1 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-2xs font-bold cursor-pointer";
          } else {
            btn.className = "px-2.5 py-1 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 cursor-pointer";
          }
        }
      });

      // Filter list by period
      let filtered = apts;
      if (period === 'today') {
        filtered = apts.filter(a => (a.bookDate || a.book_date) === todayStr);
      } else if (period === 'month') {
        filtered = apts.filter(a => (a.bookDate || a.book_date || '').startsWith(currentYearMonth));
      }

      const container = document.getElementById("asst-history-items-container");
      if (!container) return;

      if (filtered.length === 0) {
        container.innerHTML = \`
          <div class="py-8 px-4 text-center bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 space-y-2">
            <div class="w-10 h-10 mx-auto rounded-full bg-slate-100 dark:bg-slate-700 text-slate-400 flex items-center justify-center">
              <i data-lucide="calendar-x" class="w-5 h-5"></i>
            </div>
            <div class="text-xs font-bold text-slate-600 dark:text-slate-300">ยังไม่มีประวัติการนวดในช่วงเวลาที่เลือก</div>
            <p class="text-[11px] text-slate-400">เมื่อมีการจองหรือเริ่มหัตถการกับผู้ช่วยท่านนี้ รายการจะบันทึกเข้ามาโดยอัตโนมัติ</p>
          </div>
        \`;
        lucide.createIcons();
        return;
      }

      container.innerHTML = filtered.map((apt, idx) => {
        const dateStr = apt.bookDate || apt.book_date || "-";
        const timeSlot = apt.timeSlot || apt.time_slot || "-";
        const patient = apt.name || apt.patientName || apt.patient_name || "ไม่ระบุชื่อ";
        const phone = apt.phone || "";
        const service = apt.service || apt.serviceName || apt.main_service || "นวดแผนไทย";
        const status = apt.status || "confirmed";

        let statusBadge = '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">รอรับบริการ</span>';
        if (status === 'completed' || status === 'finished') {
          statusBadge = '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">🟢 นวดเสร็จสิ้น</span>';
        } else if (status === 'in_progress' || status === 'treatment') {
          statusBadge = '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">🔵 กำลังรับบริการ</span>';
        } else if (status === 'cancelled') {
          statusBadge = '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">⚪ ยกเลิก</span>';
        }

        const dateDisplay = (typeof formatThaiDisplayDate === "function") ? formatThaiDisplayDate(dateStr) : dateStr;

        return \`
          <div class="p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-2xs hover:border-herbal-300 transition flex items-center justify-between gap-3 text-xs">
            <div class="min-w-0 flex items-center space-x-3">
              <div class="w-8 h-8 rounded-xl bg-herbal-50 dark:bg-emerald-950/60 text-herbal-700 dark:text-emerald-400 font-bold flex items-center justify-center shrink-0 text-xs">
                \${idx + 1}
              </div>
              <div class="min-w-0">
                <div class="flex items-center space-x-2 flex-wrap">
                  <span class="font-bold text-slate-800 dark:text-white truncate">\${escapeHtml(patient)}</span>
                  \${phone ? \`<span class="text-[10px] text-slate-400 font-mono">(\${escapeHtml(phone)})</span>\` : ''}
                  \${statusBadge}
                </div>
                <div class="flex items-center space-x-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex-wrap">
                  <span class="font-semibold text-herbal-700 dark:text-emerald-400">\${escapeHtml(service)}</span>
                  <span>•</span>
                  <span>📅 \${escapeHtml(dateDisplay)}</span>
                  <span>•</span>
                  <span class="font-bold text-slate-700 dark:text-slate-300">⏰ รอบ \${escapeHtml(timeSlot)} น.</span>
                </div>
              </div>
            </div>
            <div class="text-right shrink-0">
              <span class="text-[10px] font-mono text-slate-400 block">ID: \${escapeHtml(apt.id || "-")}</span>
            </div>
          </div>
        \`;
      }).join("");

      lucide.createIcons();
    }

    function filterAssistantHistory(period) {
      if (!currentDetailAssistantId) return;
      renderAssistantMassageHistory(currentDetailAssistantId, period);
    }`;

const newRenderHistoryFn = `    function renderAssistantMassageHistory(asstId, period = 'all', specificMonth = null) {
      currentDetailHistoryPeriod = period;
      if (specificMonth !== null) {
        currentDetailHistoryMonth = specificMonth;
      }

      const asst = (assistants || []).find(a => a.id === asstId);
      if (!asst) return;

      const apts = getAssistantAppointmentsList(asstId);
      const todayStr = (typeof getTodayDateString === "function") ? getTodayDateString() : new Date().toISOString().slice(0, 10);
      const currentYearMonth = todayStr.slice(0, 7); // YYYY-MM

      const todayCases = apts.filter(a => (a.bookDate || a.book_date) === todayStr).length;
      const monthCases = apts.filter(a => (a.bookDate || a.book_date || '').startsWith(currentYearMonth)).length;
      const totalCases = apts.length;

      // Update stat pills
      const statTodayEl = document.getElementById("asst-stat-history-today");
      if (statTodayEl) statTodayEl.innerHTML = \`\${todayCases} <span class="text-xs font-normal">เคส</span>\`;
      const statMonthEl = document.getElementById("asst-stat-history-month");
      if (statMonthEl) statMonthEl.innerHTML = \`\${monthCases} <span class="text-xs font-normal">เคส</span>\`;
      const statAllEl = document.getElementById("asst-stat-history-all");
      if (statAllEl) statAllEl.innerHTML = \`\${totalCases} <span class="text-xs font-normal">เคส</span>\`;
      const casesCountBadge = document.getElementById("asst-detail-cases-count");
      if (casesCountBadge) casesCountBadge.textContent = totalCases;

      // 1. Populate Available Months Dropdown for this Assistant
      const monthsSet = new Set();
      monthsSet.add(currentYearMonth);
      apts.forEach(a => {
        const d = a.bookDate || a.book_date;
        if (d && d.length >= 7) {
          monthsSet.add(d.slice(0, 7));
        }
      });
      const sortedMonths = Array.from(monthsSet).sort().reverse();

      const monthSelect = document.getElementById("asst-history-month-select");
      if (monthSelect) {
        const currentSelected = currentDetailHistoryMonth || 'all';
        monthSelect.innerHTML = \`<option value="all">📅 ทุกช่วงเวลา (ทั้งหมด \${totalCases} เคส)</option>\` +
          sortedMonths.map(ym => {
            const [y, m] = ym.split('-');
            const mIdx = parseInt(m, 10) - 1;
            const monthThai = THAI_FULL_MONTHS[mIdx] || ym;
            const yearThai = parseInt(y, 10) + 543;
            const count = apts.filter(a => (a.bookDate || a.book_date || '').startsWith(ym)).length;
            const isCur = ym === currentYearMonth ? " (เดือนปัจจุบัน)" : "";
            return \`<option value="\${ym}">\${monthThai} \${yearThai}\${isCur} - \${count} เคส</option>\`;
          }).join("");

        if (currentSelected && (currentSelected === 'all' || sortedMonths.includes(currentSelected))) {
          monthSelect.value = currentSelected;
        } else {
          monthSelect.value = 'all';
        }
      }

      // Update active filter pill button
      ['all', 'today', 'month'].forEach(p => {
        const btn = document.getElementById("history-filter-btn-" + p);
        if (btn) {
          if (p === period) {
            btn.className = "px-2.5 py-1 rounded-lg bg-herbal-700 text-white font-bold shadow-xs cursor-pointer";
          } else {
            btn.className = "px-2.5 py-1 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 cursor-pointer";
          }
        }
      });

      // Filter list by period and selected month
      let filtered = apts;
      let filterHeaderLabel = "";

      if (period === 'today') {
        filtered = apts.filter(a => (a.bookDate || a.book_date) === todayStr);
        filterHeaderLabel = \`ประจำวันนี้ (\${(typeof formatThaiDisplayDate === "function") ? formatThaiDisplayDate(todayStr) : todayStr})\`;
      } else if (period === 'month') {
        filtered = apts.filter(a => (a.bookDate || a.book_date || '').startsWith(currentYearMonth));
        const [y, m] = currentYearMonth.split('-');
        filterHeaderLabel = \`เดือนนี้ (\${THAI_FULL_MONTHS[parseInt(m, 10) - 1]} \${parseInt(y, 10) + 543})\`;
      } else if (currentDetailHistoryMonth && currentDetailHistoryMonth !== 'all') {
        filtered = apts.filter(a => (a.bookDate || a.book_date || '').startsWith(currentDetailHistoryMonth));
        const [y, m] = currentDetailHistoryMonth.split('-');
        filterHeaderLabel = \`เดือน \${THAI_FULL_MONTHS[parseInt(m, 10) - 1]} \${parseInt(y, 10) + 543}\`;
      } else {
        filterHeaderLabel = "ทั้งหมดทุกช่วงเวลา";
      }

      const container = document.getElementById("asst-history-items-container");
      if (!container) return;

      if (filtered.length === 0) {
        container.innerHTML = \`
          <div class="py-8 px-4 text-center bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 space-y-2">
            <div class="w-10 h-10 mx-auto rounded-full bg-slate-100 dark:bg-slate-700 text-slate-400 flex items-center justify-center">
              <i data-lucide="calendar-x" class="w-5 h-5"></i>
            </div>
            <div class="text-xs font-bold text-slate-600 dark:text-slate-300">ไม่พบประวัติการนวดในช่วง\${escapeHtml(filterHeaderLabel)}</div>
            <p class="text-[11px] text-slate-400">เมื่อมีการจองหรือเริ่มหัตถการกับผู้ช่วยท่านนี้ รายการจะบันทึกเข้ามาโดยอัตโนมัติ</p>
          </div>
        \`;
        lucide.createIcons();
        return;
      }

      // Render summary banner above list
      const summaryBanner = \`
        <div class="flex items-center justify-between px-3 py-2 bg-emerald-50/60 dark:bg-emerald-950/40 rounded-xl border border-emerald-200/70 dark:border-emerald-800/50 text-[11.5px] font-bold text-emerald-900 dark:text-emerald-200 mb-2">
          <span>📋 แสดง \${filtered.length} เคส (\${escapeHtml(filterHeaderLabel)})</span>
          <span class="text-emerald-600 dark:text-emerald-400 text-[10.5px] font-medium">เรียงจากล่าสุด</span>
        </div>
      \`;

      container.innerHTML = summaryBanner + filtered.map((apt, idx) => {
        const dateStr = apt.bookDate || apt.book_date || "-";
        const timeSlot = apt.timeSlot || apt.time_slot || "-";
        const patient = apt.name || apt.patientName || apt.patient_name || "ไม่ระบุชื่อ";
        const phone = apt.phone || "";
        const service = apt.service || apt.serviceName || apt.main_service || "นวดแผนไทย";
        const status = apt.status || "confirmed";

        let statusBadge = '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">รอรับบริการ</span>';
        if (status === 'completed' || status === 'finished') {
          statusBadge = '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">🟢 นวดเสร็จสิ้น</span>';
        } else if (status === 'in_progress' || status === 'treatment') {
          statusBadge = '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">🔵 กำลังรับบริการ</span>';
        } else if (status === 'cancelled') {
          statusBadge = '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">⚪ ยกเลิก</span>';
        }

        const dateDisplay = (typeof formatThaiDisplayDate === "function") ? formatThaiDisplayDate(dateStr) : dateStr;

        return \`
          <div class="p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-2xs hover:border-herbal-300 transition flex items-center justify-between gap-3 text-xs mb-2">
            <div class="min-w-0 flex items-center space-x-3">
              <div class="w-8 h-8 rounded-xl bg-herbal-50 dark:bg-emerald-950/60 text-herbal-700 dark:text-emerald-400 font-bold flex items-center justify-center shrink-0 text-xs">
                \${idx + 1}
              </div>
              <div class="min-w-0">
                <div class="flex items-center space-x-2 flex-wrap">
                  <span class="font-bold text-slate-800 dark:text-white truncate">\${escapeHtml(patient)}</span>
                  \${phone ? \`<span class="text-[10px] text-slate-400 font-mono">(\${escapeHtml(phone)})</span>\` : ''}
                  \${statusBadge}
                </div>
                <div class="flex items-center space-x-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex-wrap">
                  <span class="font-semibold text-herbal-700 dark:text-emerald-400">\${escapeHtml(service)}</span>
                  <span>•</span>
                  <span>📅 \${escapeHtml(dateDisplay)}</span>
                  <span>•</span>
                  <span class="font-bold text-slate-700 dark:text-slate-300">⏰ รอบ \${escapeHtml(timeSlot)} น.</span>
                </div>
              </div>
            </div>
            <div class="text-right shrink-0">
              <span class="text-[10px] font-mono text-slate-400 block">ID: \${escapeHtml(apt.id || "-")}</span>
            </div>
          </div>
        \`;
      }).join("");

      lucide.createIcons();
    }

    function filterAssistantHistory(period) {
      if (!currentDetailAssistantId) return;
      if (period === 'all') currentDetailHistoryMonth = 'all';
      if (period === 'month') {
        const todayStr = (typeof getTodayDateString === "function") ? getTodayDateString() : new Date().toISOString().slice(0, 10);
        currentDetailHistoryMonth = todayStr.slice(0, 7);
      }
      renderAssistantMassageHistory(currentDetailAssistantId, period, currentDetailHistoryMonth);
    }

    function onAssistantHistoryMonthSelect(selectedMonth) {
      if (!currentDetailAssistantId) return;
      currentDetailHistoryMonth = selectedMonth;
      const period = selectedMonth === 'all' ? 'all' : 'month_selected';
      renderAssistantMassageHistory(currentDetailAssistantId, period, selectedMonth);
    }

    function exportCurrentAssistantHistoryToExcel() {
      if (!currentDetailAssistantId) return;
      const asst = (assistants || []).find(a => a.id === currentDetailAssistantId);
      if (!asst) return;

      const apts = getAssistantAppointmentsList(currentDetailAssistantId);
      let filtered = apts;
      let monthLabel = "ทั้งหมด";

      if (currentDetailHistoryPeriod === 'today') {
        const todayStr = (typeof getTodayDateString === "function") ? getTodayDateString() : new Date().toISOString().slice(0, 10);
        filtered = apts.filter(a => (a.bookDate || a.book_date) === todayStr);
        monthLabel = todayStr;
      } else if (currentDetailHistoryMonth && currentDetailHistoryMonth !== 'all') {
        filtered = apts.filter(a => (a.bookDate || a.book_date || '').startsWith(currentDetailHistoryMonth));
        monthLabel = currentDetailHistoryMonth;
      }

      if (filtered.length === 0) {
        showToast("ไม่มีข้อมูลประวัตินวดสำหรับส่งออก", "warning");
        return;
      }

      const headers = [
        "ลำดับ",
        "รหัสคิว (ID)",
        "วันที่นัดหมาย",
        "รอบเวลา (น.)",
        "ชื่อคนไข้",
        "เบอร์โทรศัพท์",
        "หัตถการ/บริการ",
        "ผู้ช่วยที่ดูแล",
        "สถานะ"
      ];

      const rows = filtered.map((a, idx) => [
        idx + 1,
        a.id || "-",
        (typeof formatThaiDisplayDate === "function") ? formatThaiDisplayDate(a.bookDate || a.book_date) : (a.bookDate || a.book_date),
        a.timeSlot || a.time_slot || "-",
        a.name || a.patientName || a.patient_name || "-",
        a.phone || "-",
        a.service || a.serviceName || a.main_service || "นวดแผนไทย",
        asst.nickname ? \`[\${asst.nickname}] \${asst.name}\` : asst.name,
        a.status || "รอรับบริการ"
      ]);

      const nickPart = (asst.nickname || asst.name || "ผู้ช่วย").replace(/\\s+/g, '_');
      exportDataToExcel(\`ประวัตินวด_\${nickPart}_\${monthLabel}\`, "ประวัตินวด", headers, rows);
    }`;

if (!content.includes(oldRenderHistoryFn)) {
  console.error('Could not find oldRenderHistoryFn');
  process.exit(1);
}
content = content.replace(oldRenderHistoryFn, newRenderHistoryFn);

// 8. Bump version to v5.3.0
content = content.replace(/v5\.2\.6/g, 'v5.3.0');

fs.writeFileSync('index.html', content, 'utf8');
console.log('Successfully updated index.html to v5.3.0!');

// Validate all script tags in index.html
const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
let match;
let count = 0;
let hasError = false;

while ((match = scriptRegex.exec(content)) !== null) {
  count++;
  const jsCode = match[1];
  if (!jsCode.trim()) continue;
  try {
    new vm.Script(jsCode);
  } catch (err) {
    console.error('SYNTAX ERROR in script tag #' + count + ':', err.message);
    hasError = true;
  }
}

if (!hasError) {
  console.log('ALL ' + count + ' script tags in index.html compiled with 0 syntax errors!');
} else {
  process.exit(1);
}
