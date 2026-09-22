const fs = require('fs');
const vm = require('vm');

let content = fs.readFileSync('index.html', 'utf8');

// 1. Fix openAssistantDetailModal targetRosterDate duplicate & isOff & populateModalAsstSlots
const oldOpenModalPart = `      const targetRosterDate = (typeof currentRosterDate !== "undefined" && currentRosterDate) || (typeof getTodayDateString === "function" ? getTodayDateString() : "");
      const dutyStatus = getAssistantDutyStatusForDate(asst, targetRosterDate);
      const dutyEl = document.getElementById("asst-detail-duty-badge");
      if (dutyEl) {
        dutyEl.textContent = dutyStatus.isOff ? '⚪ ลาเวร / พัก (Off Duty)' : \`🟢 \${dutyStatus.shortLabel}\`;
        dutyEl.className = \`font-semibold \${dutyStatus.isOff ? 'text-slate-400' : 'text-emerald-600 dark:text-emerald-400'}\`;
      }

      // 2. Populate Tab 1: Massage History
      renderAssistantMassageHistory(asstId, currentDetailHistoryPeriod);

      // 3. Populate Tab 2: Duty & Shift Settings
      const targetRosterDate = (typeof currentRosterDate !== "undefined" && currentRosterDate) || (typeof getTodayDateString === "function" ? getTodayDateString() : "");
      const dutyDateEl = document.getElementById("asst-duty-current-date");
      if (dutyDateEl) dutyDateEl.textContent = (typeof formatThaiDisplayDate === "function") ? formatThaiDisplayDate(targetRosterDate) : targetRosterDate;

      const shiftSelect = document.getElementById("modal-asst-shift-type");
      if (shiftSelect) {
        shiftSelect.value = isOff ? 'off' : (asst.shiftType || 'full');
      }`;

const newOpenModalPart = `      const targetRosterDate = (document.getElementById("manage-selected-date")?.value) || (typeof currentRosterDate !== "undefined" && currentRosterDate) || (typeof getTodayDateString === "function" ? getTodayDateString() : "");
      const dutyStatus = getAssistantDutyStatusForDate(asst, targetRosterDate);
      const dutyEl = document.getElementById("asst-detail-duty-badge");
      if (dutyEl) {
        const dateFormatted = (typeof formatThaiDisplayDate === "function") ? formatThaiDisplayDate(targetRosterDate) : targetRosterDate;
        dutyEl.textContent = dutyStatus.isOff ? \`⚪ ลาเวร / พัก (\${dateFormatted})\` : \`🟢 \${dutyStatus.shortLabel} (\${dateFormatted})\`;
        dutyEl.className = \`font-semibold \${dutyStatus.isOff ? 'text-slate-400' : 'text-emerald-600 dark:text-emerald-400'}\`;
      }

      // 2. Populate Tab 1: Massage History
      renderAssistantMassageHistory(asstId, currentDetailHistoryPeriod);

      // 3. Populate Tab 2: Duty & Shift Settings
      const dutyDateEl = document.getElementById("asst-duty-current-date");
      if (dutyDateEl) dutyDateEl.textContent = (typeof formatThaiDisplayDate === "function") ? formatThaiDisplayDate(targetRosterDate) : targetRosterDate;

      const shiftSelect = document.getElementById("modal-asst-shift-type");
      if (shiftSelect) {
        shiftSelect.value = dutyStatus.isOff ? 'off' : (dutyStatus.type || asst.shiftType || 'full');
      }`;

if (!content.includes(oldOpenModalPart)) {
  console.error('Could not find oldOpenModalPart in index.html');
  process.exit(1);
}
content = content.replace(oldOpenModalPart, newOpenModalPart);

// Replace populateModalAsstSlots(asst) on line ~19281
content = content.replace(
  'setModalDutyDateMode(currentModalDutyDateMode || "single");\n      populateModalAsstSlots(asst);',
  'setModalDutyDateMode(currentModalDutyDateMode || "single");\n      populateModalAsstSlots(asst, targetRosterDate);'
);

// 2. Update populateModalAsstSlots to accept targetDate
const oldPopulateSlots = `    function populateModalAsstSlots(asst) {
      const grid = document.getElementById("modal-asst-slots-grid");
      if (!grid) return;

      const workingSlots = Array.isArray(asst.slots) ? asst.slots : [...ALL_WORKING_SLOTS];
      grid.innerHTML = ALL_WORKING_SLOTS.map(slot => {
        const isChecked = workingSlots.includes(slot);
        return \`
          <label class="flex items-center space-x-2 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-herbal-50/50 cursor-pointer text-xs transition">
            <input type="checkbox" name="modal-asst-slot" value="\${slot}" \${isChecked ? 'checked' : ''} class="w-3.5 h-3.5 rounded text-herbal-600 focus:ring-herbal-500 border-slate-300">
            <span class="font-bold text-slate-700 dark:text-slate-200">\${slot} น.</span>
          </label>
        \`;
      }).join("");
    }`;

const newPopulateSlots = `    function populateModalAsstSlots(asst, targetDate) {
      const grid = document.getElementById("modal-asst-slots-grid");
      if (!grid) return;

      const dateStr = targetDate || (document.getElementById("manage-selected-date")?.value) || (typeof currentRosterDate !== "undefined" && currentRosterDate) || (typeof getTodayDateString === "function" ? getTodayDateString() : "");
      const dutyStatus = getAssistantDutyStatusForDate(asst, dateStr);
      const workingSlots = Array.isArray(dutyStatus.slots) && dutyStatus.slots.length > 0 
        ? dutyStatus.slots 
        : (dutyStatus.isOff ? [] : (Array.isArray(asst.slots) ? asst.slots : [...ALL_WORKING_SLOTS]));

      grid.innerHTML = ALL_WORKING_SLOTS.map(slot => {
        const isChecked = workingSlots.includes(slot);
        return \`
          <label class="flex items-center space-x-2 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-herbal-50/50 cursor-pointer text-xs transition">
            <input type="checkbox" name="modal-asst-slot" value="\${slot}" \${isChecked ? 'checked' : ''} class="w-3.5 h-3.5 rounded text-herbal-600 focus:ring-herbal-500 border-slate-300">
            <span class="font-bold text-slate-700 dark:text-slate-200">\${slot} น.</span>
          </label>
        \`;
      }).join("");
    }`;

if (!content.includes(oldPopulateSlots)) {
  console.error('Could not find oldPopulateSlots in index.html');
  process.exit(1);
}
content = content.replace(oldPopulateSlots, newPopulateSlots);

// 3. Update onModalAssistantSingleDateChange
const oldSingleDateChange = `    function onModalAssistantSingleDateChange(newDate) {
      if (!newDate) return;
      const displayEl = document.getElementById("modal-asst-single-date-display");
      if (displayEl) {
        displayEl.textContent = (typeof formatThaiDisplayDate === "function") ? formatThaiDisplayDate(newDate) : newDate;
      }
      if (!currentDetailAssistantId) return;
      const asst = (assistants || []).find(a => a.id === currentDetailAssistantId);
      if (!asst) return;

      const rosterForDate = (typeof assistantDutyRosters !== "undefined" && assistantDutyRosters[newDate]) ? assistantDutyRosters[newDate] : {};
      const rEntry = rosterForDate[asst.id] ? (typeof normalizeAssistantRosterEntry === "function" ? normalizeAssistantRosterEntry(rosterForDate[asst.id]) : rosterForDate[asst.id]) : null;

      const shiftSelect = document.getElementById("modal-asst-shift-type");
      const checkinInput = document.getElementById("modal-asst-checkin-time");

      if (rEntry) {
        if (checkinInput) checkinInput.value = rEntry.checkInTime ? rEntry.checkInTime.replace(" น.", "").trim() : "";
        if (rEntry.slots && rEntry.slots.length > 0) {
          if (shiftSelect) shiftSelect.value = "custom";
        } else if (rEntry.isExplicitlyEmpty) {
          if (shiftSelect) shiftSelect.value = "off";
        }
      } else {
        if (shiftSelect) shiftSelect.value = (asst.active === false || asst.shiftType === "off") ? "off" : (asst.shiftType || "full");
        if (checkinInput) checkinInput.value = "";
      }
      populateModalAsstSlots(asst, newDate);
    }`;

const newSingleDateChange = `    function onModalAssistantSingleDateChange(newDate) {
      if (!newDate) return;
      const displayEl = document.getElementById("modal-asst-single-date-display");
      if (displayEl) {
        displayEl.textContent = (typeof formatThaiDisplayDate === "function") ? formatThaiDisplayDate(newDate) : newDate;
      }
      if (!currentDetailAssistantId) return;
      const asst = (assistants || []).find(a => a.id === currentDetailAssistantId);
      if (!asst) return;

      const dutyStatus = getAssistantDutyStatusForDate(asst, newDate);
      const shiftSelect = document.getElementById("modal-asst-shift-type");
      const checkinInput = document.getElementById("modal-asst-checkin-time");

      if (shiftSelect) {
        shiftSelect.value = dutyStatus.isOff ? "off" : (dutyStatus.type || asst.shiftType || "full");
      }
      if (checkinInput) {
        checkinInput.value = (dutyStatus.checkInTime || "").replace(" น.", "").trim();
      }

      const dutyEl = document.getElementById("asst-detail-duty-badge");
      if (dutyEl) {
        const dateFormatted = (typeof formatThaiDisplayDate === "function") ? formatThaiDisplayDate(newDate) : newDate;
        dutyEl.textContent = dutyStatus.isOff ? \`⚪ ลาเวร / พัก (\${dateFormatted})\` : \`🟢 \${dutyStatus.shortLabel} (\${dateFormatted})\`;
        dutyEl.className = \`font-semibold \${dutyStatus.isOff ? 'text-slate-400' : 'text-emerald-600 dark:text-emerald-400'}\`;
      }

      populateModalAsstSlots(asst, newDate);
      onModalAssistantShiftChange(shiftSelect ? shiftSelect.value : (dutyStatus.isOff ? "off" : "full"));
    }`;

if (!content.includes(oldSingleDateChange)) {
  console.error('Could not find oldSingleDateChange in index.html');
  process.exit(1);
}
content = content.replace(oldSingleDateChange, newSingleDateChange);

// 4. Update saveAssistantShiftFromModal
const oldSaveModal = `    async function saveAssistantShiftFromModal() {
      if (!currentDetailAssistantId) return;
      const asst = (assistants || []).find(a => a.id === currentDetailAssistantId);
      if (!asst) return;

      const shiftType = document.getElementById("modal-asst-shift-type")?.value || "full";
      const checkinVal = document.getElementById("modal-asst-checkin-time")?.value || "";

      const checkedSlots = [];
      document.querySelectorAll('input[name="modal-asst-slot"]:checked').forEach(cb => {
        checkedSlots.push(cb.value);
      });

      asst.shiftType = shiftType;
      asst.active = shiftType !== "off";
      asst.slots = shiftType === "off" ? [] : checkedSlots;

      let targetDates = [];
      if (currentModalDutyDateMode === "range") {
        targetDates = getSelectedModalRangeDates();
        if (targetDates.length === 0) {
          showToast("กรุณาเลือกช่วงวันที่ให้ถูกต้องอย่างน้อย 1 วัน", "warning");
          return;
        }
      } else {
        const singleDate = document.getElementById("modal-asst-single-date")?.value || (typeof currentRosterDate !== "undefined" && currentRosterDate) || (typeof getTodayDateString === "function" ? getTodayDateString() : "");
        targetDates = [singleDate];
      }

      // Save to assistantDutyRosters for each target date
      if (typeof assistantDutyRosters !== "undefined") {
        for (const d of targetDates) {
          if (!assistantDutyRosters[d]) assistantDutyRosters[d] = {};
          assistantDutyRosters[d][asst.id] = {
            slots: [...asst.slots],
            checkInTime: checkinVal ? (checkinVal + " น.") : "",
            isExplicitlyEmpty: asst.slots.length === 0
          };

          if (supabaseClient) {
            try {
              await supabaseClient.from("slot_configs").upsert({
                config_key: d,
                scope: "roster",
                slots_json: assistantDutyRosters[d],
                updated_at: new Date().toISOString()
              });
            } catch(err) {
              console.warn("Supabase roster save error for " + d, err);
            }
          }
        }

        try {
          localStorage.setItem("ttm_assistant_duty_rosters", JSON.stringify(assistantDutyRosters));
        } catch(e) {}
      }

      persistAssistants();

      if (currentModalDutyDateMode === "range") {
        const fromVal = document.getElementById("modal-asst-range-from")?.value;
        const toVal = document.getElementById("modal-asst-range-to")?.value;
        const fromDisp = (typeof formatThaiDisplayDate === "function") ? formatThaiDisplayDate(fromVal) : fromVal;
        const toDisp = (typeof formatThaiDisplayDate === "function") ? formatThaiDisplayDate(toVal) : toVal;
        showToast("บันทึกตารางเวรผู้ช่วย \\"" + asst.nickname + "\\" ในช่วง " + fromDisp + " - " + toDisp + " (" + targetDates.length + " วัน) สำเร็จแล้ว", "success");
      } else {
        showToast("บันทึกตารางเวรผู้ช่วย \\"" + asst.nickname + "\\" สำเร็จแล้ว", "success");
      }

      renderManageShifts();
      openAssistantDetailModal(asst.id, "duty");
    }`;

const newSaveModal = `    async function saveAssistantShiftFromModal() {
      if (!currentDetailAssistantId) return;
      const asst = (assistants || []).find(a => a.id === currentDetailAssistantId);
      if (!asst) return;

      const shiftType = document.getElementById("modal-asst-shift-type")?.value || "full";
      const checkinVal = document.getElementById("modal-asst-checkin-time")?.value || "";

      const checkedSlots = [];
      document.querySelectorAll('input[name="modal-asst-slot"]:checked').forEach(cb => {
        checkedSlots.push(cb.value);
      });

      asst.shiftType = shiftType;
      asst.active = shiftType !== "off";
      asst.slots = shiftType === "off" ? [] : checkedSlots;

      let targetDates = [];
      if (currentModalDutyDateMode === "range") {
        targetDates = getSelectedModalRangeDates();
        if (targetDates.length === 0) {
          showToast("กรุณาเลือกช่วงวันที่ให้ถูกต้องอย่างน้อย 1 วัน", "warning");
          return;
        }
      } else {
        const singleDate = document.getElementById("modal-asst-single-date")?.value || (document.getElementById("manage-selected-date")?.value) || (typeof currentRosterDate !== "undefined" && currentRosterDate) || (typeof getTodayDateString === "function" ? getTodayDateString() : "");
        targetDates = [singleDate];
      }

      // Save to assistantDutyRosters for each target date
      if (typeof assistantDutyRosters !== "undefined") {
        for (const d of targetDates) {
          if (!assistantDutyRosters[d]) assistantDutyRosters[d] = {};
          assistantDutyRosters[d][asst.id] = {
            slots: [...asst.slots],
            checkInTime: checkinVal ? (checkinVal + " น.") : "",
            isExplicitlyEmpty: asst.slots.length === 0 || shiftType === "off"
          };

          if (supabaseClient) {
            try {
              await supabaseClient.from("slot_configs").upsert({
                config_key: d,
                scope: "roster",
                slots_json: assistantDutyRosters[d],
                updated_at: new Date().toISOString()
              });
            } catch(err) {
              console.warn("Supabase roster save error for " + d, err);
            }
          }
        }

        try {
          localStorage.setItem("ttm_assistant_duty_rosters", JSON.stringify(assistantDutyRosters));
        } catch(e) {}
      }

      persistAssistants();

      if (supabaseClient) {
        try {
          await supabaseClient.from("assistants").update({
            active: asst.active
          }).eq("id", asst.id);
        } catch(err) {
          console.warn("Supabase assistant active update error:", err);
        }
      }

      if (currentModalDutyDateMode === "range") {
        const fromVal = document.getElementById("modal-asst-range-from")?.value;
        const toVal = document.getElementById("modal-asst-range-to")?.value;
        const fromDisp = (typeof formatThaiDisplayDate === "function") ? formatThaiDisplayDate(fromVal) : fromVal;
        const toDisp = (typeof formatThaiDisplayDate === "function") ? formatThaiDisplayDate(toVal) : toVal;
        showToast("บันทึกตารางเวรผู้ช่วย \\"" + asst.nickname + "\\" ในช่วง " + fromDisp + " - " + toDisp + " (" + targetDates.length + " วัน) สำเร็จแล้ว", "success");
      } else {
        showToast("บันทึกตารางเวรผู้ช่วย \\"" + asst.nickname + "\\" สำเร็จแล้ว", "success");
      }

      renderManageShifts();
      openAssistantDetailModal(asst.id, "duty");

      if (currentModalDutyDateMode === "range") {
        setModalDutyDateMode("range");
        const dutyEl = document.getElementById("asst-detail-duty-badge");
        if (dutyEl) {
          const fromVal = document.getElementById("modal-asst-range-from")?.value;
          const toVal = document.getElementById("modal-asst-range-to")?.value;
          const fromDisp = (typeof formatThaiDisplayDate === "function") ? formatThaiDisplayDate(fromVal) : fromVal;
          const toDisp = (typeof formatThaiDisplayDate === "function") ? formatThaiDisplayDate(toVal) : toVal;
          const isOff = shiftType === 'off';
          const shiftLabel = shiftType === 'full' ? '⭐ ทั้งวัน' : (shiftType === 'official' ? '☀️ ในเวลา' : (shiftType === 'ot' ? '🌙 OT' : \`⚙️ \${asst.slots.length} รอบ\`));
          dutyEl.textContent = isOff ? \`⚪ ลาเวร / พัก (\${fromDisp} - \${toDisp})\` : \`🟢 \${shiftLabel} (\${fromDisp} - \${toDisp})\`;
          dutyEl.className = \`font-semibold \${isOff ? 'text-slate-400' : 'text-emerald-600 dark:text-emerald-400'}\`;
        }
      }
    }`;

if (!content.includes(oldSaveModal)) {
  console.error('Could not find oldSaveModal in index.html');
  process.exit(1);
}
content = content.replace(oldSaveModal, newSaveModal);

// 5. Update renderManageShifts targetRosterDate resolution to prioritize manage-selected-date
content = content.replace(
  'const targetRosterDate = dateStr || (typeof currentRosterDate !== "undefined" && currentRosterDate) || (typeof getTodayDateString === "function" ? getTodayDateString() : "");',
  'const targetRosterDate = dateStr || document.getElementById("manage-selected-date")?.value || (typeof currentRosterDate !== "undefined" && currentRosterDate) || (typeof getTodayDateString === "function" ? getTodayDateString() : "");'
);

// 6. Bump app version in index.html
content = content.replace(/v5\.2\.\d+/g, 'v5.2.5');

fs.writeFileSync('index.html', content, 'utf8');
console.log('Successfully written index.html!');

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
