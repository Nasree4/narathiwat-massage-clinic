/**
 * Module 15: 15_booking_wizard_and_app_init.js
 * Description: 5-Step Booking Wizard Logic & App Init
 * Generated from lines 23489 to 24969 of original index.html
 */

    /* =========================================================================
       5-STEP BOOKING POPUP WIZARD LOGIC (v3.9.5)
       ========================================================================= */

    let currentWizardStep = 1;
    let wizardBookingData = {
      bookDate: "",
      timeSlot: "",
      mainService: "",
      extraServices: [],
      assistantId: "female",
      assistantNick: "ขอผู้หญิง",
      patientName: "",
      citizenOrHn: "",
      phone: "",
      medicalScheme: "บัตรทอง",
      medicalSchemeOther: "",
      notes: ""
    };

    function openBookingWizard(startStep = 1) {
      const wizardBodyScroll = document.getElementById("wizard-body-scroll") || document.querySelector("#modal-booking-wizard .overflow-y-auto");
      if (wizardBodyScroll) {
        wizardBodyScroll.scrollTop = 0;
      }
      const wizardModalEl = document.getElementById("modal-booking-wizard");
      if (wizardModalEl) {
        wizardModalEl.scrollTop = 0;
      }
      if (startStep === 1) {
        resetBookingWizard();
      }
      const modal = document.getElementById("modal-booking-wizard");
      if (!modal) return;
      modal.classList.remove("hidden");

      // Initialize date if empty
      const dateInput = document.getElementById("wizard-book-date");
      if (dateInput) {
        if (!dateInput.value) {
          dateInput.value = todayStr;
        }
        wizardBookingData.bookDate = dateInput.value;
      } else {
        wizardBookingData.bookDate = todayStr;
      }

      // Initialize service containers in step 3
      renderMainServicesOptions("wizard-main-services-container");
      renderExtraServicesCheckboxes("wizard-extra-services-container");
      populateWizardAssistantsDropdown();

      onWizardDateChanged();
      goToWizardStep(startStep);
      if (typeof lucide !== "undefined" && lucide.createIcons) lucide.createIcons();
    }

    function closeBookingWizard() {
      const modal = document.getElementById("modal-booking-wizard");
      if (modal) modal.classList.add("hidden");
      resetBookingWizard();
      resetBookingForm('new');
    }

    function resetBookingWizard() {
      const wizardBodyScroll = document.getElementById("wizard-body-scroll") || document.querySelector("#modal-booking-wizard .overflow-y-auto");
      if (wizardBodyScroll) {
        wizardBodyScroll.scrollTop = 0;
      }
      const wizardModalEl = document.getElementById("modal-booking-wizard");
      if (wizardModalEl) {
        wizardModalEl.scrollTop = 0;
      }
      currentWizardStep = 1;
      wizardBookingData = {
        bookDate: todayStr,
        timeSlot: "",
        mainService: "",
        extraServices: [],
        assistantId: "female",
        assistantNick: "ขอผู้หญิง",
        patientName: "",
        citizenOrHn: "",
        phone: "",
        medicalScheme: "บัตรทอง",
        medicalSchemeOther: "",
        notes: ""
      };
      const dateInp = document.getElementById("wizard-book-date");
      if (dateInp) dateInp.value = todayStr;
      const nameInp = document.getElementById("wizard-patientName");
      if (nameInp) nameInp.value = "";
      const hnInp = document.getElementById("wizard-citizenOrHn");
      if (hnInp) hnInp.value = "";
      const phoneInp = document.getElementById("wizard-phone");
      if (phoneInp) phoneInp.value = "";
      const notesInp = document.getElementById("wizard-notes");
      if (notesInp) notesInp.value = "";
      const schemeSel = document.getElementById("wizard-medicalScheme");
      if (schemeSel) schemeSel.value = "บัตรทอง";
      const schemeOther = document.getElementById("wizard-medicalScheme-other");
      if (schemeOther) {
        schemeOther.value = "";
        schemeOther.classList.add("hidden");
      }
      const extraCbs = document.querySelectorAll("#wizard-extra-services-container input[type='checkbox']");
      extraCbs.forEach(cb => { cb.checked = false; });
      const mainRadios = document.querySelectorAll("#wizard-main-services-container input[name='mainService']");
      mainRadios.forEach((rb, idx) => { rb.checked = (idx === 0); });

      // Reset Wizard staff chips & select dropdown
      if (typeof setWizardStaffPref === "function") {
        setWizardStaffPref("female");
      }
      const asstSel = document.getElementById("new-assistant-select");
      if (asstSel) asstSel.value = "female";
      const wizAsstSel = document.getElementById("wizard-assistant-select");
      if (wizAsstSel) wizAsstSel.value = "female";

      const hint = document.getElementById("staff-selection-hint");
      if (hint) hint.textContent = "👩 ขอผู้ช่วยแพทย์หญิง";

      document.querySelectorAll(".staff-avatar-chip").forEach(el => {
        el.classList.remove("border-herbal-600", "bg-herbal-50", "ring-2", "ring-herbal-400", "text-herbal-900", "font-bold", "shadow-xs");
        el.classList.add("border-slate-200", "bg-white", "text-slate-700", "font-medium");
      });

      if (typeof updateWizardSlotFeedbackUi === "function") {
        updateWizardSlotFeedbackUi();
      }
    }

    function resetAndOpenWizard() {
      resetBookingWizard();
      openBookingWizard(1);
    }

    function onWizardDateChanged() {
      const dateInput = document.getElementById("wizard-book-date");
      const dateVal = dateInput ? (dateInput.value || todayStr) : todayStr;
      wizardBookingData.bookDate = dateVal;

      const holCheck = checkDateHoliday(dateVal);
      const thaiText = document.getElementById("wizard-date-thai-text");
      const statusBadge = document.getElementById("wizard-date-status-badge");
      const noticeBox = document.getElementById("wizard-holiday-notice-box");

      if (thaiText) thaiText.textContent = `🗓️ ${formatThaiDate(dateVal)}`;

      if (holCheck.isClosed) {
        if (statusBadge) {
          statusBadge.textContent = "ปิดทำการ";
          statusBadge.className = "px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-rose-100 text-rose-800 border border-rose-300";
        }
        if (noticeBox) {
          noticeBox.classList.remove("hidden");
          noticeBox.className = "p-3.5 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 rounded-xl text-xs text-rose-800 dark:text-rose-300 space-y-1";
          noticeBox.innerHTML = `
            <div class="font-extrabold flex items-center gap-1 text-sm"><span>🚫</span> ${escapeHtml(holCheck.title)}</div>
            <p class="text-rose-700 dark:text-rose-400 font-medium">${escapeHtml(holCheck.description || 'คลินิกปิดทำการในวันที่เลือก กรุณาเลือกวันอื่น')}</p>
          `;
        }
      } else {
        const isSat = (holCheck.holidayType === 'saturday');
        if (statusBadge) {
          statusBadge.textContent = isSat ? "เสาร์ (ครึ่งวัน)" : "เปิดบริการปกติ";
          statusBadge.className = isSat ? "px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-100 text-amber-900 border border-amber-300" : "px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300";
        }
        if (noticeBox) {
          if (isSat) {
            noticeBox.classList.remove("hidden");
            noticeBox.className = "p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 rounded-xl text-xs text-amber-900 dark:text-amber-200";
            noticeBox.innerHTML = `⚡ วันเสาร์เปิดบริการครึ่งวัน: <strong>08:30 - 12:30 น.</strong>`;
          } else {
            noticeBox.classList.add("hidden");
          }
        }
      }

      // Sync with inline legacy date input
      const inlineDate = document.getElementById("new-book-date");
      if (inlineDate) inlineDate.value = dateVal;

      // Update Step 2 date tag & slot grid
      const step2DateTag = document.getElementById("wizard-step2-date-tag");
      if (step2DateTag) step2DateTag.textContent = `📅 ${formatThaiDateShort(dateVal)}`;

      renderWizardSlotGrid(dateVal, true);
      populateWizardAssistantsDropdown();
    }

    function setWizardDatePreset(daysOffset) {
      const d = new Date();
      d.setDate(d.getDate() + daysOffset);
      const iso = d.toISOString().split("T")[0];
      const dateInput = document.getElementById("wizard-book-date");
      if (dateInput) {
        dateInput.value = iso;
        onWizardDateChanged();
      }
    }

    function setWizardDateNextSaturday() {
      const d = new Date();
      const day = d.getDay();
      const diff = (6 - day + 7) % 7 || 7;
      d.setDate(d.getDate() + diff);
      const iso = d.toISOString().split("T")[0];
      const dateInput = document.getElementById("wizard-book-date");
      if (dateInput) {
        dateInput.value = iso;
        onWizardDateChanged();
      }
    }

    function populateWizardAssistantsDropdown() {
      const sel = document.getElementById("wizard-assistant-select");
      if (!sel) return;
      const dateVal = wizardBookingData.bookDate || (typeof todayStr !== "undefined" ? todayStr : "");
      const timeSlot = wizardBookingData.timeSlot || "";
      const twoSlots = typeof isTwoSlotsSelected === "function" ? isTwoSlotsSelected("new") : false;
      const genderAvail = typeof getGenderAvailability === "function" ? getGenderAvailability(dateVal, timeSlot, twoSlots) : { freeStaff: [] };
      const availableStaff = genderAvail.freeStaff || [];

      sel.innerHTML = `<option value="female">👩 ไม่ระบุเจาะจง (ขอผู้ช่วยหญิง)</option><option value="male">👨 ไม่ระบุเจาะจง (ขอผู้ช่วยชาย)</option>`;

      availableStaff.forEach(st => {
        const opt = document.createElement("option");
        opt.value = st.id;
        opt.textContent = `👤 ${st.nickname || st.name} (${st.gender === 'male' ? 'ชาย' : 'หญิง'})`;
        sel.appendChild(opt);
      });
    }

    function onWizardAssistantSelectChange(val) {
      wizardBookingData.assistantId = val;
      if (val === "female") {
        setWizardStaffPref("female");
      } else if (val === "male") {
        setWizardStaffPref("male");
      } else {
        const asst = assistants.find(a => a.id === val);
        wizardBookingData.assistantNick = asst ? (asst.nickname || asst.name) : val;
        document.querySelectorAll(".wizard-staff-chip").forEach(c => {
          c.className = "wizard-staff-chip px-2.5 py-2 rounded-xl text-xs font-medium border flex items-center justify-center gap-1.5 transition cursor-pointer bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50";
        });
      }
    }

    function setWizardStaffPref(type) {
      wizardBookingData.assistantId = type;
      if (type === "auto") wizardBookingData.assistantNick = "ไม่ระบุ (จัดสรรตามเหมาะสม)";
      else if (type === "female") wizardBookingData.assistantNick = "ขอผู้หญิง";
      else if (type === "male") wizardBookingData.assistantNick = "ขอผู้ชาย";

      const sel = document.getElementById("wizard-assistant-select");
      if (sel && (type === "female" || type === "male")) {
        sel.value = type;
      }

      document.querySelectorAll(".wizard-staff-chip").forEach(c => {
        c.className = "wizard-staff-chip px-2.5 py-2 rounded-xl text-xs font-medium border flex items-center justify-center gap-1.5 transition cursor-pointer bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50";
      });

      const activeChip = document.getElementById(`wizard-chip-${type}`);
      if (activeChip) {
        activeChip.className = "wizard-staff-chip px-2.5 py-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition cursor-pointer bg-herbal-700 text-white border-herbal-700 shadow-2xs";
      }

      // Sync with inline assistant
      if (typeof selectQuickChip === "function" && (type === "female" || type === "male")) {
        selectQuickChip(type);
      }
    }

    function updateWizardSlotFeedbackUi() {
      const fb = document.getElementById("wizard-selected-slot-feedback");
      if (!fb) return;

      if (wizardBookingData.timeSlot) {
        let nick = wizardBookingData.assistantNick || "ไม่ระบุ (จัดสรรตามความเหมาะสม)";
        let icon = "✨";
        if (wizardBookingData.assistantId === "female" || (nick && nick.includes("ขอผู้หญิง"))) icon = "👩";
        else if (wizardBookingData.assistantId === "male" || (nick && nick.includes("ขอผู้ชาย"))) icon = "👨";
        else if (wizardBookingData.assistantId && wizardBookingData.assistantId !== "auto") icon = "👤";

        fb.innerHTML = `
          <div class="flex items-center gap-2 flex-wrap">
            <span class="text-emerald-900 dark:text-emerald-200 font-extrabold flex items-center gap-1">
              <span>✅ เลือกรอบ:</span>
              <span class="text-emerald-700 dark:text-emerald-300 font-black font-mono text-sm bg-white dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-emerald-300 shadow-2xs">${formatTimeLabel(wizardBookingData.timeSlot)}</span>
            </span>
            <span class="text-slate-400">•</span>
            <span class="text-slate-700 dark:text-slate-300 font-semibold">ผู้ช่วยแพทย์: <strong class="text-herbal-900 dark:text-emerald-200">${icon} ${escapeHtml(nick)}</strong></span>
          </div>
        `;
      } else {
        fb.innerHTML = `<span class="text-slate-600 dark:text-slate-400 font-medium">⏰ กรุณาคลิกเลือกรอบเวลา (สีเขียว) ที่ต้องการด้านล่าง</span>`;
      }
    }

    function selectWizardSlotClassic(slot, assistantId, isAvailable) {
      if (!isAvailable) {
        const dateVal = wizardBookingData.bookDate || todayStr;
        const slotConf = typeof getSlotConfigForDate === "function" ? getSlotConfigForDate(dateVal, slot) : { enabled: true };
        let msg = `รอบเวลา ${formatCleanTime(slot)} คิวเต็มแล้ว กรุณาเลือกรอบอื่น`;
        let desc = `ขณะนี้รอบเวลา ${formatCleanTime(slot)} มีการจองคิวเต็มโควตา หรือผู้ช่วยแพทย์ติดนัดหมายครบทุกท่านแล้ว กรุณาเลือกรอบเวลาอื่นที่ยังว่าง`;
        
        if (slotConf && !slotConf.enabled) {
          msg = `รอบเวลา ${formatCleanTime(slot)} ปิดให้บริการในวันนี้`;
          desc = `รอบเวลานี้ปิดรับนัดหมายตามการตั้งค่าของคลินิก กรุณาเลือกรอบเวลาอื่น`;
        } else if (assistantId === 'male') {
          msg = `รอบเวลา ${formatCleanTime(slot)} ผู้ช่วยแพทย์ชายคิวเต็มแล้ว`;
          desc = `ผู้ช่วยแพทย์ชายทุกท่านในรอบเวลา ${formatCleanTime(slot)} ติดนัดหมายเต็มแล้ว กรุณาเลือกรอบอื่นหรือเลือกผู้ช่วยแพทย์หญิง`;
        } else if (assistantId === 'female') {
          msg = `รอบเวลา ${formatCleanTime(slot)} ผู้ช่วยแพทย์หญิงคิวเต็มแล้ว`;
          desc = `ผู้ช่วยแพทย์หญิงทุกท่านในรอบเวลา ${formatCleanTime(slot)} ติดนัดหมายเต็มแล้ว กรุณาเลือกรอบอื่นหรือเลือกผู้ช่วยแพทย์ชาย`;
        } else if (assistantId && assistantId !== 'auto') {
          const asst = (assistants || []).find(a => a.id === assistantId);
          const asstNick = asst ? (asst.nickname || asst.name) : 'ผู้ช่วยแพทย์';
          const genderAvail = typeof getGenderAvailability === "function" ? getGenderAvailability(dateVal, slot, false) : null;
          const isMale = asst ? (typeof isMaleAssistant === "function" ? isMaleAssistant(asst) : (asst.gender === 'male')) : false;
          const isGenderFull = asst && genderAvail && ((isMale ? genderAvail.maleFreeCount : genderAvail.femaleFreeCount) <= 0);

          if (isGenderFull) {
            msg = `รอบเวลา ${formatCleanTime(slot)} คิวผู้ช่วยแพทย์${isMale ? 'ชาย' : 'หญิง'}เต็มแล้ว`;
            desc = `ผู้ช่วยแพทย์${isMale ? 'ชาย' : 'หญิง'}ที่เช็คชื่อเข้างานในรอบเวลา ${formatCleanTime(slot)} ติดนัดหมายเต็มแล้ว กรุณาเลือกรอบอื่น`;
          } else {
            msg = `รอบเวลา ${formatCleanTime(slot)} ของ${asstNick} คิวเต็มแล้ว`;
            desc = `${asstNick} ติดนัดหมายหรือไม่อยู่เวรในรอบเวลานี้ กรุณาเลือกรอบเวลาอื่น หรือเลือกผู้ช่วยแพทย์ท่านอื่น`;
          }
        }

        openSlotFullAlertModal(slot, msg, desc);
        showToast(msg, "error");
        return;
      }

      wizardBookingData.timeSlot = slot;
      wizardBookingData.assistantId = assistantId;

      if (assistantId === "auto" || !assistantId) {
        wizardBookingData.assistantNick = "ไม่ระบุ (จัดสรรตามความเหมาะสม)";
      } else if (assistantId === "female") {
        wizardBookingData.assistantNick = "ไม่ระบุ (ขอผู้หญิง)";
      } else if (assistantId === "male") {
        wizardBookingData.assistantNick = "ไม่ระบุ (ขอผู้ชาย)";
      } else {
        const asst = assistants.find(a => a.id === assistantId);
        wizardBookingData.assistantNick = asst ? (asst.nickname || asst.name) : "ไม่ระบุ";
      }

      // Sync inline hidden inputs if present
      const slotSelect = document.getElementById("new-time-slot");
      if (slotSelect) slotSelect.value = slot;

      renderWizardSlotGrid(wizardBookingData.bookDate, false);
      showToast(`✅ เลือกรอบ ${formatCleanTime(slot)} (${wizardBookingData.assistantNick}) เรียบร้อย`, "success");
    }

    function jumpToAssistantSlot(asstId, asstName) {
      const card = document.getElementById("asst-slot-card-" + asstId);
      if (card) {
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        card.classList.add("ring-4", "ring-emerald-400", "dark:ring-emerald-500", "bg-emerald-50/90", "dark:bg-emerald-950/40", "shadow-md");
        setTimeout(() => {
          card.classList.remove("ring-4", "ring-emerald-400", "dark:ring-emerald-500", "bg-emerald-50/90", "dark:bg-emerald-950/40", "shadow-md");
        }, 2200);
        if (asstName) {
          showToast(`🔍 ดูรอบเวลาของ ${asstName}`, "info");
        }
      } else {
        showToast(`ไม่พบตารางรอบเวลาของผู้ช่วยฯ ${asstName || ''}`, "warning");
      }
    }

    function renderWizardSlotGrid(dateVal, resetScroll = false) {
      const container = document.getElementById("wizard-slot-matrix-container");
      if (!container) return;

      const wizardBodyScroll = document.getElementById("wizard-body-scroll");
      const prevScrollTop = (!resetScroll && wizardBodyScroll) ? wizardBodyScroll.scrollTop : 0;

      container.innerHTML = "";

      const dateTag = document.getElementById("wizard-step2-date-tag");
      if (dateTag) {
        dateTag.textContent = `วันที่: ${formatThaiDate(dateVal)} (${dateVal})`;
      }

      const holCheck = checkDateHoliday(dateVal);
      if (holCheck.isClosed) {
        container.innerHTML = `
          <div class="p-5 text-center bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-2xl space-y-1.5">
            <div class="text-2xl">🗓️❌</div>
            <div class="text-sm font-extrabold text-rose-800 dark:text-rose-300">${escapeHtml(holCheck.title)}</div>
            <div class="text-xs text-rose-600 dark:text-rose-400 font-normal">${escapeHtml(holCheck.description)}</div>
          </div>
        `;
        updateWizardSlotFeedbackUi();
        return;
      }

      const slots = holCheck.slots || [];
      if (slots.length === 0) {
        container.innerHTML = `<div class="p-5 text-center text-rose-600 font-bold bg-rose-50 dark:bg-rose-950/40 rounded-xl text-xs">คลินิกปิดทำการในวันที่เลือก</div>`;
        updateWizardSlotFeedbackUi();
        return;
      }

      const activeAssts = (assistants || []).filter(a => {
        if (!a || a.active === false || a.canMassage === false) return false;
        const isOff = (typeof isAssistantOnLeaveOnDate === "function")
          ? isAssistantOnLeaveOnDate(a.id, dateVal)
          : (typeof getAssistantDutyStatusForDate === "function" ? getAssistantDutyStatusForDate(a, dateVal).isOff : false);
        return !isOff;
      });
      const rosterForDate = (typeof assistantDutyRosters !== "undefined" && assistantDutyRosters[dateVal]) ? assistantDutyRosters[dateVal] : {};

      function sortAssistantsByCheckIn(list) {
        return [...list].sort((a, b) => {
          const aStatus = (typeof getAssistantDutyStatusForDate === "function") ? getAssistantDutyStatusForDate(a, dateVal) : { isOff: false };
          const bStatus = (typeof getAssistantDutyStatusForDate === "function") ? getAssistantDutyStatusForDate(b, dateVal) : { isOff: false };

          // On-duty first, off-duty last
          if (!aStatus.isOff && bStatus.isOff) return -1;
          if (aStatus.isOff && !bStatus.isOff) return 1;

          const aEntry = rosterForDate[a.id];
          const bEntry = rosterForDate[b.id];
          const aChecked = Boolean(aEntry && !aEntry.isExplicitlyEmpty && aEntry.shiftType !== 'off');
          const bChecked = Boolean(bEntry && !bEntry.isExplicitlyEmpty && bEntry.shiftType !== 'off');

          if (aChecked && bChecked) {
            const aNorm = typeof normalizeAssistantRosterEntry === "function" ? normalizeAssistantRosterEntry(aEntry) : aEntry;
            const bNorm = typeof normalizeAssistantRosterEntry === "function" ? normalizeAssistantRosterEntry(bEntry) : bEntry;
            const aTime = (aNorm.checkInTime || "99:99").trim().replace(" น.", "");
            const bTime = (bNorm.checkInTime || "99:99").trim().replace(" น.", "");
            if (aTime !== bTime) return aTime.localeCompare(bTime);
          } else if (aChecked && !bChecked) {
            return -1;
          } else if (!aChecked && bChecked) {
            return 1;
          }

          const aFree = getAssistantFreeSlotCount(a);
          const bFree = getAssistantFreeSlotCount(b);
          if (aFree > 0 && bFree === 0) return -1;
          if (aFree === 0 && bFree > 0) return 1;

          return (a.nickname || a.name).localeCompare(b.nickname || b.name, 'th');
        });
      }

      const femaleAssts = sortAssistantsByCheckIn(activeAssts.filter(a => a.gender === 'female'));
      const maleAssts = sortAssistantsByCheckIn(activeAssts.filter(a => a.gender === 'male'));

      // Helper to count available slots for an assistant
      function getAssistantFreeSlotCount(asst) {
        if (!asst || asst.active === false || asst.canMassage === false) return 0;
        const isOff = (typeof isAssistantOnLeaveOnDate === "function")
          ? isAssistantOnLeaveOnDate(asst.id, dateVal)
          : (typeof getAssistantDutyStatusForDate === "function" ? getAssistantDutyStatusForDate(asst, dateVal).isOff : false);
        if (isOff) return 0;

        let freeCount = 0;
        slots.forEach(slot => {
          const slotConf = getSlotConfigForDate(dateVal, slot);
          if (!slotConf.enabled) return;
          const isOccupied = appointments.some(apt => {
            if (apt.bookDate === dateVal && (apt.assistantId === asst.id || (apt.assistantNick && apt.assistantNick === asst.nickname))) {
              if (apt.status === "🔴 ส่งต่อ" || apt.status === "ยกเลิก") return false;
              const aptSlots = (apt.slotsOccupied && apt.slotsOccupied.length > 0) ? apt.slotsOccupied : [apt.timeSlot];
              return aptSlots.includes(slot);
            }
            return false;
          });
          if (isOccupied) return;

          const genderAvail = getGenderAvailability(dateVal, slot, false);
          const isMale = typeof isMaleAssistant === "function" ? isMaleAssistant(asst) : (asst.gender === 'male');
          const isGenderFull = isMale ? (genderAvail.maleFreeCount <= 0) : (genderAvail.femaleFreeCount <= 0);
          if (isGenderFull) return;

          freeCount++;
        });
        return freeCount;
      }

      // 1. Box A: "ไม่ระบุ (แต่ขอผู้ช่วยแพทย์หญิง)" - Compact
      const femaleBox = document.createElement("div");
      femaleBox.className = "border border-rose-300 dark:border-rose-900/80 rounded-xl p-2.5 sm:p-3 bg-rose-50/60 dark:bg-rose-950/20 space-y-2 shadow-2xs";

      let femaleSlotPills = slots.map(slot => {
        const slotConf = getSlotConfigForDate(dateVal, slot);
        if (!slotConf.enabled) {
          return `
            <div class="text-center p-1 sm:p-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700 opacity-60 cursor-not-allowed">
              <div class="font-bold text-[11px] sm:text-xs font-mono">${slot}</div>
              <div class="text-[9px] font-normal">ปิดรอบ</div>
            </div>
          `;
        }

        const genderAvail = getGenderAvailability(dateVal, slot, false);
        const femaleFree = genderAvail.femaleFreeCount;
        const isSlotAvailable = femaleFree > 0;
        const isSelected = (wizardBookingData.timeSlot === slot && wizardBookingData.assistantId === "female");

        const cardClass = isSelected
          ? "bg-rose-600 text-white ring-2 ring-amber-300 ring-offset-1 border border-rose-400 shadow-xs font-bold"
          : isSlotAvailable
            ? "bg-rose-700 hover:bg-rose-800 text-white shadow-2xs cursor-pointer active:scale-95"
            : "bg-slate-100 dark:bg-slate-800/80 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700 opacity-60 cursor-not-allowed";

        return `
          <div class="text-center p-1 sm:p-1.5 rounded-lg text-xs font-semibold transition transform ${cardClass}" onclick="selectWizardSlotClassic('${slot}', 'female', ${isSlotAvailable})" title="${isSlotAvailable ? `คลิกเพื่อเลือกรอบเวลานี้ (ผู้ช่วยแพทย์หญิงว่าง ${femaleFree} ท่าน)` : 'ผู้ช่วยแพทย์หญิงติดนัดหมดแล้ว'}">
            <div class="font-bold text-[11px] sm:text-xs font-mono">${slot}</div>
            <div class="text-[9px] sm:text-[9.5px] ${isSelected ? 'text-amber-200 font-bold' : isSlotAvailable ? 'text-rose-100' : 'text-slate-400 dark:text-slate-500'} font-normal">
              ${isSelected ? '✅ เลือกแล้ว' : isSlotAvailable ? `ว่าง (${femaleFree})` : 'เต็ม'}
            </div>
          </div>
        `;
      }).join("");

      femaleBox.innerHTML = `
        <div class="flex items-center justify-between gap-1 border-b border-rose-200 dark:border-rose-900/60 pb-1.5">
          <div class="font-bold text-xs text-rose-900 dark:text-rose-200 flex items-center space-x-1.5">
            <span class="text-sm">👩</span>
            <span>ไม่ระบุ (แต่ขอผู้ช่วยแพทย์หญิง)</span>
          </div>
          <span class="text-[10px] text-rose-800 dark:text-rose-200 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-800 font-bold shadow-2xs">
            👩 เฉพาะผู้หญิง
          </span>
        </div>
        <p class="text-[10.5px] text-rose-700/80 dark:text-rose-300/80">ระบบจะจัดสรรผู้ช่วยแพทย์หญิงที่ว่างให้ตามความเหมาะสมในรอบเวลาที่เลือก</p>
        <div class="grid grid-cols-4 sm:grid-cols-6 gap-1 sm:gap-1.5 pt-0.5">
          ${femaleSlotPills}
        </div>
      `;
      container.appendChild(femaleBox);

      // 2. Box B: "ไม่ระบุ (แต่ขอผู้ช่วยแพทย์ชาย)" - Compact
      const maleBox = document.createElement("div");
      maleBox.className = "border border-sky-300 dark:border-sky-900/80 rounded-xl p-2.5 sm:p-3 bg-sky-50/60 dark:bg-sky-950/20 space-y-2 shadow-2xs";

      let maleSlotPills = slots.map(slot => {
        const slotConf = getSlotConfigForDate(dateVal, slot);
        if (!slotConf.enabled) {
          return `
            <div class="text-center p-1 sm:p-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700 opacity-60 cursor-not-allowed">
              <div class="font-bold text-[11px] sm:text-xs font-mono">${slot}</div>
              <div class="text-[9px] font-normal">ปิดรอบ</div>
            </div>
          `;
        }

        const genderAvail = getGenderAvailability(dateVal, slot, false);
        const maleFree = genderAvail.maleFreeCount;
        const isSlotAvailable = maleFree > 0;
        const isSelected = (wizardBookingData.timeSlot === slot && wizardBookingData.assistantId === "male");

        const cardClass = isSelected
          ? "bg-sky-600 text-white ring-2 ring-amber-300 ring-offset-1 border border-sky-400 shadow-xs font-bold"
          : isSlotAvailable
            ? "bg-sky-700 hover:bg-sky-800 text-white shadow-2xs cursor-pointer active:scale-95"
            : "bg-slate-100 dark:bg-slate-800/80 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700 opacity-60 cursor-not-allowed";

        return `
          <div class="text-center p-1 sm:p-1.5 rounded-lg text-xs font-semibold transition transform ${cardClass}" onclick="selectWizardSlotClassic('${slot}', 'male', ${isSlotAvailable})" title="${isSlotAvailable ? `คลิกเพื่อเลือกรอบเวลานี้ (ผู้ช่วยแพทย์ชายว่าง ${maleFree} ท่าน)` : 'ผู้ช่วยแพทย์ชายติดนัดหมดแล้ว'}">
            <div class="font-bold text-[11px] sm:text-xs font-mono">${slot}</div>
            <div class="text-[9px] sm:text-[9.5px] ${isSelected ? 'text-amber-200 font-bold' : isSlotAvailable ? 'text-sky-100' : 'text-slate-400 dark:text-slate-500'} font-normal">
              ${isSelected ? '✅ เลือกแล้ว' : isSlotAvailable ? `ว่าง (${maleFree})` : 'เต็ม'}
            </div>
          </div>
        `;
      }).join("");

      maleBox.innerHTML = `
        <div class="flex items-center justify-between gap-1 border-b border-sky-200 dark:border-sky-900/60 pb-1.5">
          <div class="font-bold text-xs text-sky-900 dark:text-sky-200 flex items-center space-x-1.5">
            <span class="text-sm">👨</span>
            <span>ไม่ระบุ (แต่ขอผู้ช่วยแพทย์ชาย)</span>
          </div>
          <span class="text-[10px] text-sky-800 dark:text-sky-200 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-full border border-sky-200 dark:border-sky-800 font-bold shadow-2xs">
            👨 เฉพาะผู้ชาย
          </span>
        </div>
        <p class="text-[10.5px] text-sky-700/80 dark:text-sky-300/80">ระบบจะจัดสรรผู้ช่วยแพทย์ชายที่ว่างให้ตามความเหมาะสมในรอบเวลาที่เลือก</p>
        <div class="grid grid-cols-4 sm:grid-cols-6 gap-1 sm:gap-1.5 pt-0.5">
          ${maleSlotPills}
        </div>
      `;
      container.appendChild(maleBox);

      // 3. Quick Jump Directory: All Assistants by Gender (รายชื่อผู้ช่วยแพทย์ทั้งหมด เรียงชาย-หญิง)
      const directoryBox = document.createElement("div");
      directoryBox.className = "border border-slate-200 dark:border-slate-700/80 rounded-xl p-3 bg-gradient-to-br from-slate-50 via-white to-emerald-50/40 dark:from-slate-850 dark:via-slate-850 dark:to-slate-900 space-y-2.5 shadow-2xs";

      // Female Assistant Quick Chips
      const femaleChips = femaleAssts.map(asst => {
        const isOff = (typeof isAssistantOnLeaveOnDate === "function")
          ? isAssistantOnLeaveOnDate(asst.id, dateVal)
          : (typeof getAssistantDutyStatusForDate === "function" ? getAssistantDutyStatusForDate(asst, dateVal).isOff : false);
        const freeCount = isOff ? 0 : getAssistantFreeSlotCount(asst);
        const hasFree = freeCount > 0;
        const isCurrent = wizardBookingData.assistantId === asst.id;
        const nick = escapeHtml(asst.nickname || asst.name);

        let statusBadgeText = 'เต็ม';
        let statusBadgeClass = 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold';
        let btnBgClass = 'bg-slate-100 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700';

        if (isOff) {
          statusBadgeText = 'ลาเวร';
          statusBadgeClass = 'bg-slate-200 dark:bg-slate-700 text-slate-500 font-bold';
          btnBgClass = 'bg-slate-100 dark:bg-slate-800/60 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700 opacity-60';
        } else if (hasFree) {
          statusBadgeText = `ว่าง ${freeCount}`;
          statusBadgeClass = isCurrent ? 'bg-white text-rose-700 font-black' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold';
          btnBgClass = isCurrent ? 'bg-rose-600 text-white border-rose-700 shadow-xs ring-2 ring-rose-400' : 'bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 text-rose-900 dark:text-rose-200 border-rose-200 dark:border-rose-800';
        } else {
          statusBadgeText = 'เต็ม';
          statusBadgeClass = 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold';
          btnBgClass = isCurrent ? 'bg-rose-600 text-white border-rose-700 shadow-xs ring-2 ring-rose-400' : 'bg-slate-100 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700';
        }

        const chipTitle = isOff
          ? `${nick} (ลาเวร / พัก ในวันที่เลือก)`
          : `${nick} (พร้อมให้บริการ - ${hasFree ? `ว่าง ${freeCount} รอบ` : 'เต็มทุกรอบ'})`;

        return `
          <button type="button" onclick="jumpToAssistantSlot('${asst.id}', '${nick}')" class="px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition cursor-pointer active:scale-95 ${btnBgClass}" title="${chipTitle}">
            <span>👩 ${nick}</span>
            <span class="text-[9.5px] px-1.5 py-0.2 rounded-full font-bold ${statusBadgeClass}">
              ${statusBadgeText}
            </span>
          </button>
        `;
      }).join("");

      // Male Assistant Quick Chips
      const maleChips = maleAssts.map(asst => {
        const isOff = (typeof isAssistantOnLeaveOnDate === "function")
          ? isAssistantOnLeaveOnDate(asst.id, dateVal)
          : (typeof getAssistantDutyStatusForDate === "function" ? getAssistantDutyStatusForDate(asst, dateVal).isOff : false);
        const freeCount = isOff ? 0 : getAssistantFreeSlotCount(asst);
        const hasFree = freeCount > 0;
        const isCurrent = wizardBookingData.assistantId === asst.id;
        const nick = escapeHtml(asst.nickname || asst.name);

        let statusBadgeText = 'เต็ม';
        let statusBadgeClass = 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold';
        let btnBgClass = 'bg-slate-100 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700';

        if (isOff) {
          statusBadgeText = 'ลาเวร';
          statusBadgeClass = 'bg-slate-200 dark:bg-slate-700 text-slate-500 font-bold';
          btnBgClass = 'bg-slate-100 dark:bg-slate-800/60 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700 opacity-60';
        } else if (hasFree) {
          statusBadgeText = `ว่าง ${freeCount}`;
          statusBadgeClass = isCurrent ? 'bg-white text-sky-700 font-black' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold';
          btnBgClass = isCurrent ? 'bg-sky-600 text-white border-sky-700 shadow-xs ring-2 ring-sky-400' : 'bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/40 dark:hover:bg-sky-900/50 text-sky-900 dark:text-sky-200 border-sky-200 dark:border-sky-800';
        } else {
          statusBadgeText = 'เต็ม';
          statusBadgeClass = 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold';
          btnBgClass = isCurrent ? 'bg-sky-600 text-white border-sky-700 shadow-xs ring-2 ring-sky-400' : 'bg-slate-100 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700';
        }

        const chipTitle = isOff
          ? `${nick} (ลาเวร / พัก ในวันที่เลือก)`
          : `${nick} (พร้อมให้บริการ - ${hasFree ? `ว่าง ${freeCount} รอบ` : 'เต็มทุกรอบ'})`;

        return `
          <button type="button" onclick="jumpToAssistantSlot('${asst.id}', '${nick}')" class="px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition cursor-pointer active:scale-95 ${btnBgClass}" title="${chipTitle}">
            <span>👨 ${nick}</span>
            <span class="text-[9.5px] px-1.5 py-0.2 rounded-full font-bold ${statusBadgeClass}">
              ${statusBadgeText}
            </span>
          </button>
        `;
      }).join("");

      directoryBox.innerHTML = `
        <div class="flex items-center justify-between gap-1 border-b border-slate-200 dark:border-slate-700/80 pb-1.5 flex-wrap">
          <div class="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center space-x-1.5">
            <span class="text-sm">👥</span>
            <span>รายชื่อผู้ช่วยแพทย์แผนไทยที่พร้อมให้บริการ (คลิกที่ชื่อเพื่อดูรอบเวลา & จองคิว)</span>
          </div>
          <div class="flex items-center gap-1.5 flex-wrap">
            <span class="text-[10px] text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full font-bold">
              🟢 พร้อมให้บริการ ${activeAssts.length} ท่าน
            </span>
          </div>
        </div>

        <!-- Group: Female Assistants -->
        <div class="space-y-1">
          <div class="text-[11px] font-bold text-rose-800 dark:text-rose-300 flex items-center gap-1">
            <span>👩 ผู้ช่วยแพทย์หญิง (${femaleAssts.length} ท่าน):</span>
          </div>
          <div class="flex flex-wrap gap-1.5">
            ${femaleChips || '<span class="text-[11px] text-slate-400">ไม่มีผู้ช่วยแพทย์หญิงที่พร้อมให้บริการในวันที่เลือก</span>'}
          </div>
        </div>

        <!-- Group: Male Assistants -->
        <div class="space-y-1 pt-1.5 border-t border-slate-200/80 dark:border-slate-700/60">
          <div class="text-[11px] font-bold text-sky-800 dark:text-sky-300 flex items-center gap-1">
            <span>👨 ผู้ช่วยแพทย์ชาย (${maleAssts.length} ท่าน):</span>
          </div>
          <div class="flex flex-wrap gap-1.5">
            ${maleChips || '<span class="text-[11px] text-slate-400">ไม่มีผู้ช่วยแพทย์ชายที่พร้อมให้บริการในวันที่เลือก</span>'}
          </div>
        </div>
      `;
      container.appendChild(directoryBox);

      // 4. Section Header: ตารางรอบเวลาของผู้ช่วยแพทย์แต่ละท่าน
      const asstHeader = document.createElement("div");
      asstHeader.className = "pt-2 font-bold text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1.5";
      asstHeader.innerHTML = `<i data-lucide="users" class="w-4 h-4 text-emerald-600 dark:text-emerald-400"></i> <span>ตารางรอบเวลาของผู้ช่วยแพทย์แต่ละท่าน (ระบุเฉพาะเจาะจง):</span>`;
      container.appendChild(asstHeader);

      // 5. Individual Assistants Cards (Female then Male)
      const sortedAsstsForCards = [...femaleAssts, ...maleAssts];

      sortedAsstsForCards.forEach(asst => {
        const isOff = (typeof isAssistantOnLeaveOnDate === "function")
          ? isAssistantOnLeaveOnDate(asst.id, dateVal)
          : (typeof getAssistantDutyStatusForDate === "function" ? getAssistantDutyStatusForDate(asst, dateVal).isOff : false);

        const asstBox = document.createElement("div");
        asstBox.id = "asst-slot-card-" + asst.id;
        asstBox.className = "border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 sm:p-3 bg-white dark:bg-slate-800/90 space-y-1.5 shadow-2xs transition-all duration-300";

        let slotPills = slots.map(slot => {
          const slotConf = getSlotConfigForDate(dateVal, slot);
          if (!slotConf.enabled) {
            return `
              <div class="text-center p-1 sm:p-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700 opacity-60 cursor-not-allowed">
                <div class="font-bold text-[11px] sm:text-xs font-mono">${slot}</div>
                <div class="text-[9px] font-normal">ปิดรอบ</div>
              </div>
            `;
          }

          const isOccupied = appointments.some(apt => {
            if (apt.bookDate === dateVal && (apt.assistantId === asst.id || (apt.assistantNick && apt.assistantNick === asst.nickname))) {
              if (apt.status === "🔴 ส่งต่อ" || apt.status === "ยกเลิก") return false;
              const aptSlots = (apt.slotsOccupied && apt.slotsOccupied.length > 0) ? apt.slotsOccupied : [apt.timeSlot];
              return aptSlots.includes(slot);
            }
            return false;
          });

          const genderAvail = getGenderAvailability(dateVal, slot, false);
          const isMale = typeof isMaleAssistant === "function" ? isMaleAssistant(asst) : (asst.gender === 'male');
          const isGenderFull = isMale ? (genderAvail.maleFreeCount <= 0) : (genderAvail.femaleFreeCount <= 0);

          const isSelected = (wizardBookingData.timeSlot === slot && wizardBookingData.assistantId === asst.id);
          const isAvailable = !isOff && !isOccupied && !isGenderFull;

          let cardClass = "";
          let statusLabel = "ว่าง";

          if (isSelected) {
            cardClass = "bg-emerald-600 text-white ring-2 ring-emerald-400 ring-offset-1 border border-emerald-400 shadow-xs font-bold";
            statusLabel = "✅ เลือกแล้ว";
          } else if (isOff) {
            cardClass = "bg-slate-100 dark:bg-slate-800/60 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700 opacity-60 cursor-not-allowed";
            statusLabel = "ลาเวร";
          } else if (isOccupied || isGenderFull) {
            cardClass = "bg-rose-100 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50 cursor-not-allowed";
            statusLabel = isOccupied ? "ติดนัด" : "เต็ม";
          } else {
            cardClass = "bg-emerald-100 dark:bg-emerald-950/50 hover:bg-emerald-200 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 cursor-pointer active:scale-95";
            statusLabel = "ว่าง";
          }

          const toolTip = isOff
            ? `${escapeHtml(asst.nickname || asst.name)} ลาเวร / พัก ในวันที่เลือก`
            : isOccupied 
              ? 'ติดนัดหมาย' 
              : isGenderFull 
                ? `คิวผู้ช่วยแพทย์${isMale ? 'ชาย' : 'หญิง'}ในรอบนี้เต็มแล้ว` 
                : `คลิกเพื่อเลือกรอบเวลานี้กับ ${escapeHtml(asst.nickname || asst.name)}`;

          return `
            <div class="text-center p-1 sm:p-1.5 rounded-lg text-xs font-semibold transition transform ${cardClass}" onclick="selectWizardSlotClassic('${slot}', '${asst.id}', ${isAvailable})" title="${toolTip}">
              <div class="font-bold text-[11px] sm:text-xs font-mono">${slot}</div>
              <div class="text-[9px] sm:text-[9.5px] ${isSelected ? 'text-amber-200 font-bold' : (isOff || isOccupied || isGenderFull) ? 'text-slate-400 dark:text-slate-500' : 'font-normal'}">${statusLabel}</div>
            </div>
          `;
        }).join("");

        const genderEmoji = asst.gender === 'female' ? '👩' : '👨';
        const genderBadgeClass = asst.gender === 'female' 
          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-200 dark:border-rose-800'
          : 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border-sky-200 dark:border-sky-800';

        const statusBadgeHeader = isOff
          ? '<span class="text-[9.5px] px-2 py-0.2 rounded-full font-bold bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-300">⚪ ลาเวร / พัก</span>'
          : '<span class="text-[9.5px] px-2 py-0.2 rounded-full font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300">🟢 พร้อมให้บริการ</span>';

        asstBox.innerHTML = `
          <div class="font-bold text-xs text-slate-800 dark:text-slate-100 flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-700/60 flex-wrap gap-1">
            <div class="flex items-center space-x-1.5 flex-wrap">
              <span>${genderEmoji}</span>
              <span class="text-slate-900 dark:text-white font-bold">${escapeHtml(asst.nickname || asst.name)}</span>
              ${asst.nickname && asst.name !== asst.nickname ? `<span class="text-[10px] text-slate-400 font-normal hidden sm:inline">(${escapeHtml(asst.name)})</span>` : ''}
              <span class="text-[9.5px] px-1.5 py-0.2 rounded border font-semibold ${genderBadgeClass}">${asst.gender === 'female' ? 'หญิง' : 'ชาย'}</span>
              ${statusBadgeHeader}
            </div>
            ${wizardBookingData.assistantId === asst.id ? '<span class="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 rounded-full font-bold border border-emerald-300">✅ เลือกผู้ช่วยฯ คนนี้</span>' : ''}
          </div>
          <div class="grid grid-cols-4 sm:grid-cols-6 gap-1 sm:gap-1.5">
            ${slotPills}
          </div>
        `;
        container.appendChild(asstBox);
      });

      updateWizardSlotFeedbackUi();

      if (wizardBodyScroll) {
        if (resetScroll) {
          wizardBodyScroll.scrollTop = 0;
        } else {
          wizardBodyScroll.scrollTop = prevScrollTop;
        }
      }

      if (typeof lucide !== "undefined" && lucide.createIcons) {
        lucide.createIcons();
      }
    }

    function handleWizardMedicalSchemeChange() {
      const sel = document.getElementById("wizard-medicalScheme");
      const otherContainer = document.getElementById("wizard-medicalScheme-other-container");
      if (sel && otherContainer) {
        otherContainer.classList.toggle("hidden", sel.value !== "อื่นๆ");
      }
    }

    function renderWizardReviewSummary() {
      const box = document.getElementById("wizard-review-summary-box");
      if (!box) return;

      // Extract services from Step 3 inputs
      const mainSvcRadio = document.querySelector("#wizard-main-services-container input[name='mainService']:checked");
      wizardBookingData.mainService = mainSvcRadio ? mainSvcRadio.value : "";

      const extraCb = Array.from(document.querySelectorAll("#wizard-extra-services-container input[name='extraService']:checked")).map(cb => cb.value);
      wizardBookingData.extraServices = extraCb;

      let serviceDisplay = wizardBookingData.mainService;
      if (extraCb.length > 0) {
        serviceDisplay = serviceDisplay ? `${serviceDisplay} + ${extraCb.join(', ')}` : extraCb.join(', ');
      }
      if (!serviceDisplay) serviceDisplay = "บริการนวดและหัตถการทั่วไป";

      box.innerHTML = `
        <div class="flex items-center justify-between border-b border-emerald-200/60 dark:border-emerald-800/60 pb-2">
          <span class="text-xs font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1">
            <span>📋</span> สรุปรายการนัดหมายที่เลือก:
          </span>
          <button type="button" onclick="goToWizardStep(2)" class="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 hover:underline">
            แก้ไขรอบเวลา
          </button>
        </div>
        <div class="grid grid-cols-2 gap-2 text-xs pt-1">
          <div>
            <span class="text-slate-500 dark:text-slate-400 block text-[10.5px]">📅 วันที่นัด:</span>
            <span class="font-bold text-slate-800 dark:text-slate-100">${formatThaiDateShort(wizardBookingData.bookDate)}</span>
          </div>
          <div>
            <span class="text-slate-500 dark:text-slate-400 block text-[10.5px]">⏰ รอบเวลา:</span>
            <span class="font-bold text-emerald-700 dark:text-emerald-300 font-mono">${formatTimeLabel(wizardBookingData.timeSlot)}</span>
          </div>
          <div class="col-span-2">
            <span class="text-slate-500 dark:text-slate-400 block text-[10.5px]">🌿 หัตถการ:</span>
            <span class="font-bold text-herbal-800 dark:text-emerald-300">${escapeHtml(serviceDisplay)}</span>
          </div>
          <div>
            <span class="text-slate-500 dark:text-slate-400 block text-[10.5px]">👨‍⚕️ ผู้ให้บริการ:</span>
            <span class="font-bold text-slate-800 dark:text-slate-100">${escapeHtml(wizardBookingData.assistantNick || 'ไม่ระบุ')}</span>
          </div>
        </div>
      `;
    }

    function goToWizardStep(targetStep) {
      // Ensure scroll position is reset to top for every step
      const wizardBodyScroll = document.getElementById("wizard-body-scroll") || document.querySelector("#modal-booking-wizard .overflow-y-auto");
      if (wizardBodyScroll) {
        wizardBodyScroll.scrollTop = 0;
      }
      const wizardModalEl = document.getElementById("modal-booking-wizard");
      if (wizardModalEl) {
        wizardModalEl.scrollTop = 0;
      }
      if (targetStep < 1 || targetStep > 5) return;

      // Sync bookDate from DOM if available
      const dateInput = document.getElementById("wizard-book-date");
      if (dateInput && dateInput.value) {
        wizardBookingData.bookDate = dateInput.value;
      }
      if (!wizardBookingData.bookDate) {
        wizardBookingData.bookDate = typeof todayStr !== "undefined" ? todayStr : "";
      }

      // Validation Guards
      if (targetStep > 1) {
        const dateVal = wizardBookingData.bookDate;
        const holCheck = checkDateHoliday(dateVal);
        if (holCheck.isClosed) {
          showToast(`ไม่สามารถนัดหมายในวันที่คลินิกปิดทำการ: ${holCheck.title}`, "warning");
          return;
        }
      }

      if (targetStep > 2) {
        if (!wizardBookingData.timeSlot) {
          showToast("กรุณาเลือกรอบเวลาที่ต้องการนัดหมายในขั้นตอนที่ 2 ก่อน", "warning");
          targetStep = 2;
        }
      }

      if (targetStep > 3) {
        // Collect services
        const mainSvcRadio = document.querySelector("#wizard-main-services-container input[name='mainService']:checked");
        const extraCb = Array.from(document.querySelectorAll("#wizard-extra-services-container input[name='extraService']:checked")).map(cb => cb.value);
        if (!mainSvcRadio && extraCb.length === 0) {
          showToast("กรุณาเลือกหัตถการหลัก หรือบริการเสริมอย่างน้อย 1 รายการ", "warning");
          return;
        }
      }

      currentWizardStep = targetStep;

      // Update Step Badge in Header
      const badge = document.getElementById("wizard-step-badge");
      if (badge) {
        const stepLabels = [
          "ขั้นที่ 1/5: เลือกวันที่",
          "ขั้นที่ 2/5: เลือกรอบเวลา",
          "ขั้นที่ 3/5: เลือกหัตถการ",
          "ขั้นที่ 4/5: ข้อมูลผู้ป่วย",
          "ขั้นที่ 5/5: ใบนัดหมาย"
        ];
        badge.textContent = stepLabels[targetStep - 1] || `ขั้นที่ ${targetStep}/5`;
      }

      // Update Progress Track Bar
      const progressPercent = ((targetStep - 1) / 4) * 100;
      const track = document.getElementById("wizard-progress-track");
      if (track) track.style.width = `${progressPercent}%`;

      // Update Stepper Dots
      for (let i = 1; i <= 5; i++) {
        const dot = document.getElementById(`wizard-dot-${i}`);
        if (!dot) continue;
        const circle = dot.querySelector("div");
        const label = dot.querySelector("span");

        if (i < targetStep) {
          circle.className = "w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs border-2 transition-all bg-emerald-600 text-white border-emerald-600 shadow-xs";
          circle.innerHTML = `<i data-lucide="check" class="w-3.5 h-3.5"></i>`;
          if (label) label.className = "text-[10px] font-bold mt-1 text-emerald-800 dark:text-emerald-300";
        } else if (i === targetStep) {
          circle.className = "w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-extrabold text-xs border-2 transition-all bg-emerald-700 text-white border-emerald-400 ring-4 ring-emerald-100 dark:ring-emerald-950 shadow-md scale-110";
          circle.innerHTML = `<span>${i}</span>`;
          if (label) label.className = "text-[10px] font-extrabold mt-1 text-emerald-900 dark:text-emerald-100";
        } else {
          circle.className = "w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs border-2 transition-all bg-white dark:bg-slate-800 text-slate-400 border-slate-300 dark:border-slate-700";
          circle.innerHTML = `<span>${i}</span>`;
          if (label) label.className = "text-[10px] font-medium mt-1 text-slate-400 dark:text-slate-500";
        }
      }

      // Hide all steps and show active step
      for (let i = 1; i <= 5; i++) {
        const stepContainer = document.getElementById(`wizard-step-${i}`);
        if (stepContainer) {
          stepContainer.classList.toggle("hidden", i !== targetStep);
        }
      }

      // Dynamic Next Button Label
      const nextBtnLabel = document.getElementById("wizard-btn-next-label");
      if (nextBtnLabel) {
        if (targetStep === 1) nextBtnLabel.textContent = "ถัดไป: เลือกรอบเวลา";
        else if (targetStep === 2) nextBtnLabel.textContent = "ถัดไป: เลือกหัตถการ";
        else if (targetStep === 3) nextBtnLabel.textContent = "ถัดไป: กรอกข้อมูลผู้ป่วย";
      }

      // Update footer buttons
      const btnPrev = document.getElementById("wizard-btn-prev");
      const btnNext = document.getElementById("wizard-btn-next");
      const btnSubmit = document.getElementById("wizard-btn-submit");
      const btnFinish = document.getElementById("wizard-btn-finish");

      if (btnPrev) btnPrev.classList.toggle("hidden", targetStep === 1 || targetStep === 5);
      if (btnNext) btnNext.classList.toggle("hidden", targetStep >= 4);
      if (btnSubmit) btnSubmit.classList.toggle("hidden", targetStep !== 4);
      if (btnFinish) btnFinish.classList.toggle("hidden", targetStep !== 5);

      if (targetStep === 2) {
        renderWizardSlotGrid(wizardBookingData.bookDate, true);
        setTimeout(() => {
          const wBody = document.getElementById("wizard-body-scroll");
          if (wBody) wBody.scrollTop = 0;
          const mCont = document.getElementById("wizard-slot-matrix-container");
          if (mCont) mCont.scrollTop = 0;
        }, 20);
      } else if (targetStep === 4) {
        renderWizardReviewSummary();
        setTimeout(() => {
          const nameInp = document.getElementById("wizard-patientName");
          if (nameInp && !nameInp.value) nameInp.focus();
        }, 150);
      }

      if (typeof lucide !== "undefined" && lucide.createIcons) lucide.createIcons();
    }

    function wizardNextStep() {
      goToWizardStep(currentWizardStep + 1);
    }

    function wizardPrevStep() {
      goToWizardStep(currentWizardStep - 1);
    }

    async function submitWizardBooking() {
      const nameInput = document.getElementById("wizard-patientName");
      const patientName = nameInput ? nameInput.value.trim() : "";
      if (!patientName) {
        showToast("กรุณากรอกชื่อ-นามสกุล ผู้รับบริการ", "warning");
        if (nameInput) nameInput.focus();
        return;
      }

      const bookDate = wizardBookingData.bookDate;
      const timeSlot = wizardBookingData.timeSlot;

      if (!bookDate || !timeSlot) {
        showToast("กรุณาเลือกวันที่และรอบเวลาให้ถูกต้อง", "warning");
        goToWizardStep(1);
        return;
      }

      // Holiday Check
      const holCheck = checkDateHoliday(bookDate);
      if (holCheck.isClosed) {
        openHolidayAlertModal(holCheck, bookDate);
        showToast(`ไม่สามารถจองคิวได้: ${holCheck.title}`, "error");
        return;
      }

      // Capacity & Availability Check
      const slotConf = getSlotConfigForDate(bookDate, timeSlot);
      if (slotConf && !slotConf.enabled) {
        const msg = `รอบเวลา ${formatCleanTime(timeSlot)} ปิดให้บริการในวันนี้`;
        openSlotFullAlertModal(timeSlot, msg, "รอบเวลานี้ปิดให้บริการตามการตั้งค่าของคลินิก กรุณาเลือกรอบเวลาอื่น");
        showToast(msg, "error");
        goToWizardStep(2);
        return;
      }

      let assignedAssistantId = wizardBookingData.assistantId || "auto";
      const selectedExtras = Array.from(document.querySelectorAll("#wizard-extra-services-container input[name='extraService']:checked")).map(cb => cb.value);
      const requiresTwoSlots = selectedExtras.some(extraName => {
        const svc = extraServicesList.find(s => s.name === extraName);
        return svc && svc.twoSlots;
      });

      const slotsList = getSlotsForDate(bookDate);
      const currentIndex = slotsList.indexOf(timeSlot);
      const slotsOccupied = [timeSlot];
      if (requiresTwoSlots && currentIndex !== -1 && currentIndex + 1 < slotsList.length) {
        slotsOccupied.push(slotsList[currentIndex + 1]);
      }

      // Universal Conflict Validation (v5.4.2)
      const conflict = (typeof checkAssistantBookingConflict === "function") ? checkAssistantBookingConflict({
        assistantId: assignedAssistantId,
        bookDate: bookDate,
        timeSlot: timeSlot,
        slotsOccupied: slotsOccupied,
        requiresTwoSlots: requiresTwoSlots,
        patientName: patientName
      }) : { hasConflict: false };

      if (conflict && conflict.hasConflict) {
        if (typeof showAssistantConflictModal === "function") {
          showAssistantConflictModal(conflict, timeSlot, bookDate);
        }
        showToast(`❌ ไม่สามารถจองคิวได้: ${conflict.title}`, "error");
        goToWizardStep(2);
        return;
      }

      const citizenOrHn = document.getElementById("wizard-citizenOrHn")?.value.trim() || "-";
      const phone = document.getElementById("wizard-phone")?.value.trim() || "-";
      const schemeSel = document.getElementById("wizard-medicalScheme");
      let medicalScheme = schemeSel ? schemeSel.value : "บัตรทอง";
      if (medicalScheme === "อื่นๆ") {
        medicalScheme = document.getElementById("wizard-medicalScheme-other")?.value.trim() || "อื่นๆ";
      }
      const notes = document.getElementById("wizard-notes")?.value.trim() || "-";

      const mainSvcRadio = document.querySelector("#wizard-main-services-container input[name='mainService']:checked");
      const effectiveMainService = mainSvcRadio ? mainSvcRadio.value : (wizardBookingData.extraServices.length > 0 ? "บริการเสริม" : "นวดบำบัดรักษาและประคบสมุนไพร");

      const submitBtn = document.getElementById("wizard-btn-submit");
      const originalHtml = submitBtn ? submitBtn.innerHTML : "";
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> <span>กำลังบันทึกนัดหมาย...</span>`;
        if (typeof lucide !== "undefined" && lucide.createIcons) lucide.createIcons();
      }

      try {

        const slotsList = getSlotsForDate(bookDate);
        const currentIndex = slotsList.indexOf(timeSlot);
        const slotsOccupied = [timeSlot];
        if (requiresTwoSlots && currentIndex !== -1 && currentIndex + 1 < slotsList.length) {
          slotsOccupied.push(slotsList[currentIndex + 1]);
        }

        let assignedAssistantId = wizardBookingData.assistantId || "auto";
        let assignedNick = wizardBookingData.assistantNick || "ไม่ระบุ (จัดสรรตามความเหมาะสม)";

        const currentClientIp = "127.0.0.1";
        const dev = (typeof detectClientDevice === "function") ? detectClientDevice() : { deviceText: "Web Browser" };

        const newAppointment = {
          id: "APT-" + Date.now(),
          patientName,
          citizenOrHn,
          phone,
          medicalScheme,
          bookDate,
          timeSlot,
          slotsOccupied,
          mainService: effectiveMainService,
          extraServices: selectedExtras,
          assistantId: assignedAssistantId,
          assistantNick: assignedNick,
          notes,
          status: "🟢 รอดำเนินการ",
          createdAt: new Date().toISOString(),
          clientIp: currentClientIp,
          device: dev.deviceText
        };

        if (currentUser && currentUser.role === 'patient') {
          newAppointment.patientUserId = currentUser.id;
          newAppointment.createdBy = currentUser.username || currentUser.name;
        }

        // Save to Supabase Cloud
        try {
          if (supabaseClient) {
            const payload = mapAppointmentToSupabase(newAppointment);
            const { error } = await supabaseClient.from("appointments").insert([payload]);
            if (error) {
              console.warn("Supabase booking insert warning with medical_scheme, trying fallback:", error);
              const fallbackPayload = { ...payload };
              delete fallbackPayload.medical_scheme;
              const { error: fallbackError } = await supabaseClient.from("appointments").insert([fallbackPayload]);
              if (fallbackError) {
                console.error("Supabase booking insert error:", fallbackError);
                showToast("❌ บันทึกลงระบบ Cloud ไม่สำเร็จ: " + (fallbackError.message || "กรุณาตรวจสอบการเชื่อมต่อ"), "error");
              }
            }
          }
        } catch(sbErr) {
          console.warn("Supabase insert error:", sbErr);
        }

        appointments.push(newAppointment);
        persistAppointments();
        lastBookedAppointment = newAppointment;

        showToast(`จองคิวนัดหมายสำเร็จ: ${patientName} (${formatTimeLabel(timeSlot)})`, "success");

        // Render Step 5 (ใบนัด)
        renderWizardSlip(newAppointment);
        goToWizardStep(5);

        if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'staff')) {
          renderDeskQueue();
          renderStatsAndShare();
        }

      } catch(err) {
        console.error("Wizard submit error:", err);
        showToast("เกิดข้อผิดพลาดในการจองคิว: " + (err.message || "กรุณาลองใหม่"), "error");
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalHtml;
        }
      }
    }

    function renderWizardSlip(apt) {
      const container = document.getElementById("wizard-slip-render-container");
      if (!container) return;

      const extraText = (apt.extraServices && apt.extraServices.length > 0) ? ` + ${apt.extraServices.join(", ")}` : "";
      const serviceDisplay = (apt.mainService && apt.mainService !== "-" && apt.mainService !== "บริการเสริม") ? `${apt.mainService}${extraText}` : (apt.extraServices && apt.extraServices.length > 0 ? `บริการเสริม: ${apt.extraServices.join(", ")}` : "บริการนวดและหัตถการ");

      container.innerHTML = `
        <div id="wizard-summary-slip" class="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-md space-y-4 text-slate-800 font-sans relative overflow-hidden" style="background-color: #ffffff !important; color: #1e293b !important;">
          <!-- Top Accent Stripe -->
          <div class="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-herbal-700 via-emerald-600 to-teal-500"></div>

          <!-- Hospital Header Section -->
          <div class="flex items-center space-x-3.5 border-b border-dashed border-slate-200 pb-3.5 pt-1">
            <div class="w-13 h-13 sm:w-14 sm:h-14 flex-shrink-0 flex items-center justify-center rounded-full p-1 bg-white border border-slate-200/90 shadow-2xs overflow-hidden" style="width: 52px; height: 52px; min-width: 52px; min-height: 52px; max-width: 52px; max-height: 52px;">
              <img src="logo.png" alt="โลโก้โรงพยาบาล" class="w-full h-full object-contain rounded-full" style="width: 100%; height: 100%; max-width: 100%; max-height: 100%; object-fit: contain;" onerror="this.src='favicon.png'">
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-1.5 flex-wrap">
                <span class="px-2.5 py-0.5 bg-herbal-100 text-herbal-800 text-[10.5px] font-bold rounded-full border border-herbal-200 inline-flex items-center gap-1 shadow-2xs">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span> ใบนัดหมายเข้ารับบริการ
                </span>
              </div>
              <h4 class="font-extrabold text-sm sm:text-[15px] text-herbal-900 leading-tight mt-1">คลินิกการแพทย์แผนไทย</h4>
              <p class="text-[11px] sm:text-xs text-slate-500 font-medium truncate">โรงพยาบาลนราธิวาสราชนครินทร์</p>
            </div>
          </div>

          <!-- Appointment ID & Schedule Highlight Ticket -->
          <div class="bg-gradient-to-br from-emerald-50/90 via-teal-50/40 to-slate-50 rounded-xl p-3 sm:p-3.5 border border-emerald-200/60 shadow-xs space-y-2.5">
            <div class="flex items-center justify-between border-b border-emerald-200/50 pb-2">
              <span class="text-[11px] font-semibold text-emerald-900/90 flex items-center gap-1">
                <span>🔖</span> รหัสนัดหมาย:
              </span>
              <span class="font-mono font-black text-herbal-900 text-xs sm:text-sm bg-white/90 px-2.5 py-0.5 rounded-md border border-emerald-300/80 shadow-2xs tracking-wide">${apt.id}</span>
            </div>

            <div class="grid grid-cols-2 gap-2.5">
              <div class="bg-white/90 rounded-lg p-2.5 border border-emerald-100 shadow-2xs">
                <div class="flex items-center gap-1 text-[11px] text-slate-500 font-medium mb-0.5">
                  <span>📅</span> วันที่นัดหมาย
                </div>
                <span class="font-extrabold text-xs sm:text-sm text-slate-900 block leading-tight">${formatThaiDate(apt.bookDate)}</span>
              </div>
              <div class="bg-white/90 rounded-lg p-2.5 border border-emerald-100 shadow-2xs">
                <div class="flex items-center gap-1 text-[11px] text-slate-500 font-medium mb-0.5">
                  <span>⏰</span> รอบเวลานัดหมาย
                </div>
                <span class="font-mono font-extrabold text-xs sm:text-sm text-emerald-700 block leading-tight">${formatTimeLabel(apt.timeSlot)}</span>
              </div>
            </div>
          </div>

          <!-- Patient & Booking Information Rows -->
          <div class="bg-slate-50/90 rounded-xl p-3 sm:p-3.5 border border-slate-200/80 space-y-2 text-xs">
            <div class="flex items-center justify-between gap-2">
              <span class="text-slate-500 font-medium flex items-center gap-1.5 shrink-0">
                <span class="text-slate-400">👤</span> ชื่อ-สกุล ผู้รับบริการ:
              </span>
              <span class="font-bold text-slate-900 text-right">${escapeHtml(apt.patientName)}</span>
            </div>

            <div class="border-t border-slate-200/60 pt-2 flex items-center justify-between gap-2">
              <span class="text-slate-500 font-medium flex items-center gap-1.5 shrink-0">
                <span class="text-slate-400">🪪</span> เลข HN / บัตร ปชช.:
              </span>
              <span class="font-mono font-semibold text-slate-700 text-right">${escapeHtml(apt.citizenOrHn || '-')}</span>
            </div>

            <div class="border-t border-slate-200/60 pt-2 flex items-center justify-between gap-2">
              <span class="text-slate-500 font-medium flex items-center gap-1.5 shrink-0">
                <span class="text-slate-400">📞</span> เบอร์โทรศัพท์ติดต่อ:
              </span>
              <span class="font-mono font-bold text-emerald-700 text-right">${escapeHtml(apt.phone || '-')}</span>
            </div>

            <div class="border-t border-slate-200/60 pt-2 flex items-center justify-between gap-2">
              <span class="text-slate-500 font-medium flex items-center gap-1.5 shrink-0">
                <span class="text-slate-400">🏥</span> สิทธิการรักษา:
              </span>
              <span class="font-bold text-slate-800 text-right">${escapeHtml(apt.medicalScheme || 'บัตรทอง')}</span>
            </div>

            <div class="border-t border-slate-200/60 pt-2 flex items-start justify-between gap-2">
              <span class="text-slate-500 font-medium flex items-center gap-1.5 shrink-0 mt-0.5">
                <span class="text-slate-400">🌿</span> บริการที่นัดหมาย:
              </span>
              <span class="font-bold text-herbal-800 text-right leading-snug max-w-[65%]">${escapeHtml(serviceDisplay)}</span>
            </div>

            <div class="border-t border-slate-200/60 pt-2 flex items-center justify-between gap-2">
              <span class="text-slate-500 font-medium flex items-center gap-1.5 shrink-0">
                <span class="text-slate-400">👨‍⚕️</span> ผู้ช่วยแพทย์ผู้ดูแล:
              </span>
              <span class="inline-flex items-center gap-1 font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200/80 text-xs shadow-2xs">${escapeHtml(apt.assistantNick || 'ไม่ระบุ (จัดสรรตามเหมาะสม)')}</span>
            </div>
          </div>

          <!-- Instructions Card -->
          <div class="bg-amber-50/90 rounded-xl p-3 sm:p-3.5 border border-amber-200/80 text-xs text-amber-950 space-y-1.5">
            <div class="font-bold text-amber-900 flex items-center gap-1.5 text-xs">
              <span class="text-amber-600">📌</span>
              <span>ข้อปฏิบัติสำหรับผู้รับบริการ:</span>
            </div>
            <ul class="space-y-1 text-amber-900/90 text-[11px] leading-relaxed pl-1">
              <li class="flex items-start gap-1.5">
                <span class="text-amber-600 shrink-0 mt-0.5">•</span>
                <span>กรุณามาก่อนเวลานัดหมายอย่างน้อย <strong>15 นาที</strong> เพื่อตรวจคัดกรอง</span>
              </li>
              <li class="flex items-start gap-1.5">
                <span class="text-amber-600 shrink-0 mt-0.5">•</span>
                <span>โปรดนำ<strong>บัตรประจำตัวประชาชน</strong>มาแสดง ณ จุดบริการ</span>
              </li>
            </ul>
            <div class="mt-2 pt-2 border-t border-amber-200/60 flex flex-wrap items-center justify-between gap-1 text-[10.5px] text-amber-900 font-semibold">
              <span>📞 ติดต่อ: 073-510673</span>
              <span>💬 LINE: @690xzaaa</span>
            </div>
          </div>

          <!-- Action Buttons Inside Step 5 -->
          <div class="pt-2 flex flex-wrap gap-2 items-center justify-between">
            <div class="flex flex-wrap gap-2 items-center w-full sm:w-auto">
              <button type="button" onclick="downloadSlipFromEl('wizard-summary-slip', this)" class="flex-1 sm:flex-initial px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow-sm transition cursor-pointer">
                <span>⚡</span>
                <span>บันทึกรูปทันที (PNG)</span>
              </button>

              <button type="button" onclick="shareAppointmentSlip()" class="flex-1 sm:flex-initial px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow-sm transition cursor-pointer" title="แชร์ใบนัดไปยัง LINE / แชท">
                <span>📤</span>
                <span>แชร์ใบนัด (LINE)</span>
              </button>

              <button type="button" onclick="printSlipPdf()" class="flex-1 sm:flex-initial px-3.5 py-2 bg-herbal-700 hover:bg-herbal-600 text-white font-bold rounded-lg text-xs flex items-center justify-center space-x-1.5 shadow-sm transition cursor-pointer">
                <i data-lucide="printer" class="w-4 h-4"></i>
                <span>พิมพ์ / PDF</span>
              </button>
            </div>

            <button type="button" onclick="resetAndOpenWizard()" class="w-full sm:w-auto px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg text-xs flex items-center justify-center space-x-1 shadow-sm transition cursor-pointer">
              <span>🔄 จองคิวใหม่อีกรายการ</span>
            </button>
          </div>
        </div>
      `;

      if (typeof lucide !== "undefined" && lucide.createIcons) lucide.createIcons();
    }

    async function resetAllPatientRecords() {
      if (!currentUser || currentUser.role !== 'admin') {
        showToast("🔒 เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่สามารถล้างข้อมูลระบบได้", "error");
        return;
      }
      const pass = prompt("⚠️ ยืนยันการลบข้อมูลคิวนัดหมายและประวัติคนไข้ทั้งหมดในระบบ?\n\n(ข้อมูลบริการ, รายชื่อหมอ/ผู้ช่วย, และการตั้งค่าคลินิกจะไม่ถูกลบ)\n\nพิมพ์ 'CLEAR' เพื่อยืนยันการลบทั้งหมด:");
      if (pass !== "CLEAR") {
        if (pass !== null) showToast("การยืนยันไม่ถูกต้อง ยกเลิกการลบข้อมูล", "warning");
        return;
      }

      showToast("⏳ กำลังล้างข้อมูลคิวและประวัติคนไข้ทั้งหมดจากทุกระบบ...", "info");

      const wipeTimestamp = new Date().toISOString();

      // 1. Wipe local memory immediately
      appointments = [];
      lastAppointmentsHash = "";

      // 2. Wipe local storage keys
      try {
        localStorage.setItem("ttm_appointments", JSON.stringify([]));
        localStorage.setItem("ttm_last_system_wipe", wipeTimestamp);
        localStorage.removeItem("ttm_status_histories");
        localStorage.removeItem("ttm_treatment_timings");
        localStorage.removeItem("ttm_deleted_appointment_ids");
        localStorage.removeItem("ttm_my_booking_ids");
        localStorage.removeItem("ttm_patient_history");
        localStorage.removeItem("ttm_patient_records");
        sessionStorage.removeItem("ttm_my_booking_ids");
        sessionStorage.removeItem("ttm_guest_phone");
        const rawNotifs = localStorage.getItem("ttm_notifications_v1");
        if (rawNotifs) {
          const notifs = JSON.parse(rawNotifs);
          if (Array.isArray(notifs)) {
            const systemNotifs = notifs.filter(n => n && n.type !== "NEW_BOOKING" && n.type !== "CANCEL_BOOKING" && n.type !== "STATUS_UPDATE" && n.type !== "ASSISTANT_ASSIGNED");
            localStorage.setItem("ttm_notifications_v1", JSON.stringify(systemNotifs));
          }
        }
      } catch(e) {
        console.error("Local storage wipe error:", e);
      }

      // 3. Wipe Cloud Database (Supabase)
      if (supabaseClient) {
        try {
          // Record wipe marker on Supabase slot_configs first so all devices know
          await supabaseClient.from("slot_configs").upsert([{
            id: "system_wiped_at",
            scope: "system",
            config_key: "wiped_at",
            slots_json: { wiped_at: wipeTimestamp, wiped_by: currentUser.name || "admin" },
            updated_at: wipeTimestamp
          }]);

          // Delete all appointments in batches
          const { data: allRows } = await supabaseClient.from("appointments").select("id");
          if (Array.isArray(allRows) && allRows.length > 0) {
            const allIds = allRows.map(r => r.id).filter(Boolean);
            for (let i = 0; i < allIds.length; i += 50) {
              const batch = allIds.slice(i, i + 50);
              await supabaseClient.from("appointments").delete().in("id", batch);
            }
          }
          // Safety net broad deletes
          await supabaseClient.from("appointments").delete().not("id", "is", null);
          await supabaseClient.from("appointments").delete().gt("id", "");
        } catch(e) {
          console.error("Supabase clear error:", e);
        }

        // 4. Broadcast realtime event to ALL open devices & tabs
        if (realtimeChannel) {
          try {
            await realtimeChannel.send({
              type: "broadcast",
              event: "system_reset_appointments",
              payload: { wiped_at: wipeTimestamp, by: currentUser.name || "admin" }
            });
          } catch(e) {
            console.warn("Realtime broadcast send failed:", e);
          }
        }
      }

      // 5. Re-render all views
      renderDeskQueue(true);
      renderStatsAndShare(true);
      if (typeof renderPatientsList === "function") renderPatientsList();
      if (typeof renderDeskCalendar === "function") if (typeof renderDeskCalendar === "function") renderDeskCalendar();
      if (typeof updateRoomQuotaDisplay === "function") updateRoomQuotaDisplay();
      refreshActiveTabUI(typeof silent !== 'undefined' ? silent : false);

      showToast("✨ ล้างข้อมูลการนัดหมายและประวัติคนไข้ทั้งหมดเรียบร้อยแล้ว ระบบพร้อมเริ่มต้นใหม่", "success");
      await logActivity("CONFIG_SYSTEM", "ล้างข้อมูลการนัดหมายและประวัติคนไข้ทั้งหมดเพื่อเริ่มต้นใช้งานใหม่", {
        by: currentUser.name,
        wiped_at: wipeTimestamp
      });
    }

