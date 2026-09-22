const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

// 1. Replace the Tab 2 HTML in modal-assistant-detail
const oldDutyTabStart = '        <!-- Section 2: Duty & Slots Tab -->';
const oldDutyTabEnd = '        <!-- Section 3: Profile & Settings Tab -->';

const startIdx = html.indexOf(oldDutyTabStart);
const endIdx = html.indexOf(oldDutyTabEnd);

if (startIdx === -1 || endIdx === -1) {
  console.error('Could not find Duty Tab markers');
  process.exit(1);
}

const newDutyTabHTML = `        <!-- Section 2: Duty & Slots Tab -->
        <div id="asst-tab-duty" class="asst-detail-tab-content hidden space-y-4">
          <div class="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3.5">
            
            <!-- Date Mode Switcher (วันเดียว vs เป็นช่วงวันที่) -->
            <div class="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3 flex-wrap gap-2">
              <div class="flex items-center space-x-2">
                <i data-lucide="calendar" class="w-4 h-4 text-herbal-700 dark:text-emerald-400"></i>
                <span class="font-bold text-xs sm:text-sm text-slate-800 dark:text-white">กำหนดวันที่ปฏิบัติงาน:</span>
              </div>
              <div class="inline-flex rounded-xl p-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold shadow-2xs gap-1">
                <button type="button" id="btn-duty-mode-single" onclick="setModalDutyDateMode('single')" class="px-3 py-1.5 rounded-lg bg-herbal-700 text-white font-bold transition cursor-pointer flex items-center space-x-1">
                  <span>📅 เฉพาะวันเดียว</span>
                </button>
                <button type="button" id="btn-duty-mode-range" onclick="setModalDutyDateMode('range')" class="px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition cursor-pointer flex items-center space-x-1">
                  <span>🗓️ เป็นช่วงวันที่ (Date Range)</span>
                </button>
              </div>
            </div>

            <!-- Single Date Mode Panel -->
            <div id="duty-panel-single-date" class="space-y-2">
              <label class="block text-xs font-semibold text-slate-600 dark:text-slate-300">เลือกวันที่:</label>
              <div class="flex items-center space-x-2">
                <input type="date" id="modal-asst-single-date" onchange="onModalAssistantSingleDateChange(this.value)" class="px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-herbal-500 cursor-pointer">
                <span id="modal-asst-single-date-display" class="text-xs font-bold text-herbal-800 dark:text-emerald-300 bg-herbal-50 dark:bg-emerald-950/60 px-2.5 py-1.5 rounded-xl border border-herbal-200 dark:border-emerald-800"></span>
              </div>
            </div>

            <!-- Date Range Mode Panel -->
            <div id="duty-panel-date-range" class="hidden space-y-3 bg-white dark:bg-slate-850 p-3.5 rounded-2xl border border-emerald-200 dark:border-emerald-800/60">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">ตั้งแต่วันที่:</label>
                  <input type="date" id="modal-asst-range-from" onchange="updateModalRangeCalculation()" class="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-herbal-500 cursor-pointer">
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">ถึงวันที่:</label>
                  <input type="date" id="modal-asst-range-to" onchange="updateModalRangeCalculation()" class="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-herbal-500 cursor-pointer">
                </div>
              </div>

              <!-- Quick Presets -->
              <div class="flex items-center space-x-1.5 flex-wrap gap-y-1.5 pt-1 text-xs">
                <span class="text-[11px] font-semibold text-slate-500 dark:text-slate-400">ทางลัดช่วงวัน:</span>
                <button type="button" onclick="applyModalRangePreset(7)" class="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-bold transition cursor-pointer">7 วันข้างหน้า</button>
                <button type="button" onclick="applyModalRangePreset(14)" class="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-bold transition cursor-pointer">14 วัน</button>
                <button type="button" onclick="applyModalRangePreset('mon_fri')" class="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-bold transition cursor-pointer">จ.-ศ. สัปดาห์นี้</button>
                <button type="button" onclick="applyModalRangePreset('month')" class="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-bold transition cursor-pointer">ทั้งเดือนนี้</button>
                <span id="modal-asst-range-count-badge" class="ml-auto text-xs font-black text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-2.5 py-0.5 rounded-lg border border-emerald-300 dark:border-emerald-800">0 วัน</span>
              </div>

              <!-- Days of week filters -->
              <div class="pt-2 border-t border-slate-100 dark:border-slate-800">
                <div class="flex items-center justify-between mb-1.5">
                  <span class="text-[11px] font-semibold text-slate-600 dark:text-slate-300">เลือกวันในสัปดาห์ที่ต้องการจัดเวร:</span>
                  <div class="space-x-1 text-[10.5px]">
                    <button type="button" onclick="setModalRangeDaysOfWeek(true)" class="text-herbal-700 dark:text-emerald-400 font-bold hover:underline cursor-pointer">ทุกวัน</button>
                    <span class="text-slate-300">|</span>
                    <button type="button" onclick="setModalRangeDaysOfWeek('workdays')" class="text-herbal-700 dark:text-emerald-400 font-bold hover:underline cursor-pointer">จ.-ศ.</button>
                  </div>
                </div>
                <div class="flex items-center gap-1.5 flex-wrap text-xs">
                  <label class="flex items-center space-x-1 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 cursor-pointer">
                    <input type="checkbox" name="modal-asst-dow" value="1" checked onchange="updateModalRangeCalculation()" class="w-3.5 h-3.5 text-herbal-600 rounded">
                    <span>จันทร์</span>
                  </label>
                  <label class="flex items-center space-x-1 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 cursor-pointer">
                    <input type="checkbox" name="modal-asst-dow" value="2" checked onchange="updateModalRangeCalculation()" class="w-3.5 h-3.5 text-herbal-600 rounded">
                    <span>อังคาร</span>
                  </label>
                  <label class="flex items-center space-x-1 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 cursor-pointer">
                    <input type="checkbox" name="modal-asst-dow" value="3" checked onchange="updateModalRangeCalculation()" class="w-3.5 h-3.5 text-herbal-600 rounded">
                    <span>พุธ</span>
                  </label>
                  <label class="flex items-center space-x-1 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 cursor-pointer">
                    <input type="checkbox" name="modal-asst-dow" value="4" checked onchange="updateModalRangeCalculation()" class="w-3.5 h-3.5 text-herbal-600 rounded">
                    <span>พฤหัสบดี</span>
                  </label>
                  <label class="flex items-center space-x-1 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 cursor-pointer">
                    <input type="checkbox" name="modal-asst-dow" value="5" checked onchange="updateModalRangeCalculation()" class="w-3.5 h-3.5 text-herbal-600 rounded">
                    <span>ศุกร์</span>
                  </label>
                  <label class="flex items-center space-x-1 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 cursor-pointer">
                    <input type="checkbox" name="modal-asst-dow" value="6" checked onchange="updateModalRangeCalculation()" class="w-3.5 h-3.5 text-herbal-600 rounded">
                    <span>เสาร์</span>
                  </label>
                  <label class="flex items-center space-x-1 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 cursor-pointer">
                    <input type="checkbox" name="modal-asst-dow" value="0" checked onchange="updateModalRangeCalculation()" class="w-3.5 h-3.5 text-herbal-600 rounded">
                    <span>อาทิตย์</span>
                  </label>
                </div>
              </div>
            </div>

            <!-- Shift Details Settings -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-slate-700">
              <div>
                <label class="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">เลือกรูปแบบเวร:</label>
                <select id="modal-asst-shift-type" onchange="onModalAssistantShiftChange(this.value)" class="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-herbal-500 cursor-pointer">
                  <option value="full">⭐ เข้าเวรทั้งวัน (08:00 - 19:00 น.)</option>
                  <option value="official">☀️ ในเวลาราชการ (08:00 - 16:00 น.)</option>
                  <option value="ot">🌙 นอกเวลาราชการ / OT (17:00 - 19:00 น.)</option>
                  <option value="custom">⚙️ กำหนดรอบเวลาเฉพาะ (Custom)</option>
                  <option value="off">⚪ ลาเวร / พัก (ไม่เข้าเวร)</option>
                </select>
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">เวลาเช็คชื่อเข้างาน (Check-in):</label>
                <input type="time" id="modal-asst-checkin-time" class="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-herbal-500">
              </div>
            </div>

            <!-- Slots Picker Grid -->
            <div id="modal-asst-slots-section" class="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-slate-700 dark:text-slate-300">รอบเวลาที่เปิดรับคิวนวด:</span>
                <div class="space-x-1.5 text-[11px]">
                  <button type="button" onclick="setAllModalAsstSlots(true)" class="text-herbal-700 dark:text-emerald-400 font-bold hover:underline cursor-pointer">เลือกทั้งหมด</button>
                  <span class="text-slate-300">|</span>
                  <button type="button" onclick="setAllModalAsstSlots(false)" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">ล้างทั้งหมด</button>
                </div>
              </div>
              <div id="modal-asst-slots-grid" class="grid grid-cols-3 sm:grid-cols-4 gap-2">
                <!-- Checkbox Pills Populated via JS -->
              </div>
            </div>

            <div class="pt-3 flex justify-end">
              <button type="button" onclick="saveAssistantShiftFromModal()" class="px-5 py-2.5 bg-herbal-700 hover:bg-herbal-600 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition flex items-center space-x-2 cursor-pointer">
                <i data-lucide="save" class="w-4 h-4"></i>
                <span id="btn-save-asst-shift-text">บันทึกการจัดตารางเวร</span>
              </button>
            </div>
          </div>
        </div>
`;

html = html.slice(0, startIdx) + newDutyTabHTML + html.slice(endIdx);

// 2. Add JavaScript helper functions for Date Range Scheduling
const oldSaveFuncStart = '    async function saveAssistantShiftFromModal() {';
const oldSaveFuncEnd = '    async function handleAssistantProfileSubmitFromModal(e) {';

const saveStartIdx = html.indexOf(oldSaveFuncStart);
const saveEndIdx = html.indexOf(oldSaveFuncEnd);

if (saveStartIdx === -1 || saveEndIdx === -1) {
  console.error('Could not find saveAssistantShiftFromModal markers');
  process.exit(1);
}

const newSaveFunc = [
  '    let currentModalDutyDateMode = "single"; // "single" or "range"',
  '',
  '    function setModalDutyDateMode(mode) {',
  '      currentModalDutyDateMode = mode;',
  '      const btnSingle = document.getElementById("btn-duty-mode-single");',
  '      const btnRange = document.getElementById("btn-duty-mode-range");',
  '      const panelSingle = document.getElementById("duty-panel-single-date");',
  '      const panelRange = document.getElementById("duty-panel-date-range");',
  '      const saveBtnText = document.getElementById("btn-save-asst-shift-text");',
  '',
  '      if (mode === "single") {',
  '        if (btnSingle) {',
  '          btnSingle.className = "px-3 py-1.5 rounded-lg bg-herbal-700 text-white font-bold transition cursor-pointer flex items-center space-x-1";',
  '        }',
  '        if (btnRange) {',
  '          btnRange.className = "px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition cursor-pointer flex items-center space-x-1";',
  '        }',
  '        if (panelSingle) panelSingle.classList.remove("hidden");',
  '        if (panelRange) panelRange.classList.add("hidden");',
  '        if (saveBtnText) saveBtnText.textContent = "บันทึกการจัดตารางเวร";',
  '      } else {',
  '        if (btnSingle) {',
  '          btnSingle.className = "px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition cursor-pointer flex items-center space-x-1";',
  '        }',
  '        if (btnRange) {',
  '          btnRange.className = "px-3 py-1.5 rounded-lg bg-herbal-700 text-white font-bold transition cursor-pointer flex items-center space-x-1";',
  '        }',
  '        if (panelSingle) panelSingle.classList.add("hidden");',
  '        if (panelRange) panelRange.classList.remove("hidden");',
  '        updateModalRangeCalculation();',
  '      }',
  '      lucide.createIcons();',
  '    }',
  '',
  '    function onModalAssistantSingleDateChange(newDate) {',
  '      if (!newDate) return;',
  '      const displayEl = document.getElementById("modal-asst-single-date-display");',
  '      if (displayEl) {',
  '        displayEl.textContent = (typeof formatThaiDisplayDate === "function") ? formatThaiDisplayDate(newDate) : newDate;',
  '      }',
  '      if (!currentDetailAssistantId) return;',
  '      const asst = (assistants || []).find(a => a.id === currentDetailAssistantId);',
  '      if (!asst) return;',
  '',
  '      const rosterForDate = (typeof assistantDutyRosters !== "undefined" && assistantDutyRosters[newDate]) ? assistantDutyRosters[newDate] : {};',
  '      const rEntry = rosterForDate[asst.id] ? (typeof normalizeAssistantRosterEntry === "function" ? normalizeAssistantRosterEntry(rosterForDate[asst.id]) : rosterForDate[asst.id]) : null;',
  '',
  '      const shiftSelect = document.getElementById("modal-asst-shift-type");',
  '      const checkinInput = document.getElementById("modal-asst-checkin-time");',
  '',
  '      if (rEntry) {',
  '        if (checkinInput) checkinInput.value = rEntry.checkInTime ? rEntry.checkInTime.replace(" น.", "").trim() : "";',
  '        if (rEntry.slots && rEntry.slots.length > 0) {',
  '          if (shiftSelect) shiftSelect.value = "custom";',
  '        } else if (rEntry.isExplicitlyEmpty) {',
  '          if (shiftSelect) shiftSelect.value = "off";',
  '        }',
  '      } else {',
  '        if (shiftSelect) shiftSelect.value = (asst.active === false || asst.shiftType === "off") ? "off" : (asst.shiftType || "full");',
  '        if (checkinInput) checkinInput.value = "";',
  '      }',
  '      populateModalAsstSlots(asst, newDate);',
  '    }',
  '',
  '    function applyModalRangePreset(preset) {',
  '      const todayStr = (typeof getTodayDateString === "function") ? getTodayDateString() : new Date().toISOString().slice(0, 10);',
  '      const fromEl = document.getElementById("modal-asst-range-from");',
  '      const toEl = document.getElementById("modal-asst-range-to");',
  '      if (!fromEl || !toEl) return;',
  '',
  '      const d = new Date(todayStr);',
  '      fromEl.value = todayStr;',
  '',
  '      if (typeof preset === "number") {',
  '        const endD = new Date(d);',
  '        endD.setDate(endD.getDate() + (preset - 1));',
  '        toEl.value = endD.toISOString().slice(0, 10);',
  '      } else if (preset === "mon_fri") {',
  '        const dayOfWeek = d.getDay();',
  '        const diffToMon = d.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);',
  '        const monD = new Date(d);',
  '        monD.setDate(diffToMon);',
  '        const friD = new Date(monD);',
  '        friD.setDate(friD.getDate() + 4);',
  '        fromEl.value = monD.toISOString().slice(0, 10);',
  '        toEl.value = friD.toISOString().slice(0, 10);',
  '        setModalRangeDaysOfWeek("workdays");',
  '      } else if (preset === "month") {',
  '        const year = d.getFullYear();',
  '        const month = d.getMonth();',
  '        const firstDay = new Date(year, month, 1);',
  '        const lastDay = new Date(year, month + 1, 0);',
  '        fromEl.value = firstDay.toISOString().slice(0, 10);',
  '        toEl.value = lastDay.toISOString().slice(0, 10);',
  '      }',
  '      updateModalRangeCalculation();',
  '    }',
  '',
  '    function setModalRangeDaysOfWeek(mode) {',
  '      document.querySelectorAll(\'input[name="modal-asst-dow"]\').forEach(cb => {',
  '        if (mode === true) {',
  '          cb.checked = true;',
  '        } else if (mode === "workdays") {',
  '          cb.checked = (cb.value !== "0" && cb.value !== "6");',
  '        }',
  '      });',
  '      updateModalRangeCalculation();',
  '    }',
  '',
  '    function getSelectedModalRangeDates() {',
  '      const fromVal = document.getElementById("modal-asst-range-from")?.value;',
  '      const toVal = document.getElementById("modal-asst-range-to")?.value;',
  '      if (!fromVal || !toVal || fromVal > toVal) return [];',
  '',
  '      const allowedDOW = new Set();',
  '      document.querySelectorAll(\'input[name="modal-asst-dow"]:checked\').forEach(cb => {',
  '        allowedDOW.add(parseInt(cb.value, 10));',
  '      });',
  '',
  '      const dates = [];',
  '      const cur = new Date(fromVal);',
  '      const end = new Date(toVal);',
  '',
  '      while (cur <= end) {',
  '        const dow = cur.getDay();',
  '        if (allowedDOW.has(dow)) {',
  '          dates.push(cur.toISOString().slice(0, 10));',
  '        }',
  '        cur.setDate(cur.getDate() + 1);',
  '      }',
  '      return dates;',
  '    }',
  '',
  '    function updateModalRangeCalculation() {',
  '      const dates = getSelectedModalRangeDates();',
  '      const badge = document.getElementById("modal-asst-range-count-badge");',
  '      if (badge) {',
  '        badge.textContent = "รวม " + dates.length + " วัน";',
  '      }',
  '      const saveBtnText = document.getElementById("btn-save-asst-shift-text");',
  '      if (saveBtnText && currentModalDutyDateMode === "range") {',
  '        saveBtnText.textContent = "บันทึกตารางเวร (" + dates.length + " วัน)";',
  '      }',
  '    }',
  '',
  '    async function saveAssistantShiftFromModal() {',
  '      if (!currentDetailAssistantId) return;',
  '      const asst = (assistants || []).find(a => a.id === currentDetailAssistantId);',
  '      if (!asst) return;',
  '',
  '      const shiftType = document.getElementById("modal-asst-shift-type")?.value || "full";',
  '      const checkinVal = document.getElementById("modal-asst-checkin-time")?.value || "";',
  '',
  '      const checkedSlots = [];',
  '      document.querySelectorAll(\'input[name="modal-asst-slot"]:checked\').forEach(cb => {',
  '        checkedSlots.push(cb.value);',
  '      });',
  '',
  '      asst.shiftType = shiftType;',
  '      asst.active = shiftType !== "off";',
  '      asst.slots = shiftType === "off" ? [] : checkedSlots;',
  '',
  '      let targetDates = [];',
  '      if (currentModalDutyDateMode === "range") {',
  '        targetDates = getSelectedModalRangeDates();',
  '        if (targetDates.length === 0) {',
  '          showToast("กรุณาเลือกช่วงวันที่ให้ถูกต้องอย่างน้อย 1 วัน", "warning");',
  '          return;',
  '        }',
  '      } else {',
  '        const singleDate = document.getElementById("modal-asst-single-date")?.value || (typeof currentRosterDate !== "undefined" && currentRosterDate) || (typeof getTodayDateString === "function" ? getTodayDateString() : "");',
  '        targetDates = [singleDate];',
  '      }',
  '',
  '      // Save to assistantDutyRosters for each target date',
  '      if (typeof assistantDutyRosters !== "undefined") {',
  '        for (const d of targetDates) {',
  '          if (!assistantDutyRosters[d]) assistantDutyRosters[d] = {};',
  '          assistantDutyRosters[d][asst.id] = {',
  '            slots: [...asst.slots],',
  '            checkInTime: checkinVal ? (checkinVal + " น.") : "",',
  '            isExplicitlyEmpty: asst.slots.length === 0',
  '          };',
  '',
  '          if (supabaseClient) {',
  '            try {',
  '              await supabaseClient.from("slot_configs").upsert({',
  '                config_key: d,',
  '                scope: "roster",',
  '                slots_json: assistantDutyRosters[d],',
  '                updated_at: new Date().toISOString()',
  '              });',
  '            } catch(err) {',
  '              console.warn("Supabase roster save error for " + d, err);',
  '            }',
  '          }',
  '        }',
  '',
  '        try {',
  '          localStorage.setItem("ttm_assistant_duty_rosters", JSON.stringify(assistantDutyRosters));',
  '        } catch(e) {}',
  '      }',
  '',
  '      persistAssistants();',
  '',
  '      if (currentModalDutyDateMode === "range") {',
  '        const fromVal = document.getElementById("modal-asst-range-from")?.value;',
  '        const toVal = document.getElementById("modal-asst-range-to")?.value;',
  '        const fromDisp = (typeof formatThaiDisplayDate === "function") ? formatThaiDisplayDate(fromVal) : fromVal;',
  '        const toDisp = (typeof formatThaiDisplayDate === "function") ? formatThaiDisplayDate(toVal) : toVal;',
  '        showToast("บันทึกตารางเวรผู้ช่วย \\"" + asst.nickname + "\\" ในช่วง " + fromDisp + " - " + toDisp + " (" + targetDates.length + " วัน) สำเร็จแล้ว", "success");',
  '      } else {',
  '        showToast("บันทึกตารางเวรผู้ช่วย \\"" + asst.nickname + "\\" สำเร็จแล้ว", "success");',
  '      }',
  '',
  '      renderManageShifts();',
  '      openAssistantDetailModal(asst.id, "duty");',
  '    }'
].join('\n');

html = html.slice(0, saveStartIdx) + newSaveFunc + '\n\n' + html.slice(saveEndIdx);

// Also update openAssistantDetailModal to initialize the date fields
const oldInitMarker = '      populateModalAsstSlots(asst);';
const newInitCode = [
  '      const singleDateInput = document.getElementById("modal-asst-single-date");',
  '      if (singleDateInput) {',
  '        singleDateInput.value = targetRosterDate;',
  '        onModalAssistantSingleDateChange(targetRosterDate);',
  '      }',
  '      const rangeFromInput = document.getElementById("modal-asst-range-from");',
  '      const rangeToInput = document.getElementById("modal-asst-range-to");',
  '      if (rangeFromInput && rangeToInput && (!rangeFromInput.value || !rangeToInput.value)) {',
  '        applyModalRangePreset(7);',
  '      }',
  '      setModalDutyDateMode(currentModalDutyDateMode || "single");',
  '      populateModalAsstSlots(asst);'
].join('\n');

html = html.replace(oldInitMarker, newInitCode);

// Bump version
html = html.replace(/v5\.2\.3/g, 'v5.2.4');
html = html.replace(/ttm-clinic-cache-v130/g, 'ttm-clinic-cache-v131');

fs.writeFileSync('index.html', html);
console.log('Date range scheduling added and bumped to v5.2.4 (ttm-clinic-cache-v131)');
