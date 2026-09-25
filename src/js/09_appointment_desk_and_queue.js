/**
 * Module 9: 09_appointment_desk_and_queue.js
 * Description: Desk Queue, Calling Voice, Edit Gender/Time/Services
 * Generated from lines 13554 to 16385 of original index.html
 */

    // ==========================================
    // APPOINTMENT GENDER & TIME EDIT CONTROLLERS (v5.3.0)
    // ==========================================
    function getAppointmentGender(apt) {
      if (!apt) return 'unknown';

      // 1. Explicit patientGender if present
      const pg = (apt.patientGender || '').toLowerCase();
      if (pg === 'male' || pg === 'ชาย' || pg === 'm') return 'male';
      if (pg === 'female' || pg === 'หญิง' || pg === 'f') return 'female';

      // 2. Patient name prefix check
      const name = (apt.patientName || '').trim();
      if (name.startsWith("นาย") || name.startsWith("ด.ช.") || name.startsWith("เด็กชาย") || name.startsWith("นพ.") || name.startsWith("นายแพทย์") || name.startsWith("พระ") || name.startsWith("สามเณร") || name.startsWith("แบ ") || name.startsWith("แบ-")) {
        return 'male';
      }
      if (name.startsWith("นาง") || name.startsWith("น.ส.") || name.startsWith("นางสาว") || name.startsWith("ด.ญ.") || name.startsWith("เด็กหญิง") || name.startsWith("พญ.") || name.startsWith("แพทย์หญิง") || name.startsWith("ก๊ะ") || name.startsWith("เจ๊ะ") || name.startsWith("แมะ")) {
        return 'female';
      }

      // 3. From requested/assigned assistant
      if (apt.assistantId === 'male' || (apt.assistantNick && (apt.assistantNick.includes('ขอผู้ชาย') || apt.assistantNick.includes('ชาย')))) return 'male';
      if (apt.assistantId === 'female' || (apt.assistantNick && (apt.assistantNick.includes('ขอผู้หญิง') || apt.assistantNick.includes('หญิง')))) return 'female';

      if (apt.assistantId && apt.assistantId !== 'auto') {
        const asst = (assistants || []).find(a => a.id === apt.assistantId);
        if (asst) {
          if (typeof isMaleAssistant === 'function' && isMaleAssistant(asst)) return 'male';
          if (asst.gender === 'male' || asst.gender === 'ชาย') return 'male';
          if (asst.gender === 'female' || asst.gender === 'หญิง') return 'female';
        }
      }

      return 'unknown';
    }

    let currentEditingAptTimeId = null;
    let selectedNewAptTimeSlot = null;

    function openEditAppointmentTimeModal(aptId) {
      const isStaffOrAdmin = currentUser && (currentUser.role === 'staff' || currentUser.role === 'admin');
      if (!isStaffOrAdmin) {
        showToast("🔒 เฉพาะเจ้าหน้าที่และแอดมินเท่านั้นที่สามารถปรับเปลี่ยนรอบเวลานัดหมายได้", "warning");
        return;
      }
      const apt = appointments.find(a => a.id === aptId);
      if (!apt) return;

      currentEditingAptTimeId = aptId;
      document.getElementById("edit-apt-time-id").value = apt.id;
      document.getElementById("edit-apt-time-patient-name").textContent = `${apt.patientName} (${apt.citizenOrHn || '-'})`;
      
      let svcLabel = apt.mainService || "นวดรักษา";
      if (apt.extraServices && apt.extraServices.length > 0) {
        svcLabel += ` + ${apt.extraServices.join(', ')}`;
      }
      document.getElementById("edit-apt-time-service").textContent = svcLabel;
      document.getElementById("edit-apt-time-current-slot").textContent = `${formatTimeLabel(apt.timeSlot)} (วันที่ ${formatThaiDateShort(apt.bookDate)})`;

      const dateInput = document.getElementById("edit-apt-time-date");
      if (dateInput) {
        dateInput.value = apt.bookDate || todayStr;
      }

      selectedNewAptTimeSlot = apt.timeSlot;
      renderEditAptTimeSlotsGrid(apt.bookDate || todayStr, apt);
      populateEditAptTimeAssistants(apt.bookDate || todayStr, apt.timeSlot, apt.assistantId);

      const modal = document.getElementById("modal-edit-apt-time");
      if (modal) modal.classList.remove("hidden");
      if (window.lucide) lucide.createIcons();
    }

    function renderEditAptTimeSlotsGrid(targetDate, targetApt) {
      const container = document.getElementById("edit-apt-time-slots-container");
      const statusLabel = document.getElementById("edit-apt-time-slot-status");
      if (!container) return;
      container.innerHTML = "";

      const aptId = currentEditingAptTimeId || document.getElementById("edit-apt-time-id").value;
      const apt = targetApt || appointments.find(a => a.id === aptId);

      const holCheck = checkDateHoliday(targetDate);
      if (holCheck.isClosed) {
        container.innerHTML = `<div class="col-span-3 sm:col-span-4 p-3 text-center bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-bold">⛔ ${escapeHtml(holCheck.title)} (คลินิกปิดทำการ)</div>`;
        if (statusLabel) statusLabel.textContent = "คลินิกปิดทำการ";
        return;
      }

      const slots = holCheck.slots || [];
      if (slots.length === 0) {
        container.innerHTML = `<div class="col-span-3 sm:col-span-4 p-3 text-center bg-rose-50 text-rose-700 rounded-xl text-xs">ไม่มีรอบเวลาเปิดในวันนี้</div>`;
        return;
      }

      const activeAssts = (assistants || []).filter(a => a.active !== false && a.shiftType !== 'off');

      slots.forEach(slot => {
        const slotConf = getSlotConfigForDate(targetDate, slot);
        if (!slotConf.enabled) {
          const disabledBtn = document.createElement("div");
          disabledBtn.className = "p-2 rounded-xl text-center bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700 opacity-60 cursor-not-allowed";
          disabledBtn.innerHTML = `
            <div class="font-bold font-mono text-xs">${slot}</div>
            <div class="text-[9px]">ปิดรอบ</div>
          `;
          container.appendChild(disabledBtn);
          return;
        }

        // Count free assistants for this slot (ignoring current appointment being moved)
        const busyCount = appointments.filter(a => {
          if (a.id === aptId) return false;
          if (a.bookDate !== targetDate || a.status === "🔴 ส่งต่อ" || a.status === "ยกเลิก") return false;
          const aptSlots = (a.slotsOccupied && a.slotsOccupied.length > 0) ? a.slotsOccupied : [a.timeSlot];
          return aptSlots.includes(slot);
        }).length;

        const rosterForDate = (typeof assistantDutyRosters !== "undefined" && assistantDutyRosters[targetDate]) ? assistantDutyRosters[targetDate] : {};
        const checkedInCount = Object.keys(rosterForDate).length > 0
          ? activeAssts.filter(a => Boolean(rosterForDate[a.id]) && isAssistantOnDutyForSlot(a, slot, targetDate)).length
          : activeAssts.filter(a => isAssistantOnDutyForSlot(a, slot, targetDate)).length;

        const freeCount = Math.max(0, checkedInCount - busyCount);
        const isSelected = (selectedNewAptTimeSlot === slot);
        const isCurrentSlot = (apt && apt.bookDate === targetDate && apt.timeSlot === slot);

        let btnClass = "";
        let badgeText = "";

        if (isSelected) {
          btnClass = "bg-emerald-600 text-white ring-2 ring-emerald-400 ring-offset-1 border border-emerald-500 shadow-md font-extrabold";
          badgeText = isCurrentSlot ? "รอบเดิม (เลือก)" : "✅ เลือกแล้ว";
        } else if (freeCount > 0 || isCurrentSlot) {
          btnClass = "bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 hover:border-emerald-400 cursor-pointer active:scale-95 shadow-2xs";
          badgeText = isCurrentSlot ? "รอบเดิม" : `ว่าง (${freeCount})`;
        } else {
          btnClass = "bg-slate-100 dark:bg-slate-800/70 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700 opacity-60 cursor-not-allowed";
          badgeText = "เต็ม";
        }

        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = `p-2 rounded-xl text-center transition ${btnClass}`;
        btn.innerHTML = `
          <div class="font-bold font-mono text-xs">${slot}</div>
          <div class="text-[9.5px] ${isSelected ? 'text-amber-200 font-bold' : (freeCount > 0 || isCurrentSlot) ? 'text-emerald-700 dark:text-emerald-400 font-semibold' : 'text-slate-400'}">${badgeText}</div>
        `;
        if (freeCount > 0 || isCurrentSlot) {
          btn.onclick = () => selectEditAptNewSlot(slot);
          btn.ondblclick = () => { selectEditAptNewSlot(slot); saveEditAppointmentTime(); };
        }
        container.appendChild(btn);
      });

      if (statusLabel) {
        statusLabel.textContent = selectedNewAptTimeSlot ? `เลือกรอบ: ${formatTimeLabel(selectedNewAptTimeSlot)}` : 'กรุณาคลิกเลือกรอบเวลา';
      }
    }

    function onEditAptDateChanged() {
      const dateVal = document.getElementById("edit-apt-time-date")?.value || todayStr;
      renderEditAptTimeSlotsGrid(dateVal);
      populateEditAptTimeAssistants(dateVal, selectedNewAptTimeSlot);
    }

    function selectEditAptNewSlot(slot) {
      selectedNewAptTimeSlot = slot;
      const dateVal = document.getElementById("edit-apt-time-date")?.value || todayStr;
      renderEditAptTimeSlotsGrid(dateVal);
      populateEditAptTimeAssistants(dateVal, slot);
    }

    function populateEditAptTimeAssistants(dateVal, timeSlot, currentAsstId) {
      const select = document.getElementById("edit-apt-time-asst-select");
      if (!select) return;

      const aptId = currentEditingAptTimeId || document.getElementById("edit-apt-time-id").value;
      const apt = appointments.find(a => a.id === aptId);
      const selectedId = currentAsstId || (apt ? apt.assistantId : "female");

      let opts = `
        <option value="female" ${selectedId === 'female' ? 'selected' : ''}>👩 ขอผู้ช่วยแพทย์หญิง (จัดสรรตามความเหมาะสม)</option>
        <option value="male" ${selectedId === 'male' ? 'selected' : ''}>👨 ขอผู้ช่วยแพทย์ชาย (จัดสรรตามความเหมาะสม)</option>
        <option disabled>──────────────</option>
      `;

      const activeAssts = (assistants || []).filter(a => a.active !== false);
      activeAssts.forEach(a => {
        const dutyStatus = (typeof getAssistantDutyStatusForDate === "function")
          ? getAssistantDutyStatusForDate(a, dateVal)
          : { isOff: a.shiftType === 'off' };
        const isOff = dutyStatus.isOff;
        const onDuty = !isOff && (timeSlot ? isAssistantOnDutyForSlot(a, timeSlot, dateVal) : true);

        let occupiedPatient = "";
        const isOccupied = appointments.some(otherApt => {
          if (otherApt.id === aptId) return false;
          if (otherApt.bookDate === dateVal && otherApt.assistantId === a.id) {
            if (otherApt.status === "🔴 ส่งต่อ" || otherApt.status === "ยกเลิก") return false;
            const otherSlots = (otherApt.slotsOccupied && otherApt.slotsOccupied.length > 0) ? otherApt.slotsOccupied : [otherApt.timeSlot];
            if (otherSlots.includes(timeSlot)) {
              occupiedPatient = otherApt.patientName || "ผู้รับบริการ";
              return true;
            }
          }
          return false;
        });

        const icon = (typeof isMaleAssistant === "function" && isMaleAssistant(a)) ? '👨' : '👩';
        const nick = a.nickname || a.name;
        const isSel = selectedId === a.id;

        if (isOff) {
          opts += `<option value="${a.id}" ${isSel ? 'selected' : ''} class="text-slate-400 bg-slate-100 dark:bg-slate-800">${icon} ${escapeHtml(nick)} (ลาเวร/พัก)</option>`;
        } else if (!onDuty) {
          opts += `<option value="${a.id}" ${isSel ? 'selected' : ''} class="text-slate-400 bg-slate-100 dark:bg-slate-800">${icon} ${escapeHtml(nick)} (ไม่อยู่เวร)</option>`;
        } else if (isOccupied) {
          opts += `<option value="${a.id}" ${isSel ? 'selected' : ''} class="text-amber-800 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-300 font-bold">${icon} ${escapeHtml(nick)} (ติดนัด: คุณ ${escapeHtml(occupiedPatient)})</option>`;
        } else {
          opts += `<option value="${a.id}" ${isSel ? 'selected' : ''}>${icon} ${escapeHtml(nick)} (ว่าง)</option>`;
        }
      });

      select.innerHTML = opts;
    }

    async function saveEditAppointmentTime() {
      const aptId = document.getElementById("edit-apt-time-id").value;
      const newDate = document.getElementById("edit-apt-time-date").value;
      const newSlot = selectedNewAptTimeSlot;
      const asstSelect = document.getElementById("edit-apt-time-asst-select");
      const newAsstId = asstSelect ? asstSelect.value : "female";

      if (!aptId) return;
      if (!newDate) {
        showToast("กรุณาเลือกวันที่นัดหมาย", "warning");
        return;
      }
      if (!newSlot) {
        showToast("กรุณาเลือกรอบเวลานัดหมายใหม่", "warning");
        return;
      }

      const holCheck = checkDateHoliday(newDate);
      if (holCheck.isClosed) {
        showToast(`ไม่สามารถนัดในวันที่คลินิกปิดทำการ: ${holCheck.title}`, "error");
        return;
      }

      const aptIndex = appointments.findIndex(a => a.id === aptId);
      if (aptIndex === -1) return;
      const apt = appointments[aptIndex];

      const oldDate = apt.bookDate;
      const oldSlot = apt.timeSlot;

      // Check requires 2 slots
      const requiresTwoSlots = (apt.slotsOccupied && apt.slotsOccupied.length > 1) ||
        (apt.mainService && apt.mainService.includes("หลังคลอด")) ||
        ((apt.extraServices || []).some(extraName => {
          const svc = extraServicesList.find(s => s.name === extraName);
          return svc && svc.twoSlots;
        }));

      const slotsList = getSlotsForDate(newDate);
      const currentIndex = slotsList.indexOf(newSlot);
      const newSlotsOccupied = [newSlot];
      if (requiresTwoSlots && currentIndex !== -1 && currentIndex + 1 < slotsList.length) {
        newSlotsOccupied.push(slotsList[currentIndex + 1]);
      }

      // Universal Assistant Booking Conflict Check (v5.4.2)
      const conflict = (typeof checkAssistantBookingConflict === "function") ? checkAssistantBookingConflict({
        assistantId: newAsstId,
        bookDate: newDate,
        timeSlot: newSlot,
        slotsOccupied: newSlotsOccupied,
        excludeAppointmentId: aptId,
        requiresTwoSlots: requiresTwoSlots,
        patientName: apt.patientName
      }) : { hasConflict: false };

      if (conflict && conflict.hasConflict) {
        if (typeof showAssistantConflictModal === "function") {
          showAssistantConflictModal(conflict, newSlot, newDate);
        }
        showToast(`❌ ไม่สามารถย้ายรอบเวลาได้: ${conflict.title}`, "error");
        return;
      }

      let newAsstNick = "ไม่ระบุ";
      if (newAsstId === "female") newAsstNick = "ไม่ระบุ (ขอผู้หญิง)";
      else if (newAsstId === "male") newAsstNick = "ไม่ระบุ (ขอผู้ชาย)";
      else {
        const foundAsst = assistants.find(a => a.id === newAsstId);
        newAsstNick = foundAsst ? (foundAsst.nickname || foundAsst.name) : "ไม่ระบุ";
      }

      // 1. Lock in-flight
      inFlightAssistantUpdates.add(aptId);
      inFlightStatusUpdates.add(aptId);

      // 2. Optimistic local update
      apt.bookDate = newDate;
      apt.timeSlot = newSlot;
      apt.slotsOccupied = newSlotsOccupied;
      apt.assistantId = newAsstId;
      apt.assistantNick = newAsstNick;

      // 3. Persist to LocalStorage & Hash
      persistAppointments();
      lastAppointmentsHash = computeAppointmentsHash(appointments);

      // 4. Close modal and re-render UI immediately
      closeEditAppointmentTimeModal();
      renderDeskQueue();
      if (typeof renderStatsAndShare === "function") renderStatsAndShare();
      if (typeof renderDeskCalendar === "function") renderDeskCalendar();

      showToast(`✅ ย้ายรอบเวลาคุณ ${apt.patientName} เป็นรอบ ${formatTimeLabel(newSlot)} เรียบร้อยแล้ว`, "success");

      await logActivity("RESCHEDULE", `แก้ไขรอบเวลาของ ${apt.patientName}: จาก (${formatThaiDateShort(oldDate)} ${formatTimeLabel(oldSlot)}) เป็น (${formatThaiDateShort(newDate)} ${formatTimeLabel(newSlot)} [${newAsstNick}])`, {
        appointmentId: apt.id,
        patientName: apt.patientName,
        oldDate,
        oldSlot,
        newDate,
        newSlot,
        assistantId: newAsstId,
        assistantNick: newAsstNick
      });

      // 5. Update Cloud Supabase
      if (supabaseClient) {
        try {
          const { error } = await supabaseClient.from("appointments").update({
            book_date: newDate,
            time_slot: newSlot,
            slots_occupied: newSlotsOccupied,
            assistant_id: newAsstId,
            assistant_nick: newAsstNick
          }).eq("id", aptId);
          if (error) throw error;
        } catch(e) {
          console.error("Supabase reschedule update error:", e);
          showToast("บันทึกบน Cloud ไม่สำเร็จ: " + e.message, "error");
        } finally {
          setTimeout(() => {
            inFlightAssistantUpdates.delete(aptId);
            inFlightStatusUpdates.delete(aptId);
          }, 3000);
        }
      } else {
        inFlightAssistantUpdates.delete(aptId);
        inFlightStatusUpdates.delete(aptId);
      }
    }

    function closeEditAppointmentTimeModal() {
      const modal = document.getElementById("modal-edit-apt-time");
      if (modal) modal.classList.add("hidden");
    }

    function renderDeskQueue() {
      updateDeskViewSwitcherUI();
      updateDeskCloudSyncBadge();

      const startDate = document.getElementById("desk-filter-date-start") ? document.getElementById("desk-filter-date-start").value : "";
      const endDate = document.getElementById("desk-filter-date-end") ? document.getElementById("desk-filter-date-end").value : "";
      const statusFilter = document.getElementById("desk-filter-status") ? document.getElementById("desk-filter-status").value : "all";
      const slotFilter = document.getElementById("desk-filter-slot") ? document.getElementById("desk-filter-slot").value : "all";
      const searchQuery = document.getElementById("desk-filter-search") ? document.getElementById("desk-filter-search").value.toLowerCase().trim() : "";

      let filtered = appointments.filter(a => {
        if (startDate && a.bookDate < startDate) return false;
        if (endDate && a.bookDate > endDate) return false;
        if (statusFilter !== "all") {
          const cleanAptStatus = (a.status || "").replace("🔵 ", "").replace("🟣 ", "").replace("🟡 ", "").replace("⚪ ", "").replace("🔴 ", "").replace("🟢 ", "").trim();
          if (statusFilter === "room") {
            if (!cleanAptStatus.startsWith("ห้อง")) return false;
          } else if (statusFilter === "🔵 รอนวด" || statusFilter === "รอนวด") {
            const isWaitingMassage = cleanAptStatus === "รอนวด" || cleanAptStatus === "ตรวจแล้ว" || cleanAptStatus.startsWith("รอห้อง");
            if (!isWaitingMassage) return false;
          } else if (statusFilter.startsWith("ห้อง")) {
            const targetRm = statusFilter.trim();
            const isRoomMatch = cleanAptStatus === targetRm || 
                                cleanAptStatus === ("รอ" + targetRm) ||
                                cleanAptStatus.startsWith(targetRm) ||
                                cleanAptStatus.startsWith("รอ" + targetRm);
            if (!isRoomMatch) return false;
          } else {
            const cleanFilter = statusFilter.replace("🔵 ", "").replace("🟣 ", "").replace("🟡 ", "").replace("⚪ ", "").replace("🔴 ", "").replace("🟢 ", "").trim();
            if (cleanAptStatus !== cleanFilter && a.status !== statusFilter) return false;
          }
        }
        if (slotFilter !== "all") {
          const aptSlots = (a.slotsOccupied && a.slotsOccupied.length > 0) ? a.slotsOccupied : [a.timeSlot];
          if (!aptSlots.includes(slotFilter)) return false;
        }
        if (searchQuery) {
          const matchName = a.patientName.toLowerCase().includes(searchQuery);
          const matchHn = (a.citizenOrHn || "").toLowerCase().includes(searchQuery);
          const matchPhone = (a.phone || "").includes(searchQuery);
          const matchScheme = (a.medicalScheme || "").toLowerCase().includes(searchQuery);
          if (!matchName && !matchHn && !matchPhone && !matchScheme) return false;
        }
        return true;
      });

      filtered.sort((a, b) => {
        if (a.bookDate !== b.bookDate) {
          return a.bookDate.localeCompare(b.bookDate);
        }
        const slotCmp = extractSlotMinutes(a.timeSlot) - extractSlotMinutes(b.timeSlot);
        if (slotCmp !== 0) return slotCmp;
        const tA = a.createdAt || a.created_at || a.id || '';
        const tB = b.createdAt || b.created_at || b.id || '';
        return String(tA).localeCompare(String(tB));
      });

      let totalMaleCount = 0;
      let totalFemaleCount = 0;
      filtered.forEach(a => {
        const g = getAppointmentGender(a);
        if (g === 'male') totalMaleCount++;
        else if (g === 'female') totalFemaleCount++;
      });

      const deskCountBadge = document.getElementById("desk-count-badge");
      if (deskCountBadge) {
        deskCountBadge.innerHTML = `รวม <strong>${filtered.length}</strong> คน <span class="ml-1 px-1.5 py-0.2 rounded-full bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-300 text-[10.5px] font-bold">👨 ${totalMaleCount}</span> <span class="px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-300 text-[10.5px] font-bold">👩 ${totalFemaleCount}</span>`;
      }

      updateRoomQuotaDisplay(startDate, endDate);

      const isMultiDay = (startDate !== endDate) || (!startDate && !endDate);

      // Render Active View
      if (currentDeskViewMode === "table") {
        renderDeskTableView(filtered, isMultiDay);
      } else if (currentDeskViewMode === "kanban") {
        renderDeskKanbanView(filtered, isMultiDay);
      } else if (currentDeskViewMode === "assistant") {
        renderDeskAssistantView(filtered, isMultiDay);
      } else if (currentDeskViewMode === "compact") {
        renderDeskCompactView(filtered, isMultiDay);
      } else if (currentDeskViewMode === "rooms") {
        renderDeskRoomsView(filtered, isMultiDay);
      }

      lucide.createIcons();
    }

    function renderDeskTableView(filtered, isMultiDay) {
      const tbody = document.getElementById("desk-table-body");
      const cardsContainer = document.getElementById("desk-cards-container");
      if (!tbody || !cardsContainer) return;
      tbody.innerHTML = "";
      cardsContainer.innerHTML = "";

      if (filtered.length === 0) {
        tbody.innerHTML = getEmptyDeskStateHtml(true);
        cardsContainer.innerHTML = getEmptyDeskStateHtml(false);
        if (window.lucide) lucide.createIcons();
        return;
      }

      const slotFilter = document.getElementById("desk-filter-slot") ? document.getElementById("desk-filter-slot").value : "all";

      const groups = [];
      const groupMap = new Map();

      filtered.forEach(apt => {
        const aptSlots = (apt.slotsOccupied && apt.slotsOccupied.length > 0) ? apt.slotsOccupied : [apt.timeSlot];
        const targetSlots = (slotFilter !== "all")
          ? aptSlots.filter(s => s === slotFilter)
          : aptSlots;

        targetSlots.forEach(slot => {
          const groupKey = isMultiDay ? `${apt.bookDate}___${slot}` : slot;
          if (!groupMap.has(groupKey)) {
            const newGroup = {
              key: groupKey,
              bookDate: apt.bookDate,
              timeSlot: slot,
              items: []
            };
            groupMap.set(groupKey, newGroup);
            groups.push(newGroup);
          }
          const isSecondSlot = (slot !== apt.timeSlot);
          groupMap.get(groupKey).items.push({
            apt,
            displaySlot: slot,
            isSecondSlot
          });
        });
      });

      // Sort groups chronologically
      groups.sort((a, b) => {
        if (a.bookDate !== b.bookDate) {
          return a.bookDate.localeCompare(b.bookDate);
        }
        return extractSlotMinutes(a.timeSlot) - extractSlotMinutes(b.timeSlot);
      });

      groups.forEach(group => {
        let grpMaleCount = 0;
        let grpFemaleCount = 0;
        let grpOtherCount = 0;

        group.items.forEach(({ apt }) => {
          const g = getAppointmentGender(apt);
          if (g === 'male') grpMaleCount++;
          else if (g === 'female') grpFemaleCount++;
          else grpOtherCount++;
        });

        // Group Header Row in Desktop Table
        const headerTr = document.createElement("tr");
        headerTr.className = "bg-emerald-50/80 dark:bg-slate-900/90 border-t-2 border-b border-herbal-200/90 dark:border-slate-700";
        headerTr.innerHTML = `
          <td colspan="6" class="py-2.5 px-4">
            <div class="flex items-center justify-between flex-wrap gap-2">
              <div class="flex items-center space-x-2">
                <span class="w-2.5 h-2.5 rounded-full bg-herbal-600 dark:bg-emerald-400 inline-block shadow-xs"></span>
                <span class="font-extrabold text-herbal-900 dark:text-emerald-300 text-xs sm:text-sm">⏰ ${formatTimeLabel(group.timeSlot)}</span>
                ${isMultiDay ? `<span class="text-xs font-semibold text-herbal-800 dark:text-emerald-300 bg-herbal-100 dark:bg-emerald-950 border border-herbal-300 dark:border-emerald-800 px-2 py-0.5 rounded-md ml-1">📅 วันที่ ${formatThaiDateShort(group.bookDate)}</span>` : ''}
              </div>
              <div class="flex items-center space-x-1.5 flex-wrap gap-1">
                <span class="text-xs font-bold text-slate-500 dark:text-slate-400">นัดหมาย:</span>
                <span class="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-herbal-100 dark:bg-emerald-950 text-herbal-900 dark:text-emerald-200 border border-herbal-300 dark:border-emerald-800 shadow-2xs" title="ยอดรวมคิวนัดหมายในรอบนี้">
                  รวม ${group.items.length} ราย
                </span>
                <span class="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 border border-sky-300 dark:border-sky-800 shadow-2xs flex items-center gap-1" title="ผู้รับบริการ / ขอผู้ช่วยแพทย์ชาย">
                  <span>👨 ชาย</span>
                  <strong class="font-black text-sky-900 dark:text-sky-100">${grpMaleCount}</strong>
                </span>
                <span class="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800 shadow-2xs flex items-center gap-1" title="ผู้รับบริการ / ขอผู้ช่วยแพทย์หญิง">
                  <span>👩 หญิง</span>
                  <strong class="font-black text-rose-900 dark:text-rose-100">${grpFemaleCount}</strong>
                </span>
                ${grpOtherCount > 0 ? `<span class="text-[10.5px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700" title="ไม่ระบุ">${grpOtherCount}</span>` : ''}
              </div>
            </div>
          </td>
        `;
        tbody.appendChild(headerTr);

        // Group Header in Mobile Cards
        const mobileGroupHeader = document.createElement("div");
        mobileGroupHeader.className = "bg-gradient-to-r from-herbal-100 to-emerald-50 dark:from-slate-900 dark:to-slate-800 border border-herbal-300 dark:border-slate-700 px-3.5 py-2 rounded-xl flex items-center justify-between font-bold text-herbal-900 dark:text-emerald-300 text-xs shadow-xs mt-3.5 first:mt-0 flex-wrap gap-2";
        mobileGroupHeader.innerHTML = `
          <div class="flex items-center space-x-1.5">
            <i data-lucide="clock" class="w-4 h-4 text-herbal-700 dark:text-emerald-400"></i>
            <span class="font-extrabold">${formatTimeLabel(group.timeSlot)} ${isMultiDay ? `<span class="text-[11px] font-normal text-herbal-800 dark:text-emerald-400">(${formatThaiDateShort(group.bookDate)})</span>` : ''}</span>
          </div>
          <div class="flex items-center gap-1 flex-wrap">
            <span class="bg-herbal-200 dark:bg-emerald-950 text-herbal-900 dark:text-emerald-200 px-2.5 py-0.5 rounded-full text-xs font-extrabold border border-herbal-300 dark:border-emerald-800">${group.items.length} ราย</span>
            <span class="bg-sky-100 dark:bg-sky-950 text-sky-900 dark:text-sky-200 px-2 py-0.5 rounded-full text-[11px] font-bold border border-sky-300 dark:border-sky-800">👨 ${grpMaleCount}</span>
            <span class="bg-rose-100 dark:bg-rose-950 text-rose-900 dark:text-rose-200 px-2 py-0.5 rounded-full text-[11px] font-bold border border-rose-300 dark:border-rose-800">👩 ${grpFemaleCount}</span>
          </div>
        `;
        cardsContainer.appendChild(mobileGroupHeader);

        group.items.forEach(({ apt, displaySlot, isSecondSlot }) => {
          const isPostpartum = (apt.mainService === "จองฟื้นฟูหลังคลอด" || (apt.mainService && apt.mainService.includes("หลังคลอด")));
          const mainTitle = isPostpartum ? "🤱 ฟื้นฟูหลังคลอด" : "💆‍♂️ นวดรักษา";
          const mainColorClass = isPostpartum ? "text-purple-800 dark:text-purple-300 font-bold" : "text-emerald-800 dark:text-emerald-300 font-bold";

          let extrasPill = "";
          if (apt.extraServices && apt.extraServices.length > 0) {
            extrasPill = `<span class="px-1.5 py-0.5 rounded-md bg-herbal-100 dark:bg-emerald-950 text-herbal-900 dark:text-emerald-300 border border-herbal-200 dark:border-emerald-800 text-[10px] font-black shrink-0" title="${apt.extraServices.join(', ')}">+${apt.extraServices.length}</span>`;
          }

          const dateBadgeHtml = isMultiDay
            ? `<span class="inline-block text-[11px] font-bold text-herbal-900 dark:text-emerald-300 bg-herbal-100/90 dark:bg-emerald-950 border border-herbal-300 dark:border-emerald-800 px-1.5 py-0.5 rounded mr-1 shadow-xs">${formatThaiDateShort(apt.bookDate)}</span>`
            : '';

          const safePatientName = apt.patientName.replace(/'/g, "\\'");

          // Badge for 1st slot vs 2nd slot
          const slotBadgeHtml = isSecondSlot
            ? `<span class="inline-block text-[10px] font-bold text-purple-800 dark:text-purple-300 bg-purple-100/90 dark:bg-purple-950/80 px-2 py-0.5 rounded-md border border-purple-300 dark:border-purple-800 shadow-2xs" title="รอบที่ 2 ต่อเนื่องจาก ${formatTimeLabel(apt.timeSlot)}">(ต่อเนื่องจาก ${formatTimeLabel(apt.timeSlot)})</span>`
            : (apt.slotsOccupied && apt.slotsOccupied.length > 1
                ? `<span class="inline-block text-[10px] font-bold text-amber-800 dark:text-amber-300 bg-amber-100/90 dark:bg-amber-950/80 px-2 py-0.5 rounded-md border border-amber-300 dark:border-amber-800 shadow-2xs" title="ครอง 2 รอบเวลาต่อเนื่อง: ${formatTimeLabel(apt.slotsOccupied[0])} - ${formatTimeLabel(apt.slotsOccupied[1])}">(2 รอบ: ${formatTimeLabel(apt.slotsOccupied[0])} - ${formatTimeLabel(apt.slotsOccupied[1])})</span>`
                : '');

          // Desktop Row
          const tr = document.createElement("tr");
          tr.className = isSecondSlot
            ? "bg-purple-50/20 dark:bg-purple-950/10 hover:bg-purple-50/40 dark:hover:bg-purple-900/20 transition border-b-2 border-purple-200 dark:border-purple-900/60"
            : "hover:bg-slate-50 dark:hover:bg-slate-800/60 transition border-b-2 border-slate-200 dark:border-slate-700/80";
          tr.innerHTML = `
            <td class="py-2.5 px-3 font-bold text-herbal-800 dark:text-emerald-300 whitespace-nowrap pl-3 align-top">
              <div class="flex flex-col items-start gap-1">
                ${isMultiDay ? `<div class="mb-0.5">${dateBadgeHtml}</div>` : ''}
                <button type="button" onclick="openEditAppointmentTimeModal('${apt.id}')" class="group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 hover:text-emerald-800 dark:hover:text-emerald-300 border border-slate-200 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-500 shadow-2xs transition cursor-pointer text-left" title="คลิกเพื่อแก้ไขรอบเวลา / วันที่นัดหมาย">
                  <span class="text-xs sm:text-sm font-black font-mono">${formatTimeLabel(displaySlot)}</span>
                  <i data-lucide="calendar-clock" class="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition shrink-0"></i>
                </button>
                ${slotBadgeHtml ? `<div class="mt-0.5">${slotBadgeHtml}</div>` : ''}
              </div>
            </td>
            <td class="py-2.5 px-3 text-slate-800 dark:text-slate-200 align-top">
              <div class="flex items-center gap-1.5 flex-wrap">
                <span class="font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm leading-snug">${apt.patientName}</span>
                ${getMedicalSchemeBadgeHtml(apt.medicalScheme)}
              </div>
              <div class="text-[11px] text-slate-500 dark:text-slate-400 font-mono flex items-center gap-1.5 mt-0.5 whitespace-nowrap">
                <span>HN: ${apt.citizenOrHn || '-'}</span>
                <span class="text-slate-300 dark:text-slate-600">•</span>
                ${apt.phone ? `<a href="tel:${apt.phone}" class="text-herbal-700 dark:text-emerald-400 hover:underline font-semibold flex items-center gap-0.5"><i data-lucide="phone" class="w-2.5 h-2.5"></i><span>${apt.phone}</span></a>` : '<span class="text-slate-400">-</span>'}
                <button type="button" onclick="openEditPatientModalFromApt('${apt.id}')" class="text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 p-0.5 rounded transition cursor-pointer ml-0.5" title="คลิกแก้ไขข้อมูลคนไข้ / สิทธิ์การรักษา">
                  <i data-lucide="edit-2" class="w-3 h-3"></i>
                </button>
              </div>
            </td>
            <td class="py-2.5 px-2 align-top">
              <button type="button" onclick="openEditServicesModal('${apt.id}')" class="group flex items-center justify-between gap-1 w-28 sm:w-32 px-2 py-1 text-xs border border-slate-300 dark:border-slate-700 rounded-lg outline-none font-semibold bg-white dark:bg-slate-800 hover:bg-herbal-50/80 dark:hover:bg-slate-700 hover:border-herbal-400 dark:hover:border-emerald-500 transition shadow-2xs cursor-pointer text-left" title="คลิกเพื่อเปลี่ยนหรือเพิ่มหัตถการบริการ">
                <div class="flex items-center gap-1 min-w-0 truncate">
                  <span class="${mainColorClass} truncate text-[11px] font-bold">${mainTitle}</span>
                  ${extrasPill}
                </div>
                <i data-lucide="edit-3" class="w-3 h-3 text-slate-400 dark:text-slate-500 group-hover:text-herbal-700 dark:group-hover:text-emerald-400 shrink-0"></i>
              </button>
            </td>
            <td class="py-2.5 px-2 whitespace-nowrap align-top">
              ${generateAssistantDropdownHtml(apt.id, apt.assistantId, apt.assistantNick, "w-28 sm:w-32 px-2 py-1 text-xs border rounded-lg outline-none font-bold shadow-2xs cursor-pointer hover:border-herbal-500 focus:ring-2 focus:ring-herbal-500/40 transition")}
            </td>
            <td class="py-2.5 px-3 align-top">
              <div class="flex flex-col gap-1 max-w-[210px]">
                ${generateStatusDropdownHtml(apt.id, apt.status, apt.bookDate, "w-full max-w-[160px] px-2 py-1 text-xs border border-slate-300 dark:border-slate-700 rounded-lg outline-none font-semibold bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-herbal-500/40 shadow-2xs cursor-pointer transition")}
                <div class="flex flex-wrap items-center gap-1">
                  ${generateStatusTimerBadgeHtml(apt)}
                  ${generateMassageTimingTextHtml(apt)}
                </div>
              </div>
            </td>
            <td class="py-2.5 px-3 pr-4 sm:pr-5 text-center whitespace-nowrap align-top">
              <div class="flex items-center justify-center gap-1.5 flex-nowrap">
                ${generateDeskActionButtonHtml(apt, "px-2.5 py-1 rounded-lg text-white font-bold text-xs inline-flex items-center justify-center gap-1 shadow-2xs transition cursor-pointer shrink-0")}
                <button onclick="bookNextAppointment('${apt.id}')" class="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center shadow-xs transition cursor-pointer shrink-0" title="นัดหมายครั้งถัดไป (ดึงข้อมูลเดิม)">
                  <i data-lucide="calendar-plus" class="w-3.5 h-3.5"></i>
                </button>
                <button onclick="playQueueAnnouncement('${safePatientName}', '${displaySlot}')" class="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 transition shrink-0" title="กดเรียกคิว (อ่านชื่อ-นามสกุล)">
                  <i data-lucide="bell" class="w-3.5 h-3.5"></i>
                </button>
                <button onclick="cancelAppointment('${apt.id}')" class="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 transition shrink-0" title="ยกเลิกนัด (คืนคิวทันที)">
                  <i data-lucide="calendar-x" class="w-3.5 h-3.5"></i>
                </button>
              </div>
            </td>
          `;
          tbody.appendChild(tr);

          // Mobile Touch Card
          const card = document.createElement("div");
          card.className = isSecondSlot
            ? "bg-purple-50/20 dark:bg-purple-950/10 p-4 rounded-xl border border-purple-200/80 dark:border-purple-800/60 shadow-sm space-y-2.5"
            : "bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-2.5";
          card.innerHTML = `
            <div class="flex items-start justify-between border-b border-slate-100 dark:border-slate-700 pb-2">
              <div class="flex flex-col gap-1">
                ${isMultiDay ? dateBadgeHtml : ''}
                <button type="button" onclick="openEditAppointmentTimeModal('${apt.id}')" class="group inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs font-bold shadow-2xs hover:bg-emerald-100 transition cursor-pointer" title="คลิกเพื่อแก้ไขรอบเวลา / วันที่นัดหมาย">
                  <i data-lucide="calendar-clock" class="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400"></i>
                  <span>${formatTimeLabel(displaySlot)}</span>
                  <i data-lucide="edit-3" class="w-2.5 h-2.5 ml-0.5 text-emerald-600 dark:text-emerald-400 opacity-80"></i>
                </button>
                ${slotBadgeHtml ? `<div>${slotBadgeHtml}</div>` : ''}
              </div>
              <div class="flex items-center gap-1">
                <span class="text-[11px] text-slate-500 dark:text-slate-400 font-medium">ผู้ช่วยฯ:</span>
                ${generateAssistantDropdownHtml(apt.id, apt.assistantId, apt.assistantNick)}
              </div>
            </div>
            <div>
              <div class="flex items-center justify-between gap-1">
                <div class="flex items-center gap-1.5 flex-wrap">
                  <span class="font-bold text-slate-800 dark:text-white text-base">${apt.patientName}</span>
                  ${getMedicalSchemeBadgeHtml(apt.medicalScheme)}
                </div>
                <button type="button" onclick="openEditPatientModalFromApt('${apt.id}')" class="p-1 rounded-md text-slate-400 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer" title="แก้ไขข้อมูลคนไข้ / สิทธิ์การรักษา">
                  <i data-lucide="edit-2" class="w-3.5 h-3.5"></i>
                </button>
              </div>
              <div class="text-xs text-slate-500 dark:text-slate-400 font-mono">${apt.citizenOrHn || '-'}</div>
            </div>
            <div class="flex items-center justify-between pt-1">
              <button type="button" onclick="openEditServicesModal('${apt.id}')" class="group flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-herbal-50 dark:hover:bg-slate-700 text-xs text-slate-800 dark:text-slate-100 transition shadow-2xs cursor-pointer" title="คลิกเพื่อเปลี่ยนหรือเพิ่มหัตถการบริการ">
                <span class="${mainColorClass}">${mainTitle}</span>
                ${extrasPill}
                <i data-lucide="edit-3" class="w-3 h-3 text-slate-400 group-hover:text-herbal-700 dark:group-hover:text-emerald-400 ml-0.5"></i>
              </button>
              <a href="tel:${apt.phone}" class="inline-flex items-center space-x-1 text-xs px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-lg font-mono font-bold">
                <i data-lucide="phone" class="w-3 h-3"></i>
                <span>${apt.phone || '-'}</span>
              </a>
            </div>
            <div class="pt-2 border-t border-slate-100 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2">
              <div class="flex flex-col gap-1 flex-grow">
                ${generateStatusDropdownHtml(apt.id, apt.status, apt.bookDate)}
                <div class="flex flex-wrap items-center gap-1">
                  ${generateStatusTimerBadgeHtml(apt)}
                  ${generateMassageTimingTextHtml(apt)}
                </div>
              </div>
              <div class="flex items-center space-x-1">
                ${generateDeskActionButtonHtml(apt)}
                <button onclick="bookNextAppointment('${apt.id}')" class="p-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs flex items-center space-x-1 shadow-xs transition" title="นัดหมายครั้งถัดไป (ดึงข้อมูลเดิม)">
                  <i data-lucide="calendar-plus" class="w-4 h-4"></i>
                  <span class="text-[11px]">นัดถัดไป</span>
                </button>
                <button onclick="playQueueAnnouncement('${safePatientName}', '${displaySlot}')" class="p-2 rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60" title="เรียกคิว (อ่านชื่อ-นามสกุล)">
                  <i data-lucide="bell" class="w-4 h-4"></i>
                </button>
                <button onclick="cancelAppointment('${apt.id}')" class="p-2 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60" title="ยกเลิกนัด">
                  <i data-lucide="calendar-x" class="w-4 h-4"></i>
                </button>
              </div>
            </div>
          `;
          cardsContainer.appendChild(card);
        });
      });
    }

    function renderDeskKanbanView(filtered, isMultiDay) {
      const board = document.getElementById("desk-kanban-board");
      if (!board) return;
      board.innerHTML = "";

      if (filtered.length === 0) {
        board.innerHTML = `<div class="col-span-full">${getEmptyDeskStateHtml(false)}</div>`;
        if (window.lucide) lucide.createIcons();
        return;
      }

      const columns = [
        {
          id: "waiting",
          title: "รอเรียก / ว่าง",
          icon: "clock",
          bgHeader: "bg-slate-700",
          borderCol: "border-slate-200 dark:border-slate-700",
          bgCol: "bg-slate-50/60 dark:bg-slate-900/40",
          badgeBg: "bg-slate-600 text-white",
          filterFn: a => a.status === "⚪ ว่าง" || a.status === "ว่าง" || !a.status
        },
        {
          id: "vitals",
          title: "รอตรวจ",
          icon: "stethoscope",
          bgHeader: "bg-amber-600",
          borderCol: "border-amber-200 dark:border-amber-900/50",
          bgCol: "bg-amber-50/30 dark:bg-amber-950/20",
          badgeBg: "bg-amber-700 text-white",
          filterFn: a => a.status === "🟡 รอตรวจ" || a.status === "รอตรวจ"
        },
        {
          id: "waiting-massage",
          title: "รอนวด",
          icon: "sparkles",
          bgHeader: "bg-sky-600",
          borderCol: "border-sky-200 dark:border-sky-900/50",
          bgCol: "bg-sky-50/30 dark:bg-sky-950/20",
          badgeBg: "bg-sky-700 text-white",
          filterFn: a => {
            const st = (a.status || '').replace('🔵 ', '').trim();
            return st === 'รอนวด' || st === 'ตรวจแล้ว' || st.startsWith('รอห้อง');
          }
        },
        {
          id: "in-room",
          title: "ห้อง 1-5 (กำลังนวด)",
          icon: "bed-double",
          bgHeader: "bg-purple-700",
          borderCol: "border-purple-200 dark:border-purple-900/50",
          bgCol: "bg-purple-50/30 dark:bg-purple-950/20",
          badgeBg: "bg-purple-800 text-white",
          filterFn: a => {
            const st = (a.status || '').replace('🟣 ', '').trim();
            return (st.startsWith('ห้อง') && !st.startsWith('รอห้อง')) || st.includes('ปฏิบัติ');
          }
        },
        {
          id: "done",
          title: "กลับบ้าน",
          icon: "check-circle",
          bgHeader: "bg-emerald-700",
          borderCol: "border-emerald-200 dark:border-emerald-900/50",
          bgCol: "bg-emerald-50/30 dark:bg-emerald-950/20",
          badgeBg: "bg-emerald-800 text-white",
          filterFn: a => a.status === "🟢 กลับบ้าน" || a.status === "กลับบ้าน"
        },
        {
          id: "transfer",
          title: "ส่งต่อ",
          icon: "share-2",
          bgHeader: "bg-rose-700",
          borderCol: "border-rose-200 dark:border-rose-900/50",
          bgCol: "bg-rose-50/30 dark:bg-rose-950/20",
          badgeBg: "bg-rose-800 text-white",
          filterFn: a => a.status === "🔴 ส่งต่อ" || a.status === "ส่งต่อ"
        }
      ];

      columns.forEach(col => {
        const colItems = filtered.filter(col.filterFn);
        const colEl = document.createElement("div");
        colEl.className = `w-full rounded-2xl border ${col.borderCol} ${col.bgCol} flex flex-col shadow-2xs overflow-hidden`;

        // Column Header
        const headerEl = document.createElement("div");
        headerEl.className = `${col.bgHeader} text-white px-3 py-2 flex items-center justify-between shadow-xs`;
        headerEl.innerHTML = `
          <div class="flex items-center space-x-1.5 min-w-0">
            <i data-lucide="${col.icon}" class="w-3.5 h-3.5 shrink-0"></i>
            <span class="font-bold text-xs tracking-tight truncate">${col.title}</span>
          </div>
          <span class="${col.badgeBg} text-[10px] sm:text-[11px] font-black px-2 py-0.5 rounded-full border border-white/20 shadow-2xs shrink-0">${colItems.length}</span>
        `;
        colEl.appendChild(headerEl);

        // Room Occupancy Sub-Bar for "ห้อง 1-5 (กำลังนวด)"
        if (col.id === "in-room") {
          const rooms = ["ห้อง 1", "ห้อง 2", "ห้อง 3", "ห้อง 4", "ห้อง 5"];
          const inRoomSubBar = document.createElement("div");
          inRoomSubBar.className = "bg-purple-100/90 dark:bg-purple-950/90 px-2 py-1.5 border-b border-purple-200 dark:border-purple-800 flex flex-wrap gap-1 items-center justify-between text-[10px] font-bold";
          
          let subBarHtml = "";
          rooms.forEach(rm => {
            const max = (typeof ROOM_CAPACITIES !== 'undefined' && ROOM_CAPACITIES[rm]) ? ROOM_CAPACITIES[rm] : (rm === "ห้อง 3" || rm === "ห้อง 4" ? 6 : 5);
            const occ = filtered.filter(a => {
              const st = (a.status || '').replace('🟣 ', '').replace('🔵 ', '').trim();
              return st === rm || st === ('รอ' + rm);
            }).length;
            const isFull = occ >= max;
            subBarHtml += `<span class="px-1.5 py-0.5 rounded ${isFull ? 'bg-rose-500 text-white font-black shadow-2xs animate-pulse' : 'bg-white dark:bg-slate-800 text-purple-900 dark:text-purple-200 border border-purple-300 dark:border-purple-700'}" title="${rm}: ครอง ${occ}/${max} เตียง">${rm}: ${occ}/${max} เตียง</span>`;
          });
          inRoomSubBar.innerHTML = subBarHtml;
          colEl.appendChild(inRoomSubBar);
        }

        // Column Cards Container
        const cardList = document.createElement("div");
        cardList.className = "p-2 space-y-2.5 flex-grow overflow-y-auto max-h-[calc(100vh-270px)] custom-scroll";

        if (colItems.length === 0) {
          cardList.innerHTML = `<div class="py-8 text-center text-xs text-slate-400 font-medium border border-dashed border-slate-300/70 dark:border-slate-700/70 rounded-xl bg-white/40 dark:bg-slate-800/30">ไม่มีคิว</div>`;
        } else {
          colItems.forEach(apt => {
            const isPostpartum = (apt.mainService === "จองฟื้นฟูหลังคลอด" || (apt.mainService && apt.mainService.includes("หลังคลอด")));
            const isMassage = (apt.mainService === "จองนวด" || (apt.mainService && apt.mainService.includes("นวด")));
            const isExtraOnly = (!apt.mainService || apt.mainService === "-" || apt.mainService === "บริการเสริม");

            let mainTitle = "💆‍♂️ นวด";
            let mainBadgeStyle = "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800";

            if (isPostpartum) {
              mainTitle = "🤱 ฟื้นฟู";
              mainBadgeStyle = "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800";
            } else if (isExtraOnly) {
              mainTitle = "🌿 เสริม";
              mainBadgeStyle = "bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-950 dark:text-teal-300 dark:border-teal-800";
            } else if (!isMassage) {
              mainTitle = apt.mainService;
            }
            
            const extrasCount = apt.extraServices ? apt.extraServices.length : 0;
            const extraTag = extrasCount > 0 ? `<span class="text-[9px] font-black bg-white/80 dark:bg-slate-900/80 px-1 py-0.2 rounded border border-current ml-0.5">+${extrasCount}</span>` : '';

            const safePatientName = apt.patientName.replace(/'/g, "\\'");
            const dateBadgeHtml = isMultiDay
              ? `<span class="text-[10px] font-bold text-herbal-800 dark:text-emerald-300 bg-herbal-100/90 dark:bg-emerald-950 border border-herbal-200 dark:border-emerald-800 px-1.5 py-0.2 rounded shrink-0">${formatThaiDateShort(apt.bookDate)}</span>`
              : '';

            const card = document.createElement("div");
            card.className = "bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200/90 dark:border-slate-700 shadow-2xs hover:shadow-md transition space-y-2";
            card.innerHTML = `
              <!-- Top Row: Time & Service Badge (Never overlapping) -->
              <div class="flex items-center justify-between gap-1 border-b border-slate-100 dark:border-slate-700/80 pb-2">
                <button type="button" onclick="openEditAppointmentTimeModal('${apt.id}')" class="flex items-center gap-1 font-black text-herbal-900 dark:text-emerald-300 text-xs shrink-0 px-2 py-0.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-slate-700 border border-transparent hover:border-emerald-300 transition cursor-pointer" title="คลิกเพื่อแก้ไขรอบเวลา">
                  <i data-lucide="calendar-clock" class="w-3.5 h-3.5 text-herbal-600 dark:text-emerald-400"></i>
                  <span>${apt.timeSlot} น.</span>
                  <i data-lucide="edit-3" class="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400 opacity-80"></i>
                  ${apt.slotsOccupied && apt.slotsOccupied.length > 1 ? '<span class="text-[9px] font-bold text-amber-700 bg-amber-50 dark:bg-amber-950 dark:text-amber-300 px-1 py-0.2 rounded border border-amber-200 dark:border-amber-800 shrink-0">2 ชม.</span>' : ''}
                </button>
                
                <button type="button" onclick="openEditServicesModal('${apt.id}')" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold ${mainBadgeStyle} border transition hover:opacity-80 cursor-pointer shadow-2xs shrink-0" title="คลิกเพื่อเปลี่ยนหรือเพิ่มหัตถการบริการ">
                  <span>${mainTitle}</span>
                  ${extraTag}
                  <i data-lucide="edit-3" class="w-2.5 h-2.5 opacity-70"></i>
                </button>
              </div>

              <!-- Middle: Date (if multi-day) + Patient Name, HN & Phone -->
              <div>
                ${isMultiDay ? `<div class="text-[10.5px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1 mb-1"><i data-lucide="calendar" class="w-3 h-3 text-slate-400"></i> <span>วันที่ ${formatThaiDateShort(apt.bookDate)}</span></div>` : ''}
                <div class="flex items-center justify-between gap-1">
                  <div class="flex items-center gap-1.5 min-w-0 flex-wrap">
                    <span class="font-bold text-slate-900 dark:text-slate-100 text-sm leading-snug truncate" title="${escapeHtml(apt.patientName)}">
                      ${escapeHtml(apt.patientName)}
                    </span>
                    ${getMedicalSchemeBadgeHtml(apt.medicalScheme)}
                  </div>
                  <button type="button" onclick="openEditPatientModalFromApt('${apt.id}')" class="text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 p-0.5 rounded transition shrink-0 cursor-pointer" title="แก้ไขข้อมูลคนไข้ / สิทธิ์การรักษา">
                    <i data-lucide="edit-2" class="w-3 h-3"></i>
                  </button>
                </div>
                <div class="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                  <span>HN: ${escapeHtml(apt.citizenOrHn || '-')}</span>
                  ${apt.phone ? `<a href="tel:${apt.phone}" class="text-herbal-700 dark:text-emerald-400 hover:underline font-bold flex items-center gap-1"><i data-lucide="phone" class="w-2.5 h-2.5"></i> ${escapeHtml(apt.phone)}</a>` : '<span class="text-slate-400">-</span>'}
                </div>
              </div>

              <!-- Select Controls: Assistant & Status -->
              <div class="space-y-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-700/80">
                <div>
                  ${generateAssistantDropdownHtml(apt.id, apt.assistantId, apt.assistantNick, "w-full px-2 py-1.5 text-xs border border-slate-300 dark:border-slate-600 rounded-lg outline-none font-medium bg-slate-50/80 dark:bg-slate-900/60 shadow-2xs cursor-pointer truncate")}
                </div>
                <div class="space-y-1">
                  ${generateStatusDropdownHtml(apt.id, apt.status, apt.bookDate, "w-full px-2 py-1.5 text-xs border border-slate-300 dark:border-slate-600 rounded-lg outline-none font-semibold bg-white dark:bg-slate-800 shadow-2xs cursor-pointer truncate")}
                  <div class="flex items-center justify-start gap-1 flex-wrap pt-0.5">
                    ${generateStatusTimerBadgeHtml(apt)}
                    ${generateMassageTimingTextHtml(apt)}
                  </div>
                </div>
              </div>

              <!-- Quick Action Button -->
              <div>
                ${generateDeskActionButtonHtml(apt, "w-full justify-center py-1.5 text-xs")}
              </div>

              <!-- Bottom Actions -->
              <div class="pt-1.5 border-t border-slate-100 dark:border-slate-700/80 flex items-center justify-between gap-1.5">
                <button onclick="playQueueAnnouncement('${safePatientName}', '${apt.timeSlot}')" class="flex-1 py-1.5 px-2 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 dark:hover:bg-amber-900/60 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1 shadow-2xs" title="เรียกคิวด้วยเสียง">
                  <i data-lucide="bell" class="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0"></i>
                  <span class="truncate">เรียกคิว</span>
                </button>
                <button onclick="bookNextAppointment('${apt.id}')" class="py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1 shadow-2xs shrink-0" title="นัดหมายครั้งถัดไป (ดึงข้อมูลเดิม)">
                  <i data-lucide="calendar-plus" class="w-3.5 h-3.5"></i>
                  <span class="text-[11px]">นัดถัดไป</span>
                </button>
                <button onclick="cancelAppointment('${apt.id}')" class="p-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-lg text-xs transition flex items-center justify-center shrink-0" title="ยกเลิกนัด">
                  <i data-lucide="calendar-x" class="w-4 h-4"></i>
                </button>
              </div>
            `;
            cardList.appendChild(card);
          });
        }

        colEl.appendChild(cardList);
        board.appendChild(colEl);
      });
    }

    function renderDeskAssistantView(filtered, isMultiDay) {
      const grid = document.getElementById("desk-assistant-grid");
      if (!grid) return;
      grid.innerHTML = "";

      if (filtered.length === 0) {
        grid.innerHTML = `<div class="col-span-full">${getEmptyDeskStateHtml(false)}</div>`;
        if (window.lucide) lucide.createIcons();
        return;
      }

      const list = (assistants && assistants.length > 0) ? assistants : [
        { id: "asst-1", nickname: "นัสรีน", active: true, gender: "หญิง" },
        { id: "asst-2", nickname: "มีนี", active: true, gender: "หญิง" },
        { id: "asst-3", nickname: "ฟา", active: true, gender: "หญิง" },
        { id: "asst-4", nickname: "เลาะห์", active: true, gender: "ชาย" }
      ];

      // Groups: Each Assistant + ขอผู้หญิง + ขอผู้ชาย + ไม่ระบุ
      const groups = [
        ...list.map(asst => ({
          type: "specific",
          id: asst.id,
          nickname: asst.nickname,
          active: asst.active !== false,
          gender: asst.gender || "หญิง",
          filterFn: a => (a.assistantId === asst.id || a.assistantNick === asst.nickname)
        })),
        {
          type: "female_request",
          id: "female",
          nickname: "ขอผู้หญิง",
          active: true,
          gender: "หญิง",
          filterFn: a => a.assistantId === "female" || (a.assistantNick && a.assistantNick.includes("ขอผู้หญิง"))
        },
        {
          type: "male_request",
          id: "male",
          nickname: "ขอผู้ชาย",
          active: true,
          gender: "ชาย",
          filterFn: a => a.assistantId === "male" || (a.assistantNick && a.assistantNick.includes("ขอผู้ชาย"))
        },
        {
          type: "auto",
          id: "auto",
          nickname: "ยังไม่ระบุ (จัดสรรตามเหมาะสม)",
          active: true,
          gender: "auto",
          filterFn: a => (!a.assistantId || a.assistantId === "auto" || !a.assistantNick || a.assistantNick === "ไม่ระบุ" || a.assistantNick === "จัดสรรตามเหมาะสม" || a.assistantNick === "จัดสรรตามความเหมาะสม") && (a.assistantId !== "female" && a.assistantId !== "male" && !(a.assistantNick && (a.assistantNick.includes("ขอผู้หญิง") || a.assistantNick.includes("ขอผู้ชาย"))))
        }
      ];

      groups.forEach(grp => {
        const apts = filtered.filter(grp.filterFn);
        const inRoomCount = apts.filter(a => a.status.startsWith("ห้อง") || a.status.includes("ปฏิบัติ")).length;
        const doneCount = apts.filter(a => a.status.includes("กลับบ้าน")).length;

        const card = document.createElement("div");
        card.className = "bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col overflow-hidden";

        let avatarBg = "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800";
        let avatarIcon = "👩";
        let statusBadge = `<span class="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">🟢 เข้าเวร</span>`;

        if (grp.gender === "ชาย") {
          avatarBg = "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800";
          avatarIcon = "👨";
        } else if (grp.type === "auto") {
          avatarBg = "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800";
          avatarIcon = "✨";
          statusBadge = `<span class="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">รอจัดสรร</span>`;
        } else if (grp.type === "female_request" || grp.type === "male_request") {
          statusBadge = `<span class="px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800">ระบุเพศ</span>`;
        }

        if (grp.type === "specific" && !grp.active) {
          statusBadge = `<span class="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">⚪ พักเวร</span>`;
        }

        card.innerHTML = `
          <!-- Header -->
          <div class="bg-gradient-to-r from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 p-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 rounded-xl ${avatarBg} border flex items-center justify-center text-lg font-bold shadow-2xs">
                ${avatarIcon}
              </div>
              <div>
                <div class="flex items-center space-x-2">
                  <h3 class="font-bold text-slate-800 dark:text-slate-100 text-base">${grp.nickname}</h3>
                  ${statusBadge}
                </div>
                <div class="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                  <span>นัดหมาย ${apts.length} ราย</span>
                  ${inRoomCount > 0 ? `<span class="text-purple-700 dark:text-purple-300 font-bold">• นวดอยู่ ${inRoomCount}</span>` : ''}
                  ${doneCount > 0 ? `<span class="text-emerald-700 dark:text-emerald-300 font-bold">• เสร็จ ${doneCount}</span>` : ''}
                </div>
              </div>
            </div>
            <span class="text-xs font-extrabold px-2.5 py-1 rounded-full ${apts.length > 0 ? 'bg-herbal-100 dark:bg-emerald-950 text-herbal-900 dark:text-emerald-300 border border-herbal-200 dark:border-emerald-800' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}">
              ${apts.length} คิว
            </span>
          </div>

          <!-- List of Appointments -->
          <div class="p-3 space-y-2.5 flex-grow overflow-y-auto max-h-[420px] custom-scroll">
            ${apts.length === 0 ? `
              <div class="p-6 text-center text-xs text-slate-400 dark:text-slate-500 font-medium border border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                ว่าง - ไม่มีคิวนัดหมายในช่วงเวลาที่เลือก
              </div>
            ` : apts.map(apt => {
              const safeName = apt.patientName.replace(/'/g, "\\'");
              const dateBadgeHtml = isMultiDay
                ? `<span class="text-[10px] font-bold text-herbal-900 dark:text-emerald-300 bg-herbal-100 dark:bg-emerald-950 border border-herbal-300 dark:border-emerald-800 px-1.5 py-0.5 rounded mr-1">${formatThaiDateShort(apt.bookDate)}</span>`
                : '';

              const isPostpartum = (apt.mainService === "จองฟื้นฟูหลังคลอด" || (apt.mainService && apt.mainService.includes("หลังคลอด")));
              const isMassage = (apt.mainService === "จองนวด" || (apt.mainService && apt.mainService.includes("นวด")));
              const isExtraOnly = (!apt.mainService || apt.mainService === "-" || apt.mainService === "บริการเสริม");

              let mainTitle = "💆‍♂️ นวด";
              let mainBadgeStyle = "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800";

              if (isPostpartum) {
                mainTitle = "🤱 ฟื้นฟู";
                mainBadgeStyle = "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800";
              } else if (isExtraOnly) {
                mainTitle = "🌿 เสริม";
                mainBadgeStyle = "bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-950 dark:text-teal-300 dark:border-teal-800";
              } else if (!isMassage) {
                mainTitle = apt.mainService;
              }
              const extrasCount = apt.extraServices ? apt.extraServices.length : 0;
              const extraTag = extrasCount > 0 ? `<span class="text-[9px] font-black bg-white/80 dark:bg-slate-900/80 px-1 py-0.2 rounded border border-current ml-0.5">+${extrasCount}</span>` : '';

              return `
                <div class="bg-slate-50/70 hover:bg-slate-50 dark:bg-slate-900/60 dark:hover:bg-slate-900/90 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700/80 transition space-y-2">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-1.5">
                      ${dateBadgeHtml}
                      <button type="button" onclick="openEditAppointmentTimeModal('${apt.id}')" class="font-extrabold text-herbal-900 dark:text-emerald-300 text-xs flex items-center gap-1 px-1.5 py-0.5 rounded-lg hover:bg-emerald-100 dark:hover:bg-slate-700 transition cursor-pointer" title="คลิกเพื่อแก้ไขรอบเวลา">
                        <i data-lucide="calendar-clock" class="w-3 h-3 text-herbal-600 dark:text-emerald-400"></i>
                        <span>${apt.timeSlot} น.</span>
                        <i data-lucide="edit-3" class="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400 opacity-80"></i>
                      </button>
                      ${apt.slotsOccupied && apt.slotsOccupied.length > 1 ? '<span class="text-[9px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950 px-1 py-0.2 rounded border border-amber-200 dark:border-amber-800 shrink-0">2 ชม.</span>' : ''}
                    </div>
                    <button type="button" onclick="openEditServicesModal('${apt.id}')" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold ${mainBadgeStyle} border transition hover:opacity-80 cursor-pointer shadow-2xs shrink-0" title="คลิกเพื่อเปลี่ยนหรือเพิ่มหัตถการบริการ">
                      <span>${mainTitle}</span>
                      ${extraTag}
                      <i data-lucide="edit-3" class="w-2.5 h-2.5 opacity-70"></i>
                    </button>
                  </div>

                  <div class="flex items-center justify-between">
                    <div>
                      <div class="flex items-center gap-1.5 flex-wrap">
                        <span class="font-bold text-slate-800 dark:text-slate-100 text-sm">${apt.patientName}</span>
                        ${getMedicalSchemeBadgeHtml(apt.medicalScheme)}
                        <button type="button" onclick="openEditPatientModalFromApt('${apt.id}')" class="text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 p-0.5 rounded transition cursor-pointer" title="แก้ไขข้อมูลคนไข้ / สิทธิ์การรักษา">
                          <i data-lucide="edit-2" class="w-3 h-3"></i>
                        </button>
                      </div>
                      <div class="text-xs text-slate-500 dark:text-slate-400 font-mono">${apt.citizenOrHn || '-'}</div>
                    </div>
                    <a href="tel:${apt.phone}" class="inline-flex items-center space-x-1 text-xs px-2 py-1 bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-lg font-mono font-bold shadow-2xs">
                      <i data-lucide="phone" class="w-3 h-3"></i>
                      <span>${apt.phone || '-'}</span>
                    </a>
                  </div>

                  <div class="pt-1.5 border-t border-slate-200/60 dark:border-slate-700/80 flex flex-wrap items-center justify-between gap-1.5">
                    <div class="flex flex-wrap items-center gap-1 flex-grow">
                      ${generateStatusDropdownHtml(apt.id, apt.status, apt.bookDate)}
                      ${generateStatusTimerBadgeHtml(apt)}
                      ${generateMassageTimingTextHtml(apt)}
                    </div>
                    <div class="flex items-center space-x-1">
                      ${generateDeskActionButtonHtml(apt)}
                      <button onclick="bookNextAppointment('${apt.id}')" class="px-2 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-2xs transition flex items-center space-x-1" title="นัดหมายครั้งถัดไป (ดึงข้อมูลเดิม)">
                        <i data-lucide="calendar-plus" class="w-3.5 h-3.5"></i>
                        <span class="text-[11px]">นัดถัดไป</span>
                      </button>
                      <button onclick="playQueueAnnouncement('${safeName}', '${apt.timeSlot}')" class="p-1.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 rounded-lg text-xs transition" title="เรียกคิว">
                        <i data-lucide="bell" class="w-3.5 h-3.5"></i>
                      </button>
                    </div>
                  </div>
                </div>
              `;
            }).join("")}
          </div>
        `;
        grid.appendChild(card);
      });
    }

    function renderDeskCompactView(filtered, isMultiDay) {
      const list = document.getElementById("desk-compact-list");
      if (!list) return;
      list.innerHTML = "";

      if (filtered.length === 0) {
        list.innerHTML = getEmptyDeskStateHtml(false);
        if (window.lucide) lucide.createIcons();
        return;
      }

      const slotFilter = document.getElementById("desk-filter-slot") ? document.getElementById("desk-filter-slot").value : "all";

      const groups = [];
      const groupMap = new Map();

      filtered.forEach(apt => {
        const aptSlots = (apt.slotsOccupied && apt.slotsOccupied.length > 0) ? apt.slotsOccupied : [apt.timeSlot];
        const targetSlots = (slotFilter !== "all")
          ? aptSlots.filter(s => s === slotFilter)
          : aptSlots;

        targetSlots.forEach(slot => {
          const groupKey = isMultiDay ? `${apt.bookDate}___${slot}` : slot;
          if (!groupMap.has(groupKey)) {
            const newGroup = {
              key: groupKey,
              bookDate: apt.bookDate,
              timeSlot: slot,
              items: []
            };
            groupMap.set(groupKey, newGroup);
            groups.push(newGroup);
          }
          const isSecondSlot = (slot !== apt.timeSlot);
          groupMap.get(groupKey).items.push({
            apt,
            displaySlot: slot,
            isSecondSlot
          });
        });
      });

      // Sort groups chronologically
      function extractSlotMinutes(s) {
        if (!s) return 9999;
        const clean = String(s).replace(/[^0-9:]/g, '').replace('.', ':');
        const parts = clean.split(':');
        if (parts.length >= 2) return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
        return 9999;
      }

      groups.sort((a, b) => {
        if (a.bookDate !== b.bookDate) {
          return a.bookDate.localeCompare(b.bookDate);
        }
        return extractSlotMinutes(a.timeSlot) - extractSlotMinutes(b.timeSlot);
      });

      groups.forEach(group => {
        let grpMaleCount = 0;
        let grpFemaleCount = 0;
        let grpOtherCount = 0;

        group.items.forEach(({ apt }) => {
          const g = getAppointmentGender(apt);
          if (g === 'male') grpMaleCount++;
          else if (g === 'female') grpFemaleCount++;
          else grpOtherCount++;
        });

        // Group Header Bar (สรุปยอดแต่ละรอบ เช่น รอบ 08.00 มีใครบ้าง แยกชาย หญิง)
        const groupHeader = document.createElement("div");
        groupHeader.className = "bg-gradient-to-r from-emerald-100 via-teal-50 to-emerald-50/80 dark:from-emerald-950 dark:via-slate-900 dark:to-slate-850 px-4 py-3 border-y-2 border-emerald-300 dark:border-emerald-700/80 flex items-center justify-between flex-wrap gap-2 shadow-xs first:border-t-0";
        groupHeader.innerHTML = `
          <div class="flex items-center gap-2 sm:gap-2.5 flex-wrap">
            <span class="px-3.5 py-1 rounded-xl bg-gradient-to-r from-emerald-700 to-teal-800 text-white font-mono font-black text-xs sm:text-sm shadow-xs flex items-center gap-1.5">
              <span>⏰</span>
              <span>รอบ ${formatTimeLabel(group.timeSlot)}</span>
            </span>
            ${isMultiDay ? `<span class="text-xs font-black text-emerald-900 dark:text-emerald-200 bg-emerald-100/90 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-800 px-2.5 py-0.5 rounded-xl shadow-2xs">📅 วันที่ ${formatThaiDateShort(group.bookDate)}</span>` : ''}
            <span class="text-xs sm:text-sm font-black px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-xl bg-white dark:bg-slate-800 text-emerald-950 dark:text-emerald-200 border-2 border-emerald-300 dark:border-emerald-700 shadow-2xs">
              รวม <strong class="text-emerald-700 dark:text-emerald-400 font-black text-sm sm:text-base">${group.items.length}</strong> คน
            </span>
            <span class="text-xs sm:text-sm font-bold px-2.5 py-0.5 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-900 dark:text-sky-200 border border-sky-300 dark:border-sky-800 shadow-2xs flex items-center gap-1">
              <span>👨 ชาย</span>
              <strong class="text-sm sm:text-base text-sky-950 dark:text-white font-black">${grpMaleCount}</strong>
            </span>
            <span class="text-xs sm:text-sm font-bold px-2.5 py-0.5 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-900 dark:text-rose-200 border border-rose-300 dark:border-rose-800 shadow-2xs flex items-center gap-1">
              <span>👩 หญิง</span>
              <strong class="text-sm sm:text-base text-rose-950 dark:text-white font-black">${grpFemaleCount}</strong>
            </span>
            ${grpOtherCount > 0 ? `<span class="text-xs font-bold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700" title="ไม่ระบุ">${grpOtherCount}</span>` : ''}
          </div>
        `;
        list.appendChild(groupHeader);

        // Patients in this group (แสดงแค่ชื่อและผู้นวด อย่างอื่นเอาออกให้หมด)
        group.items.forEach(({ apt, isSecondSlot }, itemIdx) => {
          const row = document.createElement("div");
          row.className = "px-4 py-3 sm:py-3.5 bg-white dark:bg-slate-850 hover:bg-emerald-50/50 dark:hover:bg-slate-800/80 transition border-b border-slate-200 dark:border-slate-750 flex items-center justify-between gap-3";
          row.innerHTML = `
            <!-- Left: ลำดับ & ชื่อคนไข้ -->
            <div class="flex items-center space-x-3 min-w-0 flex-1">
              <span class="w-7 h-7 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-mono font-black text-xs sm:text-sm flex items-center justify-center shrink-0 shadow-2xs">
                ${itemIdx + 1}
              </span>
              <span class="font-black text-slate-900 dark:text-white text-base sm:text-lg truncate tracking-tight">
                ${escapeHtml(apt.patientName)}
              </span>
              ${isSecondSlot ? '<span class="text-[10px] font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950 px-2 py-0.5 rounded-md border border-purple-200 shrink-0">ต่อเนื่อง 2 ชม.</span>' : ''}
            </div>

            <!-- Right: ผู้นวด -->
            <div class="shrink-0 flex items-center gap-1.5 text-sm sm:text-base">
              <span class="text-slate-500 dark:text-slate-400 font-bold">ผู้นวด:</span>
              <span class="font-black text-emerald-800 dark:text-emerald-300 px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 shadow-2xs">
                ${escapeHtml(apt.assistantNick || 'ไม่ระบุ')}
              </span>
            </div>
          `;
          list.appendChild(row);
        });
      });
    }

    function renderDeskRoomsView(filtered, isMultiDay) {
      const container = document.getElementById("desk-room-matrix-container");
      if (!container) return;
      container.innerHTML = "";

      if (filtered.length === 0) {
        container.innerHTML = getEmptyDeskStateHtml(false);
        if (window.lucide) lucide.createIcons();
        return;
      }

      const timeSlots = (clinicConfig && clinicConfig.timeSlots) ? clinicConfig.timeSlots : [
        "08:00", "09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"
      ];

      const rooms = ["ห้อง 1", "ห้อง 2", "ห้อง 3", "ห้อง 4", "ห้อง 5"];

      const table = document.createElement("table");
      table.className = "w-full text-left text-xs border-collapse";

      table.innerHTML = `
        <thead class="bg-herbal-700 text-white font-bold uppercase tracking-wider">
          <tr>
            <th class="py-3 px-3 w-28 border border-herbal-800 text-center">รอบเวลา</th>
            ${rooms.map(rm => {
              const cap = (typeof ROOM_CAPACITIES !== 'undefined' && ROOM_CAPACITIES[rm]) ? ROOM_CAPACITIES[rm] : 5;
              return `<th class="py-3 px-3 border border-herbal-800 text-center">🟣 ${rm} <span class="text-[10px] font-normal text-herbal-200">(${cap} เตียง)</span></th>`;
            }).join("")}
            <th class="py-3 px-3 w-48 border border-herbal-800 text-center bg-herbal-800">🟡 รอตรวจ / 🔵 รอนวด</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-200">
        </tbody>
      `;

      const tbody = table.querySelector("tbody");

      timeSlots.forEach(slot => {
        const slotApts = filtered.filter(a => a.timeSlot === slot || (a.slotsOccupied && a.slotsOccupied.includes(slot)));

        const tr = document.createElement("tr");
        tr.className = "hover:bg-slate-50/80 dark:hover:bg-slate-850/80 transition border-b border-slate-200 dark:border-slate-700";

        // Slot Time Column
        let trHtml = `
          <td class="py-3 px-2 text-center font-extrabold text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-900/60 border-r border-slate-200 dark:border-slate-700 whitespace-nowrap">
            <div class="text-sm font-black text-herbal-900 dark:text-emerald-300">${formatTimeLabel(slot)}</div>
            <span class="text-[10px] text-slate-500 dark:text-slate-400 font-medium">${slotApts.length} ราย</span>
          </td>
        `;

        // Rooms 1 to 5 Columns
        rooms.forEach(rm => {
          const rmApts = slotApts.filter(a => a.status === rm);
          if (rmApts.length > 0) {
            const cardsHtml = rmApts.map(apt => {
              const safeName = apt.patientName.replace(/'/g, "\\'");
              return `
                <div class="bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800/60 rounded-lg p-2 shadow-2xs mb-1.5 last:mb-0">
                  <div class="flex items-center gap-1 min-w-0 flex-wrap">
                    <span class="font-bold text-purple-950 dark:text-purple-200 text-xs truncate">${apt.patientName}</span>
                    ${getMedicalSchemeBadgeHtml(apt.medicalScheme)}
                  </div>
                  <div class="text-[11px] text-purple-800 dark:text-purple-300 font-medium flex items-center justify-between mt-0.5">
                    <span>👤 ${apt.assistantNick || 'ไม่ระบุ'}</span>
                    <button onclick="playQueueAnnouncement('${safeName}', '${apt.timeSlot}')" class="p-1 text-purple-700 hover:text-purple-950 dark:text-purple-300 dark:hover:text-purple-100" title="เรียกคิว">
                      <i data-lucide="bell" class="w-3 h-3"></i>
                    </button>
                  </div>
                  <div class="mt-1 space-y-1">
                    ${generateStatusDropdownHtml(apt.id, apt.status, apt.bookDate, "w-full px-1.5 py-1 text-[11px] border border-slate-300 dark:border-slate-600 rounded outline-none font-semibold bg-white dark:bg-slate-800 shadow-2xs cursor-pointer truncate")}
                    <div class="flex justify-start pt-0.5">${generateStatusTimerBadgeHtml(apt)}</div>
                  </div>
                  <div class="mt-1">
                    ${generateDeskActionButtonHtml(apt, "w-full justify-center py-1 text-[11px]")}
                  </div>
                </div>
              `;
            }).join("");
            trHtml += `<td class="py-2.5 px-2 border-r border-slate-200 dark:border-slate-700 align-top">${cardsHtml}</td>`;
          } else {
            trHtml += `
              <td class="py-2.5 px-2 border-r border-slate-200 dark:border-slate-700 align-top text-center">
                <span class="inline-block py-1.5 px-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold border border-emerald-200/70 dark:border-emerald-800/60">
                  🟢 ว่าง
                </span>
              </td>
            `;
          }
        });

        // Unassigned / Waiting Column
        const unassignedApts = slotApts.filter(a => !rooms.includes(a.status));
        if (unassignedApts.length > 0) {
          const unassignedHtml = unassignedApts.map(apt => {
            const safeName = apt.patientName.replace(/'/g, "\\'");
            return `
              <div class="bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/60 rounded-lg p-2 shadow-2xs mb-1.5 last:mb-0">
                <div class="flex items-center gap-1 min-w-0 flex-wrap">
                  <span class="font-bold text-amber-950 dark:text-amber-200 text-xs truncate">${apt.patientName}</span>
                  ${getMedicalSchemeBadgeHtml(apt.medicalScheme)}
                </div>
                <div class="text-[11px] text-amber-800 dark:text-amber-300 flex items-center justify-between mt-0.5">
                  <span>${apt.status}</span>
                  <button onclick="playQueueAnnouncement('${safeName}', '${apt.timeSlot}')" class="p-1 text-amber-700 hover:text-amber-950 dark:text-amber-300 dark:hover:text-amber-100" title="เรียกคิว">
                    <i data-lucide="bell" class="w-3 h-3"></i>
                  </button>
                </div>
                <div class="mt-1 space-y-1">
                  ${generateStatusDropdownHtml(apt.id, apt.status, apt.bookDate, "w-full px-1.5 py-1 text-[11px] border border-slate-300 dark:border-slate-600 rounded outline-none font-semibold bg-white dark:bg-slate-800 shadow-2xs cursor-pointer truncate")}
                  <div class="flex justify-start pt-0.5">${generateStatusTimerBadgeHtml(apt)}</div>
                </div>
                <div class="mt-1">
                  ${generateDeskActionButtonHtml(apt, "w-full justify-center py-1 text-[11px]")}
                </div>
              </div>
            `;
          }).join("");
          trHtml += `<td class="py-2.5 px-2 align-top bg-amber-50/30 dark:bg-amber-950/20">${unassignedHtml}</td>`;
        } else {
          trHtml += `<td class="py-2.5 px-2 align-top text-center text-slate-400 dark:text-slate-500 text-[11px] bg-slate-50/40 dark:bg-slate-900/30">-</td>`;
        }

        tr.innerHTML = trHtml;
        tbody.appendChild(tr);
      });

      container.appendChild(table);
    }

    function generateAssistantDropdownHtml(appointmentId, currentAssistantId, currentAssistantNick, customClass = "") {
      const apt = appointments.find(a => a.id === appointmentId);
      const aptDate = apt ? apt.bookDate : todayStr;
      const aptSlot = apt ? apt.timeSlot : "";
      const aptSlots = (apt && apt.slotsOccupied && apt.slotsOccupied.length > 0) ? apt.slotsOccupied : (aptSlot ? [aptSlot] : []);

      const list = (assistants && assistants.length > 0) ? assistants : [
        { id: "asst-1", nickname: "นัสรีน", active: true },
        { id: "asst-2", nickname: "มีนี", active: true },
        { id: "asst-3", nickname: "ฟา", active: true },
        { id: "asst-4", nickname: "เลาะห์", active: true }
      ];

      const isFemale = currentAssistantId === "female" || (currentAssistantNick && (currentAssistantNick.includes("ขอผู้หญิง") || currentAssistantNick.includes("ผู้หญิง")));
      const isMale = currentAssistantId === "male" || (currentAssistantNick && (currentAssistantNick.includes("ขอผู้ชาย") || currentAssistantNick.includes("ผู้ชาย")));
      const isAuto = (!currentAssistantId || 
                      currentAssistantId === "auto" || 
                      !currentAssistantNick || 
                      currentAssistantNick === "ไม่ระบุ" || 
                      currentAssistantNick === "จัดสรรตามเหมาะสม" || 
                      currentAssistantNick === "จัดสรรตามความเหมาะสม") && !isFemale && !isMale;

      const isSpecific = !isAuto && !isFemale && !isMale;

      const hasCurrent = list.some(a => a.id === currentAssistantId || a.nickname === currentAssistantNick);
      let extraOption = "";
      if (isSpecific && !hasCurrent && currentAssistantNick) {
        extraOption = `<option value="${currentAssistantId || currentAssistantNick}" selected>👤 ${currentAssistantNick}</option>`;
      }

      // Check gender availability for this slot
      let femaleOption = `<option value="female" ${isFemale ? "selected" : ""}>👩 ขอผู้หญิง</option>`;
      let maleOption = `<option value="male" ${isMale ? "selected" : ""}>👨 ขอผู้ชาย</option>`;
      if (aptDate && aptSlot) {
        const genderAvail = getGenderAvailability(aptDate, aptSlot, false);
        if (!genderAvail.femaleAvailable && !isFemale) {
          femaleOption = `<option value="female" disabled class="text-slate-400 bg-slate-100 dark:bg-slate-800 cursor-not-allowed">👩 ขอผู้หญิง (❌ ไม่มีหมอหญิงว่าง/อยู่เวร)</option>`;
        }
        if (!genderAvail.maleAvailable && !isMale) {
          maleOption = `<option value="male" disabled class="text-slate-400 bg-slate-100 dark:bg-slate-800 cursor-not-allowed">👨 ขอผู้ชาย (❌ ไม่มีหมอชายว่าง/อยู่เวร)</option>`;
        }
      }

      // Group assistants into On-Duty (Available), Occupied in this round (Busy), and Off-Duty
      let availableOptions = "";
      let occupiedOptions = "";
      let offDutyOptions = "";

      list.forEach(asst => {
        const isSelected = (isSpecific && (asst.id === currentAssistantId || (asst.nickname && asst.nickname === currentAssistantNick)));
        const onDuty = aptSlot ? isAssistantOnDutyForSlot(asst, aptSlot, aptDate) : true;
        const nick = asst.nickname || asst.name;

        // Check if this assistant is already occupied by another patient in the same slot(s)
        const isOccupiedByOther = appointments.some(other => {
          if (other.id === appointmentId || other.bookDate !== aptDate) return false;
          if (other.status === "🔴 ส่งต่อ" || other.status === "ยกเลิก" || other.status === "⚪ ว่าง" || other.status === "ว่าง") return false;
          
          const matchesAsst = (other.assistantId === asst.id) || (other.assistantNick && (other.assistantNick === asst.nickname || other.assistantNick === asst.name));
          if (!matchesAsst) return false;
          
          const otherSlots = (other.slotsOccupied && other.slotsOccupied.length > 0) ? other.slotsOccupied : [other.timeSlot];
          return aptSlots.some(s => otherSlots.includes(s));
        });

        if (onDuty) {
          if (isOccupiedByOther) {
            if (isSelected) {
              occupiedOptions += `<option value="${asst.id}" selected class="text-amber-800 dark:text-amber-300 font-bold bg-amber-50 dark:bg-amber-950/60">👤 ${escapeHtml(nick)} (⚠️ ไม่ว่าง - ติดคิวอื่นในรอบนี้)</option>`;
            } else {
              occupiedOptions += `<option value="${asst.id}" class="text-amber-800 dark:text-amber-300 font-bold bg-amber-50 dark:bg-amber-950/60">❌ 👤 ${escapeHtml(nick)} (ไม่ว่าง - ติดคิวรอบนี้)</option>`;
            }
          } else {
            availableOptions += `<option value="${asst.id}" ${isSelected ? "selected" : ""}>👤 ${escapeHtml(nick)}</option>`;
          }
        } else {
          if (isSelected) {
            offDutyOptions += `<option value="${asst.id}" selected class="text-rose-600 dark:text-rose-400 font-bold bg-rose-50 dark:bg-rose-950/60">🔒 ${escapeHtml(nick)} (ไม่อยู่เวร)</option>`;
          } else {
            offDutyOptions += `<option value="${asst.id}" disabled class="text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 cursor-not-allowed">🔒 ${escapeHtml(nick)} (ไม่อยู่เวร)</option>`;
          }
        }
      });

      // No '✨ ไม่ระบุ' in the options list. If isAuto, show disabled hidden placeholder
      let placeholderOption = "";
      if (isAuto) {
        placeholderOption = `<option value="auto" selected disabled hidden>-- เลือกผู้ช่วย/เพศ --</option>`;
      }

      let highlightClass = "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100";
      if (isAuto) {
        highlightClass = "border-amber-400 dark:border-amber-600/70 bg-amber-50/80 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300";
      } else if (isFemale) {
        highlightClass = "border-rose-400 dark:border-rose-600/70 bg-rose-50/90 dark:bg-rose-950/60 text-rose-900 dark:text-rose-300";
      } else if (isMale) {
        highlightClass = "border-blue-400 dark:border-blue-600/70 bg-blue-50/90 dark:bg-blue-950/60 text-blue-900 dark:text-blue-300";
      }

      const baseClass = customClass || "w-36 px-2.5 py-1.5 text-xs border rounded-xl outline-none font-bold shadow-2xs cursor-pointer hover:border-herbal-500 focus:ring-2 focus:ring-herbal-500/40 transition";

      return `
        <select onfocus="isUserInteractingWithDropdown = true; lastDropdownInteractionTime = Date.now();" onchange="handleAssistantChange('${appointmentId}', this.value)" class="${baseClass} ${highlightClass}">
          ${placeholderOption}${femaleOption}${maleOption}${extraOption}${availableOptions}${occupiedOptions}${offDutyOptions}
        </select>
      `;
    }

    async function handleAssistantChange(appointmentId, newAssistantId) {
      isUserInteractingWithDropdown = false;
      const apt = appointments.find(a => a.id === appointmentId);
      if (!apt) return;

      const aptSlots = (apt.slotsOccupied && apt.slotsOccupied.length > 0) ? apt.slotsOccupied : [apt.timeSlot];
      const requiresTwoSlots = aptSlots.length > 1;

      // Universal Conflict Validation (v5.4.2)
      const conflict = (typeof checkAssistantBookingConflict === "function") ? checkAssistantBookingConflict({
        assistantId: newAssistantId,
        bookDate: apt.bookDate,
        timeSlot: apt.timeSlot,
        slotsOccupied: aptSlots,
        excludeAppointmentId: apt.id,
        requiresTwoSlots: requiresTwoSlots,
        patientName: apt.patientName
      }) : { hasConflict: false };

      if (conflict && conflict.hasConflict) {
        if (typeof showAssistantConflictModal === "function") {
          showAssistantConflictModal(conflict, apt.timeSlot, apt.bookDate);
        }
        showToast(`❌ ไม่สามารถเลือกผู้ช่วยฯ ท่านนี้ได้: ${conflict.title}`, "error");
        renderDeskQueue(true); // Revert dropdown in UI
        return;
      }

      let newNick = "ไม่ระบุ";
      if (newAssistantId === "female") {
        newNick = "ไม่ระบุ (ขอผู้หญิง)";
      } else if (newAssistantId === "male") {
        newNick = "ไม่ระบุ (ขอผู้ชาย)";
      } else if (newAssistantId === "auto") {
        newNick = "ไม่ระบุ";
      } else {
        const targetAsst = assistants.find(a => a.id === newAssistantId);
        newNick = targetAsst ? (targetAsst.nickname || targetAsst.name) : newAssistantId;
      }

      const oldNick = apt.assistantNick;

      // 1. Lock assistant in-flight
      inFlightAssistantUpdates.add(appointmentId);

      // 2. Optimistic local update
      apt.assistantId = newAssistantId;
      apt.assistantNick = newNick;
      persistAppointments();

      // 3. Update hash
      lastAppointmentsHash = computeAppointmentsHash(appointments);

      // 4. Toast
      if (newAssistantId === "female") {
        showToast(`💾 บันทึก: ปรับผู้ช่วยฯ คุณ ${apt.patientName} เป็น "👩 ขอผู้หญิง" สำเร็จ`, "success");
      } else if (newAssistantId === "male") {
        showToast(`💾 บันทึก: ปรับผู้ช่วยฯ คุณ ${apt.patientName} เป็น "👨 ขอผู้ชาย" สำเร็จ`, "success");
      } else {
        showToast(`💾 บันทึก: เลือกผู้ช่วยฯ คุณ ${apt.patientName} เป็น "👤 ${newNick}" สำเร็จ`, "success");
        addNotification({
          type: "ASSISTANT_ASSIGNED",
          title: `👤 มอบหมายนัดหมายให้คุณ: คุณ ${apt.patientName}`,
          message: `คุณได้รับการมอบหมายให้ดูแลคุณ ${apt.patientName} (รอบ ${formatTimeLabel(apt.timeSlot)} วันที่ ${formatThaiDateShort(apt.bookDate)}) หัตถการ: ${apt.mainService || 'บริการนวด/หัตถการ'}`,
          patientName: apt.patientName,
          patientPhone: apt.phone || "",
          patientUserId: apt.userId || apt.patientUserId || "",
          appointmentId: apt.id,
          targetAssistantId: newAssistantId,
          targetAssistantNick: newNick,
          targetRole: "staff"
        });
      }

      // 5. Force UI re-render
      renderDeskQueue(true);
      renderStatsAndShare(true);

      await logActivity("CHANGE_ASSISTANT", `เปลี่ยนผู้ช่วยฯ ของ ${apt.patientName} (${formatTimeLabel(apt.timeSlot)}) เป็น "${newNick}"`, {
        appointmentId,
        patientName: apt.patientName,
        bookDate: apt.bookDate,
        timeSlot: apt.timeSlot,
        oldAssistant: oldNick,
        newAssistant: newNick
      });

      if (supabaseClient) {
        try {
          const { error } = await supabaseClient.from("appointments").update({
            assistant_id: newAssistantId,
            assistant_nick: newNick
          }).eq("id", appointmentId);
          if (error) throw error;
        } catch(e) {
          console.error("Supabase assistant update error:", e);
          showToast("บันทึกบน Cloud ไม่สำเร็จ: " + e.message, "error");
        } finally {
          setTimeout(() => {
            inFlightAssistantUpdates.delete(appointmentId);
          }, 3000);
        }
      } else {
        inFlightAssistantUpdates.delete(appointmentId);
      }
    }

    function generateStatusDropdownHtml(appointmentId, currentStatus, dateStr, customClass = "") {
      const roomOccupiedCounts = { "ห้อง 1": 0, "ห้อง 2": 0, "ห้อง 3": 0, "ห้อง 4": 0, "ห้อง 5": 0 };
      
      appointments.filter(a => a.bookDate === dateStr).forEach(a => {
        const cleanSt = (a.status || "").replace("🔵 ", "").replace("🟣 ", "").trim();
        const matched = cleanSt.match(/^(?:รอ)?(ห้อง\s*[1-5])/);
        if (matched) {
          const rmKey = matched[1].replace(/\s+/g, " ");
          if (roomOccupiedCounts[rmKey] !== undefined) {
            roomOccupiedCounts[rmKey]++;
          }
        }
      });

      const cleanCurrent = (currentStatus || "").replace("🔵 ", "").replace("🟣 ", "").trim();
      const currentMatched = cleanCurrent.match(/^(?:รอ)?(ห้อง\s*[1-5])/);
      const currentAssignedRoom = currentMatched ? currentMatched[1].replace(/\s+/g, " ") : null;
      const isMassaging = (currentStatus || "").startsWith("🟣");

      const getRoomCap = (room) => {
        return (typeof ROOM_CAPACITIES !== 'undefined' && ROOM_CAPACITIES[room]) ? ROOM_CAPACITIES[room] : (room === "ห้อง 3" || room === "ห้อง 4" ? 6 : 5);
      };

      const isRoomFullForApt = (roomKey) => {
        const cap = getRoomCap(roomKey);
        const totalOcc = roomOccupiedCounts[roomKey] || 0;
        if (currentAssignedRoom === roomKey) {
          return false; // already in this room
        }
        return totalOcc >= cap;
      };

      const rooms = ["ห้อง 1", "ห้อง 2", "ห้อง 3", "ห้อง 4", "ห้อง 5"];

      const roomOptions = rooms.map(rm => {
        const cap = getRoomCap(rm);
        const total = roomOccupiedCounts[rm] || 0;
        const disabled = isRoomFullForApt(rm);
        const isFull = total >= cap;
        const isCurrentRoomAndMassaging = (currentAssignedRoom === rm && isMassaging);
        const icon = isCurrentRoomAndMassaging ? "🟣" : "🔵";
        const statusVal = isCurrentRoomAndMassaging ? `🟣 ${rm}` : `🔵 ${rm}`;
        const tag = isCurrentRoomAndMassaging ? " (กำลังนวด)" : "";
        return {
          value: statusVal,
          matchRoom: rm,
          label: `${icon} ${rm}${tag} (ครอง ${total}/${cap} เตียง${isFull && disabled ? ' - เต็ม' : ''})`,
          disabled
        };
      });

      const options = [
        { value: "⚪ ว่าง", label: "⚪ ว่าง" },
        { value: "🟡 รอตรวจ", label: "🟡 รอตรวจ" },
        { value: "🔵 รอนวด", label: "🔵 รอนวด" },
        ...roomOptions,
        { value: "🔴 ส่งต่อ", label: "🔴 ส่งต่อ" },
        { value: "🟢 กลับบ้าน", label: "🟢 กลับบ้าน" }
      ];

      const isOptionSelected = (opt) => {
        if (opt.value === currentStatus) return true;
        const cleanSt = (currentStatus || "").replace("🔵 ", "").replace("🟣 ", "").trim();
        if (opt.matchRoom && (cleanSt === opt.matchRoom || cleanSt === "รอ" + opt.matchRoom)) {
          return true;
        }
        const cleanVal = opt.value.replace("🔵 ", "").replace("🟣 ", "").trim();
        if (cleanSt === cleanVal) return true;
        if ((cleanSt === "ตรวจแล้ว" || cleanSt === "รอนวด") && cleanVal === "รอนวด") return true;
        return false;
      };

      let selectOptions = options.map(opt => {
        const isSelected = isOptionSelected(opt) ? "selected" : "";
        const isDisabled = opt.disabled ? "disabled" : "";
        return `<option value="${opt.value}" ${isSelected} ${isDisabled}>${opt.label.trim()}</option>`;
      }).join("");

      // Status-specific color accenting (Blue for waiting in room, Purple for active massage)
      let statusColorClass = "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border-slate-300 dark:border-slate-700";
      if (currentStatus === "🟡 รอตรวจ") {
        statusColorClass = "bg-amber-50 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200 border-amber-400 dark:border-amber-600 font-extrabold";
      } else if (currentStatus.startsWith("🔵") || currentStatus.includes("รอนวด") || currentStatus.includes("ตรวจแล้ว")) {
        // BLUE COLOR for waiting in room or waiting massage
        statusColorClass = "bg-blue-50 dark:bg-blue-950/70 text-blue-900 dark:text-blue-200 border-blue-400 dark:border-blue-600 font-extrabold";
      } else if (currentStatus.startsWith("🟣")) {
        // PURPLE COLOR for active massage
        statusColorClass = "bg-purple-50 dark:bg-purple-950/70 text-purple-900 dark:text-purple-200 border-purple-400 dark:border-purple-600 font-extrabold";
      } else if (currentStatus === "🟢 กลับบ้าน") {
        statusColorClass = "bg-emerald-50 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-200 border-emerald-400 dark:border-emerald-600 font-extrabold";
      } else if (currentStatus === "🔴 ส่งต่อ") {
        statusColorClass = "bg-rose-50 dark:bg-rose-950/70 text-rose-900 dark:text-rose-200 border-rose-400 dark:border-rose-600 font-extrabold";
      }

      const baseClass = customClass
        ? `${customClass} ${statusColorClass} border-2 rounded-xl outline-none font-bold shadow-2xs cursor-pointer transition`
        : `w-36 px-2.5 py-1.5 text-xs ${statusColorClass} border-2 rounded-xl outline-none font-bold shadow-2xs cursor-pointer transition`;

      return `
        <select onfocus="isUserInteractingWithDropdown = true; lastDropdownInteractionTime = Date.now();" onchange="handleStatusChange('${appointmentId}', this.value)" class="${baseClass}">
          ${selectOptions}
        </select>
      `;
    }

    async function handleStatusChange(appointmentId, newStatus) {
      isUserInteractingWithDropdown = false;
      const apt = appointments.find(a => a.id === appointmentId);
      if (!apt) return;

      const oldStatus = apt.status;
      if (oldStatus === newStatus) return;

      // Quota Validation for Room 1 - 5
      const cleanNewStatus = (newStatus || "").replace("🔵 ", "").replace("🟣 ", "").trim();
      const roomMatch = cleanNewStatus.match(/^(?:รอ)?(ห้อง\s*[1-5])/);
      const targetRoom = roomMatch ? roomMatch[1].replace(/\s+/g, " ") : null;

      if (targetRoom) {
        const maxCapacity = (typeof ROOM_CAPACITIES !== 'undefined' && ROOM_CAPACITIES[targetRoom]) 
          ? ROOM_CAPACITIES[targetRoom] 
          : (targetRoom === "ห้อง 3" || targetRoom === "ห้อง 4" ? 6 : 5);

        // Count how many OTHER appointments on this date are currently in targetRoom
        const otherOccupiedCount = appointments.filter(a => {
          if (a.id === appointmentId || a.bookDate !== apt.bookDate) return false;
          const st = (a.status || "").replace("🔵 ", "").replace("🟣 ", "").trim();
          return st === targetRoom || st === ("รอ" + targetRoom);
        }).length;

        if (otherOccupiedCount >= maxCapacity) {
          showToast(`⚠️ ไม่สามารถย้ายคิวได้: เตียงใน ${targetRoom} เต็มแล้ว (${otherOccupiedCount}/${maxCapacity} เตียง)`, "warning");
          playAlertSound();
          renderDeskQueue();
          renderStatsAndShare();
          return;
        }
      }

      // If selected room directly from dropdown without "🟣", default to "🔵 " + targetRoom
      let finalStatus = newStatus;
      if (targetRoom && !newStatus.startsWith("🟣") && !newStatus.startsWith("🔵")) {
        finalStatus = "🔵 " + targetRoom;
      }

      // If moving to massage treatment (🟣 ห้อง X), record treatment start time if not already set
      if (finalStatus.startsWith("🟣") || (finalStatus.startsWith("ห้อง") && !finalStatus.startsWith("🔵"))) {
        if (!apt.treatmentStartTime) {
          apt.treatmentStartTime = new Date().toISOString();
        }
      }

      // If moving to finish/transfer, record treatment end time if not already set
      if (finalStatus === "🟢 กลับบ้าน" || finalStatus === "🔴 ส่งต่อ") {
        if (!apt.treatmentEndTime) {
          apt.treatmentEndTime = new Date().toISOString();
        }
      }

      // 1. Lock this ID in-flight to prevent background sync from reverting
      inFlightStatusUpdates.add(appointmentId);

      // 2. Optimistic local update
      apt.status = finalStatus;
      recordStatusTransition(apt, finalStatus);
      persistAppointments();

      // 3. Update hash immediately to prevent false diffs
      lastAppointmentsHash = computeAppointmentsHash(appointments);

      // 4. Render UI immediately with new status
      renderDeskQueue(true);
      renderStatsAndShare(true);

      showToast(`💾 บันทึก: ปรับสถานะ ${apt.patientName} เป็น "${finalStatus}" เรียบร้อย`, "success");

      await logActivity("CHANGE_STATUS", `เปลี่ยนสถานะคิว ${apt.patientName} (${formatTimeLabel(apt.timeSlot)}) เป็น "${finalStatus}"`, {
        appointmentId,
        patientName: apt.patientName,
        bookDate: apt.bookDate,
        timeSlot: apt.timeSlot,
        oldStatus,
        newStatus: finalStatus
      });

      if (supabaseClient) {
        try {
          const { error } = await supabaseClient.from("appointments").update({ status: finalStatus }).eq("id", appointmentId);
          if (error) throw error;
        } catch(e) {
          console.error("Supabase status update error:", e);
          showToast("บันทึกบน Cloud ไม่สำเร็จ: " + e.message, "error");
        } finally {
          // Keep lock for 3 seconds to ensure read-after-write consistency across cluster
          setTimeout(() => {
            inFlightStatusUpdates.delete(appointmentId);
          }, 3000);
        }
      } else {
        inFlightStatusUpdates.delete(appointmentId);
      }
    }

    let currentRoomAlertAptId = null;

    function showRoomNotSelectedModal(appointmentId) {
      const apt = appointments.find(a => a.id === appointmentId);
      if (!apt) return;
      currentRoomAlertAptId = appointmentId;

      const infoEl = document.getElementById("room-alert-patient-info");
      const statusEl = document.getElementById("room-alert-current-status");
      const quickBtnsEl = document.getElementById("room-alert-quick-buttons");

      if (infoEl) {
        infoEl.innerHTML = `คนไข้: <strong class="text-slate-900 dark:text-white">${escapeHtml(apt.patientName)}</strong> (รอบ ${formatTimeLabel(apt.timeSlot)})`;
      }
      if (statusEl) {
        statusEl.textContent = `"${apt.status || '⚪ ว่าง'}"`;
      }

      if (quickBtnsEl) {
        const rooms = ["ห้อง 1", "ห้อง 2", "ห้อง 3", "ห้อง 4", "ห้อง 5"];
        const roomOccupiedCounts = { "ห้อง 1": 0, "ห้อง 2": 0, "ห้อง 3": 0, "ห้อง 4": 0, "ห้อง 5": 0 };
        
        appointments.filter(a => a.bookDate === apt.bookDate).forEach(a => {
          const cleanSt = (a.status || "").replace("🔵 ", "").replace("🟣 ", "").trim();
          const matched = cleanSt.match(/^(?:รอ)?(ห้อง\s*[1-5])/);
          if (matched) {
            const rmKey = matched[1].replace(/\s+/g, " ");
            if (roomOccupiedCounts[rmKey] !== undefined) roomOccupiedCounts[rmKey]++;
          }
        });

        quickBtnsEl.innerHTML = rooms.map(rm => {
          const cap = (typeof ROOM_CAPACITIES !== 'undefined' && ROOM_CAPACITIES[rm]) ? ROOM_CAPACITIES[rm] : (rm === "ห้อง 3" || rm === "ห้อง 4" ? 6 : 5);
          const total = roomOccupiedCounts[rm] || 0;
          const isFull = total >= cap;
          const disabledAttr = isFull ? "disabled" : "";
          const bgCls = isFull
            ? "bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 opacity-60 cursor-not-allowed"
            : "bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-500 hover:to-indigo-600 text-white font-black shadow-sm active:scale-95 cursor-pointer border border-purple-400/40";

          return `
            <button type="button" ${disabledAttr} onclick="selectRoomAndStartMassage('${apt.id}', '${rm}')" class="p-2.5 rounded-xl text-xs flex flex-col items-center justify-center gap-1 transition ${bgCls}">
              <span class="font-extrabold text-sm sm:text-base">🚪 ${rm}</span>
              <span class="text-[10px] ${isFull ? 'text-rose-500 font-bold' : 'text-purple-100 font-medium'}">${isFull ? 'เตียงเต็ม' : `ว่าง (${total}/${cap})`}</span>
            </button>
          `;
        }).join("");
      }

      const modal = document.getElementById("modal-room-not-selected-alert");
      if (modal) modal.classList.remove("hidden");
      if (window.lucide) lucide.createIcons();
    }

    function closeRoomNotSelectedModal() {
      const modal = document.getElementById("modal-room-not-selected-alert");
      if (modal) modal.classList.add("hidden");
      currentRoomAlertAptId = null;
    }

    async function selectRoomAndStartMassage(appointmentId, roomName) {
      closeRoomNotSelectedModal();
      await startMassageTreatment(appointmentId, roomName);
    }

    async function startMassageTreatment(appointmentId, explicitRoom = null) {
      const apt = appointments.find(a => a.id === appointmentId);
      if (!apt) return;

      let targetRoom = explicitRoom;
      if (!targetRoom) {
        const cleanStatus = (apt.status || '').replace('🔵 ', '').replace('🟣 ', '').trim();
        const roomMatch = cleanStatus.match(/^(?:รอ)?(ห้อง\s*[1-5])/);
        if (roomMatch) {
          targetRoom = roomMatch[1].replace(/\s+/g, ' ');
        }
      }

      // If status is "ว่าง", "รอตรวจ", "รอนวด", "ส่งต่อ", "กลับบ้าน" without an assigned room
      if (!targetRoom) {
        playAlertSound();
        showToast("⚠️ ยังไม่เลือกห้อง กรุณาเลือกห้อง", "warning");
        showRoomNotSelectedModal(appointmentId);
        return;
      }

      // Quota validation for targetRoom
      const cap = (typeof ROOM_CAPACITIES !== 'undefined' && ROOM_CAPACITIES[targetRoom]) ? ROOM_CAPACITIES[targetRoom] : (targetRoom === "ห้อง 3" || targetRoom === "ห้อง 4" ? 6 : 5);
      const otherOccupiedCount = appointments.filter(a => {
        if (a.id === appointmentId || a.bookDate !== apt.bookDate) return false;
        const st = (a.status || '').replace('🔵 ', '').replace('🟣 ', '').trim();
        return st === targetRoom || st === ('รอ' + targetRoom);
      }).length;

      if (otherOccupiedCount >= cap) {
        showToast(`⚠️ เตียงใน ${targetRoom} เต็มแล้ว (${otherOccupiedCount}/${cap} เตียง)`, "warning");
        playAlertSound();
        return;
      }

      // Record treatment start timestamp when "เริ่มนวด" is clicked
      apt.treatmentStartTime = new Date().toISOString();
      const purpleRoomStatus = "🟣 " + targetRoom;
      await handleStatusChange(appointmentId, purpleRoomStatus);
      showToast(`💆‍♂️ เริ่มนวด: คุณ ${apt.patientName} ใน "${targetRoom}" เรียบร้อย (เปลี่ยนเป็นสีม่วง 🟣 และเริ่มจับเวลานวด)`, "success");
    }

    async function finishMassageTreatment(appointmentId) {
      const apt = appointments.find(a => a.id === appointmentId);
      if (!apt) return;

      await handleStatusChange(appointmentId, "🟢 กลับบ้าน");
      showToast(`✅ สิ้นสุดการนวด: คุณ ${apt.patientName} เรียบร้อย (บันทึกเวลาและคืนเตียงสำเร็จ)`, "success");
    }

    function generateDeskActionButtonHtml(apt, customClass = "") {
      if (!apt) return "";
      const status = apt.status || "";
      const isDone = status.includes("กลับบ้าน") || status.includes("ส่งต่อ");
      const isMassaging = status.startsWith("🟣") || (status.includes("ห้อง") && !status.startsWith("🔵") && !status.includes("รอห้อง"));

      if (isDone) {
        const defaultCls = "px-3 py-1.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-2 border-emerald-300 dark:border-emerald-700 rounded-xl text-xs font-black inline-flex items-center justify-center gap-1.5 shadow-2xs shrink-0";
        const cls = customClass ? `${customClass} bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-2 border-emerald-300 dark:border-emerald-700 inline-flex items-center justify-center gap-1.5 font-bold` : defaultCls;
        return `
          <span class="${cls}">
            <i data-lucide="check-circle" class="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0"></i>
            <span>เสร็จสิ้น (กลับบ้าน)</span>
          </span>
        `;
      }

      if (isMassaging) {
        const defaultCls = "px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 via-herbal-700 to-teal-700 hover:from-emerald-500 hover:to-teal-600 active:scale-95 text-white font-black text-xs sm:text-sm inline-flex items-center justify-center gap-1.5 shadow-md shadow-emerald-900/20 transition cursor-pointer shrink-0 border border-emerald-400/50";
        const cls = customClass ? `${customClass} bg-gradient-to-r from-emerald-600 via-herbal-700 to-teal-700 hover:from-emerald-500 hover:to-teal-600 active:scale-95 text-white inline-flex items-center justify-center gap-1.5 border border-emerald-400/50 shadow-md font-extrabold` : defaultCls;
        return `
          <button type="button" onclick="finishMassageTreatment('${apt.id}')" class="${cls}" title="สิ้นสุดการนวด (ย้ายไปสถานะกลับบ้าน บันทึกเวลา และคืนเตียง)">
            <i data-lucide="check-circle-2" class="w-4 h-4 text-amber-300 shrink-0"></i>
            <span>✅ สิ้นสุดการนวด</span>
          </button>
        `;
      }

      // Waiting state (⚪ ว่าง, 🟡 รอตรวจ, 🔵 รอนวด, 🔵 ห้อง 1..5) -> Show "เริ่มนวด"
      let targetRoomParam = "";
      let label = "เริ่มนวด";
      const cleanSt = status.replace("🔵 ", "").trim();
      const roomMatch = cleanSt.match(/^(?:รอ)?(ห้อง\s*[1-5])/);
      if (roomMatch) {
        const rm = roomMatch[1].replace(/\s+/g, " ");
        targetRoomParam = `'${apt.id}', '${rm}'`;
        label = `เริ่มนวด (${rm})`;
      } else {
        targetRoomParam = `'${apt.id}'`;
      }

      const defaultCls = "px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 active:scale-95 text-white font-black text-xs sm:text-sm inline-flex items-center justify-center gap-1.5 shadow-md shadow-purple-900/25 transition cursor-pointer shrink-0 border border-purple-400/50";
      const cls = customClass ? `${customClass} bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 active:scale-95 text-white inline-flex items-center justify-center gap-1.5 border border-purple-400/50 shadow-md font-extrabold` : defaultCls;
      
      return `
        <button type="button" onclick="startMassageTreatment(${targetRoomParam})" class="${cls}" title="เริ่มนวด เปลี่ยนเป็นสีม่วง 🟣 และเริ่มนับเวลานวด">
          <i data-lucide="play" class="w-4 h-4 text-amber-300 fill-amber-300 shrink-0"></i>
          <span>▶️ ${label}</span>
        </button>
      `;
    }

    
    /* =========================================================================
       NEXT APPOINTMENT CONTROLLER FOR EXISTING PATIENTS (นัดหมายครั้งถัดไป v5.3.0)
       ========================================================================= */

    let nextAptCurrentData = null;

    function bookNextAppointment(appointmentId) {
      const apt = appointments.find(a => a.id === appointmentId);
      if (!apt) {
        showToast("ไม่พบข้อมูลนัดหมายเดิม", "error");
        return;
      }
      openNextAppointmentModalWithData({
        sourceAptId: apt.id,
        patientName: apt.patientName || "",
        citizenOrHn: (apt.citizenOrHn && apt.citizenOrHn !== "-") ? apt.citizenOrHn : "",
        phone: (apt.phone && apt.phone !== "-") ? apt.phone : "",
        medicalScheme: apt.medicalScheme || "บัตรทอง",
        mainService: apt.mainService || "จองนวด",
        extraServices: Array.isArray(apt.extraServices) ? [...apt.extraServices] : [],
        assistantId: "female",
        assistantNick: "ขอผู้หญิง",
        notes: apt.notes && apt.notes !== "-" ? apt.notes : ""
      });
    }

    function bookAgainForPatient(name, hn, phone, scheme, prevService, prevAssistantId, prevAssistantNick) {
      if (typeof closePatientHistoryModal === "function") {
        closePatientHistoryModal();
      }
      openNextAppointmentModalWithData({
        patientName: name || "",
        citizenOrHn: (hn && hn !== "-") ? hn : "",
        phone: (phone && phone !== "-") ? phone : "",
        medicalScheme: scheme || "บัตรทอง",
        mainService: prevService || "จองนวด",
        extraServices: [],
        assistantId: "female",
        assistantNick: "ขอผู้หญิง",
        notes: ""
      });
    }

    function openNextAppointmentModalWithData(data) {
      const nextAptScroll = document.getElementById("next-apt-body-scroll") || document.querySelector("#modal-next-appointment .overflow-y-auto");
      if (nextAptScroll) {
        nextAptScroll.scrollTop = 0;
      }
      const nextAptModal = document.getElementById("modal-next-appointment");
      if (nextAptModal) {
        nextAptModal.scrollTop = 0;
      }
      // Default target date: +7 days (next week)
      const d = new Date();
      d.setDate(d.getDate() + 7);
      const defaultDate = d.toISOString().split("T")[0];

      nextAptCurrentData = {
        ...data,
        bookDate: defaultDate,
        selectedSlot: ""
      };

      // 1. Populate Patient Info Banner
      const elName = document.getElementById("next-apt-patient-name");
      const elHn = document.getElementById("next-apt-patient-hn");
      const elPhone = document.getElementById("next-apt-patient-phone");
      const elScheme = document.getElementById("next-apt-patient-scheme-badge");

      if (elName) elName.textContent = nextAptCurrentData.patientName || "-";
      if (elHn) elHn.textContent = nextAptCurrentData.citizenOrHn || "-";
      if (elPhone) elPhone.textContent = nextAptCurrentData.phone || "-";
      if (elScheme) {
        elScheme.innerHTML = (typeof getMedicalSchemeBadgeHtml === "function")
          ? getMedicalSchemeBadgeHtml(nextAptCurrentData.medicalScheme)
          : `<span class="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">${nextAptCurrentData.medicalScheme || 'บัตรทอง'}</span>`;
      }

      // 2. Set Date input
      const dateInput = document.getElementById("next-apt-book-date");
      if (dateInput) {
        dateInput.value = defaultDate;
      }

      // 3. Render Main Services Radio Chips
      renderNextAptMainServices();

      // 4. Render Extra Services Checkboxes
      renderNextAptExtraServices();

      // 5. Populate Assistant Dropdown
      populateNextAptAssistantDropdown();

      // 6. Set Notes
      const notesInput = document.getElementById("next-apt-notes");
      if (notesInput) notesInput.value = nextAptCurrentData.notes || "";

      // 7. Update Date & Slot Grid
      onNextAptDateChanged();

      // 8. Open Modal
      const modal = document.getElementById("modal-next-appointment");
      if (modal) {
        modal.classList.remove("hidden");
      }

      if (window.lucide && lucide.createIcons) {
        lucide.createIcons();
      }

      showToast(`📅 ดึงข้อมูลคุณ ${nextAptCurrentData.patientName} สำหรับนัดรอบถัดไปแล้ว`, "info");
    }

    function closeNextAppointmentModal() {
      const modal = document.getElementById("modal-next-appointment");
      if (modal) modal.classList.add("hidden");
    }

    function setNextAptDateOffset(daysOffset) {
      const d = new Date();
      d.setDate(d.getDate() + daysOffset);
      const iso = d.toISOString().split("T")[0];
      const dateInput = document.getElementById("next-apt-book-date");
      if (dateInput) {
        dateInput.value = iso;
        onNextAptDateChanged();
      }
    }

    function setNextAptDateNextSaturday() {
      const d = new Date();
      const day = d.getDay();
      const diff = (6 - day + 7) % 7 || 7;
      d.setDate(d.getDate() + diff);
      const iso = d.toISOString().split("T")[0];
      const dateInput = document.getElementById("next-apt-book-date");
      if (dateInput) {
        dateInput.value = iso;
        onNextAptDateChanged();
      }
    }

    function onNextAptDateChanged() {
      const dateInput = document.getElementById("next-apt-book-date");
      const dateVal = dateInput ? (dateInput.value || todayStr) : todayStr;
      if (nextAptCurrentData) {
        nextAptCurrentData.bookDate = dateVal;
        nextAptCurrentData.selectedSlot = ""; // reset slot when date changes
      }

      const slotBadge = document.getElementById("next-apt-selected-slot-badge");
      if (slotBadge) {
        slotBadge.textContent = "ยังไม่ได้เลือกรอบ";
        slotBadge.className = "text-xs font-extrabold text-amber-700 dark:text-amber-300 bg-amber-100/70 dark:bg-amber-950/80 px-2.5 py-0.5 rounded-lg border border-amber-300 dark:border-amber-800";
      }

      const holCheck = checkDateHoliday(dateVal);
      const thaiText = document.getElementById("next-apt-date-thai-text");
      const statusBadge = document.getElementById("next-apt-date-status-badge");
      const noticeBox = document.getElementById("next-apt-holiday-notice");

      if (thaiText) thaiText.textContent = `🗓️ ${formatThaiDate(dateVal)}`;

      if (holCheck.isClosed) {
        if (statusBadge) {
          statusBadge.textContent = "🚫 ปิดทำการ";
          statusBadge.className = "px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-rose-100 text-rose-800 border border-rose-300";
        }
        if (noticeBox) {
          noticeBox.classList.remove("hidden");
          noticeBox.className = "p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 rounded-xl text-xs text-rose-800 dark:text-rose-300 space-y-1";
          noticeBox.innerHTML = `
            <div class="font-extrabold flex items-center gap-1 text-sm"><span>🚫</span> ${escapeHtml(holCheck.title)}</div>
            <p class="text-rose-700 dark:text-rose-400 font-medium">${escapeHtml(holCheck.description || 'คลินิกปิดทำการในวันที่เลือก กรุณาเลือกวันอื่น')}</p>
          `;
        }
      } else {
        const isSat = (holCheck.holidayType === 'saturday');
        if (statusBadge) {
          statusBadge.textContent = isSat ? "⚡ เสาร์ (ครึ่งวัน)" : "🟢 เปิดบริการปกติ";
          statusBadge.className = isSat ? "px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-100 text-amber-900 border border-amber-300" : "px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300";
        }
        if (noticeBox) {
          if (isSat) {
            noticeBox.classList.remove("hidden");
            noticeBox.className = "p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 rounded-xl text-xs text-amber-900 dark:text-amber-200";
            noticeBox.innerHTML = `⚡ วันเสาร์เปิดบริการครึ่งวัน: <strong>08:30 - 12:30 น.</strong>`;
          } else {
            noticeBox.classList.add("hidden");
          }
        }
      }

      renderNextAptSlots(dateVal);
      populateNextAptAssistantDropdown(dateVal, "");
    }

    function renderNextAptSlots(dateVal) {
      const container = document.getElementById("next-apt-slot-grid");
      if (!container) return;
      container.innerHTML = "";

      const holCheck = checkDateHoliday(dateVal);
      if (holCheck.isClosed) {
        container.innerHTML = `
          <div class="col-span-full p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl text-center text-xs text-rose-700 dark:text-rose-300 font-bold">
            🚫 วันที่เลือกเป็นวันปิดทำการ ไม่สามารถเลือกรอบเวลานัดหมายได้
          </div>
        `;
        return;
      }

      const slotsList = getSlotsForDate(dateVal);
      if (!slotsList || slotsList.length === 0) {
        container.innerHTML = `
          <div class="col-span-full p-4 text-center text-xs text-slate-400">
            ไม่มีรอบเวลาสำหรับวันที่เลือก
          </div>
        `;
        return;
      }

      const bookedBySlot = {};
      appointments.filter(a => a.bookDate === dateVal && a.status !== "ยกเลิก" && a.status !== "🔴 ส่งต่อ").forEach(a => {
        (a.slotsOccupied || [a.timeSlot]).forEach(s => {
          bookedBySlot[s] = (bookedBySlot[s] || 0) + 1;
        });
      });

      slotsList.forEach(slot => {
        const slotConf = getSlotConfigForDate(dateVal, slot);
        const booked = bookedBySlot[slot] || 0;
        const max = slotConf.max || 5;
        const available = Math.max(0, max - booked);
        const isFull = (available === 0);
        const isSelected = nextAptCurrentData && nextAptCurrentData.selectedSlot === slot;

        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = `p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-between cursor-pointer ${
          isFull 
            ? 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40 text-rose-800 dark:text-rose-300 opacity-60 cursor-not-allowed'
            : isSelected 
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-300 scale-[1.02] font-bold'
              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-emerald-400 hover:bg-emerald-50/50 text-slate-800 dark:text-slate-100 shadow-2xs'
        }`;

        btn.onclick = () => {
          if (isFull) {
            showToast(`รอบเวลา ${formatTimeLabel(slot)} คิวเต็มแล้ว`, "warning");
            return;
          }
          selectNextAptSlot(slot);
        };

        btn.innerHTML = `
          <div class="font-black text-xs sm:text-sm font-mono flex items-center gap-1">
            ${isSelected ? '<span>✓</span>' : ''}
            <span>${formatTimeLabel(slot)}</span>
          </div>
          <div class="text-[10px] font-bold mt-1 ${isSelected ? 'text-emerald-100' : isFull ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400'}">
            ${isFull ? '🔴 เต็ม' : `🟢 ว่าง ${available}/${max}`}
          </div>
        `;

        container.appendChild(btn);
      });
    }

    function selectNextAptSlot(slot) {
      if (!nextAptCurrentData) return;
      nextAptCurrentData.selectedSlot = slot;

      const slotBadge = document.getElementById("next-apt-selected-slot-badge");
      if (slotBadge) {
        slotBadge.textContent = `⏰ รอบ ${formatTimeLabel(slot)}`;
        slotBadge.className = "text-xs font-extrabold text-emerald-800 dark:text-emerald-200 bg-emerald-100 dark:bg-emerald-950 px-2.5 py-0.5 rounded-lg border border-emerald-400 shadow-xs animate-pulse";
      }

      // Re-render slots to highlight selected
      renderNextAptSlots(nextAptCurrentData.bookDate);
      populateNextAptAssistantDropdown(nextAptCurrentData.bookDate, slot);
    }

    function renderNextAptMainServices() {
      const container = document.getElementById("next-apt-main-services-container");
      if (!container) return;
      container.innerHTML = "";

      const activeMain = (mainServicesList || []).filter(s => s.active !== false);
      const currentVal = (nextAptCurrentData && nextAptCurrentData.mainService) || "จองนวด";

      activeMain.forEach(svc => {
        const isChecked = (svc.name === currentVal || svc.title === currentVal);
        const label = document.createElement("label");
        label.className = `flex items-center space-x-2.5 p-2.5 rounded-xl border cursor-pointer transition ${
          isChecked ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 shadow-2xs font-bold' : 'bg-slate-50/60 dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-100'
        }`;

        label.innerHTML = `
          <input type="radio" name="nextAptMainService" value="${escapeHtml(svc.name)}" ${isChecked ? 'checked' : ''} class="w-4 h-4 text-emerald-600 focus:ring-emerald-500">
          <div class="flex items-center space-x-1.5 text-xs text-slate-800 dark:text-slate-100">
            <span class="text-sm">${svc.icon || '💆‍♂️'}</span>
            <span class="font-bold">${escapeHtml(svc.name)}</span>
          </div>
        `;

        label.querySelector("input").onchange = () => {
          if (nextAptCurrentData) nextAptCurrentData.mainService = svc.name;
          renderNextAptMainServices();
        };

        container.appendChild(label);
      });
    }

    function renderNextAptExtraServices() {
      const container = document.getElementById("next-apt-extra-services-container");
      if (!container) return;
      container.innerHTML = "";

      const activeExtra = (extraServicesList || []).filter(s => s.active !== false);
      const currentExtras = (nextAptCurrentData && nextAptCurrentData.extraServices) || [];

      activeExtra.forEach(svc => {
        const isChecked = currentExtras.includes(svc.name);
        const label = document.createElement("label");
        label.className = `flex items-center space-x-2 p-2 rounded-xl border cursor-pointer transition ${
          isChecked ? 'bg-teal-50 dark:bg-teal-950/60 border-teal-500 shadow-2xs font-bold' : 'bg-slate-50/60 dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-100'
        }`;

        label.innerHTML = `
          <input type="checkbox" name="nextAptExtraService" value="${escapeHtml(svc.name)}" ${isChecked ? 'checked' : ''} class="w-3.5 h-3.5 text-teal-600 rounded focus:ring-teal-500">
          <div class="text-[11.5px] text-slate-800 dark:text-slate-100 font-medium">
            <span>${escapeHtml(svc.name)}</span>
            ${svc.twoSlots ? '<span class="text-[9.5px] text-amber-600 font-bold ml-1">(2 ชม.)</span>' : ''}
          </div>
        `;

        label.querySelector("input").onchange = (e) => {
          if (!nextAptCurrentData) return;
          if (e.target.checked) {
            if (!nextAptCurrentData.extraServices.includes(svc.name)) {
              nextAptCurrentData.extraServices.push(svc.name);
            }
          } else {
            nextAptCurrentData.extraServices = nextAptCurrentData.extraServices.filter(n => n !== svc.name);
          }
          renderNextAptExtraServices();
        };

        container.appendChild(label);
      });
    }

    function populateNextAptAssistantDropdown(targetDate, targetSlot) {
      const sel = document.getElementById("next-apt-assistant-select");
      if (!sel) return;

      const dateVal = targetDate || (nextAptCurrentData && nextAptCurrentData.bookDate) || todayStr;
      const slotVal = targetSlot || (nextAptCurrentData && nextAptCurrentData.selectedSlot) || "";
      const currentSelectedVal = sel.value;

      sel.innerHTML = "";

      // 1. Quick preferences (Default is Female preference)
      const optFemale = document.createElement("option");
      optFemale.value = JSON.stringify({ id: "female", nick: "ขอผู้หญิง" });
      optFemale.textContent = "👩 ขอผู้ช่วยผู้หญิง (ค่าเริ่มต้น)";
      sel.appendChild(optFemale);

      const optMale = document.createElement("option");
      optMale.value = JSON.stringify({ id: "male", nick: "ขอผู้ชาย" });
      optMale.textContent = "👨 ขอผู้ช่วยผู้ชาย";
      sel.appendChild(optMale);

      // 2. Active Staff list in standard alphabetical/gender order
      const activeStaff = (assistants || []).filter(a => a.active !== false);
      if (activeStaff.length > 0) {
        const optGroup = document.createElement("optgroup");
        optGroup.label = "--- รายชื่อผู้ช่วยแพทย์แผนไทย ---";
        activeStaff.forEach(asst => {
          const dutyStatus = (typeof getAssistantDutyStatusForDate === "function")
            ? getAssistantDutyStatusForDate(asst, dateVal)
            : { isOff: asst.shiftType === 'off' };
          const isOff = dutyStatus.isOff;
          const onDuty = !isOff && (slotVal ? isAssistantOnDutyForSlot(asst, slotVal, dateVal) : true);

          let occupiedPatient = "";
          const isOccupied = slotVal ? (appointments || []).some(otherApt => {
            if (otherApt.bookDate === dateVal && otherApt.assistantId === asst.id) {
              if (otherApt.status === "🔴 ส่งต่อ" || otherApt.status === "ยกเลิก") return false;
              const otherSlots = (otherApt.slotsOccupied && otherApt.slotsOccupied.length > 0) ? otherApt.slotsOccupied : [otherApt.timeSlot];
              if (otherSlots.includes(slotVal)) {
                occupiedPatient = otherApt.patientName || "ผู้รับบริการ";
                return true;
              }
            }
            return false;
          }) : false;

          let statusTag = "ว่าง";
          let isBlocked = false;
          if (isOff) {
            statusTag = "ลาเวร/พัก";
            isBlocked = true;
          } else if (!onDuty) {
            statusTag = "ไม่อยู่เวร";
            isBlocked = true;
          } else if (isOccupied) {
            statusTag = `ติดนัด: ${occupiedPatient}`;
            isBlocked = true;
          }

          const opt = document.createElement("option");
          opt.value = JSON.stringify({ id: asst.id, nick: asst.nickname || asst.name });
          opt.textContent = `${asst.gender === "ชาย" ? '👨' : '👩'} คุณ ${asst.nickname || asst.name} (${statusTag})`;
          if (isBlocked) {
            opt.className = "text-slate-400 bg-slate-100 dark:bg-slate-800";
          }
          optGroup.appendChild(opt);
        });
        sel.appendChild(optGroup);
      }

      if (currentSelectedVal) {
        sel.value = currentSelectedVal;
      }
      if (!sel.value) {
        sel.value = JSON.stringify({ id: "female", nick: "ขอผู้หญิง" });
      }
    }

    async function submitNextAppointment() {
      if (!nextAptCurrentData) return;

      const bookDate = nextAptCurrentData.bookDate;
      const timeSlot = nextAptCurrentData.selectedSlot;

      if (!bookDate) {
        showToast("กรุณาเลือกวันที่นัดหมาย", "warning");
        return;
      }
      if (!timeSlot) {
        showToast("กรุณาคลิกเลือกรอบเวลานัดหมาย", "warning");
        return;
      }

      const holCheck = checkDateHoliday(bookDate);
      if (holCheck.isClosed) {
        showToast(`ไม่สามารถนัดหมายในวันที่คลินิกปิดทำการ: ${holCheck.title}`, "error");
        return;
      }

      const slotConf = getSlotConfigForDate(bookDate, timeSlot);
      if (slotConf && !slotConf.enabled) {
        openSlotFullAlertModal(timeSlot, `รอบเวลา ${formatCleanTime(timeSlot)} ปิดให้บริการในวันนี้`, "รอบเวลานี้ปิดรับนัดหมายตามการตั้งค่าของคลินิก");
        showToast(`รอบเวลา ${formatCleanTime(timeSlot)} ปิดให้บริการ กรุณาเลือกรอบอื่น`, "error");
        return;
      }

      // Parse assistant selection
      const asstSel = document.getElementById("next-apt-assistant-select");
      let asstId = "female";
      let asstNick = "ขอผู้หญิง";
      if (asstSel && asstSel.value) {
        try {
          const parsedAsst = JSON.parse(asstSel.value);
          asstId = parsedAsst.id;
          asstNick = parsedAsst.nick;
        } catch(e) {}
      }

      // Notes
      const notesVal = document.getElementById("next-apt-notes")?.value.trim() || "-";

      // Check 2-slot duration
      const selectedExtras = nextAptCurrentData.extraServices || [];
      const requiresTwoSlots = selectedExtras.some(extraName => {
        const svc = (extraServicesList || []).find(s => s.name === extraName);
        return svc && svc.twoSlots;
      });

      const slotsList = getSlotsForDate(bookDate);
      const currentIndex = slotsList.indexOf(timeSlot);
      const slotsOccupied = [timeSlot];
      if (requiresTwoSlots && currentIndex !== -1 && currentIndex + 1 < slotsList.length) {
        slotsOccupied.push(slotsList[currentIndex + 1]);
      }

      // Universal Conflict Check (v5.4.2)
      const conflict = (typeof checkAssistantBookingConflict === "function") ? checkAssistantBookingConflict({
        assistantId: asstId,
        bookDate: bookDate,
        timeSlot: timeSlot,
        slotsOccupied: slotsOccupied,
        requiresTwoSlots: requiresTwoSlots,
        patientName: nextAptCurrentData.patientName
      }) : { hasConflict: false };

      if (conflict && conflict.hasConflict) {
        if (typeof showAssistantConflictModal === "function") {
          showAssistantConflictModal(conflict, timeSlot, bookDate);
        }
        showToast(`❌ ไม่สามารถนัดหมายรอบถัดไปได้: ${conflict.title}`, "error");
        return;
      }

      const btnSubmit = document.getElementById("btn-submit-next-appointment");
      const origHtml = btnSubmit ? btnSubmit.innerHTML : "";
      if (btnSubmit) {
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> <span>กำลังบันทึกนัดหมาย...</span>`;
        if (window.lucide && lucide.createIcons) lucide.createIcons();
      }

      try {
        const currentClientIp = "127.0.0.1";
        const dev = (typeof detectClientDevice === "function") ? detectClientDevice() : { deviceText: "Web Browser" };

        const newAppointment = {
          id: "APT-" + Date.now(),
          patientName: nextAptCurrentData.patientName,
          citizenOrHn: nextAptCurrentData.citizenOrHn || "-",
          phone: nextAptCurrentData.phone || "-",
          medicalScheme: nextAptCurrentData.medicalScheme || "บัตรทอง",
          bookDate: bookDate,
          timeSlot: timeSlot,
          slotsOccupied: slotsOccupied,
          mainService: nextAptCurrentData.mainService || "จองนวด",
          extraServices: selectedExtras,
          assistantId: asstId,
          assistantNick: asstNick,
          notes: notesVal,
          status: "🟢 รอดำเนินการ",
          createdAt: new Date().toISOString(),
          clientIp: currentClientIp,
          device: dev.deviceText
        };

        if (currentUser && currentUser.role === 'patient') {
          newAppointment.patientUserId = currentUser.id;
          newAppointment.createdBy = currentUser.username || currentUser.name;
        } else if (currentUser) {
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

        await logActivity("BOOKING", `นัดหมายรอบถัดไปสำหรับ ${newAppointment.patientName} วันที่ ${formatThaiDateShort(bookDate)} รอบ ${formatTimeLabel(timeSlot)}`, {
          appointmentId: newAppointment.id,
          patientName: newAppointment.patientName,
          bookDate,
          timeSlot,
          mainService: newAppointment.mainService,
          assistant: asstNick
        });

        closeNextAppointmentModal();
        showToast(`📅 บันทึกนัดหมายรอบถัดไปสำหรับคุณ ${newAppointment.patientName} สำเร็จแล้ว`, "success");

        // Refresh views
        if (typeof renderDeskQueue === "function") renderDeskQueue();
        if (typeof renderStatsAndShare === "function") renderStatsAndShare();

        // Show appointment slip modal immediately
        showBookingSummaryModal(newAppointment.id);

      } catch(err) {
        console.error("Submit next appointment error:", err);
        showToast("เกิดข้อผิดพลาดในการบันทึกนัดหมาย: " + (err.message || "กรุณาลองใหม่"), "error");
      } finally {
        if (btnSubmit) {
          btnSubmit.disabled = false;
          btnSubmit.innerHTML = origHtml;
        }
      }
    }

    async function saveAppointmentRow(appointmentId) {
      const apt = appointments.find(a => a.id === appointmentId);
      if (!apt) return;

      persistAppointments();
      showToast(`💾 บันทึกและอัปเดตข้อมูลคุณ ${apt.patientName} สำเร็จ`, "success");

      await logActivity("CHANGE_STATUS", `บันทึกข้อมูลแถวคิว ${apt.patientName} (บริการ: "${apt.mainService}", สถานะ: "${apt.status}", ผู้ช่วย: "${apt.assistantNick}")`, {
        appointmentId,
        patientName: apt.patientName,
        mainService: apt.mainService,
        extraServices: apt.extraServices,
        status: apt.status,
        assistant: apt.assistantNick
      });

      if (supabaseClient) {
        try {
          const { error } = await supabaseClient.from("appointments").update({
            assistant_id: apt.assistantId,
            assistant_nick: apt.assistantNick,
            status: apt.status,
            main_service: apt.mainService,
            extra_services: apt.extraServices || [],
            slots_occupied: apt.slotsOccupied || [apt.timeSlot]
          }).eq("id", appointmentId);
          if (error) throw error;
          showToast(`⚡ ซิงค์ข้อมูลขึ้น Supabase สำเร็จ`, "info");
        } catch(e) {
          console.error("Supabase row save error:", e);
          showToast("บันทึกบน Cloud ไม่สำเร็จ: " + e.message, "error");
        }
      }

      renderDeskQueue(true);
      renderStatsAndShare(true);
    }

    // ==========================================
    // EDIT & ADD SERVICES HANDLERS
    // ==========================================
    function openEditServicesModal(aptId) {
      const isStaffOrAdmin = currentUser && (currentUser.role === 'staff' || currentUser.role === 'admin');
      if (!isStaffOrAdmin) {
        showToast("🔒 เฉพาะเจ้าหน้าที่และแอดมินเท่านั้นที่สามารถปรับเปลี่ยนบริการคนไข้ได้", "warning");
        return;
      }

      const apt = appointments.find(a => a.id === aptId);
      if (!apt) return;

      const idInput = document.getElementById("edit-svc-apt-id");
      if (idInput) idInput.value = apt.id;

      const patientInfo = document.getElementById("edit-svc-patient-info");
      if (patientInfo) {
        patientInfo.textContent = `คนไข้: ${apt.patientName} (${apt.citizenOrHn || '-'}) • รอบ ${formatTimeLabel(apt.timeSlot)} น. • วันที่ ${formatThaiDateShort(apt.bookDate)}`;
      }

      setMedicalSchemeInUi("services", apt.medicalScheme || "บัตรทอง");

      // Render dynamic main services
      renderEditMainServicesRadios("edit-svc-main-container", apt.mainService);

      // Render extra services list with checkboxes
      const container = document.getElementById("edit-svc-extras-container");
      if (container) {
        container.innerHTML = "";
        const activeServices = extraServicesList.filter(s => s.active !== false);

        if (activeServices.length === 0) {
          container.innerHTML = `<div class="col-span-2 text-center text-slate-400 py-3">ไม่มีรายการหัตถการเสริมในระบบ</div>`;
        } else {
          activeServices.forEach(svc => {
            const target = svc.target || svc.target_audience || 'all';
            if (target === 'staff_only' && !isStaffOrAdmin) return;

            const isChecked = apt.extraServices && apt.extraServices.includes(svc.name);
            const shareNote = (svc.price && svc.asstPercent)
              ? `<span class="text-[10px] text-slate-400 block">ผู้ช่วยฯ ${svc.asstPercent}% (${svc.share60 || Math.round(svc.price * svc.asstPercent / 100)} บ.) / รพ. ${svc.hospitalPercent || (100 - svc.asstPercent)}%</span>`
              : '';

            const twoSlotNote = svc.twoSlots ? `<span class="text-[9px] font-bold text-amber-700 bg-amber-50 px-1 py-0.2 rounded border border-amber-200 ml-1">2 ชม.</span>` : '';

            const label = document.createElement("label");
            label.className = `flex items-start space-x-2.5 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900 transition cursor-pointer has-[:checked]:border-herbal-600 has-[:checked]:bg-herbal-50/60 dark:has-[:checked]:bg-herbal-900/40`;
            label.innerHTML = `
              <input type="checkbox" value="${escapeHtml(svc.name)}" ${isChecked ? 'checked' : ''} onchange="onEditServiceFormChange()" class="mt-0.5 rounded text-herbal-700 focus:ring-herbal-500 w-4 h-4">
              <div class="flex-grow min-w-0">
                <div class="flex items-center justify-between gap-1">
                  <span class="font-bold text-slate-800 dark:text-slate-100 text-xs truncate">${escapeHtml(svc.name)} ${twoSlotNote}</span>
                  <span class="font-extrabold text-herbal-800 dark:text-emerald-400 text-xs shrink-0">${svc.price || 0} บ.</span>
                </div>
                ${shareNote}
              </div>
            `;
            container.appendChild(label);
          });
        }
      }

      onEditServiceFormChange();

      const modal = document.getElementById("modal-edit-services");
      if (modal) {
        modal.classList.remove("hidden");
      }
      if (window.lucide) lucide.createIcons();
    }

    function closeEditServicesModal() {
      const modal = document.getElementById("modal-edit-services");
      if (modal) modal.classList.add("hidden");
    }

    function onEditServiceFormChange() {
      const mainRadio = document.querySelector("input[name='editMainService']:checked");
      const mainVal = mainRadio ? mainRadio.value : "";

      const selectedExtras = [];
      let totalExtrasPrice = 0;
      document.querySelectorAll("#edit-svc-extras-container input[type='checkbox']:checked").forEach(cb => {
        selectedExtras.push(cb.value);
        const svc = extraServicesList.find(s => s.name === cb.value);
        if (svc) totalExtrasPrice += (svc.price || 0);
      });

      const badgesContainer = document.getElementById("edit-svc-badges-preview");
      const totalCalcEl = document.getElementById("edit-svc-total-calc");

      let mainBadge = "";
      if (mainVal) {
        const foundMain = mainServicesList.find(s => s.name === mainVal);
        if (foundMain) {
          const colorCls = foundMain.color || "bg-slate-100 text-slate-800 border-slate-200";
          mainBadge = `<span class="badge-service ${colorCls}">${foundMain.icon || '💆‍♂️'} ${escapeHtml(foundMain.name)} (${foundMain.durationSlots === 2 ? '2 ชม.' : '1 ชม.'})</span>`;
        } else {
          mainBadge = `<span class="badge-service bg-slate-100 text-slate-800 border border-slate-200">${escapeHtml(mainVal)}</span>`;
        }
      }

      const extraBadges = selectedExtras.map(ex => {
        const svc = extraServicesList.find(s => s.name === ex);
        const color = svc ? svc.color : "bg-slate-100 text-slate-700";
        const tagText = svc ? `${svc.tag || `[${ex}]`} (${svc.price || 0} บ.)` : `[${ex}]`;
        return `<span class="badge-service ${color}">${tagText}</span>`;
      }).join("");

      if (badgesContainer) {
        badgesContainer.innerHTML = (mainBadge + extraBadges) || `<span class="text-[11px] text-slate-400 italic ml-1">ไม่มีหัตถการ</span>`;
      }

      if (totalCalcEl) {
        if (mainVal && selectedExtras.length > 0) {
          totalCalcEl.textContent = `บริการหลัก + เสริม ${selectedExtras.length} รายการ (+${totalExtrasPrice} บ.)`;
        } else if (selectedExtras.length > 0) {
          totalCalcEl.textContent = `เฉพาะบริการเสริม ${selectedExtras.length} รายการ (${totalExtrasPrice} บ.)`;
        } else if (mainVal) {
          totalCalcEl.textContent = `เฉพาะบริการหลัก`;
        } else {
          totalCalcEl.textContent = `ยังไม่ได้เลือกหัตถการ`;
        }
      }
    }

    async function saveEditedServicesSubmit() {
      const aptId = document.getElementById("edit-svc-apt-id").value;
      const apt = appointments.find(a => a.id === aptId);
      if (!apt) {
        showToast("ไม่พบข้อมูลการนัดหมาย", "error");
        return;
      }

      const mainServiceRadio = document.querySelector("input[name='editMainService']:checked");
      const mainService = mainServiceRadio ? mainServiceRadio.value : "";

      const selectedExtras = [];
      document.querySelectorAll("#edit-svc-extras-container input[type='checkbox']:checked").forEach(cb => {
        selectedExtras.push(cb.value);
      });

      if (!mainService && selectedExtras.length === 0) {
        showToast("กรุณาเลือกหัตถการหลัก หรือบริการเสริมอย่างน้อย 1 รายการ", "warning");
        return;
      }

      const effectiveMainService = mainService || "บริการเสริม";
      const mainSvc = mainServicesList.find(s => s.name === mainService);
      const isMainTwoSlots = Boolean(mainSvc && mainSvc.durationSlots === 2);
      const requiresTwoSlots = isMainTwoSlots || selectedExtras.some(extraName => {
        const svc = extraServicesList.find(s => s.name === extraName);
        return svc && svc.twoSlots;
      });

      const slotsList = getSlotsForDate(apt.bookDate);
      const slotsOccupied = [apt.timeSlot];
      if (requiresTwoSlots) {
        const nextSlot = getNextSlot(apt.timeSlot, slotsList);
        if (!nextSlot) {
          showToast("รอบเวลานี้เป็นรอบสุดท้ายของวัน ไม่สามารถเลือกหัตถการที่ใช้เวลา 2 รอบเวลาได้", "error");
          return;
        }
        slotsOccupied.push(nextSlot);
      }

      // Universal Conflict Check (v5.4.2)
      const conflict = (typeof checkAssistantBookingConflict === "function") ? checkAssistantBookingConflict({
        assistantId: apt.assistantId,
        bookDate: apt.bookDate,
        timeSlot: apt.timeSlot,
        slotsOccupied: slotsOccupied,
        excludeAppointmentId: apt.id,
        requiresTwoSlots: requiresTwoSlots,
        patientName: apt.patientName
      }) : { hasConflict: false };

      if (conflict && conflict.hasConflict) {
        if (typeof showAssistantConflictModal === "function") {
          showAssistantConflictModal(conflict, apt.timeSlot, apt.bookDate);
        }
        showToast(`❌ ไม่สามารถเปลี่ยนเป็น 2 ชม. ได้: ${conflict.title}`, "error");
        return;
      }

      const newScheme = getMedicalSchemeFromUi("services");

      const oldMain = apt.mainService;
      const oldExtras = (apt.extraServices || []).join(", ");
      const oldScheme = apt.medicalScheme || "บัตรทอง";

      apt.mainService = effectiveMainService;
      apt.extraServices = selectedExtras;
      apt.slotsOccupied = slotsOccupied;
      apt.medicalScheme = newScheme;
      persistAppointments();

      showToast(`💾 บันทึกการเปลี่ยน/เพิ่มบริการคุณ ${apt.patientName} สำเร็จ`, "success");

      await logActivity("EDIT_SERVICE", `แก้ไขบริการคนไข้ ${apt.patientName} (หลัก: ${oldMain} ➔ ${effectiveMainService}, เสริม: [${selectedExtras.join(", ") || "ไม่มี"}], สิทธิ์: ${oldScheme} ➔ ${newScheme})`, {
        appointmentId: apt.id,
        patientName: apt.patientName,
        mainService: apt.mainService,
        extraServices: apt.extraServices,
        slotsOccupied: apt.slotsOccupied,
        medicalScheme: apt.medicalScheme
      });

      if (supabaseClient) {
        try {
          const payload = {
            main_service: apt.mainService,
            extra_services: apt.extraServices,
            slots_occupied: apt.slotsOccupied,
            medical_scheme: apt.medicalScheme
          };
          const { error } = await supabaseClient.from("appointments").update(payload).eq("id", apt.id);
          if (error) {
            // Fallback without medical_scheme if column is not yet on remote
            await supabaseClient.from("appointments").update({
              main_service: apt.mainService,
              extra_services: apt.extraServices,
              slots_occupied: apt.slotsOccupied
            }).eq("id", apt.id);
          }
          showToast(`⚡ ซิงค์ข้อมูลบริการขึ้น Supabase สำเร็จ`, "info");
        } catch(e) {
          console.error("Supabase update error:", e);
          showToast("บันทึกบน Cloud ไม่สำเร็จ: " + e.message, "error");
        }
      }

      closeEditServicesModal();
      renderDeskQueue(true);
      renderStatsAndShare(true);
    }

    let lastBookedAppointment = null;

    function showBookingSummaryModal(aptOrId) {
      let apt = aptOrId;
      if (typeof aptOrId === "string") {
        apt = appointments.find(a => a.id === aptOrId) || (lastBookedAppointment && lastBookedAppointment.id === aptOrId ? lastBookedAppointment : null);
      }
      if (!apt) return;
      lastBookedAppointment = apt;
      
      const elId = document.getElementById("slip-id");
      const elDate = document.getElementById("slip-date");
      const elTime = document.getElementById("slip-time");
      const elName = document.getElementById("slip-name");
      const elHn = document.getElementById("slip-hn");
      const elPhone = document.getElementById("slip-phone");
      const elScheme = document.getElementById("slip-scheme");
      const elService = document.getElementById("slip-service");
      const elAssistant = document.getElementById("slip-assistant");
      const elExtra = document.getElementById("slip-extra");
      const elNotes = document.getElementById("slip-notes");

      if (elId) elId.textContent = apt.id;
      if (elDate) elDate.textContent = formatThaiDate(apt.bookDate);
      if (elTime) elTime.textContent = formatTimeLabel(apt.timeSlot);
      if (elName) elName.textContent = apt.patientName;
      if (elHn) elHn.textContent = apt.citizenOrHn || "-";
      if (elPhone) elPhone.textContent = apt.phone || "-";
      if (elScheme) elScheme.textContent = apt.medicalScheme || "บัตรทอง";
      
      if (elService) {
        const extraText = (apt.extraServices && apt.extraServices.length > 0) ? ` + ${apt.extraServices.join(", ")}` : "";
        if (apt.mainService && apt.mainService !== "-" && apt.mainService !== "บริการเสริม") {
          elService.textContent = `${apt.mainService}${extraText}`;
        } else {
          elService.textContent = (apt.extraServices && apt.extraServices.length > 0) ? `บริการเสริม: ${apt.extraServices.join(", ")}` : "บริการนวดและหัตถการ";
        }
      }

      if (elAssistant) { if (!apt.assistantNick || apt.assistantNick === "-") apt.assistantNick = "ไม่ระบุ (จัดสรรตามเหมาะสม)";
        if (apt.assistantNick === "ไม่ระบุ (ขอผู้หญิง)" || apt.assistantId === "female") {
          elAssistant.textContent = "ขอผู้ช่วยผู้หญิง";
        } else if (apt.assistantNick === "ไม่ระบุ (ขอผู้ชาย)" || apt.assistantId === "male") {
          elAssistant.textContent = "ขอผู้ช่วยผู้ชาย";
        } else if (!apt.assistantNick || apt.assistantNick === "auto" || apt.assistantNick === "ไม่ระบุ" || apt.assistantNick === "จัดสรรตามเหมาะสม") {
          elAssistant.textContent = "ไม่ระบุ (เจ้าหน้าที่จัดสรร)";
        } else {
          elAssistant.textContent = `คุณ ${apt.assistantNick}`;
        }
      }

      if (elExtra) {
        elExtra.textContent = (apt.extraServices && apt.extraServices.length > 0) ? apt.extraServices.join(", ") : "ไม่มี";
      }

      if (elNotes) {
        elNotes.textContent = apt.notes || "-";
      }

      const modal = document.getElementById("modal-booking-summary");
      if (modal) modal.classList.remove("hidden");
    }

    function closeBookingSummaryModal() {
      const modal = document.getElementById("modal-booking-summary");
      if (modal) modal.classList.add("hidden");
      resetBookingForm('new');
    }

