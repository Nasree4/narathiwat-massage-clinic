const fs = require('fs');
const vm = require('vm');

let html = fs.readFileSync('index.html', 'utf8');

// Build the JavaScript functions for Assistant Detail & Massage History
const assistantHistoryJS = `
    // ==========================================
    // ASSISTANT DETAIL & MASSAGE HISTORY SYSTEM
    // ==========================================
    let currentDetailAssistantId = null;
    let currentDetailHistoryPeriod = 'all';

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
      if (nicknameEl) nicknameEl.textContent = \`ชื่อเล่น: \${asst.nickname || "-"}\`;

      const roleEl = document.getElementById("asst-detail-role-badge");
      if (roleEl) {
        const isRoleAdmin = asst.role === 'admin';
        const isRoleUser = asst.role === 'user';
        roleEl.textContent = isRoleAdmin ? '🛡️ Admin' : (isRoleUser ? '👤 User' : '🩺 Staff');
        roleEl.className = \`px-2 py-0.5 rounded-lg text-[10.5px] font-bold border \${isRoleAdmin ? 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950 dark:text-purple-300' : (isRoleUser ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300')}\`;
      }

      const phoneEl = document.getElementById("asst-detail-phone");
      if (phoneEl) phoneEl.innerHTML = \`<i data-lucide="phone" class="w-3 h-3"></i> \${asst.phone ? escapeHtml(asst.phone) : 'ไม่มีเบอร์'}\`;

      const genderEl = document.getElementById("asst-detail-gender");
      if (genderEl) genderEl.textContent = asst.gender === 'male' ? '👨 ชาย' : '👩 หญิง';

      const isOff = asst.active === false || asst.shiftType === 'off';
      const dutyEl = document.getElementById("asst-detail-duty-badge");
      if (dutyEl) {
        dutyEl.textContent = isOff ? '⚪ ลาเวร / พัก (Off Duty)' : '🟢 กำลังเข้าเวรวันนี้';
        dutyEl.className = \`font-semibold \${isOff ? 'text-slate-400' : 'text-emerald-600 dark:text-emerald-400'}\`;
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
      }

      const rosterForDate = (typeof assistantDutyRosters !== "undefined" && assistantDutyRosters[targetRosterDate]) ? assistantDutyRosters[targetRosterDate] : {};
      const rEntry = rosterForDate[asst.id] ? (typeof normalizeAssistantRosterEntry === "function" ? normalizeAssistantRosterEntry(rosterForDate[asst.id]) : rosterForDate[asst.id]) : null;
      const checkinInput = document.getElementById("modal-asst-checkin-time");
      if (checkinInput) {
        checkinInput.value = (rEntry && rEntry.checkInTime) ? rEntry.checkInTime.replace(" น.", "").trim() : "";
      }

      populateModalAsstSlots(asst);

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

    function renderAssistantMassageHistory(asstId, period = 'all') {
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
    }

    function populateModalAsstSlots(asst) {
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
    }

    function onModalAssistantShiftChange(shiftType) {
      const slotsSection = document.getElementById("modal-asst-slots-section");
      if (slotsSection) {
        slotsSection.classList.toggle("hidden", shiftType === "off");
      }

      if (shiftType === 'official') {
        setAllModalAsstSlots(false);
        IN_HOURS_SLOTS.forEach(s => {
          const cb = document.querySelector(\`input[name="modal-asst-slot"][value="\${s}"]\`);
          if (cb) cb.checked = true;
        });
      } else if (shiftType === 'ot') {
        setAllModalAsstSlots(false);
        OUT_OF_HOURS_SLOTS.forEach(s => {
          const cb = document.querySelector(\`input[name="modal-asst-slot"][value="\${s}"]\`);
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

      asst.shiftType = shiftType;
      asst.active = shiftType !== 'off';
      asst.slots = shiftType === 'off' ? [] : checkedSlots;

      // Save to assistantDutyRosters
      const targetRosterDate = (typeof currentRosterDate !== "undefined" && currentRosterDate) || (typeof getTodayDateString === "function" ? getTodayDateString() : "");
      if (typeof assistantDutyRosters !== "undefined") {
        if (!assistantDutyRosters[targetRosterDate]) assistantDutyRosters[targetRosterDate] = {};
        assistantDutyRosters[targetRosterDate][asst.id] = {
          slots: [...asst.slots],
          checkInTime: checkinVal ? \`\${checkinVal} น.\` : "",
          isExplicitlyEmpty: asst.slots.length === 0
        };
        try {
          localStorage.setItem("ttm_assistant_duty_rosters", JSON.stringify(assistantDutyRosters));
        } catch(e) {}

        if (supabaseClient) {
          try {
            await supabaseClient.from("slot_configs").upsert({
              config_key: targetRosterDate,
              scope: "roster",
              slots_json: assistantDutyRosters[targetRosterDate],
              updated_at: new Date().toISOString()
            });
          } catch(err) {
            console.warn("Supabase roster save warning:", err);
          }
        }
      }

      persistAssistants();
      showToast(\`บันทึกตารางเวรผู้ช่วย "\${asst.nickname}" สำเร็จแล้ว\`, "success");
      renderManageShifts();
      openAssistantDetailModal(asst.id, 'duty');
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

      showToast(\`บันทึกข้อมูลผู้ช่วย "\${nickname}" สำเร็จแล้ว\`, "success");
      renderManageShifts();
      openAssistantDetailModal(asst.id, 'profile');
    }

    async function deleteAssistantFromDetailModal() {
      if (!currentDetailAssistantId) return;
      const asst = (assistants || []).find(a => a.id === currentDetailAssistantId);
      if (!asst) return;

      const confirmed = confirm(\`ท่านต้องการลบรายชื่อผู้ช่วย "\${asst.nickname} (\${asst.name})" ออกจากระบบหรือไม่?\\n(การลบจะไม่มีผลต่อประวัติคิวย้อนหลัง)\`);
      if (!confirmed) return;

      closeAssistantDetailModal();
      await deleteAssistant(asst.id);
    }
`;

// Inject the JavaScript functions into index.html before renderManageShifts
if (!html.includes('function openAssistantDetailModal')) {
  html = html.replace('function renderManageShifts(dateStr) {', assistantHistoryJS + '\n    function renderManageShifts(dateStr) {');
}

fs.writeFileSync('index.html', html);
console.log('Step 2 complete: Assistant detail & history JS injected into index.html');
