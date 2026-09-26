/**
 * Module 12: 12_assistant_shifts_and_roster.js
 * Description: Assistant Shifts, Duty Roster, Modal & Monthly History
 * Generated from lines 18779 to 22338 of original index.html
 */

    // ==================== ASSISTANT SHIFTS & WORKING HOURS LOGIC ====================

    async function setAssistantShiftType(asstId, shiftType) {
      const asst = assistants.find(a => a.id === asstId);
      if (!asst) return;

      const targetDate = document.getElementById("manage-selected-date")?.value || (typeof currentRosterDate !== "undefined" && currentRosterDate) || (typeof getTodayDateString === "function" ? getTodayDateString() : "");
      const isToday = (typeof getTodayDateString === "function" && targetDate === getTodayDateString());
      const isLeave = (shiftType === 'off');

      let slots = [];
      if (shiftType === 'official') {
        slots = [...IN_HOURS_SLOTS];
      } else if (shiftType === 'ot') {
        slots = [...OUT_OF_HOURS_SLOTS];
      } else if (shiftType === 'full') {
        slots = [...ALL_WORKING_SLOTS];
      } else if (shiftType === 'custom') {
        slots = (Array.isArray(asst.slots) && asst.slots.length > 0) ? [...asst.slots] : [...ALL_WORKING_SLOTS];
      }

      if (isToday) {
        asst.slots = isLeave ? [] : slots;
        if (!isLeave) {
          asst.shiftType = shiftType;
        }
      }
      asst.active = true;

      // Synchronize active date roster if assistant is in the roster matrix
      if (typeof assistantDutyRosters !== "undefined" && targetDate) {
        if (!assistantDutyRosters[targetDate]) assistantDutyRosters[targetDate] = {};
        assistantDutyRosters[targetDate][asstId] = {
          slots: isLeave ? [] : [...slots],
          checkInTime: isLeave ? "" : "08:00 น.",
          shiftType: shiftType,
          isExplicitlyEmpty: isLeave
        };
        if (typeof saveAssistantRoster === "function") {
          saveAssistantRoster(targetDate, false);
        }
      }

      persistAssistants();
      renderManageShifts(targetDate);
      if (typeof renderAssistantRosterMatrix === "function") {
        renderAssistantRosterMatrix();
      }
      populateAssistantsDropdown("new-assistant-select");

      const badge = getShiftBadgeInfo(asst);
      showToast(`เปลี่ยนเวร ${asst.nickname}: ${badge.label}`, "info");

      await logActivity("CHANGE_ASSISTANT", `ปรับช่วงเวลาเวรผู้ช่วยฯ: ${asst.nickname} เป็น ${badge.label}`, {
        assistantId: asstId,
        name: asst.name,
        nickname: asst.nickname,
        shiftType: shiftType,
        active: asst.active,
        slots: asst.slots
      });

      if (supabaseClient) {
        try {
          await supabaseClient.from("assistants").update({
            active: true
          }).eq("id", asstId);
        } catch(e) { console.error("Error syncing shift type to Supabase:", e); }
      }
    }

    async function bulkSetAssistantShiftPreset(preset) {
      if (!assistants || assistants.length === 0) {
        showToast("ไม่พบรายชื่อผู้ช่วยฯ ในระบบ", "warning");
        return;
      }

      const targetDate = document.getElementById("manage-selected-date")?.value || (typeof currentRosterDate !== "undefined" && currentRosterDate) || (typeof getTodayDateString === "function" ? getTodayDateString() : "");
      const targetDateDisplay = (typeof formatThaiDisplayDate === "function") ? formatThaiDisplayDate(targetDate) : targetDate;

      let presetName = "ทั้งวัน";
      let shiftType = "full";
      let slots = [...ALL_WORKING_SLOTS];
      let isLeave = false;

      if (preset === 'official') {
        presetName = "☀️ ในเวลาราชการ (08:00 - 16:00 น.)";
        shiftType = "official";
        slots = [...IN_HOURS_SLOTS];
      } else if (preset === 'ot') {
        presetName = "🌙 นอกเวลาราชการ / OT (17:00 - 19:00 น.)";
        shiftType = "ot";
        slots = [...OUT_OF_HOURS_SLOTS];
      } else if (preset === 'full') {
        presetName = "⭐ เข้าเวรทั้งวัน (08:00 - 19:00 น.)";
        shiftType = "full";
        slots = [...ALL_WORKING_SLOTS];
      } else if (preset === 'off') {
        presetName = "⚪ ลาเวร / พัก (Off Duty)";
        shiftType = "off";
        slots = [];
        isLeave = true;
      }

      if (!confirm(`คุณต้องการปรับเวรผู้ช่วยฯ ทุกคน (${assistants.length} คน) ประจำวันที่ ${targetDateDisplay} เป็น "${presetName}" หรือไม่?`)) {
        return;
      }

      // Apply to assistantDutyRosters for targetDate specifically
      if (typeof assistantDutyRosters !== "undefined") {
        if (!assistantDutyRosters[targetDate]) assistantDutyRosters[targetDate] = {};
        assistants.forEach(a => {
          assistantDutyRosters[targetDate][a.id] = {
            slots: [...slots],
            checkInTime: isLeave ? "" : "08:00 น.",
            shiftType: shiftType,
            isExplicitlyEmpty: isLeave
          };
        });

        try {
          localStorage.setItem("ttm_assistant_duty_rosters", JSON.stringify(assistantDutyRosters));
        } catch(e) {}

        if (supabaseClient) {
          try {
            await supabaseClient.from("slot_configs").upsert({
              id: "roster_" + targetDate,
              config_key: targetDate,
              scope: "roster",
              slots_json: assistantDutyRosters[targetDate],
              updated_at: new Date().toISOString()
            }, { onConflict: "id" });
          } catch(err) {
            console.warn("Supabase bulk roster save error:", err);
          }
        }
      }

      renderManageShifts(targetDate);
      if (typeof renderAssistantRosterMatrix === "function") {
        renderAssistantRosterMatrix();
      }
      populateAssistantsDropdown("new-assistant-select");
      showToast(`ปรับเวรทุกคนประจำวันที่ ${targetDateDisplay} เป็น "${presetName}" เรียบร้อยแล้ว`, "success");

      await logActivity("CONFIG_SYSTEM", `ปรับเวรผู้ช่วยฯ ทุกคนประจำวันที่ ${targetDate} เป็น ${presetName} (${assistants.length} คน)`, {
        preset: preset,
        shiftType: shiftType,
        targetDate: targetDate,
        total: assistants.length
      });
    }

    // Backwards compatible bulk shift toggle
    async function bulkSetAssistantShifts(status) {
      return bulkSetAssistantShiftPreset(status ? 'full' : 'off');
    }

    async function toggleAssistantShift(asstId, status) {
      if (status) {
        await setAssistantShiftType(asstId, 'full');
      } else {
        await setAssistantShiftType(asstId, 'off');
      }
    }

    // ==================== SLOT PICKER MODAL CONTROLLER ====================
    let pickerSelectedSlots = new Set();

    function openAssistantSlotPickerModal(asstId) {
      const asst = assistants.find(a => a.id === asstId);
      if (!asst) return;

      const modal = document.getElementById("modal-assistant-slot-picker");
      if (!modal) return;

      document.getElementById("slot-picker-asst-id").value = asst.id;
      document.getElementById("slot-picker-asst-name").textContent = `${asst.nickname} (${asst.name})`;
      
      const avatarEl = document.getElementById("slot-picker-avatar");
      if (avatarEl) {
        avatarEl.textContent = asst.nickname ? asst.nickname.charAt(0) : '?';
        if (asst.gender === 'male') {
          avatarEl.className = "w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 flex items-center justify-center font-bold text-base shadow-2xs";
        } else {
          avatarEl.className = "w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 flex items-center justify-center font-bold text-base shadow-2xs";
        }
      }

      // Initialize selected slots
      pickerSelectedSlots.clear();
      const currentSlots = getAssistantWorkSlots(asst);
      currentSlots.forEach(s => pickerSelectedSlots.add(s));

      renderSlotPickerGrids();
      updateSlotPickerCountUI();

      modal.classList.remove("hidden");
      lucide.createIcons();
    }

    function closeAssistantSlotPickerModal() {
      const modal = document.getElementById("modal-assistant-slot-picker");
      if (modal) modal.classList.add("hidden");
    }

    function renderSlotPickerGrids() {
      const inHoursGrid = document.getElementById("slot-picker-in-hours-grid");
      const otGrid = document.getElementById("slot-picker-ot-grid");

      if (inHoursGrid) {
        inHoursGrid.innerHTML = IN_HOURS_SLOTS.map(slot => {
          const isSelected = pickerSelectedSlots.has(slot);
          return `
            <button type="button" onclick="toggleSlotInPicker('${slot}')" id="slot-chip-${slot.replace(':', '-')}"
              class="px-2.5 py-2 rounded-xl text-xs font-bold transition flex items-center justify-between border cursor-pointer ${
                isSelected 
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs' 
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-emerald-400'
              }">
              <span class="font-mono">${slot} น.</span>
              <span class="text-[10px] opacity-80">${isSelected ? '✓' : '+'}</span>
            </button>
          `;
        }).join('');
      }

      if (otGrid) {
        otGrid.innerHTML = OUT_OF_HOURS_SLOTS.map(slot => {
          const isSelected = pickerSelectedSlots.has(slot);
          return `
            <button type="button" onclick="toggleSlotInPicker('${slot}')" id="slot-chip-${slot.replace(':', '-')}"
              class="px-2.5 py-2 rounded-xl text-xs font-bold transition flex items-center justify-between border cursor-pointer ${
                isSelected 
                  ? 'bg-purple-600 text-white border-purple-600 shadow-xs' 
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-purple-400'
              }">
              <span class="font-mono">${slot} น.</span>
              <span class="text-[10px] opacity-80">${isSelected ? '✓' : '+'}</span>
            </button>
          `;
        }).join('');
      }
    }

    function toggleSlotInPicker(slot) {
      if (pickerSelectedSlots.has(slot)) {
        pickerSelectedSlots.delete(slot);
      } else {
        pickerSelectedSlots.add(slot);
      }
      renderSlotPickerGrids();
      updateSlotPickerCountUI();
    }

    function toggleAllInHoursSlotsInPicker() {
      const allSelected = IN_HOURS_SLOTS.every(s => pickerSelectedSlots.has(s));
      if (allSelected) {
        IN_HOURS_SLOTS.forEach(s => pickerSelectedSlots.delete(s));
      } else {
        IN_HOURS_SLOTS.forEach(s => pickerSelectedSlots.add(s));
      }
      renderSlotPickerGrids();
      updateSlotPickerCountUI();
    }

    function toggleAllOtSlotsInPicker() {
      const allSelected = OUT_OF_HOURS_SLOTS.every(s => pickerSelectedSlots.has(s));
      if (allSelected) {
        OUT_OF_HOURS_SLOTS.forEach(s => pickerSelectedSlots.delete(s));
      } else {
        OUT_OF_HOURS_SLOTS.forEach(s => pickerSelectedSlots.add(s));
      }
      renderSlotPickerGrids();
      updateSlotPickerCountUI();
    }

    function applySlotPickerPreset(preset) {
      if (preset === 'official') {
        pickerSelectedSlots.clear();
        IN_HOURS_SLOTS.forEach(s => pickerSelectedSlots.add(s));
      } else if (preset === 'ot') {
        pickerSelectedSlots.clear();
        OUT_OF_HOURS_SLOTS.forEach(s => pickerSelectedSlots.add(s));
      } else if (preset === 'full') {
        pickerSelectedSlots.clear();
        ALL_WORKING_SLOTS.forEach(s => pickerSelectedSlots.add(s));
      } else if (preset === 'off') {
        pickerSelectedSlots.clear();
      }
      renderSlotPickerGrids();
      updateSlotPickerCountUI();
    }

    function updateSlotPickerCountUI() {
      const label = document.getElementById("slot-picker-count-label");
      if (!label) return;
      const count = pickerSelectedSlots.size;
      const inHoursCount = IN_HOURS_SLOTS.filter(s => pickerSelectedSlots.has(s)).length;
      const otCount = OUT_OF_HOURS_SLOTS.filter(s => pickerSelectedSlots.has(s)).length;

      label.innerHTML = `เลือกไว้: <span class="text-herbal-700 dark:text-emerald-400 font-bold">${count}</span> / 12 รอบ <span class="text-[10px] text-slate-400">(${inHoursCount} ในเวลา, ${otCount} OT)</span>`;
    }

    async function saveAssistantSlotPicker() {
      if (!currentUser || currentUser.role !== 'admin') {
        showToast("🔒 เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่สามารถปรับเปลี่ยนรอบเวลาผู้ช่วยได้", "error");
        return;
      }
      const asstId = document.getElementById("slot-picker-asst-id")?.value;
      const asst = assistants.find(a => a.id === asstId);
      if (!asst) return;

      const selected = ALL_WORKING_SLOTS.filter(s => pickerSelectedSlots.has(s));
      asst.slots = [...selected];

      // Synchronize active date roster if assistant is in the roster matrix
      const targetDate = (typeof currentRosterDate !== "undefined" && currentRosterDate) ? currentRosterDate : getTodayDateString();
      if (typeof assistantDutyRosters !== "undefined" && assistantDutyRosters[targetDate] && assistantDutyRosters[targetDate][asstId]) {
        const rEntry = normalizeAssistantRosterEntry(assistantDutyRosters[targetDate][asstId]);
        rEntry.slots = [...selected];
        assistantDutyRosters[targetDate][asstId] = rEntry;
        if (typeof saveAssistantRoster === "function") {
          saveAssistantRoster(targetDate, false);
        }
      }
      if (typeof renderAssistantRosterMatrix === "function") {
        renderAssistantRosterMatrix();
      }

      if (selected.length === 0) {
        asst.active = false;
        asst.shiftType = 'off';
      } else if (selected.length === ALL_WORKING_SLOTS.length) {
        asst.active = true;
        asst.shiftType = 'full';
      } else if (selected.length === IN_HOURS_SLOTS.length && IN_HOURS_SLOTS.every(s => selected.includes(s))) {
        asst.active = true;
        asst.shiftType = 'official';
      } else if (selected.length === OUT_OF_HOURS_SLOTS.length && OUT_OF_HOURS_SLOTS.every(s => selected.includes(s))) {
        asst.active = true;
        asst.shiftType = 'ot';
      } else {
        asst.active = true;
        asst.shiftType = 'custom';
      }

      persistAssistants();
      closeAssistantSlotPickerModal();
      renderManageShifts();
      populateAssistantsDropdown("new-assistant-select");

      const badge = getShiftBadgeInfo(asst);
      showToast(`บันทึกรอบเวลาของ ${asst.nickname} เรียบร้อยแล้ว (${badge.label})`, "success");

      await logActivity("CHANGE_ASSISTANT", `กำหนดรอบเวลาปฏิบัติงานเฉพาะของผู้ช่วยฯ: ${asst.nickname} [${selected.join(', ')}]`, {
        assistantId: asstId,
        name: asst.name,
        nickname: asst.nickname,
        shiftType: asst.shiftType,
        slots: asst.slots,
        active: asst.active
      });

      if (supabaseClient) {
        try {
          await supabaseClient.from("assistants").update({
            active: asst.active
          }).eq("id", asstId);
        } catch(e) { console.error("Error saving slot picker to Supabase:", e); }
      }
    }

    // Assistant Avatar & Visual Identifier Helper (v5.3.0)
    function getAssistantAvatarHTML(asst, size = 'w-10 h-10', textSize = 'text-xs') {
      if (!asst) return `<div class="${size} rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-400">?</div>`;
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

      return `
        <div class="${size} rounded-xl flex items-center justify-center font-black ${textSize} shrink-0 border shadow-2xs ${colorClass}" title="${escapeHtml(rawNick)}">
          ${escapeHtml(label || '?')}
        </div>
      `;
    }

    // ==================== RENDER ASSISTANT SHIFTS TAB ====================
    
    // ==========================================
    // ASSISTANT DETAIL & MASSAGE HISTORY SYSTEM
    // ==========================================
    let currentDetailAssistantId = null;
    let currentDetailHistoryPeriod = 'all';
    let currentDetailHistoryMonth = 'all';
    const THAI_FULL_MONTHS = [
      "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
      "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
    ];

    // Universal Excel (.xlsx) / UTF-8 BOM CSV Exporter
    function exportDataToExcel(filename, sheetName, headers, rows) {
      const cleanFilename = (filename || "export").replace(/[\\/:*?"<>|]+/g, "_");

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
          XLSX.writeFile(wb, `${cleanFilename}.xlsx`);
          showToast(`ส่งออกไฟล์ Excel "${cleanFilename}.xlsx" สำเร็จแล้ว`, "success");
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
          return `"${s}"`;
        }).join(",")
      );
      const csvContent = "\uFEFF" + csvRows.join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `${cleanFilename}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast(`ส่งออกไฟล์ "${cleanFilename}.csv" สำเร็จแล้ว`, "success");
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
        ...effectiveSlots.map(s => `รอบ ${s} น.`),
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

      exportDataToExcel(`ตารางเวรผู้ช่วยแพทย์แผนไทย_${dateStr}`, "ตารางเวร", headers, rows);
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

      const datePart = (startInput && endInput) ? `${startInput}_ถึง_${endInput}` : (startInput || "all");
      exportDataToExcel(`รายงานคิวนวดแพทย์แผนไทย_${datePart}`, "รายงานคิวนวด", headers, rows);
    }
    let successAlertTimer = null;

    function showSuccessAlertModal({ title, desc, assistantName, dateText, shiftText, autoCloseMs = 0 }) {
      const modal = document.getElementById("modal-success-alert");
      if (!modal) return;

      const titleEl = document.getElementById("success-alert-title");
      const descEl = document.getElementById("success-alert-desc");
      const asstEl = document.getElementById("success-alert-asst");
      const dateEl = document.getElementById("success-alert-date");
      const shiftEl = document.getElementById("success-alert-shift");
      const detailBox = document.getElementById("success-alert-detail-box");

      if (titleEl) titleEl.textContent = title || "บันทึกข้อมูลสำเร็จ!";
      if (descEl) descEl.textContent = desc || "ระบบได้บันทึกข้อมูลเรียบร้อยแล้ว";

      if (asstEl) asstEl.textContent = assistantName || "-";
      if (dateEl) dateEl.textContent = dateText || "-";
      if (shiftEl) shiftEl.textContent = shiftText || "-";

      if (!assistantName && !dateText && !shiftText && detailBox) {
        detailBox.classList.add("hidden");
      } else if (detailBox) {
        detailBox.classList.remove("hidden");
      }

      modal.classList.remove("hidden");
      if (typeof lucide !== "undefined" && lucide.createIcons) {
        lucide.createIcons();
      }

      if (successAlertTimer) clearTimeout(successAlertTimer);
      if (autoCloseMs > 0) {
        successAlertTimer = setTimeout(() => {
          closeSuccessAlertModal();
        }, autoCloseMs);
      }
    }

    function closeSuccessAlertModal() {
      const modal = document.getElementById("modal-success-alert");
      if (modal) modal.classList.add("hidden");
      if (successAlertTimer) {
        clearTimeout(successAlertTimer);
        successAlertTimer = null;
      }
    }

    
    // Unified Assistant Duty Status for Date Helper (v5.4.0)
    function getAssistantDutyStatusForDate(asst, dateStr) {
      if (!asst) return { isOff: true, type: 'off', label: '⚪ ลาเวร / พัก (Off Duty)', shortLabel: '⚪ ลาเวร / พัก', badgeClass: 'bg-slate-100 text-slate-500 border-slate-200' };

      const targetDate = dateStr || (typeof currentRosterDate !== "undefined" && currentRosterDate) || (typeof getTodayDateString === "function" ? getTodayDateString() : "");
      const rosterObj = (typeof assistantDutyRosters !== "undefined" && assistantDutyRosters[targetDate]) ? assistantDutyRosters[targetDate] : null;
      const rEntry = rosterObj && rosterObj[asst.id] ? (typeof normalizeAssistantRosterEntry === "function" ? normalizeAssistantRosterEntry(rosterObj[asst.id]) : rosterObj[asst.id]) : null;

      // 1. If explicit roster entry exists for this specific date
      if (rEntry) {
        if (rEntry.isExplicitlyEmpty || rEntry.shiftType === 'off' || !rEntry.slots || rEntry.slots.length === 0) {
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
          label: `⚙️ กำหนดรอบเอง (${count} รอบ)`,
          shortLabel: `⚙️ ${count} รอบ`,
          badgeClass: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
          slots: rEntry.slots,
          checkInTime: rEntry.checkInTime || ''
        };
      }

      // 2. Fallback to assistant object's own default properties
      if (asst.active === false) {
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

      // Check if targetDate is TODAY and live check-in has actively started
      const isToday = (typeof getTodayDateString === "function" && targetDate === getTodayDateString());
      if (isToday && rosterObj) {
        const hasActiveCheckInsToday = Object.values(rosterObj).some(e => {
          const norm = normalizeAssistantRosterEntry(e);
          return !norm.isExplicitlyEmpty && norm.shiftType !== 'off' && Array.isArray(norm.slots) && norm.slots.length > 0;
        });
        if (hasActiveCheckInsToday) {
          return {
            isOff: false,
            isNotCheckedIn: true,
            type: 'not_checked_in',
            label: '⚪ ยังไม่ได้เช็คชื่อ (ไม่มา)',
            shortLabel: '⚪ ไม่มา',
            badgeClass: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700',
            slots: [],
            checkInTime: ''
          };
        }
      }

      const defaultShift = (asst.shiftType && asst.shiftType !== 'off') ? asst.shiftType : 'full';
      const defaultSlots = getAssistantWorkSlots(asst);
      const shiftInfo = getShiftBadgeInfo({ ...asst, shiftType: defaultShift, slots: defaultSlots });
      return {
        isOff: false,
        type: shiftInfo.type,
        label: shiftInfo.label,
        shortLabel: shiftInfo.shortLabel,
        badgeClass: shiftInfo.badgeClass,
        slots: defaultSlots,
        checkInTime: ''
      };
    }

    function openAssistantDetailModal(asstId, defaultTab = 'history') {
      currentDetailAssistantId = asstId;
      const asst = (assistants || []).find(a => a.id === asstId);
      if (!asst) return;

      // 1. Populate Header Information
      const avatarContainer = document.getElementById("asst-detail-avatar-container");
      if (avatarContainer) {
        avatarContainer.innerHTML = getAssistantAvatarHTML(asst, 'w-12 h-12 sm:w-14 sm:h-14', 'text-sm sm:text-base');
      }

      const fullnameEl = document.getElementById("asst-detail-fullname");
      if (fullnameEl) fullnameEl.textContent = asst.name || asst.nickname || "-";

      const nicknameEl = document.getElementById("asst-detail-nickname-badge");
      if (nicknameEl) nicknameEl.textContent = `ชื่อเล่น: ${asst.nickname || "-"}`;

      const roleEl = document.getElementById("asst-detail-role-badge");
      if (roleEl) {
        const isRoleAdmin = asst.role === 'admin';
        const isRoleUser = asst.role === 'user';
        roleEl.textContent = isRoleAdmin ? '🛡️ Admin' : (isRoleUser ? '👤 User' : '🩺 Staff');
        roleEl.className = `px-2 py-0.5 rounded-lg text-[10.5px] font-bold border ${isRoleAdmin ? 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950 dark:text-purple-300' : (isRoleUser ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300')}`;
      }

      const phoneEl = document.getElementById("asst-detail-phone");
      if (phoneEl) phoneEl.innerHTML = `<i data-lucide="phone" class="w-3 h-3"></i> ${asst.phone ? escapeHtml(asst.phone) : 'ไม่มีเบอร์'}`;

      const genderEl = document.getElementById("asst-detail-gender");
      if (genderEl) genderEl.textContent = asst.gender === 'male' ? '👨 ชาย' : '👩 หญิง';

      const targetRosterDate = (document.getElementById("manage-selected-date")?.value) || (typeof currentRosterDate !== "undefined" && currentRosterDate) || (typeof getTodayDateString === "function" ? getTodayDateString() : "");
      const dutyStatus = getAssistantDutyStatusForDate(asst, targetRosterDate);
      const dutyEl = document.getElementById("asst-detail-duty-badge");
      if (dutyEl) {
        const dateFormatted = (typeof formatThaiDisplayDate === "function") ? formatThaiDisplayDate(targetRosterDate) : targetRosterDate;
        dutyEl.textContent = dutyStatus.isOff ? `⚪ ลาเวร / พัก (${dateFormatted})` : `🟢 ${dutyStatus.shortLabel} (${dateFormatted})`;
        dutyEl.className = `font-semibold ${dutyStatus.isOff ? 'text-slate-400' : 'text-emerald-600 dark:text-emerald-400'}`;
      }

      // 2. Populate Tab 1: Massage History
      renderAssistantMassageHistory(asstId, currentDetailHistoryPeriod);

      // 3. Populate Tab 2: Duty & Shift Settings
      const dutyDateEl = document.getElementById("asst-duty-current-date");
      if (dutyDateEl) dutyDateEl.textContent = (typeof formatThaiDisplayDate === "function") ? formatThaiDisplayDate(targetRosterDate) : targetRosterDate;

      const shiftSelect = document.getElementById("modal-asst-shift-type");
      if (shiftSelect) {
        shiftSelect.value = dutyStatus.isOff ? 'off' : (dutyStatus.type || asst.shiftType || 'full');
      }

      const rosterForDate = (typeof assistantDutyRosters !== "undefined" && assistantDutyRosters[targetRosterDate]) ? assistantDutyRosters[targetRosterDate] : {};
      const rEntry = rosterForDate[asst.id] ? (typeof normalizeAssistantRosterEntry === "function" ? normalizeAssistantRosterEntry(rosterForDate[asst.id]) : rosterForDate[asst.id]) : null;
      const checkinInput = document.getElementById("modal-asst-checkin-time");
      if (checkinInput) {
        checkinInput.value = (rEntry && rEntry.checkInTime) ? rEntry.checkInTime.replace(" น.", "").trim() : "";
      }

      const singleDateInput = document.getElementById("modal-asst-single-date");
      if (singleDateInput) {
        singleDateInput.value = targetRosterDate;
        onModalAssistantSingleDateChange(targetRosterDate);
      }
      const rangeFromInput = document.getElementById("modal-asst-range-from");
      const rangeToInput = document.getElementById("modal-asst-range-to");
      if (rangeFromInput && rangeToInput && (!rangeFromInput.value || !rangeToInput.value)) {
        applyModalRangePreset(7);
      }
      setModalDutyDateMode(currentModalDutyDateMode || "single");
      populateModalAsstSlots(asst, targetRosterDate);

      // 4. Populate Tab 3: Profile Form
      document.getElementById("modal-profile-asst-id").value = asst.id;
      document.getElementById("modal-profile-fullname").value = asst.name || "";
      document.getElementById("modal-profile-nickname").value = asst.nickname || "";
      document.getElementById("modal-profile-gender").value = asst.gender || "female";
      document.getElementById("modal-profile-role").value = asst.role || "staff";
      document.getElementById("modal-profile-phone").value = asst.phone || "";
      document.getElementById("modal-profile-email").value = asst.email || "";

      // Switch to active tab
      switchAssistantDetailTab(defaultTab);

      // Open Modal
      const modal = document.getElementById("modal-assistant-detail");
      if (modal) {
        modal.classList.remove("hidden");
        document.body.style.overflow = "hidden";
      }
      lucide.createIcons();
    }

    function closeAssistantDetailModal() {
      const modal = document.getElementById("modal-assistant-detail");
      if (modal) {
        modal.classList.add("hidden");
        document.body.style.overflow = "";
      }
      currentDetailAssistantId = null;
    }

    function switchAssistantDetailTab(tabId) {
      document.querySelectorAll(".asst-detail-tab-btn").forEach(btn => {
        btn.classList.remove("border-herbal-700", "text-herbal-800", "dark:text-emerald-400");
        btn.classList.add("border-transparent", "text-slate-500", "dark:text-slate-400");
      });
      document.querySelectorAll(".asst-detail-tab-content").forEach(c => c.classList.add("hidden"));

      const activeBtn = document.getElementById("tab-btn-asst-" + tabId);
      if (activeBtn) {
        activeBtn.classList.remove("border-transparent", "text-slate-500", "dark:text-slate-400");
        activeBtn.classList.add("border-herbal-700", "text-herbal-800", "dark:text-emerald-400");
      }

      const activeContent = document.getElementById("asst-tab-" + tabId);
      if (activeContent) activeContent.classList.remove("hidden");
      lucide.createIcons();
    }

    function getAssistantAppointmentsList(asstId) {
      const asst = (assistants || []).find(a => a.id === asstId);
      if (!asst) return [];

      const list = (Array.isArray(appointments) ? appointments : []).filter(apt => {
        if (!apt) return false;
        if (apt.assistantId === asst.id || apt.assistant_id === asst.id) return true;
        if (apt.assistantNick && (apt.assistantNick === asst.nickname || apt.assistantNick === asst.name)) return true;
        if (apt.assistant_nick && (apt.assistant_nick === asst.nickname || apt.assistant_nick === asst.name)) return true;
        return false;
      });

      // Sort newest first
      list.sort((a, b) => {
        const dateCmp = (b.bookDate || b.book_date || '').localeCompare(a.bookDate || a.book_date || '');
        if (dateCmp !== 0) return dateCmp;
        return (b.timeSlot || b.time_slot || '').localeCompare(a.timeSlot || a.time_slot || '');
      });
      return list;
    }

    function renderAssistantMassageHistory(asstId, period = 'all', specificMonth = null) {
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
      if (statTodayEl) statTodayEl.innerHTML = `${todayCases} <span class="text-xs font-normal">เคส</span>`;
      const statMonthEl = document.getElementById("asst-stat-history-month");
      if (statMonthEl) statMonthEl.innerHTML = `${monthCases} <span class="text-xs font-normal">เคส</span>`;
      const statAllEl = document.getElementById("asst-stat-history-all");
      if (statAllEl) statAllEl.innerHTML = `${totalCases} <span class="text-xs font-normal">เคส</span>`;
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
        monthSelect.innerHTML = `<option value="all">📅 ทุกช่วงเวลา (ทั้งหมด ${totalCases} เคส)</option>` +
          sortedMonths.map(ym => {
            const [y, m] = ym.split('-');
            const mIdx = parseInt(m, 10) - 1;
            const monthThai = THAI_FULL_MONTHS[mIdx] || ym;
            const yearThai = parseInt(y, 10) + 543;
            const count = apts.filter(a => (a.bookDate || a.book_date || '').startsWith(ym)).length;
            const isCur = ym === currentYearMonth ? " (เดือนปัจจุบัน)" : "";
            return `<option value="${ym}">${monthThai} ${yearThai}${isCur} - ${count} เคส</option>`;
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
        filterHeaderLabel = `ประจำวันนี้ (${(typeof formatThaiDisplayDate === "function") ? formatThaiDisplayDate(todayStr) : todayStr})`;
      } else if (period === 'month') {
        filtered = apts.filter(a => (a.bookDate || a.book_date || '').startsWith(currentYearMonth));
        const [y, m] = currentYearMonth.split('-');
        filterHeaderLabel = `เดือนนี้ (${THAI_FULL_MONTHS[parseInt(m, 10) - 1]} ${parseInt(y, 10) + 543})`;
      } else if (currentDetailHistoryMonth && currentDetailHistoryMonth !== 'all') {
        filtered = apts.filter(a => (a.bookDate || a.book_date || '').startsWith(currentDetailHistoryMonth));
        const [y, m] = currentDetailHistoryMonth.split('-');
        filterHeaderLabel = `เดือน ${THAI_FULL_MONTHS[parseInt(m, 10) - 1]} ${parseInt(y, 10) + 543}`;
      } else {
        filterHeaderLabel = "ทั้งหมดทุกช่วงเวลา";
      }

      const container = document.getElementById("asst-history-items-container");
      if (!container) return;

      if (filtered.length === 0) {
        container.innerHTML = `
          <div class="py-8 px-4 text-center bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 space-y-2">
            <div class="w-10 h-10 mx-auto rounded-full bg-slate-100 dark:bg-slate-700 text-slate-400 flex items-center justify-center">
              <i data-lucide="calendar-x" class="w-5 h-5"></i>
            </div>
            <div class="text-xs font-bold text-slate-600 dark:text-slate-300">ไม่พบประวัติการนวดในช่วง${escapeHtml(filterHeaderLabel)}</div>
            <p class="text-[11px] text-slate-400">เมื่อมีการจองหรือเริ่มหัตถการกับผู้ช่วยท่านนี้ รายการจะบันทึกเข้ามาโดยอัตโนมัติ</p>
          </div>
        `;
        lucide.createIcons();
        return;
      }

      // Render summary banner above list
      const summaryBanner = `
        <div class="flex items-center justify-between px-3 py-2 bg-emerald-50/60 dark:bg-emerald-950/40 rounded-xl border border-emerald-200/70 dark:border-emerald-800/50 text-[11.5px] font-bold text-emerald-900 dark:text-emerald-200 mb-2">
          <span>📋 แสดง ${filtered.length} เคส (${escapeHtml(filterHeaderLabel)})</span>
          <span class="text-emerald-600 dark:text-emerald-400 text-[10.5px] font-medium">เรียงจากล่าสุด</span>
        </div>
      `;

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

        return `
          <div class="p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-2xs hover:border-herbal-300 transition flex items-center justify-between gap-3 text-xs mb-2">
            <div class="min-w-0 flex items-center space-x-3">
              <div class="w-8 h-8 rounded-xl bg-herbal-50 dark:bg-emerald-950/60 text-herbal-700 dark:text-emerald-400 font-bold flex items-center justify-center shrink-0 text-xs">
                ${idx + 1}
              </div>
              <div class="min-w-0">
                <div class="flex items-center space-x-2 flex-wrap">
                  <span class="font-bold text-slate-800 dark:text-white truncate">${escapeHtml(patient)}</span>
                  ${phone ? `<span class="text-[10px] text-slate-400 font-mono">(${escapeHtml(phone)})</span>` : ''}
                  ${statusBadge}
                </div>
                <div class="flex items-center space-x-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex-wrap">
                  <span class="font-semibold text-herbal-700 dark:text-emerald-400">${escapeHtml(service)}</span>
                  <span>•</span>
                  <span>📅 ${escapeHtml(dateDisplay)}</span>
                  <span>•</span>
                  <span class="font-bold text-slate-700 dark:text-slate-300">⏰ รอบ ${escapeHtml(timeSlot)} น.</span>
                </div>
              </div>
            </div>
            <div class="text-right shrink-0">
              <span class="text-[10px] font-mono text-slate-400 block">ID: ${escapeHtml(apt.id || "-")}</span>
            </div>
          </div>
        `;
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
        asst.nickname ? `[${asst.nickname}] ${asst.name}` : asst.name,
        a.status || "รอรับบริการ"
      ]);

      const nickPart = (asst.nickname || asst.name || "ผู้ช่วย").replace(/\s+/g, '_');
      exportDataToExcel(`ประวัตินวด_${nickPart}_${monthLabel}`, "ประวัตินวด", headers, rows);
    }

    function populateModalAsstSlots(asst, targetDate) {
      const grid = document.getElementById("modal-asst-slots-grid");
      if (!grid) return;

      const dateStr = targetDate || (document.getElementById("manage-selected-date")?.value) || (typeof currentRosterDate !== "undefined" && currentRosterDate) || (typeof getTodayDateString === "function" ? getTodayDateString() : "");
      const dutyStatus = getAssistantDutyStatusForDate(asst, dateStr);
      const workingSlots = Array.isArray(dutyStatus.slots) && dutyStatus.slots.length > 0 
        ? dutyStatus.slots 
        : (dutyStatus.isOff ? [] : (Array.isArray(asst.slots) ? asst.slots : [...ALL_WORKING_SLOTS]));

      grid.innerHTML = ALL_WORKING_SLOTS.map(slot => {
        const isChecked = workingSlots.includes(slot);
        return `
          <label class="flex items-center space-x-2 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-herbal-50/50 cursor-pointer text-xs transition">
            <input type="checkbox" name="modal-asst-slot" value="${slot}" ${isChecked ? 'checked' : ''} class="w-3.5 h-3.5 rounded text-herbal-600 focus:ring-herbal-500 border-slate-300">
            <span class="font-bold text-slate-700 dark:text-slate-200">${slot} น.</span>
          </label>
        `;
      }).join("");
    }

    function onModalAssistantShiftChange(shiftType) {
      const slotsSection = document.getElementById("modal-asst-slots-section");
      if (slotsSection) {
        slotsSection.classList.toggle("hidden", shiftType === "off");
      }

      if (shiftType === 'official') {
        setAllModalAsstSlots(false);
        IN_HOURS_SLOTS.forEach(s => {
          const cb = document.querySelector(`input[name="modal-asst-slot"][value="${s}"]`);
          if (cb) cb.checked = true;
        });
      } else if (shiftType === 'ot') {
        setAllModalAsstSlots(false);
        OUT_OF_HOURS_SLOTS.forEach(s => {
          const cb = document.querySelector(`input[name="modal-asst-slot"][value="${s}"]`);
          if (cb) cb.checked = true;
        });
      } else if (shiftType === 'full') {
        setAllModalAsstSlots(true);
      } else if (shiftType === 'off') {
        setAllModalAsstSlots(false);
      }
    }

    function setAllModalAsstSlots(checked) {
      document.querySelectorAll('input[name="modal-asst-slot"]').forEach(cb => {
        cb.checked = checked;
      });
    }

    let currentModalDutyDateMode = "single"; // "single" or "range"

    function setModalDutyDateMode(mode) {
      currentModalDutyDateMode = mode;
      const btnSingle = document.getElementById("btn-duty-mode-single");
      const btnRange = document.getElementById("btn-duty-mode-range");
      const panelSingle = document.getElementById("duty-panel-single-date");
      const panelRange = document.getElementById("duty-panel-date-range");
      const saveBtnText = document.getElementById("btn-save-asst-shift-text");

      if (mode === "single") {
        if (btnSingle) {
          btnSingle.className = "px-3 py-1.5 rounded-lg bg-herbal-700 text-white font-bold transition cursor-pointer flex items-center space-x-1";
        }
        if (btnRange) {
          btnRange.className = "px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition cursor-pointer flex items-center space-x-1";
        }
        if (panelSingle) panelSingle.classList.remove("hidden");
        if (panelRange) panelRange.classList.add("hidden");
        if (saveBtnText) saveBtnText.textContent = "บันทึกการจัดตารางเวร";
      } else {
        if (btnSingle) {
          btnSingle.className = "px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition cursor-pointer flex items-center space-x-1";
        }
        if (btnRange) {
          btnRange.className = "px-3 py-1.5 rounded-lg bg-herbal-700 text-white font-bold transition cursor-pointer flex items-center space-x-1";
        }
        if (panelSingle) panelSingle.classList.add("hidden");
        if (panelRange) panelRange.classList.remove("hidden");
        updateModalRangeCalculation();
      }
      lucide.createIcons();
    }

    function onModalAssistantSingleDateChange(newDate) {
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
        dutyEl.textContent = dutyStatus.isOff ? `⚪ ลาเวร / พัก (${dateFormatted})` : `🟢 ${dutyStatus.shortLabel} (${dateFormatted})`;
        dutyEl.className = `font-semibold ${dutyStatus.isOff ? 'text-slate-400' : 'text-emerald-600 dark:text-emerald-400'}`;
      }

      populateModalAsstSlots(asst, newDate);
      onModalAssistantShiftChange(shiftSelect ? shiftSelect.value : (dutyStatus.isOff ? "off" : "full"));
    }

    function applyModalRangePreset(preset) {
      const todayStr = (typeof getTodayDateString === "function") ? getTodayDateString() : new Date().toISOString().slice(0, 10);
      const fromEl = document.getElementById("modal-asst-range-from");
      const toEl = document.getElementById("modal-asst-range-to");
      if (!fromEl || !toEl) return;

      const d = new Date(todayStr);
      fromEl.value = todayStr;

      if (typeof preset === "number") {
        const endD = new Date(d);
        endD.setDate(endD.getDate() + (preset - 1));
        toEl.value = endD.toISOString().slice(0, 10);
      } else if (preset === "mon_fri") {
        const dayOfWeek = d.getDay();
        const diffToMon = d.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        const monD = new Date(d);
        monD.setDate(diffToMon);
        const friD = new Date(monD);
        friD.setDate(friD.getDate() + 4);
        fromEl.value = monD.toISOString().slice(0, 10);
        toEl.value = friD.toISOString().slice(0, 10);
        setModalRangeDaysOfWeek("workdays");
      } else if (preset === "month") {
        const year = d.getFullYear();
        const month = d.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        fromEl.value = firstDay.toISOString().slice(0, 10);
        toEl.value = lastDay.toISOString().slice(0, 10);
      }
      updateModalRangeCalculation();
    }

    function setModalRangeDaysOfWeek(mode) {
      document.querySelectorAll('input[name="modal-asst-dow"]').forEach(cb => {
        if (mode === true) {
          cb.checked = true;
        } else if (mode === "workdays") {
          cb.checked = (cb.value !== "0" && cb.value !== "6");
        }
      });
      updateModalRangeCalculation();
    }

    function getSelectedModalRangeDates() {
      const fromVal = document.getElementById("modal-asst-range-from")?.value;
      const toVal = document.getElementById("modal-asst-range-to")?.value;
      if (!fromVal || !toVal || fromVal > toVal) return [];

      const allowedDOW = new Set();
      document.querySelectorAll('input[name="modal-asst-dow"]:checked').forEach(cb => {
        allowedDOW.add(parseInt(cb.value, 10));
      });

      const dates = [];
      const cur = new Date(fromVal);
      const end = new Date(toVal);

      while (cur <= end) {
        const dow = cur.getDay();
        if (allowedDOW.has(dow)) {
          dates.push(cur.toISOString().slice(0, 10));
        }
        cur.setDate(cur.getDate() + 1);
      }
      return dates;
    }

    function updateModalRangeCalculation() {
      const dates = getSelectedModalRangeDates();
      const badge = document.getElementById("modal-asst-range-count-badge");
      if (badge) {
        badge.textContent = "รวม " + dates.length + " วัน";
      }
      const saveBtnText = document.getElementById("btn-save-asst-shift-text");
      if (saveBtnText && currentModalDutyDateMode === "range") {
        saveBtnText.textContent = "บันทึกตารางเวร (" + dates.length + " วัน)";
      }
    }

    async function saveAssistantShiftFromModal() {
      if (!currentDetailAssistantId) return;
      const asst = (assistants || []).find(a => a.id === currentDetailAssistantId);
      if (!asst) return;

      const shiftType = document.getElementById("modal-asst-shift-type")?.value || "full";
      const checkinVal = document.getElementById("modal-asst-checkin-time")?.value || "";

      const checkedSlots = [];
      document.querySelectorAll('input[name="modal-asst-slot"]:checked').forEach(cb => {
        checkedSlots.push(cb.value);
      });

      const isLeave = (shiftType === "off" || checkedSlots.length === 0);
      const appliedSlots = isLeave ? [] : [...checkedSlots];

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

      const todayDate = (typeof getTodayDateString === "function") ? getTodayDateString() : new Date().toISOString().slice(0, 10);

      // Only update today's live slots if today is in the targeted dates
      if (targetDates.includes(todayDate)) {
        asst.slots = [...appliedSlots];
        if (!isLeave) {
          asst.shiftType = shiftType;
        }
      }
      // Master employee record remains active
      asst.active = true;

      // Save to assistantDutyRosters for each target date
      if (typeof assistantDutyRosters !== "undefined") {
        for (const d of targetDates) {
          if (!assistantDutyRosters[d]) assistantDutyRosters[d] = {};
          assistantDutyRosters[d][asst.id] = {
            slots: [...appliedSlots],
            checkInTime: isLeave ? "" : (checkinVal ? (checkinVal + " น.") : "08:00 น."),
            shiftType: isLeave ? "off" : shiftType,
            isExplicitlyEmpty: isLeave
          };

          if (supabaseClient) {
            try {
              await supabaseClient.from("slot_configs").upsert({
                id: "roster_" + d,
                config_key: d,
                scope: "roster",
                slots_json: assistantDutyRosters[d],
                updated_at: new Date().toISOString()
              }, { onConflict: "id" });
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

      // Ensure assistant master record is active in Supabase
      if (supabaseClient) {
        try {
          await supabaseClient.from("assistants").update({
            active: true
          }).eq("id", asst.id);
        } catch(err) {
          console.warn("Supabase assistant active update error:", err);
        }
      }

      // Close the modal immediately ("ปิดแทบให้เลย")
      closeAssistantDetailModal();

      // Refresh background manage shifts cards/list
      renderManageShifts(targetDates[0]);

      let dateText = "";
      if (currentModalDutyDateMode === "range") {
        const fromVal = document.getElementById("modal-asst-range-from")?.value;
        const toVal = document.getElementById("modal-asst-range-to")?.value;
        const fromDisp = (typeof formatThaiDisplayDate === "function") ? formatThaiDisplayDate(fromVal) : fromVal;
        const toDisp = (typeof formatThaiDisplayDate === "function") ? formatThaiDisplayDate(toVal) : toVal;
        dateText = `${fromDisp} - ${toDisp} (รวม ${targetDates.length} วัน)`;
      } else {
        const singleDate = targetDates[0];
        dateText = (typeof formatThaiDisplayDate === "function") ? formatThaiDisplayDate(singleDate) : singleDate;
      }

      let shiftLabel = "⭐ เข้าเวรทั้งวัน (08:00 - 19:00 น.)";
      if (shiftType === "official") shiftLabel = "☀️ เวรในเวลา (08:00 - 16:00 น.)";
      else if (shiftType === "ot") shiftLabel = "🌙 เวรนอกเวลา / OT (17:00 - 19:00 น.)";
      else if (shiftType === "custom") shiftLabel = `⚙️ กำหนดรอบเอง (${asst.slots.length} รอบเวลา)`;
      else if (shiftType === "off") shiftLabel = "⚪ ลาเวร / พัก (Off Duty)";

      // Show modern popup alert
      showSuccessAlertModal({
        title: "บันทึกตารางเวรสำเร็จ!",
        desc: "ระบบบันทึกตารางเวรและรอบเวลาปฏิบัติงานเรียบร้อยแล้ว",
        assistantName: `${asst.nickname ? '[' + asst.nickname + '] ' : ''}${asst.name}`,
        dateText: dateText,
        shiftText: shiftLabel
      });
    }

    async function handleAssistantProfileSubmitFromModal(e) {
      e.preventDefault();
      if (!currentDetailAssistantId) return;
      const asst = (assistants || []).find(a => a.id === currentDetailAssistantId);
      if (!asst) return;

      const fullname = (document.getElementById("modal-profile-fullname")?.value || "").trim();
      const nickname = (document.getElementById("modal-profile-nickname")?.value || "").trim();
      const gender = document.getElementById("modal-profile-gender")?.value || "female";
      const role = document.getElementById("modal-profile-role")?.value || "staff";
      const phone = (document.getElementById("modal-profile-phone")?.value || "").trim();
      const email = (document.getElementById("modal-profile-email")?.value || "").trim();

      asst.name = fullname;
      asst.nickname = nickname;
      asst.gender = gender;
      asst.role = role;
      asst.phone = phone;
      asst.email = email;

      persistAssistants();

      if (supabaseClient) {
        try {
          await supabaseClient.from("assistants").upsert({
            id: asst.id,
            name: asst.name,
            nickname: asst.nickname,
            gender: asst.gender,
            phone: asst.phone,
            email: asst.email,
            role: asst.role,
            active: asst.active
          });
        } catch(err) {
          console.warn("Supabase assistant profile update error:", err);
        }
      }

      closeAssistantDetailModal();
      renderManageShifts();

      showSuccessAlertModal({
        title: "บันทึกข้อมูลส่วนตัวสำเร็จ!",
        desc: "ปรับปรุงข้อมูลผู้ช่วยและสิทธิ์การใช้งานเรียบร้อยแล้ว",
        assistantName: `${nickname ? '[' + nickname + '] ' : ''}${fullname}`,
        dateText: "ข้อมูลผู้ช่วยแพทย์แผนไทย",
        shiftText: role === 'admin' ? '🛡️ Admin (ผู้ดูแลระบบ)' : (role === 'user' ? '👤 User (ผู้รับบริการ)' : '🩺 Staff (ผู้ช่วยฯ)')
      });
    }

    async function deleteAssistantFromDetailModal() {
      if (!currentDetailAssistantId) return;
      const asst = (assistants || []).find(a => a.id === currentDetailAssistantId);
      if (!asst) return;

      const confirmed = confirm(`ท่านต้องการลบรายชื่อผู้ช่วย "${asst.nickname} (${asst.name})" ออกจากระบบหรือไม่?\n(การลบจะไม่มีผลต่อประวัติคิวย้อนหลัง)`);
      if (!confirmed) return;

      closeAssistantDetailModal();
      await deleteAssistant(asst.id);
    }

    function renderManageShifts(dateStr) {
      const container = document.getElementById("assistants-shifts-list");
      if (!container) return;
      assistants = deduplicateAssistants(assistants);

      const targetRosterDate = dateStr || document.getElementById("manage-selected-date")?.value || (typeof currentRosterDate !== "undefined" && currentRosterDate) || (typeof getTodayDateString === "function" ? getTodayDateString() : "");
      const rosterForDate = (typeof assistantDutyRosters !== "undefined" && assistantDutyRosters[targetRosterDate]) ? assistantDutyRosters[targetRosterDate] : {};

      // Preserve window and container scroll positions
      const savedScrollY = window.scrollY || document.documentElement.scrollTop || 0;
      const manageTab = document.getElementById("view-manage");
      const savedTabScrollTop = manageTab ? manageTab.scrollTop : 0;

      // 1. Update Metrics Summary Badges (In-Hours vs OT vs Full Day vs Off)
      const totalCount = (assistants || []).length;
      const inHoursCount = (assistants || []).filter(a => {
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
      }).length;

      const statTotalEl = document.getElementById("asst-stat-total");
      if (statTotalEl) statTotalEl.innerHTML = `${totalCount} <span class="text-[11px] font-normal text-slate-400">คน</span>`;
      const statInHoursEl = document.getElementById("asst-stat-in-hours");
      if (statInHoursEl) statInHoursEl.innerHTML = `${inHoursCount} <span class="text-[11px] font-normal text-emerald-600">คน</span>`;
      const todayCasesCount = (Array.isArray(appointments) ? appointments : []).filter(a => {
        const d = a.bookDate || a.book_date;
        return d === targetRosterDate && (a.assistantId || a.assistant_id || a.assistantNick);
      }).length;
      const statOtEl = document.getElementById("asst-stat-ot");
      if (statOtEl) statOtEl.innerHTML = `${todayCasesCount} <span class="text-[11px] font-normal text-purple-500">เคส</span>`;
      const statFullDayEl = document.getElementById("asst-stat-fullday");
      if (statFullDayEl) statFullDayEl.innerHTML = `${fullDayCount} <span class="text-[11px] font-normal text-teal-500">คน</span>`;
      const statInactiveEl = document.getElementById("asst-stat-inactive");
      if (statInactiveEl) statInactiveEl.innerHTML = `${inactiveCount} <span class="text-[11px] font-normal text-slate-400">คน</span>`;

      updateAssistantViewSwitcherUI();

      if (!assistants || assistants.length === 0) {
        container.innerHTML = `
          <div class="py-12 px-4 text-center bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-3">
            <div class="w-14 h-14 mx-auto bg-herbal-50 dark:bg-emerald-950 text-herbal-600 dark:text-emerald-300 rounded-2xl flex items-center justify-center">
              <i data-lucide="users" class="w-7 h-7"></i>
            </div>
            <div class="text-sm font-bold text-slate-700 dark:text-slate-200">ยังไม่มีรายชื่อผู้ช่วยแพทย์แผนไทยในระบบ</div>
            <p class="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">ท่านสามารถเริ่มเพิ่มรายชื่อผู้ช่วยฯ เพื่อจัดตารางเวร (ในเวลา/นอกเวลา) และกำหนดสิทธิ์การใช้งานเข้าสู่ระบบได้</p>
            <button onclick="openAddAssistantModal()" class="px-4 py-2 bg-herbal-700 hover:bg-herbal-600 text-white rounded-xl text-xs font-bold transition shadow-sm inline-flex items-center space-x-1.5 cursor-pointer">
              <i data-lucide="user-plus" class="w-4 h-4"></i>
              <span>+ เพิ่มผู้ช่วยฯ คนแรก</span>
            </button>
          </div>
        `;
        lucide.createIcons();
        return;
      }

      // 2. Read Search Query & Filters
      const searchInput = document.getElementById("asst-search-input");
      const q = (searchInput ? searchInput.value : "").trim().toLowerCase();
      const clearBtn = document.getElementById("btn-asst-clear-search");
      if (clearBtn) clearBtn.classList.toggle("hidden", !q);

      const filterStatus = document.getElementById("asst-filter-status") ? document.getElementById("asst-filter-status").value : "all";
      const filterSlot = document.getElementById("asst-filter-slot") ? document.getElementById("asst-filter-slot").value : "all";
      const filterGender = document.getElementById("asst-filter-gender") ? document.getElementById("asst-filter-gender").value : "all";
      const filterRole = document.getElementById("asst-filter-role") ? document.getElementById("asst-filter-role").value : "all";

      // 3. Filter and Sort Assistants List

      const filtered = assistants.filter(asst => {
        if (q) {
          const matchName = (asst.name || "").toLowerCase().includes(q);
          const matchNick = (asst.nickname || "").toLowerCase().includes(q);
          const matchPhone = (asst.phone || "").includes(q);
          const matchEmail = (asst.email || "").toLowerCase().includes(q);
          const matchRole = (asst.role || "").toLowerCase().includes(q);
          if (!matchName && !matchNick && !matchPhone && !matchEmail && !matchRole) return false;
        }

        const dutyStatus = getAssistantDutyStatusForDate(asst, targetRosterDate);
        const isOff = dutyStatus.isOff;
        const shiftType = dutyStatus.type;

        // Filter by Shift Status
        if (filterStatus === "active" && isOff) return false;
        if (filterStatus === "inactive" && !isOff) return false;
        if (filterStatus === "official" && (isOff || shiftType !== "official")) return false;
        if (filterStatus === "ot" && (isOff || shiftType !== "ot")) return false;
        if (filterStatus === "full" && (isOff || shiftType !== "full")) return false;

        // Filter by Specific Slot
        if (filterSlot !== "all") {
          if (!isAssistantOnDutyForSlot(asst, filterSlot, targetRosterDate)) return false;
        }

        // Filter by Gender
        if (filterGender === "male" && asst.gender !== "male") return false;
        if (filterGender === "female" && asst.gender === "male") return false;

        // Filter by Role
        if (filterRole !== "all" && (asst.role || "staff") !== filterRole) return false;

        return true;
      });

      // Sort by check-in time on target date (คนที่เช็คชื่อเข้างานก่อนขึ้นก่อน), then active duty status, then gender / nickname
      filtered.sort((a, b) => {
        const aEntry = rosterForDate[a.id];
        const bEntry = rosterForDate[b.id];
        const aChecked = Boolean(aEntry);
        const bChecked = Boolean(bEntry);

        if (aChecked && bChecked) {
          const aNorm = normalizeAssistantRosterEntry(aEntry);
          const bNorm = normalizeAssistantRosterEntry(bEntry);
          const aTime = (aNorm.checkInTime || "99:99").trim().replace(" น.", "");
          const bTime = (bNorm.checkInTime || "99:99").trim().replace(" น.", "");
          if (aTime !== bTime) return aTime.localeCompare(bTime);
        } else if (aChecked && !bChecked) {
          return -1;
        } else if (!aChecked && bChecked) {
          return 1;
        }

        const aActive = a.active !== false && a.shiftType !== 'off';
        const bActive = b.active !== false && b.shiftType !== 'off';
        if (aActive && !bActive) return -1;
        if (!aActive && bActive) return 1;

        if (a.gender !== b.gender) {
          return a.gender === 'female' ? -1 : 1;
        }
        return (a.nickname || a.name).localeCompare(b.nickname || b.name, 'th');
      });

      if (filtered.length === 0) {
        container.innerHTML = `
          <div class="py-10 px-4 text-center bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-2">
            <div class="w-12 h-12 mx-auto bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-300 rounded-full flex items-center justify-center">
              <i data-lucide="search-x" class="w-6 h-6"></i>
            </div>
            <div class="text-sm font-bold text-slate-700 dark:text-slate-200">ไม่พบรายชื่อผู้ช่วยฯ ตามเงื่อนไขการค้นหา/ตัวกรอง</div>
            <p class="text-xs text-slate-400">ลองล้างคำค้นหาหรือเปลี่ยนตัวกรองใหม่อีกครั้ง</p>
            <button onclick="clearAssistantSearch()" class="mt-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold transition cursor-pointer">
              ล้างการค้นหา & ตัวกรอง
            </button>
          </div>
        `;
        lucide.createIcons();
        return;
      }

      // Helper function to build clean name-focused card HTML
      const buildCardHTML = (asst) => {
        const isMale = asst.gender === 'male';
        const dutyStatus = getAssistantDutyStatusForDate(asst, targetRosterDate);
        const isOff = dutyStatus.isOff;
        
        // Count total cases and today's cases for this assistant
        const asstApts = getAssistantAppointmentsList(asst.id);
        const totalCases = asstApts.length;
        const todayStr = targetRosterDate || (typeof getTodayDateString === "function" ? getTodayDateString() : "");
        const todayCases = asstApts.filter(a => (a.bookDate || a.book_date) === todayStr).length;

        const statusDot = isOff 
          ? '<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">⚪ ลาเวร / พัก</span>'
          : `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-bold ${dutyStatus.badgeClass}">🟢 ${dutyStatus.shortLabel}</span>`;

        return `
          <div onclick="openAssistantDetailModal('${asst.id}')" class="p-3.5 bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-herbal-500 dark:hover:border-emerald-500 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between gap-3 group">
            <div class="flex items-center space-x-3 min-w-0">
              ${getAssistantAvatarHTML(asst, 'w-11 h-11', 'text-xs')}
              <div class="min-w-0 flex-1">
                <div class="flex items-center space-x-1.5 flex-wrap">
                  <span class="font-bold text-sm text-slate-800 dark:text-white group-hover:text-herbal-700 dark:group-hover:text-emerald-400 transition truncate">${escapeHtml(asst.name)}</span>
                </div>
                <div class="flex items-center space-x-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  <span class="font-semibold text-herbal-800 dark:text-emerald-300">ชื่อเล่น: ${escapeHtml(asst.nickname)}</span>
                  <span>•</span>
                  <span>${isMale ? '👨 ชาย' : '👩 หญิง'}</span>
                </div>
              </div>
            </div>

            <div class="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
              <div>${statusDot}</div>
              <div class="flex items-center space-x-2">
                <span class="text-[11px] font-bold text-herbal-800 dark:text-emerald-300">💆‍♂️ ${totalCases} เคส</span>
                <span class="text-slate-400 group-hover:text-herbal-600 dark:group-hover:text-emerald-400 font-bold transition">➔</span>
              </div>
            </div>
          </div>
        `;
      };

      // Helper function to build clean name-focused list item HTML
      const buildListItemHTML = (asst, idx) => {
        const isMale = asst.gender === 'male';
        const dutyStatus = getAssistantDutyStatusForDate(asst, targetRosterDate);
        const isOff = dutyStatus.isOff;
        
        // Count total cases and today's cases for this assistant
        const asstApts = getAssistantAppointmentsList(asst.id);
        const totalCases = asstApts.length;
        const todayStr = targetRosterDate || (typeof getTodayDateString === "function" ? getTodayDateString() : "");
        const todayCases = asstApts.filter(a => (a.bookDate || a.book_date) === todayStr).length;

        const statusBadge = isOff 
          ? '<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">⚪ ลาเวร / พัก</span>'
          : `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-bold ${dutyStatus.badgeClass}">🟢 ${dutyStatus.shortLabel}</span>`;

        return `
          <div onclick="openAssistantDetailModal('${asst.id}')" class="p-3 bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200/90 dark:border-slate-700 hover:border-herbal-500 dark:hover:border-emerald-500 hover:shadow-md transition-all duration-150 flex items-center justify-between gap-3 cursor-pointer group">
            <div class="flex items-center space-x-3 min-w-0">
              <span class="text-xs font-mono text-slate-400 w-5 text-center hidden sm:inline-block">${idx + 1}</span>
              ${getAssistantAvatarHTML(asst, 'w-10 h-10', 'text-xs')}
              <div class="min-w-0">
                <div class="flex items-center space-x-2 flex-wrap">
                  <span class="font-bold text-sm text-slate-800 dark:text-white group-hover:text-herbal-700 dark:group-hover:text-emerald-400 transition truncate">${escapeHtml(asst.name)}</span>
                  <span class="text-xs font-semibold text-herbal-700 dark:text-emerald-300">(${escapeHtml(asst.nickname)})</span>
                  ${statusBadge}
                </div>
                <div class="flex items-center space-x-2 text-[11px] text-slate-400 mt-0.5">
                  <span>${isMale ? '👨 ชาย' : '👩 หญิง'}</span>
                  <span>•</span>
                  <span class="font-mono">${asst.phone ? escapeHtml(asst.phone) : 'ไม่มีเบอร์'}</span>
                  ${asst.role === 'admin' ? '<span class="text-purple-600 font-bold">• 🛡️ Admin</span>' : ''}
                </div>
              </div>
            </div>

            <div class="flex items-center space-x-3 shrink-0">
              <div class="hidden sm:flex flex-col items-end text-right">
                <span class="text-xs font-bold text-herbal-800 dark:text-emerald-300">💆‍♂️ ${totalCases} เคส</span>
                <span class="text-[10px] text-slate-400">วันนี้ ${todayCases} เคส</span>
              </div>
              <button type="button" class="px-3 py-1.5 rounded-xl bg-herbal-50 dark:bg-emerald-950/50 group-hover:bg-herbal-700 group-hover:text-white text-herbal-700 dark:text-emerald-300 text-xs font-bold transition flex items-center space-x-1 border border-herbal-200/80 dark:border-emerald-800 shadow-2xs cursor-pointer">
                <span>ดูประวัติ & จัดการ</span>
                <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
              </button>
            </div>
          </div>
        `;
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
          : `<span class="px-2 py-0.5 rounded-full text-[10.5px] font-bold ${shiftInfo.badgeClass}">🟢 ${shiftInfo.shortLabel}</span>`;

        return `
          <tr onclick="openAssistantDetailModal('${asst.id}')" class="hover:bg-herbal-50/60 dark:hover:bg-slate-800/80 transition text-slate-700 dark:text-slate-200 cursor-pointer group">
            <td class="px-3.5 py-3 text-center text-xs text-slate-400 font-mono">${idx + 1}</td>
            <td class="px-3.5 py-3">
              <div class="flex items-center space-x-2.5">
                ${getAssistantAvatarHTML(asst, 'w-8 h-8', 'text-[10.5px]')}
                <div>
                  <div class="font-bold text-xs sm:text-sm text-slate-800 dark:text-white group-hover:text-herbal-700 transition flex items-center gap-1.5">
                    <span>${escapeHtml(asst.name)}</span>
                    <span class="text-xs text-herbal-700">(${escapeHtml(asst.nickname)})</span>
                  </div>
                  <div class="text-[11px] text-slate-400">${isMale ? 'ชาย' : 'หญิง'} • ${asst.phone ? escapeHtml(asst.phone) : 'ไม่มีเบอร์'}</div>
                </div>
              </div>
            </td>
            <td class="px-3.5 py-3">${statusBadge}</td>
            <td class="px-3.5 py-3">
              <span class="font-bold text-herbal-800 text-xs">💆‍♂️ ${totalCases} เคส</span>
              <span class="text-[10.5px] text-slate-400 ml-1">(วันนี้ ${todayCases})</span>
            </td>
            <td class="px-3.5 py-3 text-right">
              <span class="text-xs font-bold text-herbal-700 group-hover:underline inline-flex items-center gap-1">
                ดูประวัติ & จัดการ <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
              </span>
            </td>
          </tr>
        `;
      };

      // 4. Render by Current View Mode
      container.innerHTML = "";
      if (currentAssistantViewMode === "grid") {
        // GRID VIEW
        const gridDiv = document.createElement("div");
        gridDiv.className = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5";
        gridDiv.innerHTML = filtered.map(asst => buildCardHTML(asst)).join("");
        container.appendChild(gridDiv);
      } else if (currentAssistantViewMode === "list") {
        // LIST VIEW
        const listDiv = document.createElement("div");
        listDiv.className = "space-y-2";
        listDiv.innerHTML = filtered.map((asst, idx) => buildListItemHTML(asst, idx)).join("");
        container.appendChild(listDiv);
      } else if (currentAssistantViewMode === "table") {
        // TABLE VIEW
        const tableDiv = document.createElement("div");
        tableDiv.className = "overflow-x-auto bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs";
        tableDiv.innerHTML = `
          <table class="w-full text-left text-xs sm:text-sm">
            <thead class="bg-slate-50/90 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 uppercase text-[11px]">
              <tr>
                <th class="px-3.5 py-3 text-center w-12">#</th>
                <th class="px-3.5 py-3">ผู้ช่วยแพทย์แผนไทย</th>
                <th class="px-3.5 py-3">สิทธิ์ระบบ</th>
                <th class="px-3.5 py-3">ช่องทางติดต่อ / Login</th>
                <th class="px-3.5 py-3">ช่วงเวลาปฏิบัติงาน / เวร</th>
                <th class="px-3.5 py-3 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
              ${filtered.map((asst, idx) => buildTableRowHTML(asst, idx)).join("")}
            </tbody>
          </table>
        `;
        container.appendChild(tableDiv);
      } else if (currentAssistantViewMode === "grouped") {
        // GROUPED VIEW (In-Hours vs OT vs Full Day vs Custom vs Off Duty)
        const inHoursList = filtered.filter(a => a.active !== false && a.shiftType === 'official');
        const otList = filtered.filter(a => a.active !== false && a.shiftType === 'ot');
        const fullDayList = filtered.filter(a => a.active !== false && (!a.shiftType || a.shiftType === 'full'));
        const customList = filtered.filter(a => a.active !== false && a.shiftType === 'custom');
        const offDutyList = filtered.filter(a => a.active === false || a.shiftType === 'off');

        const groupWrapper = document.createElement("div");
        groupWrapper.className = "space-y-4";

        groupWrapper.innerHTML = `
          <!-- Section 1: In-Hours (Official) -->
          <div class="bg-white dark:bg-slate-850 rounded-2xl border border-emerald-200 dark:border-emerald-800/80 p-4 shadow-2xs space-y-3">
            <div class="flex items-center justify-between border-b border-emerald-100 dark:border-emerald-800/60 pb-2.5 flex-wrap gap-2">
              <div class="flex items-center space-x-2">
                <span class="text-base">☀️</span>
                <h5 class="font-bold text-sm text-emerald-950 dark:text-emerald-300">เวรในเวลาราชการ (08:00 - 16:00 น.)</h5>
                <span class="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800">${inHoursList.length} คน</span>
              </div>
              <p class="text-xs text-emerald-700 dark:text-emerald-400">9 รอบเวลา (เปิดรับคิว 08:00 ถึง 16:00 น.)</p>
            </div>
            ${inHoursList.length > 0 ? `
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                ${inHoursList.map(asst => buildCardHTML(asst)).join("")}
              </div>
            ` : `
              <div class="py-5 text-center text-xs text-slate-400 bg-slate-50/50 dark:bg-slate-900/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                ไม่มีผู้ช่วยฯ ในกลุ่มเวรนี้
              </div>
            `}
          </div>

          <!-- Section 2: Out-of-Hours / OT -->
          <div class="bg-white dark:bg-slate-850 rounded-2xl border border-purple-200 dark:border-purple-800/80 p-4 shadow-2xs space-y-3">
            <div class="flex items-center justify-between border-b border-purple-100 dark:border-purple-800/60 pb-2.5 flex-wrap gap-2">
              <div class="flex items-center space-x-2">
                <span class="text-base">🌙</span>
                <h5 class="font-bold text-sm text-purple-950 dark:text-purple-300">เวรนอกเวลาราชการ / คลินิกพิเศษ OT (17:00 - 20:00 น.)</h5>
                <span class="px-2 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800">${otList.length} คน</span>
              </div>
              <p class="text-xs text-purple-700 dark:text-purple-400">3 รอบเวลา (เปิดรับคิว 17:00, 18:00, 19:00 น.)</p>
            </div>
            ${otList.length > 0 ? `
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                ${otList.map(asst => buildCardHTML(asst)).join("")}
              </div>
            ` : `
              <div class="py-5 text-center text-xs text-slate-400 bg-slate-50/50 dark:bg-slate-900/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                ไม่มีผู้ช่วยฯ ในกลุ่มเวรนอกเวลา
              </div>
            `}
          </div>

          <!-- Section 3: Full Day -->
          <div class="bg-white dark:bg-slate-850 rounded-2xl border border-teal-200 dark:border-teal-800/80 p-4 shadow-2xs space-y-3">
            <div class="flex items-center justify-between border-b border-teal-100 dark:border-teal-800/60 pb-2.5 flex-wrap gap-2">
              <div class="flex items-center space-x-2">
                <span class="text-base">⭐</span>
                <h5 class="font-bold text-sm text-teal-950 dark:text-teal-300">เวรตลอดทั้งวัน (08:00 - 19:00 น.)</h5>
                <span class="px-2 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-800 border border-teal-200 dark:bg-teal-950 dark:text-teal-300 dark:border-teal-800">${fullDayList.length} คน</span>
              </div>
              <p class="text-xs text-teal-700 dark:text-teal-400">ครบทั้ง 12 รอบเวลา</p>
            </div>
            ${fullDayList.length > 0 ? `
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                ${fullDayList.map(asst => buildCardHTML(asst)).join("")}
              </div>
            ` : `
              <div class="py-5 text-center text-xs text-slate-400 bg-slate-50/50 dark:bg-slate-900/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                ไม่มีผู้ช่วยฯ ที่เข้าเวรทั้งวัน
              </div>
            `}
          </div>

          <!-- Section 4: Custom Slots (if any) -->
          ${customList.length > 0 ? `
            <div class="bg-white dark:bg-slate-850 rounded-2xl border border-amber-200 dark:border-amber-800/80 p-4 shadow-2xs space-y-3">
              <div class="flex items-center justify-between border-b border-amber-100 dark:border-amber-800/60 pb-2.5 flex-wrap gap-2">
                <div class="flex items-center space-x-2">
                  <span class="text-base">⚙️</span>
                  <h5 class="font-bold text-sm text-amber-950 dark:text-amber-300">กำหนดรอบเวลาเฉพาะ (Custom Slots)</h5>
                  <span class="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800">${customList.length} คน</span>
                </div>
                <p class="text-xs text-amber-700 dark:text-amber-400">เลือกช่วงเวลาเฉพาะรายคน</p>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                ${customList.map(asst => buildCardHTML(asst)).join("")}
              </div>
            </div>
          ` : ''}

          <!-- Section 5: Off Duty -->
          <div class="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 shadow-2xs space-y-3">
            <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5 flex-wrap gap-2">
              <div class="flex items-center space-x-2">
                <span class="w-3 h-3 rounded-full bg-slate-400"></span>
                <h5 class="font-bold text-sm text-slate-800 dark:text-slate-200">⚪ ลาเวร / พัก (Off Duty)</h5>
                <span class="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-200 text-slate-700 border border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">${offDutyList.length} คน</span>
              </div>
              <p class="text-xs text-slate-500 dark:text-slate-400">ผู้ช่วยฯ ที่ลาเวร จะไม่ปรากฏในตัวเลือกให้คนไข้เลือกขณะจองคิว</p>
            </div>
            ${offDutyList.length > 0 ? `
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                ${offDutyList.map(asst => buildCardHTML(asst)).join("")}
              </div>
            ` : `
              <div class="py-5 text-center text-xs text-slate-400 bg-slate-50/50 dark:bg-slate-900/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                ไม่มีผู้ช่วยฯ ที่ลาเวร (ทุกคนเข้าเวร)
              </div>
            `}
          </div>
        `;
        container.appendChild(groupWrapper);
      }

      lucide.createIcons();

      // Restore scroll positions smoothly without bouncing
      if (typeof savedScrollY === 'number') {
        window.scrollTo({ top: savedScrollY, behavior: 'instant' });
      }
      if (manageTab && typeof savedTabScrollTop === 'number') {
        manageTab.scrollTop = savedTabScrollTop;
      }
    }

    async function deleteAssistant(asstId) {
      if (!currentUser || currentUser.role !== 'admin') {
        showToast("🔒 เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่สามารถลบรายชื่อผู้ช่วยได้", "error");
        return;
      }
      const asst = assistants.find(a => a.id === asstId);
      if (!asst) return;

      if (!confirm(`คุณต้องการลบรายชื่อผู้ช่วย "${asst.nickname} (${asst.name})" ออกจากระบบหรือไม่?`)) {
        return;
      }

      recordDeletedAssistantId(asstId);
      const idx = assistants.findIndex(a => a.id === asstId);
      if (idx !== -1) {
        assistants.splice(idx, 1);
      }
      persistAssistants();

      // Remove from usersList if linked
      const userIdx = usersList.findIndex(u => u.id === "usr-" + asstId);
      if (userIdx !== -1) {
        usersList.splice(userIdx, 1);
      }

      await logActivity("CHANGE_ASSISTANT", `ลบรายชื่อผู้ช่วยฯ ออกจากระบบ: ${asst.nickname} (${asst.name})`, {
        assistantId: asstId,
        name: asst.name,
        nickname: asst.nickname
      });

      renderManageShifts();
      populateAssistantsDropdown("new-assistant-select");
      showToast(`ลบรายชื่อผู้ช่วย ${asst.nickname} เรียบร้อยแล้ว`, "info");

      if (supabaseClient) {
        try {
          const { error } = await supabaseClient.from("assistants").delete().eq("id", asstId);
          if (error) console.error("Supabase delete assistant error:", error);
        } catch(err) {
          console.error("Supabase delete assistant exception:", err);
        }
      }
    }

    function openAddAssistantModal() {
      const modal = document.getElementById("modal-add-assistant");
      if (modal) {
        modal.classList.remove("hidden");
        lucide.createIcons();
      }
    }

    function closeAddAssistantModal() {
      const modal = document.getElementById("modal-add-assistant");
      if (modal) modal.classList.add("hidden");
    }

    async function handleAddAssistantSubmit(e) {
      e.preventDefault();
      lastAssistantLocalEditTime = Date.now();

      const fullname = (document.getElementById("new-asst-fullname")?.value || "").trim();
      const nickname = (document.getElementById("new-asst-nickname")?.value || "").trim();
      const gender = document.getElementById("new-asst-gender")?.value || "female";
      const role = document.getElementById("new-asst-role")?.value || "staff";
      const phone = (document.getElementById("new-asst-phone")?.value || "").trim();
      const email = (document.getElementById("new-asst-email")?.value || "").trim();
      const shiftType = document.getElementById("new-asst-shift-type")?.value || "full";

      if (!fullname || !nickname) return;

      // Duplicate check: prevent duplicate assistant creation
      const existing = (assistants || []).find(a => 
        (a.nickname && a.nickname.trim().toLowerCase() === nickname.toLowerCase()) ||
        (a.name && normalizeAssistantName(a.name) === normalizeAssistantName(fullname))
      );
      if (existing) {
        showToast(`มีรายชื่อผู้ช่วย "${nickname}" อยู่ในระบบแล้ว`, "warning");
        closeAddAssistantModal();
        return;
      }

      let slots = [...ALL_WORKING_SLOTS];
      let active = true;
      if (shiftType === 'official') slots = [...IN_HOURS_SLOTS];
      else if (shiftType === 'ot') slots = [...OUT_OF_HOURS_SLOTS];
      else if (shiftType === 'off') {
        active = false;
        slots = [];
      }

      const newObj = {
        id: "asst-" + Date.now(),
        name: fullname,
        nickname: nickname,
        gender: gender,
        role: role,
        phone: phone,
        email: email,
        active: active,
        shiftType: shiftType,
        slots: slots,
        created_at: new Date().toISOString()
      };
      assistants.push(newObj);
      assistants = deduplicateAssistants(assistants);
      persistAssistants();

      closeAddAssistantModal();
      e.target.reset();

      renderManageShifts();
      populateAssistantsDropdown("new-assistant-select");
      showToast(`เพิ่มผู้ช่วยฯ ${nickname} เรียบร้อยแล้ว`, "success");

      await logActivity("CHANGE_ASSISTANT", `เพิ่มรายชื่อผู้ช่วยฯ ใหม่: ${nickname} (${fullname}) [สิทธิ์: ${role.toUpperCase()}, เวร: ${shiftType}]`, {
        assistantId: newObj.id,
        name: fullname,
        nickname: nickname,
        gender: gender,
        role: role,
        phone: phone,
        email: email,
        shiftType: shiftType
      });

      if (supabaseClient) {
        try {
          const { error } = await supabaseClient.from("assistants").upsert({
            id: newObj.id,
            name: newObj.name,
            nickname: newObj.nickname,
            gender: newObj.gender,
            role: newObj.role,
            phone: newObj.phone,
            email: newObj.email,
            active: newObj.active
          });
          if (error) console.error("Supabase insert assistant error:", error);
        } catch(err) { console.error("Supabase insert assistant error:", err); }
      }
    }

    function openEditAssistantModal(asstId) {
      const asst = assistants.find(a => a.id === asstId);
      if (!asst) return;

      document.getElementById("edit-asst-id").value = asst.id;
      document.getElementById("edit-asst-fullname").value = asst.name || "";
      document.getElementById("edit-asst-nickname").value = asst.nickname || "";
      document.getElementById("edit-asst-gender").value = asst.gender || "female";
      document.getElementById("edit-asst-phone").value = asst.phone || "";
      document.getElementById("edit-asst-email").value = asst.email || "";
      document.getElementById("edit-asst-role").value = asst.role || "staff";
      
      const shiftTypeSelect = document.getElementById("edit-asst-shift-type");
      if (shiftTypeSelect) {
        shiftTypeSelect.value = (asst.active === false || asst.shiftType === 'off') ? 'off' : (asst.shiftType || 'full');
      }

      const activeSelect = document.getElementById("edit-asst-active");
      if (activeSelect) {
        activeSelect.value = (asst.active !== false && asst.shiftType !== 'off') ? "true" : "false";
      }

      document.getElementById("modal-edit-assistant").classList.remove("hidden");
      lucide.createIcons();
    }

    function closeEditAssistantModal() {
      document.getElementById("modal-edit-assistant").classList.add("hidden");
    }

    async function handleEditAssistantSubmit(e) {
      e.preventDefault();
      const asstId = document.getElementById("edit-asst-id")?.value;
      const asst = assistants.find(a => a.id === asstId);
      if (!asst) return;

      const oldData = { ...asst };
      const fullname = (document.getElementById("edit-asst-fullname")?.value || "").trim();
      const nickname = (document.getElementById("edit-asst-nickname")?.value || "").trim();
      const gender = document.getElementById("edit-asst-gender")?.value || "female";
      const phone = (document.getElementById("edit-asst-phone")?.value || "").trim();
      const email = (document.getElementById("edit-asst-email")?.value || "").trim();
      const role = document.getElementById("edit-asst-role")?.value || "staff";
      const shiftType = document.getElementById("edit-asst-shift-type")?.value || "full";
      const active = document.getElementById("edit-asst-active")?.value === "true" && shiftType !== "off";

      asst.name = fullname;
      asst.nickname = nickname;
      asst.gender = gender;
      asst.phone = phone;
      asst.email = email;
      asst.role = role;
      asst.shiftType = shiftType;
      asst.active = active;

      if (shiftType === 'official') asst.slots = [...IN_HOURS_SLOTS];
      else if (shiftType === 'ot') asst.slots = [...OUT_OF_HOURS_SLOTS];
      else if (shiftType === 'full') asst.slots = [...ALL_WORKING_SLOTS];
      else if (shiftType === 'off') {
        asst.active = false;
        asst.slots = [];
      }

      persistAssistants();

      await logActivity("CONFIG_SYSTEM", `แก้ไขข้อมูลผู้ช่วยฯ: ${nickname} (${fullname}) [สิทธิ์: ${role.toUpperCase()}, เวร: ${shiftType}]`, {
        assistantId: asstId,
        changes: {
          from: oldData,
          to: asst
        }
      });

      if (supabaseClient) {
        try {
          const { error } = await supabaseClient.from("assistants").upsert({
            id: asst.id,
            name: asst.name,
            nickname: asst.nickname,
            gender: asst.gender,
            phone: asst.phone,
            email: asst.email,
            role: asst.role,
            active: asst.active
          });
          if (error) console.warn("Supabase assistant update error:", error);
        } catch(err) {
          console.warn("Supabase assistant update error:", err);
        }
      }

      closeEditAssistantModal();
      renderManageShifts();
      populateAssistantsDropdown("new-assistant-select");
      showToast(`บันทึกการแก้ไขข้อมูลผู้ช่วย "${nickname}" เรียบร้อยแล้ว`, "success");
    }

    function persistExtraServices() {
      try { localStorage.setItem("ttm_extra_services", JSON.stringify(extraServicesList)); } catch(e) {}
    }

    function onSharePercentChange(source) {
      const asstInput = document.getElementById("new-svc-asst-percent");
      const hospInput = document.getElementById("new-svc-hosp-percent");
      if (!asstInput || !hospInput) return;

      if (source === 'asst') {
        if (asstInput.value === "") {
          updateServiceSharePreview();
          return;
        }
        let asstVal = Math.max(0, Math.min(100, parseInt(asstInput.value) || 0));
        asstInput.value = asstVal;
        hospInput.value = 100 - asstVal;
      } else {
        if (hospInput.value === "") {
          updateServiceSharePreview();
          return;
        }
        let hospVal = Math.max(0, Math.min(100, parseInt(hospInput.value) || 0));
        hospInput.value = hospVal;
        asstInput.value = 100 - hospVal;
      }
      updateServiceSharePreview();
    }

    function updateServiceSharePreview() {
      const priceInput = document.getElementById("new-svc-price");
      const asstInput = document.getElementById("new-svc-asst-percent");
      const hospInput = document.getElementById("new-svc-hosp-percent");
      const preview = document.getElementById("new-svc-share-calc-preview");
      if (!preview) return;

      const price = Math.max(0, parseInt(priceInput?.value) || 0);
      const asstPct = parsePercentage(asstInput?.value, 60);
      const hospPct = 100 - asstPct;

      const asstShare = Math.round(price * (asstPct / 100));
      const hospShare = Math.max(0, price - asstShare);

      preview.innerHTML = `
        <span>คำนวณส่วนแบ่งสุทธิ:</span>
        <span class="font-semibold text-slate-800 dark:text-slate-100"><span class="text-emerald-700 dark:text-emerald-400 font-bold">ผู้ช่วยฯ: ${asstShare.toLocaleString()} บ. (${asstPct}%)</span> | <span class="text-blue-700 dark:text-blue-400 font-bold">รพ.: ${hospShare.toLocaleString()} บ. (${hospPct}%)</span></span>
      `;
    }

    function onEditSharePercentChange(source) {
      const asstInput = document.getElementById("edit-svc-asst-percent");
      const hospInput = document.getElementById("edit-svc-hosp-percent");
      if (!asstInput || !hospInput) return;

      if (source === 'asst') {
        if (asstInput.value === "") {
          updateEditServiceSharePreview();
          return;
        }
        let asstVal = Math.max(0, Math.min(100, parseInt(asstInput.value) || 0));
        asstInput.value = asstVal;
        hospInput.value = 100 - asstVal;
      } else {
        if (hospInput.value === "") {
          updateEditServiceSharePreview();
          return;
        }
        let hospVal = Math.max(0, Math.min(100, parseInt(hospInput.value) || 0));
        hospInput.value = hospVal;
        asstInput.value = 100 - hospVal;
      }
      updateEditServiceSharePreview();
    }

    function updateEditServiceSharePreview() {
      const priceInput = document.getElementById("edit-svc-price");
      const asstInput = document.getElementById("edit-svc-asst-percent");
      const hospInput = document.getElementById("edit-svc-hosp-percent");
      const preview = document.getElementById("edit-svc-share-calc-preview");
      if (!preview) return;

      const price = Math.max(0, parseInt(priceInput?.value) || 0);
      const asstPct = parsePercentage(asstInput?.value, 60);
      const hospPct = 100 - asstPct;

      const asstShare = Math.round(price * (asstPct / 100));
      const hospShare = Math.max(0, price - asstShare);

      preview.innerHTML = `
        <span>คำนวณส่วนแบ่งสุทธิ:</span>
        <span class="font-semibold text-slate-800 dark:text-slate-100"><span class="text-emerald-700 dark:text-emerald-400 font-bold">ผู้ช่วยฯ: ${asstShare.toLocaleString()} บ. (${asstPct}%)</span> | <span class="text-blue-700 dark:text-blue-400 font-bold">รพ.: ${hospShare.toLocaleString()} บ. (${hospPct}%)</span></span>
      `;
    }

    /* =========================================================================
       ASSISTANT DAILY CHECK-IN & ROSTER MATRIX (ตารางเช็คชื่อและจัดคิวนวดผู้ช่วยแพทย์แผนไทย)
       ========================================================================= */

    function getCurrentTimeString() {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      return `${hh}:${mm}`;
    }

    function normalizeAssistantRosterEntry(entry, defaultSlots = []) {
      if (!entry) {
        return { checkInTime: "", slots: [], shiftType: "off", isExplicitlyEmpty: true };
      }
      if (Array.isArray(entry)) {
        const isOff = entry.length === 0;
        return { 
          checkInTime: isOff ? "" : "08:00 น.", 
          slots: isOff ? [] : entry, 
          shiftType: isOff ? "off" : "full", 
          isExplicitlyEmpty: isOff 
        };
      }
      const isLeave = Boolean(entry.shiftType === "off" || entry.isExplicitlyEmpty === true || (Array.isArray(entry.slots) && entry.slots.length === 0 && entry.isExplicitlyEmpty !== false));
      return {
        checkInTime: entry.checkInTime || (isLeave ? "" : "08:00 น."),
        slots: isLeave ? [] : (Array.isArray(entry.slots) ? entry.slots : (Array.isArray(defaultSlots) ? defaultSlots : [])),
        shiftType: isLeave ? "off" : (entry.shiftType || "full"),
        isExplicitlyEmpty: isLeave
      };
    }

    function getEffectiveSlotsForRoster(dateStr) {
      if (!dateStr) return WEEKDAY_SLOTS;
      const slots = getSlotsForDate(dateStr);
      if (slots && slots.length > 0) return slots;
      return WEEKDAY_SLOTS; // Standard fallback for matrix
    }

    function openAssistantRosterModal(targetDate) {
      const modal = document.getElementById("modal-assistant-roster-matrix");
      if (!modal) return;

      const deskStartDate = document.getElementById("desk-filter-date-start")?.value;
      currentRosterDate = targetDate || deskStartDate || getTodayDateString();

      const dateInput = document.getElementById("roster-selected-date");
      if (dateInput) dateInput.value = currentRosterDate;

      // Ensure roster container object exists for this date (starts empty if new day)
      if (!assistantDutyRosters[currentRosterDate]) {
        assistantDutyRosters[currentRosterDate] = {};
      }

      renderAssistantRosterMatrix();
      modal.classList.remove("hidden");
      if (window.lucide) lucide.createIcons();
    }

    function closeAssistantRosterModal() {
      const modal = document.getElementById("modal-assistant-roster-matrix");
      if (modal) modal.classList.add("hidden");
    }

    function changeRosterDate(newDate) {
      if (!newDate) return;
      currentRosterDate = newDate;
      const dateInput = document.getElementById("roster-selected-date");
      if (dateInput) dateInput.value = currentRosterDate;

      if (!assistantDutyRosters[currentRosterDate]) {
        assistantDutyRosters[currentRosterDate] = {};
      }

      renderAssistantRosterMatrix();
    }

    function stepRosterDate(offsetDays) {
      try {
        const d = new Date(currentRosterDate + "T00:00:00");
        d.setDate(d.getDate() + offsetDays);
        const yr = d.getFullYear();
        const mo = String(d.getMonth() + 1).padStart(2, '0');
        const da = String(d.getDate()).padStart(2, '0');
        changeRosterDate(`${yr}-${mo}-${da}`);
      } catch(e) {
        console.error("stepRosterDate error:", e);
      }
    }

    function setRosterToToday() {
      changeRosterDate(getTodayDateString());
    }

    
    // ==================== ASSISTANT QUEUE ROTATION & RANKING SYSTEM ====================
    function computeDailyAssistantQueues(dateStr) {
      if (!dateStr) dateStr = (typeof currentRosterDate !== "undefined" && currentRosterDate) ? currentRosterDate : getTodayDateString();
      const rosterObj = (typeof assistantDutyRosters !== "undefined" && assistantDutyRosters[dateStr]) ? assistantDutyRosters[dateStr] : {};
      const asstIds = Object.keys(rosterObj);

      if (asstIds.length === 0) {
        return {
          afternoonQueue: [],
          otQueue: [],
          statsMap: {}
        };
      }

      const morningSlots = ["08:00", "09:00", "10:00", "11:00", "12:00"];
      const afternoonEvalSlots = ["13:00", "14:00", "15:00"];
      const otSlots = ["17:00", "18:00", "19:00"];

      // Filter valid non-cancelled appointments on dateStr
      const dateApts = (appointments || []).filter(apt => {
        if (apt.bookDate !== dateStr || apt.status === "🔴 ส่งต่อ" || apt.status === "ยกเลิก") return false;
        return true;
      });

      const statsList = asstIds.map(asstId => {
        const asst = (assistants || []).find(a => a.id === asstId) || {
          id: asstId,
          name: asstId,
          nickname: asstId,
          gender: "female",
          phone: ""
        };
        const entry = normalizeAssistantRosterEntry(rosterObj[asstId]);
        const checkedSlots = entry.slots || [];
        const checkInTime = (entry.checkInTime || "08:00").trim().replace(" น.", "");
        const isBeforeCutoff = checkInTime <= "08:32";

        // Morning appointments for this assistant (08:00 - 12:00)
        const morningApts = dateApts.filter(apt => {
          const isThisAsst = (apt.assistantId === asstId || (apt.assistantNick && apt.assistantNick === asst.nickname));
          if (!isThisAsst) return false;
          const aptSlots = apt.slotsOccupied || [apt.timeSlot];
          return aptSlots.some(s => morningSlots.includes(s));
        });
        const morningCaseCount = morningApts.length;

        // Afternoon appointments for this assistant (13:00 - 15:00)
        const afternoonApts = dateApts.filter(apt => {
          const isThisAsst = (apt.assistantId === asstId || (apt.assistantNick && apt.assistantNick === asst.nickname));
          if (!isThisAsst) return false;
          const aptSlots = apt.slotsOccupied || [apt.timeSlot];
          return aptSlots.some(s => afternoonEvalSlots.includes(s));
        });
        const afternoonCaseCount = afternoonApts.length;

        // Total appointments today
        const totalApts = dateApts.filter(apt => {
          return (apt.assistantId === asstId || (apt.assistantNick && apt.assistantNick === asst.nickname));
        });
        const totalCaseCount = totalApts.length;

        const isMorningDuty = checkedSlots.some(s => morningSlots.includes(s));
        const isAfternoonDuty = checkedSlots.some(s => ["13:00", "14:00", "15:00", "16:00"].includes(s));
        const isOtDuty = checkedSlots.some(s => otSlots.includes(s));

        return {
          asstId,
          asst,
          checkInTime,
          isBeforeCutoff,
          morningCaseCount,
          afternoonCaseCount,
          totalCaseCount,
          checkedSlots,
          isMorningDuty,
          isAfternoonDuty,
          isOtDuty
        };
      });

      const statsMap = {};
      statsList.forEach(s => { statsMap[s.asstId] = s; });

      // 1. Afternoon Queue:
      // Group A: Check-in <= 08:32 (มาก่อน 08:32 น.) -> sort by morningCaseCount ASC (น้อยไปมาก), checkInTime ASC
      const groupOnTime = statsList
        .filter(s => s.isBeforeCutoff)
        .sort((a, b) => {
          if (a.morningCaseCount !== b.morningCaseCount) return a.morningCaseCount - b.morningCaseCount;
          if (a.checkInTime !== b.checkInTime) return a.checkInTime.localeCompare(b.checkInTime);
          return (a.asst.nickname || a.asst.name).localeCompare(b.asst.nickname || b.asst.name);
        });

      // Group B: Check-in > 08:32 (มาหลัง 08:32 น. ต่อคิวท้าย) -> sort by morningCaseCount ASC, checkInTime ASC
      const groupLate = statsList
        .filter(s => !s.isBeforeCutoff)
        .sort((a, b) => {
          if (a.morningCaseCount !== b.morningCaseCount) return a.morningCaseCount - b.morningCaseCount;
          if (a.checkInTime !== b.checkInTime) return a.checkInTime.localeCompare(b.checkInTime);
          return (a.asst.nickname || a.asst.name).localeCompare(b.asst.nickname || b.asst.name);
        });

      const afternoonQueue = [...groupOnTime, ...groupLate].map((item, idx) => ({
        ...item,
        afternoonRank: idx + 1,
        isLateGroup: !item.isBeforeCutoff
      }));

      // Update statsMap with afternoonRank
      afternoonQueue.forEach(item => {
        if (statsMap[item.asstId]) {
          statsMap[item.asstId].afternoonRank = item.afternoonRank;
          statsMap[item.asstId].isLateGroup = item.isLateGroup;
        }
      });

      // 2. OT Queue:
      // ONLY assistants with OT duty (17:00, 18:00, or 19:00) -> sort by afternoonCaseCount (13-15) ASC, totalCaseCount ASC, checkInTime ASC
      const otEligible = statsList.filter(s => s.isOtDuty);
      const otQueue = otEligible
        .sort((a, b) => {
          if (a.afternoonCaseCount !== b.afternoonCaseCount) return a.afternoonCaseCount - b.afternoonCaseCount;
          if (a.totalCaseCount !== b.totalCaseCount) return a.totalCaseCount - b.totalCaseCount;
          if (a.checkInTime !== b.checkInTime) return a.checkInTime.localeCompare(b.checkInTime);
          return (a.asst.nickname || a.asst.name).localeCompare(b.asst.nickname || b.asst.name);
        })
        .map((item, idx) => ({
          ...item,
          otRank: idx + 1
        }));

      // Update statsMap with otRank
      otQueue.forEach(item => {
        if (statsMap[item.asstId]) {
          statsMap[item.asstId].otRank = item.otRank;
        }
      });

      return {
        afternoonQueue,
        otQueue,
        statsMap
      };
    }

    function toggleRosterQueuePanel() {
      const grid = document.getElementById("roster-queue-grid");
      const txt = document.getElementById("txt-toggle-roster-queue");
      if (!grid) return;
      const isHidden = grid.classList.contains("hidden");
      if (isHidden) {
        grid.classList.remove("hidden");
        if (txt) txt.textContent = "🙈 ซ่อนสรุป";
      } else {
        grid.classList.add("hidden");
        if (txt) txt.textContent = "👁️ แสดงสรุป";
      }
    }

    function renderAssistantRosterMatrix() {
      const table = document.getElementById("table-assistant-roster");
      const dateLabel = document.getElementById("roster-thai-date-label");
      const badgeInfo = document.getElementById("roster-badge-date-info");
      const selectEl = document.getElementById("roster-assistant-select");
      const statsPill = document.getElementById("roster-stats-pill");

      if (!table) return;

      // Preserve scroll positions of modal body and table wrapper
      const tableScrollContainer = table.closest('.overflow-x-auto') || table.parentElement;
      const modalBody = document.getElementById("roster-modal-body") || table.closest('.overflow-y-auto');
      const savedTableScrollTop = tableScrollContainer ? tableScrollContainer.scrollTop : 0;
      const savedTableScrollLeft = tableScrollContainer ? tableScrollContainer.scrollLeft : 0;
      const savedModalScrollTop = modalBody ? modalBody.scrollTop : 0;

      // Preserve focused element if user is editing
      let focusedRowId = null;
      let focusedInputType = null;
      const activeEl = document.activeElement;
      if (activeEl && table.contains(activeEl)) {
        const tr = activeEl.closest('tr');
        if (tr && tr.id) {
          focusedRowId = tr.id;
          focusedInputType = activeEl.type || activeEl.tagName;
        }
      }

      const effectiveSlots = getEffectiveSlotsForRoster(currentRosterDate);
      const isToday = currentRosterDate === getTodayDateString();

      if (dateLabel) {
        dateLabel.textContent = formatThaiDateShort(currentRosterDate) + (isToday ? " (วันนี้)" : "");
      }
      if (badgeInfo) {
        badgeInfo.textContent = isToday ? "🟢 ประจำวันนี้" : `📅 ${currentRosterDate}`;
      }

      const rosterObj = assistantDutyRosters[currentRosterDate] || {};
      const rosterAsstIds = Object.keys(rosterObj).sort((aId, bId) => {
        const aEntry = normalizeAssistantRosterEntry(rosterObj[aId]);
        const bEntry = normalizeAssistantRosterEntry(rosterObj[bId]);
        const aTime = (aEntry.checkInTime || "99:99").trim().replace(" น.", "");
        const bTime = (bEntry.checkInTime || "99:99").trim().replace(" น.", "");
        if (aTime !== bTime) return aTime.localeCompare(bTime);
        const aAsst = (assistants || []).find(a => a.id === aId);
        const bAsst = (assistants || []).find(b => b.id === bId);
        return (aAsst?.nickname || aAsst?.name || "").localeCompare(bAsst?.nickname || bAsst?.name || "", "th");
      });

      // 1. Populate Dropdown with Remaining Active Assistants
      if (selectEl) {
        const remainingAssts = (assistants || []).filter(a => a.active && !rosterAsstIds.includes(a.id));
        if (remainingAssts.length === 0) {
          selectEl.innerHTML = `<option value="">(เช็คชื่อครบทุกคนแล้ว)</option>`;
          selectEl.disabled = true;
        } else {
          selectEl.disabled = false;
          selectEl.innerHTML = remainingAssts.map(a => `
            <option value="${a.id}">${a.gender === 'male' ? '👨' : '👩'} ${a.nickname} - ${a.name}</option>
          `).join("");
        }
      }

      // 2. Build Table Content
      const slotCounts = {};
      effectiveSlots.forEach(s => { slotCounts[s] = 0; });
      let totalDailyRounds = 0;

      // If no assistants checked in yet for this date (Daily Reset / Fresh State)
      if (rosterAsstIds.length === 0) {
        table.innerHTML = `
          <thead>
            <tr class="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
              <th class="py-3 px-3 w-12 text-center">#</th>
              <th class="py-3 px-4 min-w-[190px]">ผู้ช่วยแพทย์แผนไทย</th>
              <th class="py-3 px-3 min-w-[140px] w-36 text-center border-l border-slate-200 dark:border-slate-700 text-xs font-black text-emerald-800 dark:text-emerald-300">
                <div class="flex items-center justify-center gap-1.5">
                  <i data-lucide="clock" class="w-4 h-4 text-emerald-600 dark:text-emerald-400"></i>
                  <span>เวลาที่มา</span>
                </div>
              </th>
              ${effectiveSlots.map(s => `<th class="py-3 px-2 text-center min-w-[64px] font-bold text-slate-800 dark:text-slate-200">${s}</th>`).join("")}
              <th class="py-3 px-3 w-24 text-center">รวมรอบ</th>
              <th class="py-3 px-3 w-20 text-center">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colspan="${effectiveSlots.length + 4}" class="py-12 px-4 text-center bg-white dark:bg-slate-900">
                <div class="max-w-md mx-auto space-y-3">
                  <div class="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center shadow-inner border border-emerald-200/60 dark:border-emerald-800/60">
                    <i data-lucide="user-check" class="w-7 h-7"></i>
                  </div>
                  <div class="font-bold text-sm text-slate-800 dark:text-slate-100">ยังไม่มีการเช็คชื่อผู้ช่วยฯ ประจำวันที่เลือก</div>
                  <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">เลือกรายชื่อผู้ช่วยแพทย์แผนไทยจากเมนูด้านบน แล้วกดปุ่ม <strong>"➕ เช็คชื่อเข้างาน (เพิ่มแถว)"</strong> เพื่อลงเวลามาถึงและเริ่มจัดรอบนวด</p>
                  <div class="pt-2 flex flex-wrap justify-center gap-2">
                    <button type="button" onclick="addSelectedAssistantToRoster()" class="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition shadow-sm inline-flex items-center space-x-1.5 cursor-pointer">
                      <i data-lucide="user-check" class="w-4 h-4"></i>
                      <span>➕ เช็คชื่อเข้างานคนแรก</span>
                    </button>
                    <button type="button" onclick="addAllActiveAssistantsToRoster()" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition border border-slate-200 dark:border-slate-700 inline-flex items-center space-x-1.5 cursor-pointer">
                      <i data-lucide="users" class="w-4 h-4"></i>
                      <span>เช็คชื่อทุกคนพร้อมกัน</span>
                    </button>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        `;
        if (statsPill) {
          statsPill.innerHTML = `ผู้ช่วยมาปฏิบัติงาน: <span class="text-slate-400 font-black">0</span> ท่าน • รวม <span class="text-slate-400 font-black">0</span> รอบ`;
        }
        if (window.lucide) lucide.createIcons();
        return;
      }

      // Compute Queues and Case Counts
      const dailyQueues = computeDailyAssistantQueues(currentRosterDate);
      const { afternoonQueue, otQueue, statsMap } = dailyQueues;

      // Build THEAD
      let theadHtml = `
        <thead>
          <tr class="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-700 sticky top-0 z-20 shadow-2xs text-[11px] sm:text-xs">
            <th class="py-2.5 px-1 w-7 min-w-[28px] text-center text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400">#</th>
            <th class="py-2.5 px-2 min-w-[130px] sm:min-w-[145px] text-left font-black text-slate-800 dark:text-slate-100">ผู้ช่วยแพทย์แผนไทย</th>
            <th class="py-2.5 px-1.5 min-w-[96px] sm:min-w-[110px] w-28 text-center border-l border-slate-200 dark:border-slate-700 font-black text-emerald-800 dark:text-emerald-300">
              <div class="flex items-center justify-center gap-1">
                <i data-lucide="clock" class="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400"></i>
                <span>เวลาที่มา</span>
              </div>
            </th>
      `;

      effectiveSlots.forEach(s => {
        theadHtml += `
          <th class="py-1.5 px-0.5 text-center min-w-[38px] sm:min-w-[44px] border-l border-slate-200 dark:border-slate-700/80">
            <button type="button" onclick="toggleSlotColumnForAll('${s}')" class="w-full py-0.5 rounded hover:bg-emerald-100/70 dark:hover:bg-emerald-950/60 transition group cursor-pointer" title="คลิกเพื่อสลับติ๊กทั้งรอบเวลา ${s}">
              <span class="block text-[11px] sm:text-xs font-black text-slate-800 dark:text-slate-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400">${s}</span>
              <span class="block text-[8.5px] text-slate-400 group-hover:text-emerald-600 font-semibold">รอบ</span>
            </button>
          </th>
        `;
      });

      theadHtml += `
            <th class="py-2.5 px-1 w-14 sm:w-16 min-w-[50px] text-center border-l border-slate-200 dark:border-slate-700 text-[10.5px] sm:text-xs font-bold text-amber-800 dark:text-amber-300" title="ยอดเคสจริงที่ทำในรอบเช้า 08:00 - 12:00 น.">ยอดเช้า</th>
            <th class="py-2.5 px-1 w-14 sm:w-16 min-w-[50px] text-center border-l border-slate-200 dark:border-slate-700 text-[10.5px] sm:text-xs font-bold text-purple-800 dark:text-purple-300" title="ยอดเคสจริงที่ทำในรอบ 13:00 - 15:00 น.">ยอดบ่าย</th>
            <th class="py-2.5 px-1 w-14 sm:w-16 min-w-[50px] text-center border-l border-slate-200 dark:border-slate-700 text-[10.5px] sm:text-xs font-black text-emerald-800 dark:text-emerald-300">รวมรอบ</th>
            <th class="py-2.5 px-1 w-14 sm:w-16 min-w-[50px] text-center border-l border-slate-200 dark:border-slate-700 text-[10.5px] sm:text-xs font-black text-amber-700 dark:text-amber-300" title="ลำดับคิวรอบบ่าย (มาก่อน 08:32 น. ได้สิทธิ์ก่อน เรียงยอดเช้าน้อยไปมาก)">คิวบ่าย</th>
            <th class="py-2.5 px-1 w-14 sm:w-16 min-w-[50px] text-center border-l border-slate-200 dark:border-slate-700 text-[10.5px] sm:text-xs font-black text-purple-700 dark:text-purple-300" title="ลำดับคิวนอกเวลา (เรียงยอดบ่าย 13-15 น้อยไปมาก เฉพาะคนอยู่เวร OT)">คิว OT</th>
            <th class="py-2.5 px-1 w-14 sm:w-16 min-w-[50px] text-center border-l border-slate-200 dark:border-slate-700 text-[10.5px] sm:text-xs font-bold text-slate-600 dark:text-slate-400">จัดการ</th>
          </tr>
        </thead>
      `;

      // Build TBODY
      let tbodyHtml = `<tbody class="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900 text-xs">`;

      rosterAsstIds.forEach((asstId, idx) => {
        const asst = (assistants || []).find(a => a.id === asstId) || {
          id: asstId,
          name: asstId,
          nickname: asstId,
          gender: "female",
          phone: ""
        };

        const entry = normalizeAssistantRosterEntry(rosterObj[asstId], effectiveSlots);
        const shiftSlots = getAssistantWorkSlots(asst);
        let checkedSlots = entry.slots;
        // If slots is empty and hasn't been explicitly cleared to empty/leave by user, initialize from shift schedule
        if (!Array.isArray(checkedSlots) || (checkedSlots.length === 0 && entry.isExplicitlyEmpty !== true && entry.shiftType !== 'off')) {
          checkedSlots = [...shiftSlots];
          entry.slots = checkedSlots;
          rosterObj[asstId] = entry;
        }
        const roundCount = checkedSlots.length;
        totalDailyRounds += roundCount;

        const stat = statsMap[asstId] || {
          morningCaseCount: 0,
          afternoonCaseCount: 0,
          afternoonRank: "-",
          otRank: "-",
          isBeforeCutoff: true,
          isOtDuty: false
        };

        const isMale = asst.gender === "male";
        const genderBadge = isMale 
          ? `<span class="px-1 py-0.2 rounded text-[9.5px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60">👨 ชาย</span>`
          : `<span class="px-1 py-0.2 rounded text-[9.5px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/60">👩 หญิง</span>`;

        const checkInBadge = stat.isBeforeCutoff
          ? `<span class="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[9.5px] font-extrabold bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300/90 shadow-2xs">🟢 &lt;08:32</span>`
          : `<span class="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[9.5px] font-extrabold bg-amber-100 text-amber-950 dark:bg-amber-950 dark:text-amber-200 border border-amber-300/90 shadow-2xs">🟡 &gt;08:32</span>`;

        const afternoonMedal = stat.afternoonRank === 1 ? '🥇 #1' : stat.afternoonRank === 2 ? '🥈 #2' : stat.afternoonRank === 3 ? '🥉 #3' : `#${stat.afternoonRank}`;
        const afternoonRankBadge = `<span class="inline-block px-1.5 py-0.5 rounded-lg text-xs font-extrabold ${stat.afternoonRank <= 3 ? 'bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950/80 dark:text-amber-200' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200'}">${afternoonMedal}</span>`;

        const otRankBadge = stat.isOtDuty
          ? `<span class="inline-block px-1.5 py-0.5 rounded-lg text-xs font-black bg-purple-100 text-purple-900 dark:bg-purple-950/80 dark:text-purple-200 border border-purple-300 dark:border-purple-800">🌙 #${stat.otRank || '-'}</span>`
          : `<span class="text-slate-300 dark:text-slate-600 font-bold">-</span>`;

        tbodyHtml += `
          <tr id="roster-row-${asstId}" class="hover:bg-slate-50/80 dark:hover:bg-slate-850/80 transition group">
            <td class="py-2 px-1 text-center text-xs font-bold text-slate-400">${idx + 1}</td>
            <td class="py-2 px-2">
              <div class="flex items-center space-x-1.5 min-w-0">
                <div class="w-6 h-6 rounded-full ${isMale ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'} flex items-center justify-center font-bold text-[11px] shrink-0 shadow-2xs">
                  ${asst.nickname ? asst.nickname.substring(0, 1) : 'ผ'}
                </div>
                <div class="min-w-0">
                  <div class="flex items-center gap-1 flex-wrap">
                    <span class="font-black text-slate-800 dark:text-slate-100 text-xs truncate">${asst.nickname || asst.name}</span>
                    ${genderBadge}
                  </div>
                  <div class="text-[9.5px] text-slate-400 dark:text-slate-500 truncate">${asst.name}</div>
                </div>
              </div>
            </td>
            <td class="py-1.5 px-1.5 text-center border-l border-slate-100 dark:border-slate-800 min-w-[96px] sm:min-w-[110px]">
              <div class="flex flex-col items-center justify-center gap-0.5">
                <div class="inline-flex items-center justify-center bg-emerald-50/90 dark:bg-slate-800 hover:bg-emerald-100/80 dark:hover:bg-slate-750 px-1.5 py-0.5 rounded-lg border border-emerald-400/90 dark:border-emerald-600 shadow-2xs transition group cursor-pointer" title="เวลาที่เช็คชื่อเข้างาน (คลิกเพื่อแก้ไขเวลา)">
                  <input type="time" 
                    value="${entry.checkInTime || getCurrentTimeString()}" 
                    onchange="updateAssistantCheckInTime('${asstId}', this.value)"
                    class="bg-transparent font-mono text-xs sm:text-sm font-black text-emerald-950 dark:text-emerald-200 outline-none cursor-pointer text-center w-[74px] sm:w-[80px] tracking-wide"
                    title="เวลาที่เช็คชื่อเข้างาน (คลิกเพื่อแก้ไขเวลา)">
                  <span class="text-[11px] text-emerald-800 dark:text-emerald-300 font-extrabold ml-0.5 shrink-0 select-none">น.</span>
                </div>
                <div>${checkInBadge}</div>
              </div>
            </td>
        `;

        effectiveSlots.forEach(s => {
          const isChecked = checkedSlots.includes(s);
          if (isChecked) {
            slotCounts[s] = (slotCounts[s] || 0) + 1;
          }

          tbodyHtml += `
            <td id="roster-cell-${asstId}-${s.replace(':', '_')}" class="py-1 px-0.5 text-center border-l border-slate-100 dark:border-slate-800 transition ${isChecked ? 'bg-emerald-50/50 dark:bg-emerald-950/20' : ''}">
              <label class="flex items-center justify-center p-1 cursor-pointer w-full h-full rounded hover:bg-emerald-100/50 dark:hover:bg-emerald-950/40 transition">
                <input type="checkbox" 
                  onchange="toggleAssistantSlot('${asstId}', '${s}', this.checked)"
                  ${isChecked ? 'checked' : ''}
                  class="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded text-emerald-600 border-slate-300 dark:border-slate-600 focus:ring-emerald-500 dark:bg-slate-800 cursor-pointer accent-emerald-600">
              </label>
            </td>
          `;
        });

        tbodyHtml += `
            <td class="py-1.5 px-1 text-center border-l border-slate-100 dark:border-slate-800 text-[11px] sm:text-xs font-bold text-amber-800 dark:text-amber-300">
              ${stat.morningCaseCount} เคส
            </td>
            <td class="py-1.5 px-1 text-center border-l border-slate-100 dark:border-slate-800 text-[11px] sm:text-xs font-bold text-purple-800 dark:text-purple-300">
              ${stat.afternoonCaseCount} เคส
            </td>
            <td class="py-1.5 px-1 text-center border-l border-slate-100 dark:border-slate-800 font-bold">
              <span id="roster-rounds-badge-${asstId}" class="inline-block px-1.5 py-0.5 rounded-lg text-[11px] sm:text-xs font-black shadow-2xs ${roundCount > 0 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300/80 dark:border-emerald-700/80' : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 border border-slate-200 dark:border-slate-700'}">
                ${roundCount} รอบ
              </span>
            </td>
            <td class="py-1.5 px-1 text-center border-l border-slate-100 dark:border-slate-800">
              ${afternoonRankBadge}
            </td>
            <td class="py-1.5 px-1 text-center border-l border-slate-100 dark:border-slate-800">
              ${otRankBadge}
            </td>
            <td class="py-1.5 px-0.5 text-center border-l border-slate-100 dark:border-slate-800">
              <div class="flex items-center justify-center space-x-0.5">
                <button type="button" onclick="syncAssistantRosterSlotWithShift('${asstId}')" class="p-1 text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 rounded transition cursor-pointer" title="รีเซ็ตรอบตามตารางเวร (${shiftSlots.length} รอบ)">
                  <i data-lucide="refresh-cw" class="w-3 h-3 sm:w-3.5 sm:h-3.5"></i>
                </button>
                <button type="button" onclick="toggleAssistantAllSlots('${asstId}')" class="p-1 text-slate-500 hover:text-emerald-700 dark:text-slate-400 dark:hover:text-emerald-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition cursor-pointer" title="สลับติ๊กทั้งหมด / ปลดทั้งหมด">
                  <i data-lucide="zap" class="w-3 h-3 sm:w-3.5 sm:h-3.5"></i>
                </button>
                <button type="button" onclick="removeAssistantFromRoster('${asstId}')" class="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded transition cursor-pointer" title="ลบออกจากตารางวันนี้">
                  <i data-lucide="trash-2" class="w-3 h-3 sm:w-3.5 sm:h-3.5"></i>
                </button>
              </div>
            </td>
          </tr>
        `;
      });

      tbodyHtml += `</tbody>`;

      // Build TFOOT (Summary of on-duty staff per slot)
      let tfootHtml = `
        <tfoot class="bg-slate-50 dark:bg-slate-850 font-bold border-t-2 border-slate-200 dark:border-slate-700 sticky bottom-0 z-20 text-[11px] sm:text-xs">
          <tr>
            <td colspan="3" class="py-2.5 px-3 text-left font-black text-slate-800 dark:text-slate-100">
              <div class="flex items-center space-x-1.5">
                <i data-lucide="bar-chart-2" class="w-4 h-4 text-emerald-600 dark:text-emerald-400"></i>
                <span>สรุปอัตรากำลังพร้อมให้บริการ (คน/รอบ)</span>
              </div>
            </td>
      `;

      effectiveSlots.forEach(s => {
        const count = slotCounts[s] || 0;
        let countBadgeClass = "bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border-rose-300 dark:border-rose-700";
        if (count >= 2) {
          countBadgeClass = "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700";
        } else if (count === 1) {
          countBadgeClass = "bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300 dark:border-amber-700";
        }

        tfootHtml += `
          <td id="roster-slot-summary-${s.replace(':', '_')}" class="py-2 px-0.5 text-center border-l border-slate-200 dark:border-slate-700">
            <span class="inline-block px-1 py-0.5 rounded-lg text-[10.5px] sm:text-[11px] font-black border ${countBadgeClass}">
              ${count} คน
            </span>
          </td>
        `;
      });

      tfootHtml += `
            <td class="py-2 px-1 text-center border-l border-slate-200 dark:border-slate-700 text-[11px] text-slate-400">-</td>
            <td class="py-2 px-1 text-center border-l border-slate-200 dark:border-slate-700 text-[11px] text-slate-400">-</td>
            <td class="py-2 px-1 text-center border-l border-slate-200 dark:border-slate-700">
              <span id="roster-total-rounds-summary" class="inline-block px-1.5 py-0.5 rounded-lg text-[11px] sm:text-xs font-black bg-purple-100 text-purple-900 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-300 dark:border-purple-700">
                รวม ${totalDailyRounds}
              </span>
            </td>
            <td class="py-2 px-1 text-center border-l border-slate-200 dark:border-slate-700 text-[11px] text-slate-400">-</td>
            <td class="py-2 px-1 text-center border-l border-slate-200 dark:border-slate-700 text-[11px] text-slate-400">-</td>
            <td class="py-2 px-1 text-center border-l border-slate-200 dark:border-slate-700 text-[11px] text-slate-400">-</td>
          </tr>
        </tfoot>
      `;

      table.innerHTML = theadHtml + tbodyHtml + tfootHtml;

      if (statsPill) {
        statsPill.innerHTML = `ผู้ช่วยมาปฏิบัติงาน: <span class="text-emerald-700 dark:text-emerald-400 font-black">${rosterAsstIds.length}</span> ท่าน • รวมทั้งหมด <span class="text-purple-700 dark:text-purple-400 font-black">${totalDailyRounds}</span> รอบนวด`;
      }

      // Render Visual Queue Ranking Cards
      const afternoonListEl = document.getElementById("roster-queue-afternoon-list");
      const otListEl = document.getElementById("roster-queue-ot-list");

      if (afternoonListEl) {
        if (afternoonQueue.length === 0) {
          afternoonListEl.innerHTML = `<div class="py-4 text-center text-xs text-slate-400">ยังไม่มีข้อมูลการเช็คชื่อผู้ช่วยฯ</div>`;
        } else {
          afternoonListEl.innerHTML = afternoonQueue.map(q => {
            const medal = q.afternoonRank === 1 ? '🥇 คิวที่ 1' : q.afternoonRank === 2 ? '🥈 คิวที่ 2' : q.afternoonRank === 3 ? '🥉 คิวที่ 3' : `คิวที่ ${q.afternoonRank}`;
            const badgeBg = q.afternoonRank === 1 ? 'bg-amber-500 text-white shadow-xs' : q.afternoonRank === 2 ? 'bg-slate-400 text-white' : q.afternoonRank === 3 ? 'bg-amber-700 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700';
            const timingText = q.isBeforeCutoff
              ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300/80">🟢 มา ${q.checkInTime} น. (ก่อน 08:32)</span>`
              : `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300/80">🟡 มา ${q.checkInTime} น. (ต่อท้าย)</span>`;
            
            const dutyText = q.isAfternoonDuty
              ? `<span class="text-[10.5px] text-emerald-700 dark:text-emerald-400 font-bold">🌤️ เข้าเวรบ่าย</span>`
              : `<span class="text-[10.5px] text-slate-400 dark:text-slate-500">⚪ ไม่ได้เข้าเวรบ่าย</span>`;

            return `
              <div class="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700 shadow-2xs hover:border-amber-400 transition">
                <div class="flex items-center space-x-2.5 min-w-0">
                  <span class="px-2 py-1 rounded-lg text-xs font-black shrink-0 ${badgeBg}">${medal}</span>
                  <div class="min-w-0">
                    <div class="flex items-center gap-1.5 flex-wrap">
                      <span class="font-extrabold text-xs text-slate-800 dark:text-slate-100">${escapeHtml(q.asst.nickname || q.asst.name)}</span>
                      ${timingText}
                    </div>
                    <div class="text-[10.5px] text-slate-500 dark:text-slate-400 mt-0.5">${dutyText} • ยอดรวมทั้งวัน: ${q.totalCaseCount} เคส</div>
                  </div>
                </div>
                <div class="text-right shrink-0 pl-2">
                  <div class="text-xs font-black text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 px-2 py-1 rounded-lg border border-amber-200/60 dark:border-amber-800">
                    ยอดเช้า: ${q.morningCaseCount} เคส
                  </div>
                </div>
              </div>
            `;
          }).join("");
        }
      }

      if (otListEl) {
        if (otQueue.length === 0) {
          otListEl.innerHTML = `<div class="py-4 text-center text-xs text-slate-400">ไม่มีผู้ช่วยแพทย์แผนไทยที่ลงเวลาอยู่เวรนอกเวลา (17:00 - 19:00 น.)</div>`;
        } else {
          otListEl.innerHTML = otQueue.map(q => {
            const medal = `🌙 OT คิวที่ ${q.otRank}`;
            const badgeBg = q.otRank === 1 ? 'bg-purple-600 text-white shadow-xs' : 'bg-purple-100 text-purple-900 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-300 dark:border-purple-800';

            return `
              <div class="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700 shadow-2xs hover:border-purple-400 transition">
                <div class="flex items-center space-x-2.5 min-w-0">
                  <span class="px-2 py-1 rounded-lg text-xs font-black shrink-0 ${badgeBg}">${medal}</span>
                  <div class="min-w-0">
                    <div class="flex items-center gap-1.5 flex-wrap">
                      <span class="font-extrabold text-xs text-slate-800 dark:text-slate-100">${escapeHtml(q.asst.nickname || q.asst.name)}</span>
                      <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800">🟣 เวรนอกเวลา</span>
                    </div>
                    <div class="text-[10.5px] text-slate-500 dark:text-slate-400 mt-0.5">เวลามา: ${q.checkInTime} น. • รวมทั้งวัน: ${q.totalCaseCount} เคส</div>
                  </div>
                </div>
                <div class="text-right shrink-0 pl-2">
                  <div class="text-xs font-black text-purple-900 dark:text-purple-200 bg-purple-50 dark:bg-purple-950/60 px-2 py-1 rounded-lg border border-purple-200/60 dark:border-purple-800">
                    ยอด 13-15น.: ${q.afternoonCaseCount} เคส
                  </div>
                </div>
              </div>
            `;
          }).join("");
        }
      }

      if (window.lucide) lucide.createIcons();
    }

    function addAssistantToRoster(asstId, checkInTime = null) {
      if (!asstId) return;
      if (!assistantDutyRosters[currentRosterDate]) assistantDutyRosters[currentRosterDate] = {};
      
      const time = checkInTime || getCurrentTimeString();
      const targetAsst = (assistants || []).find(a => a.id === asstId);
      const defaultSlots = targetAsst ? getAssistantWorkSlots(targetAsst) : [];

      // Store entry with auto timestamp and default slots according to assistant's shift schedule
      assistantDutyRosters[currentRosterDate][asstId] = {
        checkInTime: time,
        slots: [...defaultSlots]
      };
      
      renderAssistantRosterMatrix();
      saveAssistantRoster(currentRosterDate, false);

      const asstName = targetAsst ? targetAsst.nickname || targetAsst.name : asstId;
      showToast(`เช็คชื่อ ${asstName} เข้างานเรียบร้อย (เวลา ${time} น. • ติ๊กรอบเวร ${defaultSlots.length} รอบ)`, "success");
    }

    let rosterSaveDebounceTimer = null;
    let lastRosterLocalEditTime = 0;

    function updateAssistantCheckInTime(asstId, newTime) {
      if (!assistantDutyRosters[currentRosterDate] || !assistantDutyRosters[currentRosterDate][asstId]) return;
      lastRosterLocalEditTime = Date.now();
      const entry = normalizeAssistantRosterEntry(assistantDutyRosters[currentRosterDate][asstId]);
      entry.checkInTime = newTime || getCurrentTimeString();
      assistantDutyRosters[currentRosterDate][asstId] = entry;

      // Live update check-in badge in row directly without rebuilding table
      const cleanTime = (entry.checkInTime || "08:00").trim().replace(" น.", "");
      const isBeforeCutoff = cleanTime <= "08:32";
      const row = document.getElementById(`roster-row-${asstId}`);
      if (row) {
        const badgeCol = row.children[2];
        if (badgeCol) {
          const badgeContainer = badgeCol.querySelector('.mt-0\\.5, div:nth-child(2)');
          if (badgeContainer) {
            badgeContainer.innerHTML = isBeforeCutoff
              ? `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300/90 shadow-2xs">🟢 ก่อน 08:32</span>`
              : `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold bg-amber-100 text-amber-950 dark:bg-amber-950 dark:text-amber-200 border border-amber-300/90 shadow-2xs">🟡 หลัง 08:32</span>`;
          }
        }
      }

      saveAssistantRoster(currentRosterDate, false);
    }

    function addSelectedAssistantToRoster() {
      const selectEl = document.getElementById("roster-assistant-select");
      if (!selectEl || !selectEl.value) {
        showToast("กรุณาเลือกรายชื่อผู้ช่วยแพทย์แผนไทยที่ต้องการเช็คชื่อ", "warning");
        return;
      }
      addAssistantToRoster(selectEl.value);
    }

    function addAllActiveAssistantsToRoster() {
      if (!assistantDutyRosters[currentRosterDate]) assistantDutyRosters[currentRosterDate] = {};
      const activeAssts = (assistants || []).filter(a => a.active);
      const currentTime = getCurrentTimeString();

      let addedCount = 0;
      activeAssts.forEach(a => {
        if (!assistantDutyRosters[currentRosterDate][a.id]) {
          const defaultSlots = getAssistantWorkSlots(a);
          assistantDutyRosters[currentRosterDate][a.id] = {
            checkInTime: currentTime,
            slots: [...defaultSlots]
          };
          addedCount++;
        }
      });

      renderAssistantRosterMatrix();
      saveAssistantRoster(currentRosterDate, false);
      showToast(`เช็คชื่อผู้ช่วยแพทย์แผนไทยทั้งหมดเข้าตารางเรียบร้อยแล้ว (${activeAssts.length} ท่าน พร้อมติ๊กรอบตามเวร)`, "success");
    }

    function removeAssistantFromRoster(asstId) {
      if (!assistantDutyRosters[currentRosterDate]) return;
      delete assistantDutyRosters[currentRosterDate][asstId];
      renderAssistantRosterMatrix();
      saveAssistantRoster(currentRosterDate, false);
    }

    function syncAllRosterSlotsWithShifts(showToastFeedback = true) {
      if (!assistantDutyRosters[currentRosterDate]) assistantDutyRosters[currentRosterDate] = {};
      const rosterObj = assistantDutyRosters[currentRosterDate];
      const asstIds = Object.keys(rosterObj);

      if (asstIds.length === 0) {
        if (showToastFeedback) showToast("กรุณาเช็คชื่อผู้ช่วยฯ เข้าตารางก่อน", "warning");
        return;
      }

      let syncedCount = 0;
      asstIds.forEach(aid => {
        const asst = (assistants || []).find(a => a.id === aid);
        if (!asst) return;
        const entry = normalizeAssistantRosterEntry(rosterObj[aid]);
        const shiftSlots = getAssistantWorkSlots(asst);
        entry.slots = [...shiftSlots];
        entry.isExplicitlyEmpty = shiftSlots.length === 0;
        rosterObj[aid] = entry;
        syncedCount++;
      });

      renderAssistantRosterMatrix();
      saveAssistantRoster(currentRosterDate, false);
      if (showToastFeedback) {
        showToast(`ซิงค์รอบเวลาตามตารางเวรที่กำหนดสำเร็จ (${syncedCount} ท่าน)`, "success");
      }
    }

    function syncAssistantRosterSlotWithShift(asstId) {
      if (!assistantDutyRosters[currentRosterDate] || !assistantDutyRosters[currentRosterDate][asstId]) return;
      const asst = (assistants || []).find(a => a.id === asstId);
      if (!asst) return;

      const entry = normalizeAssistantRosterEntry(assistantDutyRosters[currentRosterDate][asstId]);
      const shiftSlots = getAssistantWorkSlots(asst);
      entry.slots = [...shiftSlots];
      entry.isExplicitlyEmpty = shiftSlots.length === 0;
      assistantDutyRosters[currentRosterDate][asstId] = entry;

      renderAssistantRosterMatrix();
      saveAssistantRoster(currentRosterDate, false);
      showToast(`ซิงค์รอบเวลาของ ${asst.nickname || asst.name} ตามตารางเวรเรียบร้อย (${shiftSlots.length} รอบ)`, "success");
    }

    function toggleAssistantSlot(asstId, slot, isChecked) {
      if (!assistantDutyRosters[currentRosterDate]) assistantDutyRosters[currentRosterDate] = {};
      if (!assistantDutyRosters[currentRosterDate][asstId]) {
        assistantDutyRosters[currentRosterDate][asstId] = { checkInTime: getCurrentTimeString(), slots: [] };
      }

      const entry = normalizeAssistantRosterEntry(assistantDutyRosters[currentRosterDate][asstId]);
      let curSlots = entry.slots || [];
      if (isChecked) {
        if (!curSlots.includes(slot)) curSlots.push(slot);
      } else {
        curSlots = curSlots.filter(s => s !== slot);
      }
      entry.slots = curSlots;
      entry.isExplicitlyEmpty = curSlots.length === 0;
      assistantDutyRosters[currentRosterDate][asstId] = entry;

      // Live Update: Cell Highlight
      const cell = document.getElementById(`roster-cell-${asstId}-${slot.replace(':', '_')}`);
      if (cell) {
        if (isChecked) cell.classList.add("bg-emerald-50/50", "dark:bg-emerald-950/20");
        else cell.classList.remove("bg-emerald-50/50", "dark:bg-emerald-950/20");
      }

      // Live Update: Row Rounds Counter
      const newRoundCount = curSlots.length;
      const roundsBadge = document.getElementById(`roster-rounds-badge-${asstId}`);
      if (roundsBadge) {
        roundsBadge.textContent = `${newRoundCount} รอบ`;
        if (newRoundCount > 0) {
          roundsBadge.className = "inline-block px-2.5 py-1 rounded-xl text-xs font-black shadow-2xs bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300/80 dark:border-emerald-700/80";
        } else {
          roundsBadge.className = "inline-block px-2.5 py-1 rounded-xl text-xs font-black shadow-2xs bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 border border-slate-200 dark:border-slate-700";
        }
      }

      // Live Update: Slot Footer Summary Count
      const rosterObj = assistantDutyRosters[currentRosterDate] || {};
      let slotTotal = 0;
      let grandTotalRounds = 0;
      Object.keys(rosterObj).forEach(aid => {
        const asstEntry = normalizeAssistantRosterEntry(rosterObj[aid]);
        const asstSlots = asstEntry.slots || [];
        if (asstSlots.includes(slot)) slotTotal++;
        grandTotalRounds += asstSlots.length;
      });

      const slotSummaryCell = document.getElementById(`roster-slot-summary-${slot.replace(':', '_')}`);
      if (slotSummaryCell) {
        let countBadgeClass = "bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border-rose-300 dark:border-rose-700";
        if (slotTotal >= 2) {
          countBadgeClass = "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700";
        } else if (slotTotal === 1) {
          countBadgeClass = "bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300 dark:border-amber-700";
        }
        slotSummaryCell.innerHTML = `
          <span class="inline-block px-2 py-0.5 rounded-lg text-xs font-black border ${countBadgeClass}">
            ${slotTotal} คน
          </span>
        `;
      }

      const grandTotalEl = document.getElementById("roster-total-rounds-summary");
      if (grandTotalEl) grandTotalEl.textContent = `รวม ${grandTotalRounds}`;

      const statsPill = document.getElementById("roster-stats-pill");
      if (statsPill) {
        statsPill.innerHTML = `ผู้ช่วยมาปฏิบัติงาน: <span class="text-emerald-700 dark:text-emerald-400 font-black">${Object.keys(rosterObj).length}</span> ท่าน • รวมทั้งหมด <span class="text-purple-700 dark:text-purple-400 font-black">${grandTotalRounds}</span> รอบนวด`;
      }

      saveAssistantRoster(currentRosterDate, false);
    }

    function toggleAssistantAllSlots(asstId) {
      if (!assistantDutyRosters[currentRosterDate] || !assistantDutyRosters[currentRosterDate][asstId]) return;
      const effectiveSlots = getEffectiveSlotsForRoster(currentRosterDate);
      const entry = normalizeAssistantRosterEntry(assistantDutyRosters[currentRosterDate][asstId]);
      const curSlots = entry.slots || [];

      if (curSlots.length === effectiveSlots.length) {
        entry.slots = [];
        entry.isExplicitlyEmpty = true;
        entry.shiftType = 'off';
      } else {
        entry.slots = [...effectiveSlots];
        entry.isExplicitlyEmpty = false;
        entry.shiftType = 'full';
      }
      assistantDutyRosters[currentRosterDate][asstId] = entry;

      renderAssistantRosterMatrix();
      saveAssistantRoster(currentRosterDate, false);
    }

    function toggleSlotColumnForAll(slot) {
      if (!assistantDutyRosters[currentRosterDate]) return;
      const rosterObj = assistantDutyRosters[currentRosterDate];
      const asstIds = Object.keys(rosterObj);
      if (asstIds.length === 0) return;

      const allChecked = asstIds.every(aid => {
        const entry = normalizeAssistantRosterEntry(rosterObj[aid]);
        return (entry.slots || []).includes(slot);
      });

      asstIds.forEach(aid => {
        const entry = normalizeAssistantRosterEntry(rosterObj[aid]);
        let cur = entry.slots || [];
        if (allChecked) {
          entry.slots = cur.filter(s => s !== slot);
        } else {
          if (!cur.includes(slot)) cur.push(slot);
          entry.slots = cur;
        }
        rosterObj[aid] = entry;
      });

      renderAssistantRosterMatrix();
      saveAssistantRoster(currentRosterDate, false);
    }

    function applyRosterPreset(presetType) {
      if (!assistantDutyRosters[currentRosterDate]) assistantDutyRosters[currentRosterDate] = {};
      const rosterObj = assistantDutyRosters[currentRosterDate];
      const asstIds = Object.keys(rosterObj);

      if (asstIds.length === 0 && presetType !== "copy_yesterday") {
        showToast("กรุณาเช็คชื่อผู้ช่วยฯ เข้าตารางก่อนเลือกรูปแบบเวร", "warning");
        return;
      }

      const effectiveSlots = getEffectiveSlotsForRoster(currentRosterDate);

      if (presetType === "morning") {
        const morningSlots = effectiveSlots.filter(s => {
          const hour = parseInt(s.split(":")[0]);
          return hour >= 8 && hour <= 12;
        });
        asstIds.forEach(aid => {
          const entry = normalizeAssistantRosterEntry(rosterObj[aid]);
          entry.slots = [...morningSlots];
          rosterObj[aid] = entry;
        });
        showToast("กำหนดเวรเช้า (08:00 - 12:00) ให้ผู้ช่วยฯ ทุกคนที่เช็คชื่อแล้ว", "info");
      } else if (presetType === "afternoon") {
        const afternoonSlots = effectiveSlots.filter(s => {
          const hour = parseInt(s.split(":")[0]);
          return hour >= 13 && hour <= 19;
        });
        asstIds.forEach(aid => {
          const entry = normalizeAssistantRosterEntry(rosterObj[aid]);
          entry.slots = [...afternoonSlots];
          rosterObj[aid] = entry;
        });
        showToast("กำหนดเวรบ่าย (13:00 - 19:00) ให้ผู้ช่วยฯ ทุกคนที่เช็คชื่อแล้ว", "info");
      } else if (presetType === "all") {
        asstIds.forEach(aid => {
          const entry = normalizeAssistantRosterEntry(rosterObj[aid]);
          entry.slots = [...effectiveSlots];
          rosterObj[aid] = entry;
        });
        showToast("กำหนดเต็มวัน (ทุกรอบ) เรียบร้อย", "info");
      } else if (presetType === "clear") {
        asstIds.forEach(aid => {
          const entry = normalizeAssistantRosterEntry(rosterObj[aid]);
          entry.slots = [];
          rosterObj[aid] = entry;
        });
        showToast("ล้างการติ๊กทั้งหมดเรียบร้อย", "info");
      } else if (presetType === "copy_yesterday") {
        try {
          const d = new Date(currentRosterDate + "T00:00:00");
          d.setDate(d.getDate() - 1);
          const yr = d.getFullYear();
          const mo = String(d.getMonth() + 1).padStart(2, '0');
          const da = String(d.getDate()).padStart(2, '0');
          const yesterdayStr = `${yr}-${mo}-${da}`;

          const yesterdayRoster = assistantDutyRosters[yesterdayStr];
          if (yesterdayRoster && Object.keys(yesterdayRoster).length > 0) {
            assistantDutyRosters[currentRosterDate] = JSON.parse(JSON.stringify(yesterdayRoster));
            showToast(`คัดลอกตารางจัดคิวจากวันที่ ${formatThaiDateShort(yesterdayStr)} เรียบร้อยแล้ว`, "success");
          } else {
            showToast(`ไม่พบข้อมูลตารางจัดคิวของวันก่อนหน้า (${formatThaiDateShort(yesterdayStr)})`, "warning");
            return;
          }
        } catch(e) {
          showToast("ไม่สามารถคัดลอกตารางจากวันก่อนหน้าได้: " + e.message, "error");
        }
      }

      renderAssistantRosterMatrix();
      saveAssistantRoster(currentRosterDate, false);
    }

    async function saveAssistantRoster(dateStr, showFeedback = false) {
      if (!dateStr) dateStr = currentRosterDate;
      lastRosterLocalEditTime = Date.now();

      try {
        localStorage.setItem("ttm_assistant_duty_rosters", JSON.stringify(assistantDutyRosters));
      } catch(e) {
        console.error("Local storage roster save error:", e);
      }

      if (typeof populateAssistantsDropdown === "function") populateAssistantsDropdown("new-assistant-select");

      if (showFeedback) {
        showToast(`บันทึกตารางคิวผู้ช่วยฯ ประจำวันที่ ${formatThaiDateShort(dateStr)} เรียบร้อยแล้ว (อัปเดตทุกหน้าจอเรียบร้อย)`, "success");
      }

      // Debounce the Supabase cloud sync & background tab refresh so rapid clicks don't spam requests or cause bouncing
      clearTimeout(rosterSaveDebounceTimer);
      rosterSaveDebounceTimer = setTimeout(async () => {
        if (typeof supabaseClient !== 'undefined' && supabaseClient) {
          try {
            const rosterForDate = assistantDutyRosters[dateStr] || {};
            await supabaseClient.from("slot_configs").upsert({
              id: "roster_" + dateStr,
              scope: "roster",
              config_key: dateStr,
              slots_json: rosterForDate,
              updated_at: new Date().toISOString()
            }, { onConflict: "id" });
          } catch(e) {
            console.warn("Supabase roster upsert warning:", e);
          }
        }
        if (typeof refreshActiveTabUI === "function") {
          refreshActiveTabUI(true);
        }
      }, showFeedback ? 0 : 500);
    }

    function exportAssistantRosterCSV() {
      const effectiveSlots = getEffectiveSlotsForRoster(currentRosterDate);
      const rosterObj = assistantDutyRosters[currentRosterDate] || {};
      const asstIds = Object.keys(rosterObj);

      if (asstIds.length === 0) {
        showToast("ไม่มีข้อมูลผู้ช่วยฯ ในตารางสำหรับส่งออก", "warning");
        return;
      }

      const dailyQueues = computeDailyAssistantQueues(currentRosterDate);
      const { statsMap } = dailyQueues;

      const headers = ["ลำดับ", "ชื่อผู้ช่วยแพทย์แผนไทย", "ชื่อเล่น", "เพศ", "เวลาที่มา", "สถานะการมา", "ยอดเช้า (08-12)", "ยอดบ่าย (13-15)", "คิวบ่าย", "คิว OT", "เบอร์โทร", ...effectiveSlots, "รวมจำนวนรอบ"];
      const rows = asstIds.map((asstId, idx) => {
        const asst = (assistants || []).find(a => a.id === asstId) || { name: asstId, nickname: asstId, gender: "female", phone: "" };
        const entry = normalizeAssistantRosterEntry(rosterObj[asstId]);
        const checkedSlots = entry.slots || [];
        const stat = statsMap[asstId] || { morningCaseCount: 0, afternoonCaseCount: 0, afternoonRank: "-", otRank: "-", isBeforeCutoff: true, isOtDuty: false };
        const slotCols = effectiveSlots.map(s => checkedSlots.includes(s) ? "✓" : "-");
        return [
          idx + 1,
          `"${asst.name.replace(/"/g, '""')}"`,
          `"${(asst.nickname || "").replace(/"/g, '""')}"`,
          asst.gender === "male" ? "ชาย" : "หญิง",
          `"${(entry.checkInTime || '-')} น."`,
          stat.isBeforeCutoff ? "มาก่อน 08:32 น." : "มาหลัง 08:32 น. (ต่อท้าย)",
          stat.morningCaseCount,
          stat.afternoonCaseCount,
          `"คิว #${stat.afternoonRank || '-'}"`,
          stat.isOtDuty ? `"OT #${stat.otRank || '-'}"` : "-",
          `"${(asst.phone || "").replace(/"/g, '""')}"`,
          ...slotCols,
          checkedSlots.length
        ];
      });

      const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `ตารางจัดคิวนวดผู้ช่วยแผนไทย_${currentRosterDate}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast("ดาวน์โหลดไฟล์ CSV ตารางจัดคิวผู้ช่วยฯ เรียบร้อย", "success");
    }

    function printAssistantRoster() {
      const effectiveSlots = getEffectiveSlotsForRoster(currentRosterDate);
      const rosterObj = assistantDutyRosters[currentRosterDate] || {};
      const asstIds = Object.keys(rosterObj);

      if (asstIds.length === 0) {
        showToast("ไม่มีข้อมูลผู้ช่วยฯ ในตารางสำหรับพิมพ์", "warning");
        return;
      }

      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        showToast("โปรดอนุญาตให้เปิดหน้าต่างพิมพ์ (Pop-up)", "warning");
        return;
      }

      const dailyQueues = computeDailyAssistantQueues(currentRosterDate);
      const { statsMap } = dailyQueues;

      const rowsHtml = asstIds.map((asstId, idx) => {
        const asst = (assistants || []).find(a => a.id === asstId) || { name: asstId, nickname: asstId, gender: "female" };
        const entry = normalizeAssistantRosterEntry(rosterObj[asstId]);
        const checkedSlots = entry.slots || [];
        const stat = statsMap[asstId] || { morningCaseCount: 0, afternoonCaseCount: 0, afternoonRank: "-", otRank: "-", isBeforeCutoff: true, isOtDuty: false };
        const slotCells = effectiveSlots.map(s => `
          <td style="text-align:center; padding: 6px; border: 1px solid #ccc; font-weight: bold; color: ${checkedSlots.includes(s) ? '#047857' : '#999'};">
            ${checkedSlots.includes(s) ? '✓' : '-'}
          </td>
        `).join("");

        return `
          <tr>
            <td style="text-align:center; padding: 6px; border: 1px solid #ccc;">${idx + 1}</td>
            <td style="padding: 6px; border: 1px solid #ccc; font-weight: bold;">${asst.nickname ? asst.nickname + ' (' + asst.name + ')' : asst.name}</td>
            <td style="text-align:center; padding: 6px; border: 1px solid #ccc;">${asst.gender === 'male' ? 'ชาย' : 'หญิง'}</td>
            <td style="text-align:center; padding: 6px; border: 1px solid #ccc; font-weight: bold; color: ${stat.isBeforeCutoff ? '#065f46' : '#b45309'};">
              ${entry.checkInTime || '-'} น.<br><span style="font-size: 10px; font-weight: normal;">${stat.isBeforeCutoff ? '🟢 ทันเวลา' : '🟡 หลัง 08:32'}</span>
            </td>
            <td style="text-align:center; padding: 6px; border: 1px solid #ccc; font-weight: bold; background: #fffbeb; color: #92400e;">${stat.morningCaseCount} เคส</td>
            <td style="text-align:center; padding: 6px; border: 1px solid #ccc; font-weight: bold; background: #faf5ff; color: #6b21a8;">${stat.afternoonCaseCount} เคส</td>
            <td style="text-align:center; padding: 6px; border: 1px solid #ccc; font-weight: bold; background: #fffbeb; color: #92400e;">#${stat.afternoonRank || '-'}</td>
            <td style="text-align:center; padding: 6px; border: 1px solid #ccc; font-weight: bold; background: #faf5ff; color: #6b21a8;">${stat.isOtDuty ? '#' + stat.otRank : '-'}</td>
            ${slotCells}
            <td style="text-align:center; padding: 6px; border: 1px solid #ccc; font-weight: bold; background: #f0fdf4;">${checkedSlots.length} รอบ</td>
          </tr>
        `;
      }).join("");

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>ตารางจัดคิวนวดผู้ช่วยแพทย์แผนไทย ประจำวันที่ ${currentRosterDate}</title>
          <style>
            body { font-family: 'Sarabun', -apple-system, BlinkMacSystemFont, sans-serif; padding: 20px; color: #1e293b; }
            h2 { margin: 0 0 5px 0; color: #064e3b; }
            p { margin: 0 0 15px 0; font-size: 13px; color: #64748b; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 10px; }
            th { background: #f1f5f9; padding: 8px; border: 1px solid #ccc; text-align: center; }
            @media print {
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <h2>ตารางจัดคิวนวด & เวรปฏิบัติงานผู้ช่วยแพทย์แผนไทย</h2>
          <p>คลินิกการแพทย์แผนไทย โรงพยาบาลนราธิวาสราชนครินทร์ • ประจำวันที่ ${formatThaiDateShort(currentRosterDate)}</p>
          <table>
            <thead>
              <tr>
                <th style="width: 30px;">#</th>
                <th style="text-align:left;">ผู้ช่วยแพทย์แผนไทย</th>
                <th style="width: 45px;">เพศ</th>
                <th style="width: 75px;">เวลาที่มา</th>
                <th style="width: 65px; background: #fef3c7;">ยอดเช้า (08-12)</th>
                <th style="width: 65px; background: #f3e8ff;">ยอดบ่าย (13-15)</th>
                <th style="width: 55px; background: #fef3c7;">คิวบ่าย</th>
                <th style="width: 55px; background: #f3e8ff;">คิว OT</th>
                ${effectiveSlots.map(s => `<th>${s}</th>`).join("")}
                <th style="width: 70px;">รวมรอบ</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
          <div style="margin-top: 20px; text-align: right;">
            <button onclick="window.print()" style="padding: 8px 16px; background: #047857; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">พิมพ์เอกสาร</button>
          </div>
        </body>
        </html>
      `);
      printWindow.document.close();
    }

    function renderManageServices() {
      // 1. Render Main Services (ประเภทหัตถการหลัก)
      const mainTbody = document.getElementById("main-services-table-body");
      if (mainTbody) {
        mainTbody.innerHTML = "";
        mainServicesList.forEach(svc => {
          const target = svc.target || "all";
          const targetBadge = target === "staff_only"
            ? `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs">🩺 เฉพาะ จนท.</span>`
            : `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-2xs">🌐 ทุกคน</span>`;
          
          const priceDisplay = svc.priceLabel || (svc.price ? `${svc.price.toLocaleString()} ฿` : 'บริการเฉพาะทาง');
          const durationDisplay = `${svc.durationSlots || 1} รอบ (${svc.durationMin || (svc.durationSlots === 2 ? 120 : 60)} นาที)`;

          const tr = document.createElement("tr");
          tr.className = "hover:bg-slate-50 dark:hover:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-xs transition";
          tr.innerHTML = `
            <td class="py-2.5 px-3.5 font-bold text-slate-800 dark:text-slate-100">${escapeHtml(svc.name)}</td>
            <td class="py-2.5 px-3"><span class="text-base p-1 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 inline-block">${svc.icon || '💆‍♂️'}</span></td>
            <td class="py-2.5 px-3 text-slate-600 dark:text-slate-300 max-w-xs truncate" title="${escapeHtml(svc.desc || '')}">${escapeHtml(svc.desc || '-')}</td>
            <td class="py-2.5 px-3 font-semibold text-herbal-800 dark:text-emerald-300">${escapeHtml(priceDisplay)}</td>
            <td class="py-2.5 px-3 font-medium text-slate-700 dark:text-slate-300">${escapeHtml(durationDisplay)}</td>
            <td class="py-2.5 px-3">${targetBadge}</td>
            <td class="py-2.5 px-3">${svc.active ? '<span class="text-emerald-700 dark:text-emerald-400 font-bold">🟢 เปิดใช้งาน</span>' : '<span class="text-slate-400">⚪ พักใช้งาน</span>'}</td>
            <td class="py-2.5 px-3.5 text-center">
              <div class="flex items-center justify-center space-x-1.5">
                <button onclick="openEditMainServiceModal('${svc.id}')" class="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold transition flex items-center space-x-1 shadow-2xs cursor-pointer" title="แก้ไขหัตถการหลัก">
                  <i data-lucide="edit-3" class="w-3.5 h-3.5 text-amber-600"></i>
                  <span>แก้ไข</span>
                </button>
                <button onclick="toggleMainServiceActive('${svc.id}')" class="text-xs px-2.5 py-1 rounded ${svc.active ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'} font-semibold transition shadow-2xs cursor-pointer" title="${svc.active ? 'พักการใช้งานหัตถการนี้' : 'เปิดใช้งานหัตถการนี้'}">
                  ${svc.active ? 'พักการใช้' : 'เปิดใช้งาน'}
                </button>
                <button onclick="deleteMainServiceItem('${svc.id}')" class="p-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition shadow-2xs cursor-pointer" title="ลบหัตถการหลัก">
                  <i data-lucide="trash-2" class="w-3.5 h-3.5 text-rose-600"></i>
                </button>
              </div>
            </td>
          `;
          mainTbody.appendChild(tr);
        });
      }

      // 2. Render Extra Services (บริการเสริม)
      const tbody = document.getElementById("services-table-body");
      if (!tbody) return;
      tbody.innerHTML = "";

      extraServicesList.forEach(svc => {
        const asstPct = parsePercentage(svc.asstPercent, 60);
        const hospPct = 100 - asstPct;
        const asstShare = svc.share60 !== undefined && svc.share60 !== null ? Number(svc.share60) : Math.round(svc.price * (asstPct / 100));
        const hospShare = Math.max(0, svc.price - asstShare);
        const target = svc.target || svc.target_audience || "all";

        const targetBadge = target === "staff_only"
          ? `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs">🩺 เฉพาะ จนท.</span>`
          : `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-2xs">🌐 ทุกคน</span>`;

        const tr = document.createElement("tr");
        tr.className = "hover:bg-slate-50 dark:hover:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-xs transition";
        tr.innerHTML = `
          <td class="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-100">${escapeHtml(svc.name)}</td>
          <td class="py-2.5 px-3"><span class="badge-service ${svc.color || 'bg-slate-100 text-slate-800 border border-slate-200'}">${escapeHtml(svc.tag)}</span></td>
          <td class="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-slate-100">${svc.price.toLocaleString()} ฿</td>
          <td class="py-2.5 px-3">
            <div class="text-[11px] font-medium leading-tight">
              <span class="text-emerald-700 dark:text-emerald-400 font-bold">🩺 ผู้ช่วย ${asstPct}% (${asstShare} บ.)</span><br>
              <span class="text-blue-700 dark:text-blue-400 font-bold">🏥 รพ. ${hospPct}% (${hospShare} บ.)</span>
            </div>
          </td>
          <td class="py-2.5 px-3">${targetBadge}</td>
          <td class="py-2.5 px-3">${svc.twoSlots ? '<span class="text-amber-700 dark:text-amber-300 font-bold bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800">2 รอบ</span>' : '<span class="text-slate-400">1 รอบ</span>'}</td>
          <td class="py-2.5 px-3">${svc.active ? '<span class="text-emerald-700 dark:text-emerald-400 font-bold">เปิดใช้งาน</span>' : '<span class="text-slate-400">พักใช้งาน</span>'}</td>
          <td class="py-2.5 px-3 text-center">
            <div class="flex items-center justify-center space-x-1.5">
              <button onclick="openEditServiceModal('${svc.id}')" class="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold transition flex items-center space-x-1 shadow-2xs cursor-pointer" title="แก้ไขข้อมูลบริการ">
                <i data-lucide="edit-3" class="w-3.5 h-3.5 text-amber-600"></i>
                <span>แก้ไข</span>
              </button>
              <button onclick="toggleServiceActive('${svc.id}')" class="text-xs px-2.5 py-1 rounded ${svc.active ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'} font-semibold transition shadow-2xs cursor-pointer" title="${svc.active ? 'พักการใช้งานบริการนี้' : 'เปิดใช้งานบริการนี้'}">
                ${svc.active ? 'พักการใช้' : 'เปิดใช้งาน'}
              </button>
              <button onclick="deleteServiceItem('${svc.id}')" class="p-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition shadow-2xs cursor-pointer" title="ลบบริการ">
                <i data-lucide="trash-2" class="w-3.5 h-3.5 text-rose-600"></i>
              </button>
            </div>
          </td>
        `;
        tbody.appendChild(tr);
      });

      lucide.createIcons();
    }

