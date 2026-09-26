/**
 * Module 8: 08_staff_selection_and_schemes.js
 * Description: Staff Quick Chips, Availability & Treatment Schemes
 * Generated from lines 12147 to 13553 of original index.html
 */

    /* =========================================================================
       STAFF SELECTION COMPONENT (QUICK CHIPS & AVAILABILITY FILTERING)
       ========================================================================= */

    function handleMainServiceRadioClick(radio) {
      if (radio.dataset.checked === "true") {
        radio.checked = false;
        radio.dataset.checked = "false";
      } else {
        document.querySelectorAll(`input[name='${radio.name}']`).forEach(r => {
          r.dataset.checked = "false";
        });
        radio.checked = true;
        radio.dataset.checked = "true";
      }
      if (radio.name === "editMainService") {
        if (typeof onEditServiceFormChange === "function") onEditServiceFormChange();
      } else {
        if (typeof onExtraServicesChanged === "function") onExtraServicesChanged();
      }
    }

    function isTwoSlotsSelected(mode = "new") {
      const form = document.getElementById(`form-booking-${mode}`);
      if (!form) return false;
      let twoSlots = false;

      const mainRadio = form.querySelector("input[name='mainService']:checked");
      if (mainRadio && mainRadio.value) {
        const mainSvc = mainServicesList.find(s => s.name === mainRadio.value);
        if (mainSvc && mainSvc.durationSlots === 2) twoSlots = true;
      }

      form.querySelectorAll("input[name='extraService']:checked").forEach(cb => {
        const svc = extraServicesList.find(s => s.name === cb.value);
        if (svc && svc.twoSlots) twoSlots = true;
      });
      return twoSlots;
    }

    function isMaleAssistant(asst) {
      if (!asst) return false;
      const g = (asst.gender || "").toLowerCase();
      if (g === "male" || g === "ชาย") return true;
      if (g === "female" || g === "หญิง") return false;
      const name = (asst.name || "").trim();
      if (name.startsWith("นาย") || name.startsWith("ชาย") || name.startsWith("แบ") || name.startsWith("เลาะห์")) return true;
      return false;
    }

    function isFemaleAssistant(asst) {
      return !isMaleAssistant(asst);
    }

    function getGenderAvailability(dateStr, timeSlot, checkTwoSlots = false, excludeAppointmentId = null) {
      const activeStaff = (assistants || []).filter(a => a.active !== false);
      const activeFemales = activeStaff.filter(isFemaleAssistant);
      const activeMales = activeStaff.filter(isMaleAssistant);

      if (!dateStr || !timeSlot) {
        return {
          femaleFreeCount: activeFemales.length,
          maleFreeCount: activeMales.length,
          femaleAvailable: activeFemales.length > 0,
          maleAvailable: activeMales.length > 0,
          freeStaff: activeStaff
        };
      }

      const slotConf = getSlotConfigForDate(dateStr, timeSlot);
      if (slotConf && !slotConf.enabled) {
        return {
          femaleFreeCount: 0,
          maleFreeCount: 0,
          femaleAvailable: false,
          maleAvailable: false,
          freeStaff: []
        };
      }

      const slotsList = getSlotsForDate(dateStr);
      const requiredSlots = [timeSlot];
      if (checkTwoSlots) {
        const nextSlot = getNextSlot(timeSlot, slotsList);
        if (nextSlot) {
          const nextConf = getSlotConfigForDate(dateStr, nextSlot);
          if (nextConf && !nextConf.enabled) {
            return {
              femaleFreeCount: 0,
              maleFreeCount: 0,
              femaleAvailable: false,
              maleAvailable: false,
              freeStaff: []
            };
          }
          requiredSlots.push(nextSlot);
        }
      }

      // 1. Individual free staff on duty for this slot (checked-in / scheduled & not busy with specific bookings)
      const availableStaff = getAvailableAssistantsForSlot(dateStr, timeSlot, checkTwoSlots, excludeAppointmentId);
      const freeFemales = availableStaff.filter(isFemaleAssistant);
      const freeMales = availableStaff.filter(isMaleAssistant);

      // 2. Count unassigned gender request bookings in this slot
      const unassignedFemaleBookings = (appointments || []).filter(apt => {
        if (excludeAppointmentId && apt.id === excludeAppointmentId) return false;
        if (apt.bookDate !== dateStr || apt.status === "🔴 ส่งต่อ" || apt.status === "ยกเลิก") return false;
        const aptSlots = (apt.slotsOccupied && apt.slotsOccupied.length > 0) ? apt.slotsOccupied : [apt.timeSlot];
        const overlaps = aptSlots.some(s => requiredSlots.includes(s));
        if (!overlaps) return false;
        return (apt.assistantId === "female" || (apt.assistantNick && apt.assistantNick.includes("ขอผู้หญิง")));
      }).length;

      const unassignedMaleBookings = (appointments || []).filter(apt => {
        if (excludeAppointmentId && apt.id === excludeAppointmentId) return false;
        if (apt.bookDate !== dateStr || apt.status === "🔴 ส่งต่อ" || apt.status === "ยกเลิก") return false;
        const aptSlots = (apt.slotsOccupied && apt.slotsOccupied.length > 0) ? apt.slotsOccupied : [apt.timeSlot];
        const overlaps = aptSlots.some(s => requiredSlots.includes(s));
        if (!overlaps) return false;
        return (apt.assistantId === "male" || (apt.assistantNick && apt.assistantNick.includes("ขอผู้ชาย")));
      }).length;

      // 3. Count unassigned general / auto bookings in this slot (จัดสรรตามเหมาะสม)
      const unassignedAutoBookings = (appointments || []).filter(apt => {
        if (excludeAppointmentId && apt.id === excludeAppointmentId) return false;
        if (apt.bookDate !== dateStr || apt.status === "🔴 ส่งต่อ" || apt.status === "ยกเลิก") return false;
        const aptSlots = (apt.slotsOccupied && apt.slotsOccupied.length > 0) ? apt.slotsOccupied : [apt.timeSlot];
        const overlaps = aptSlots.some(s => requiredSlots.includes(s));
        if (!overlaps) return false;
        const id = apt.assistantId || "";
        const nick = apt.assistantNick || "";
        const isGenderSpecific = (id === "female" || id === "male" || nick.includes("ขอผู้หญิง") || nick.includes("ขอผู้ชาย"));
        const isAssignedToSpecificStaff = (id && id !== "auto" && id !== "female" && id !== "male");
        return (!isGenderSpecific && !isAssignedToSpecificStaff);
      }).length;

      // 4. Calculate accurate remaining free capacities:
      const availFemales = Math.max(0, freeFemales.length - unassignedFemaleBookings);
      const availMales = Math.max(0, freeMales.length - unassignedMaleBookings);
      const totalRemainingStaff = availFemales + availMales;
      const netTotalFreeStaff = Math.max(0, totalRemainingStaff - unassignedAutoBookings);

      let finalFemaleSlots = Math.min(availFemales, netTotalFreeStaff);
      let finalMaleSlots = Math.min(availMales, netTotalFreeStaff);

      if (slotConf && typeof slotConf.max === "number" && slotConf.max > 0) {
        const totalAppointmentsInSlot = (appointments || []).filter(apt => {
          if (excludeAppointmentId && apt.id === excludeAppointmentId) return false;
          if (apt.bookDate !== dateStr || apt.status === "🔴 ส่งต่อ" || apt.status === "ยกเลิก") return false;
          const aptSlots = (apt.slotsOccupied && apt.slotsOccupied.length > 0) ? apt.slotsOccupied : [apt.timeSlot];
          return aptSlots.some(s => requiredSlots.includes(s));
        }).length;
        const remainingSlotCapacity = Math.max(0, slotConf.max - totalAppointmentsInSlot);
        finalFemaleSlots = Math.min(finalFemaleSlots, remainingSlotCapacity);
        finalMaleSlots = Math.min(finalMaleSlots, remainingSlotCapacity);
      }

      return {
        femaleFreeCount: finalFemaleSlots,
        maleFreeCount: finalMaleSlots,
        femaleAvailable: finalFemaleSlots > 0,
        maleAvailable: finalMaleSlots > 0,
        freeStaff: availableStaff
      };
    }

    function isAssistantOnLeaveOnDate(asstId, dateStr) {
      if (!asstId || !dateStr) return false;

      // 1. Check assistantLeaves array
      if (typeof assistantLeaves !== "undefined" && Array.isArray(assistantLeaves)) {
        const onLeave = assistantLeaves.some(l => {
          if (l.assistantId !== asstId) return false;
          if (Array.isArray(l.dates) && l.dates.includes(dateStr)) return true;
          if (l.startDate && l.endDate && dateStr >= l.startDate && dateStr <= l.endDate) return true;
          if (l.date && l.date === dateStr) return true;
          return false;
        });
        if (onLeave) return true;
      }

      // 2. Check assistantDutyRosters for dateStr
      if (typeof assistantDutyRosters !== "undefined" && assistantDutyRosters[dateStr] && assistantDutyRosters[dateStr][asstId]) {
        const rEntry = (typeof normalizeAssistantRosterEntry === "function")
          ? normalizeAssistantRosterEntry(assistantDutyRosters[dateStr][asstId])
          : assistantDutyRosters[dateStr][asstId];
        if (rEntry && (rEntry.shiftType === 'off' || rEntry.isExplicitlyEmpty === true)) {
          return true;
        }
      }

      // 3. Check assistant object's own active/shiftType
      const asstObj = (assistants || []).find(a => a.id === asstId);
      if (asstObj && (asstObj.active === false || asstObj.shiftType === 'off')) {
        return true;
      }

      return false;
    }

    function getAvailableAssistantsForSlot(dateStr, timeSlot, checkTwoSlots = false, excludeAppointmentId = null) {
      if (!dateStr) {
        return (assistants || []).filter(a => a.active !== false);
      }

      const slotsList = getSlotsForDate(dateStr);
      const requiredSlots = timeSlot ? [timeSlot] : [];
      if (timeSlot && checkTwoSlots) {
        const nextSlot = getNextSlot(timeSlot, slotsList);
        if (nextSlot) requiredSlots.push(nextSlot);
      }

      return (assistants || []).filter(asst => {
        // 1. Must be active clinic staff
        if (!asst || asst.active === false) return false;

        // 2. Must not be on leave for this specific date
        if (isAssistantOnLeaveOnDate(asst.id, dateStr)) return false;

        // 3. Check if busy in any appointment on the required slot(s)
        const isOccupied = (appointments || []).some(apt => {
          if (excludeAppointmentId && apt.id === excludeAppointmentId) return false;
          if (apt.bookDate === dateStr && (apt.assistantId === asst.id || (apt.assistantNick && apt.assistantNick === asst.nickname))) {
            if (apt.status === "🔴 ส่งต่อ" || apt.status === "ยกเลิก") return false;
            const aptSlots = (apt.slotsOccupied && apt.slotsOccupied.length > 0) ? apt.slotsOccupied : [apt.timeSlot];
            if (requiredSlots.length > 0) {
              return aptSlots.some(s => requiredSlots.includes(s));
            }
            return true;
          }
          return false;
        });

        return !isOccupied;
      });
    }

    /**
     * Universal Assistant Booking Conflict Checker (v5.5.2)
     * Validates leave, double-booking, and capacity across all workflows.
     * All active assistants can be booked unless on leave or occupied.
     */
    function checkAssistantBookingConflict({
      assistantId,
      bookDate,
      timeSlot,
      slotsOccupied = null,
      excludeAppointmentId = null,
      requiresTwoSlots = false,
      patientName = ""
    }) {
      if (!bookDate || !timeSlot) {
        return { hasConflict: false };
      }

      const slotsList = (typeof getSlotsForDate === "function") ? getSlotsForDate(bookDate) : ALL_WORKING_SLOTS;
      let reqSlots = (Array.isArray(slotsOccupied) && slotsOccupied.length > 0) ? [...slotsOccupied] : [timeSlot];
      if (reqSlots.length === 1 && requiresTwoSlots) {
        const nextS = (typeof getNextSlot === "function") ? getNextSlot(timeSlot, slotsList) : null;
        if (nextS) reqSlots.push(nextS);
      }

      // 1. SPECIFIC ASSISTANT CHECK
      if (assistantId && assistantId !== "auto" && assistantId !== "female" && assistantId !== "male") {
        const asst = (assistants || []).find(a => a.id === assistantId);
        const asstNick = asst ? (asst.nickname || asst.name) : "ผู้ช่วยแพทย์";

        // 1.1 Inactive Staff Check
        if (asst && asst.active === false) {
          return {
            hasConflict: true,
            type: 'inactive',
            title: `ผู้ช่วยแพทย์ ${asstNick} พ้นสภาพการปฏิบัติงาน`,
            desc: `ไม่สามารถเลือกผู้ช่วยฯ ${asstNick} ได้เนื่องจากไม่ได้ปฏิบัติงานในระบบแล้ว กรุณาเลือกผู้ช่วยฯ ท่านอื่น`,
            asst
          };
        }

        // 1.2 Leave / Off Duty for date Check
        if (isAssistantOnLeaveOnDate(assistantId, bookDate)) {
          const dateFormatted = (typeof formatThaiDateShort === "function") ? formatThaiDateShort(bookDate) : bookDate;
          return {
            hasConflict: true,
            type: 'leave',
            title: `ผู้ช่วยฯ ${asstNick} ลาเวร / พัก (${dateFormatted})`,
            desc: `ผู้ช่วยแพทย์ ${asstNick} ได้ลงบันทึกวันลาเวร / พักผ่อนในวันที่ ${dateFormatted} ไว้ จึงไม่สามารถรับนัดหมายได้ กรุณาเลือกรอบเวลาอื่นหรือเลือกผู้ช่วยแพทย์ท่านอื่น`,
            asst
          };
        }

        // 1.3 Appointment Collision / Double-Booking Check
        const conflictingApt = (appointments || []).find(apt => {
          if (excludeAppointmentId && apt.id === excludeAppointmentId) return false;
          if (apt.bookDate !== bookDate) return false;
          if (apt.status === "🔴 ส่งต่อ" || apt.status === "ยกเลิก") return false;
          if (apt.assistantId === assistantId || (apt.assistantNick && apt.assistantNick === asstNick)) {
            const aptSlots = (apt.slotsOccupied && apt.slotsOccupied.length > 0) ? apt.slotsOccupied : [apt.timeSlot];
            return aptSlots.some(s => reqSlots.includes(s));
          }
          return false;
        });

        if (conflictingApt) {
          const cPatient = conflictingApt.patientName || "ผู้รับบริการท่านอื่น";
          const cTime = (conflictingApt.slotsOccupied && conflictingApt.slotsOccupied.length > 0)
            ? conflictingApt.slotsOccupied.map(s => (typeof formatCleanTime === "function" ? formatCleanTime(s) : s)).join(' - ')
            : (typeof formatCleanTime === "function" ? formatCleanTime(conflictingApt.timeSlot) : conflictingApt.timeSlot);
          const cService = conflictingApt.mainService || "นวดรักษา";

          return {
            hasConflict: true,
            type: 'collision',
            title: `⚠️ ผู้ช่วยฯ ${asstNick} ติดนัดหมายซ้ำซ้อนแล้ว`,
            desc: `ผู้ช่วยแพทย์ ${asstNick} มีคิวนัดหมายซ้ำซ้อนในรอบเวลา ${cTime} น. กับคุณ "${cPatient}" (${cService}) กรุณาเลือกผู้ช่วยแพทย์ท่านอื่น หรือเลือกรอบเวลาอื่น`,
            conflictingAppointment: conflictingApt,
            asst
          };
        }

        if (conflictingApt) {
          const cPatient = conflictingApt.patientName || "ผู้รับบริการท่านอื่น";
          const cTime = (conflictingApt.slotsOccupied && conflictingApt.slotsOccupied.length > 0)
            ? conflictingApt.slotsOccupied.map(s => (typeof formatCleanTime === "function" ? formatCleanTime(s) : s)).join(' - ')
            : (typeof formatCleanTime === "function" ? formatCleanTime(conflictingApt.timeSlot) : conflictingApt.timeSlot);
          const cService = conflictingApt.mainService || "นวดรักษา";

          return {
            hasConflict: true,
            type: 'collision',
            title: `⚠️ ผู้ช่วยฯ ${asstNick} ติดนัดหมายซ้ำซ้อนแล้ว`,
            desc: `ผู้ช่วยแพทย์ ${asstNick} มีคิวนัดหมายซ้ำซ้อนในรอบเวลา ${cTime} น. กับคุณ "${cPatient}" (${cService}) กรุณาเลือกผู้ช่วยแพทย์ท่านอื่น หรือเลือกรอบเวลาอื่น`,
            conflictingAppointment: conflictingApt,
            asst
          };
        }

        // 1.5 Gender Pool Capacity Check
        if (typeof getGenderAvailability === "function") {
          const genderAvail = getGenderAvailability(bookDate, timeSlot, reqSlots.length > 1, excludeAppointmentId);
          const isMale = asst ? (typeof isMaleAssistant === "function" ? isMaleAssistant(asst) : (asst.gender === 'male')) : false;
          const isGenderFull = isMale ? (genderAvail.maleFreeCount <= 0) : (genderAvail.femaleFreeCount <= 0);
          if (isGenderFull) {
            const cleanS = typeof formatCleanTime === "function" ? formatCleanTime(timeSlot) : timeSlot;
            return {
              hasConflict: true,
              type: 'gender_full',
              title: `คิวผู้ช่วยแพทย์${isMale ? 'ชาย' : 'หญิง'}ในรอบนี้เต็มแล้ว`,
              desc: `ในรอบเวลา ${cleanS} น. คิวผู้ช่วยแพทย์${isMale ? 'ชาย' : 'หญิง'}เต็มอัตรากำลังแล้ว กรุณาเลือกรอบเวลาอื่น`,
              asst
            };
          }
        }

        return { hasConflict: false, asst };
      }

      // 2. GENDER PREFERENCE / AUTO POOL CHECK
      if (typeof getGenderAvailability === "function") {
        const genderAvail = getGenderAvailability(bookDate, timeSlot, reqSlots.length > 1, excludeAppointmentId);
        const cleanS = typeof formatCleanTime === "function" ? formatCleanTime(timeSlot) : timeSlot;
        const dateFormatted = (typeof formatThaiDateShort === "function" && bookDate) ? formatThaiDateShort(bookDate) : (bookDate || "");

        if (assistantId === "female") {
          if (!genderAvail.femaleAvailable || genderAvail.femaleFreeCount <= 0) {
            return {
              hasConflict: true,
              type: 'pool_full',
              title: `ผู้ช่วยแพทย์หญิงในรอบนี้คิวเต็มแล้ว`,
              desc: `ผู้ช่วยแพทย์หญิงที่เข้าเวรในรอบเวลา ${cleanS} น. วันที่ ${dateFormatted} ติดนัดหมายเต็มแล้ว กรุณาเลือกรอบอื่น หรือเลือกขอผู้ช่วยแพทย์ชาย`
            };
          }
        } else if (assistantId === "male") {
          if (!genderAvail.maleAvailable || genderAvail.maleFreeCount <= 0) {
            return {
              hasConflict: true,
              type: 'pool_full',
              title: `ผู้ช่วยแพทย์ชายในรอบนี้คิวเต็มแล้ว`,
              desc: `ผู้ช่วยแพทย์ชายที่เข้าเวรในรอบเวลา ${cleanS} น. วันที่ ${dateFormatted} ติดนัดหมายเต็มแล้ว กรุณาเลือกรอบอื่น หรือเลือกขอผู้ช่วยแพทย์หญิง`
            };
          }
        } else if (assistantId === "auto" || !assistantId) {
          if (genderAvail.femaleFreeCount <= 0 && genderAvail.maleFreeCount <= 0) {
            return {
              hasConflict: true,
              type: 'all_full',
              title: `รอบเวลา ${cleanS} น. คิวเต็มครบทุกท่านแล้ว`,
              desc: `ผู้ช่วยแพทย์ทุกท่านในรอบเวลา ${cleanS} น. วันที่ ${dateFormatted} ติดนัดหมายเต็มแล้ว กรุณาเลือกรอบเวลาอื่น`
            };
          }
        }
      }

      return { hasConflict: false };
    }

    /**
     * Dedicated Modal Alert for Assistant Conflict / Double-Booking (v5.4.2)
     */
    function showAssistantConflictModal(conflict, slot, date) {
      if (!conflict || !conflict.hasConflict) return;
      const modal = document.getElementById("modal-slot-full-alert");
      if (!modal) return;

      const titleEl = document.getElementById("slot-full-alert-title");
      const badgeEl = document.getElementById("slot-full-alert-badge");
      const descEl = document.getElementById("slot-full-alert-desc");

      const cleanSlot = slot ? (String(slot).replace(/รอบเวลา/g, '').replace(/รอบ/g, '').replace(/น\.?/g, '').trim()) : "-";
      const slotText = cleanSlot !== "-" ? (cleanSlot.includes('.') ? `${cleanSlot} น.` : `${cleanSlot.replace(':', '.')} น.`) : "-";
      const dateFormatted = (typeof formatThaiDateShort === "function" && date) ? formatThaiDateShort(date) : (date || "");

      if (titleEl) {
        titleEl.textContent = conflict.title || `ไม่สามารถนัดหมายรอบเวลา ${slotText} ได้`;
      }
      if (badgeEl) {
        badgeEl.textContent = dateFormatted ? `⏰ รอบเวลา: ${slotText} (วันที่ ${dateFormatted})` : `⏰ รอบเวลา: ${slotText}`;
      }
      if (descEl) {
        descEl.textContent = conflict.desc || "ขออภัยในความไม่สะดวก เนื่องจากผู้ช่วยแพทย์ท่านนี้ติดนัดหมายอื่นหรือไม่อยู่เวรในรอบเวลาดังกล่าว กรุณาเลือกรอบเวลาอื่นหรือเลือกผู้ช่วยแพทย์ท่านอื่น";
      }

      modal.classList.remove("hidden");
      if (typeof lucide !== "undefined" && lucide.createIcons) {
        lucide.createIcons();
      }

      // Play audio warning if supported
      if (typeof playAlertTone === "function") {
        try { playAlertTone(); } catch(e) {}
      }

      // Toast error notification
      if (typeof showToast === "function") {
        showToast(conflict.title || "ไม่สามารถจองคิวซ้ำซ้อนได้", "error");
      }
    }

    function selectQuickChip(type) {
      const dateVal = document.getElementById("new-book-date")?.value || todayStr;
      const timeSlot = document.getElementById("new-time-slot")?.value || "";
      const twoSlots = isTwoSlotsSelected("new");
      const genderAvail = getGenderAvailability(dateVal, timeSlot, twoSlots);

      if (timeSlot) {
        if (type === "female" && !genderAvail.femaleAvailable) {
          showToast("❌ ผู้ช่วยแพทย์หญิงในรอบเวลานี้เต็มแล้ว (ติดนัดหมด) กรุณาเลือกขอผู้ชายหรือเปลี่ยนรอบเวลา", "warning");
          return;
        }
        if (type === "male" && !genderAvail.maleAvailable) {
          showToast("❌ ผู้ช่วยแพทย์ชายในรอบเวลานี้เต็มแล้ว (ติดนัดหมด) กรุณาเลือกขอผู้หญิงหรือเปลี่ยนรอบเวลา", "warning");
          return;
        }
      }

      const sel = document.getElementById("new-assistant-select");
      if (sel) sel.value = type;

      const chips = {
        female: document.getElementById("chip-staff-female"),
        male: document.getElementById("chip-staff-male")
      };

      const activeClass = "staff-quick-chip min-h-[44px] px-3 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 border transition cursor-pointer font-bold bg-herbal-700 text-white border-herbal-700 ring-2 ring-herbal-400/80 shadow-xs";
      const inactiveClass = "staff-quick-chip min-h-[44px] px-3 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 border transition cursor-pointer font-medium bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300";

      if (chips.female && (!timeSlot || genderAvail.femaleAvailable)) {
        chips.female.className = (type === "female") ? activeClass : inactiveClass;
      }
      if (chips.male && (!timeSlot || genderAvail.maleAvailable)) {
        chips.male.className = (type === "male") ? activeClass : inactiveClass;
      }

      // Reset Quick Staff Avatar Badges
      document.querySelectorAll(".staff-avatar-chip").forEach(el => {
        el.classList.remove("border-herbal-600", "bg-herbal-50", "ring-2", "ring-herbal-400", "text-herbal-900", "font-bold");
        el.classList.add("border-slate-200", "bg-white", "text-slate-700", "font-medium");
      });

      const hint = document.getElementById("staff-selection-hint");
      if (hint) {
        if (type === "female") hint.textContent = "👩 ขอผู้ช่วยแพทย์หญิง" + (timeSlot ? ` (ว่าง ${genderAvail.femaleFreeCount} ท่าน)` : '');
        else if (type === "male") hint.textContent = "👨 ขอผู้ช่วยแพทย์ชาย" + (timeSlot ? ` (ว่าง ${genderAvail.maleFreeCount} ท่าน)` : '');
        else hint.textContent = "👩 ขอผู้ช่วยแพทย์หญิง";
      }
    }

    function onAssistantSelectChange(val) {
      if (val === "female" || val === "male") {
        selectQuickChip(val);
      } else {
        selectStaff(val);
      }
    }

    function selectStaff(asstId) {
      const asst = assistants.find(a => a.id === asstId);
      if (!asst) return;

      const sel = document.getElementById("new-assistant-select");
      if (sel) sel.value = asst.id;

      // Deactivate Quick Chips
      const inactiveClass = "staff-quick-chip min-h-[44px] px-3 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 border transition cursor-pointer font-medium bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600";
      ["chip-staff-female", "chip-staff-male"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.className = inactiveClass;
      });

      // Highlight specific Staff Avatar Badge
      document.querySelectorAll(".staff-avatar-chip").forEach(el => {
        if (el.getAttribute("data-asst-id") === asst.id) {
          el.classList.remove("border-slate-200", "dark:border-slate-700", "bg-white", "dark:bg-slate-800", "text-slate-700", "dark:text-slate-200", "font-medium");
          el.classList.add("border-herbal-600", "bg-herbal-50", "dark:bg-herbal-950/60", "ring-2", "ring-herbal-400", "text-herbal-900", "dark:text-emerald-300", "font-bold");
        } else {
          el.classList.remove("border-herbal-600", "bg-herbal-50", "dark:bg-herbal-950/60", "ring-2", "ring-herbal-400", "text-herbal-900", "dark:text-emerald-300", "font-bold");
          el.classList.add("border-slate-200", "dark:border-slate-700", "bg-white", "dark:bg-slate-800", "text-slate-700", "dark:text-slate-200", "font-medium");
        }
      });

      const nick = asst.nickname || asst.name;
      const hint = document.getElementById("staff-selection-hint");
      if (hint) hint.textContent = `👤 ระบุ: ${nick}`;

      closeStaffModal();
      showToast(`เลือกผู้ช่วยแพทย์: ${nick} เรียบร้อยแล้ว`, "info");
      lucide.createIcons();
    }

    function clearSelectedStaff() {
      const dateVal = document.getElementById("new-book-date")?.value || todayStr;
      const timeSlot = document.getElementById("new-time-slot")?.value || "";
      const twoSlots = isTwoSlotsSelected("new");
      const genderAvail = getGenderAvailability(dateVal, timeSlot, twoSlots);

      if (genderAvail.femaleAvailable) selectQuickChip("female");
      else if (genderAvail.maleAvailable) selectQuickChip("male");
    }

    function renderStaffQuickBadges() {
      const container = document.getElementById("staff-quick-badges-container");
      if (!container) return;

      const dateVal = document.getElementById("new-book-date")?.value || todayStr;
      const timeSlot = document.getElementById("new-time-slot")?.value || "";
      const twoSlots = isTwoSlotsSelected("new");
      const currentSelectedId = document.getElementById("new-assistant-select")?.value;

      const genderAvail = getGenderAvailability(dateVal, timeSlot, twoSlots);
      const availableStaff = genderAvail.freeStaff;

      if (availableStaff.length === 0) {
        if (timeSlot) {
          container.innerHTML = `
            <div class="text-[11px] text-rose-700 dark:text-rose-300 font-medium py-1.5 px-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800">
              ⚠️ ผู้ช่วยแพทย์ทุกท่านติดนัดในรอบเวลานี้แล้ว กรุณาเลือกรอบเวลาอื่น
            </div>
          `;
        } else {
          container.innerHTML = `
            <div class="text-[11px] text-slate-400 italic py-1">
              ไม่มีเจ้าหน้าที่เข้าเวรในขณะนี้
            </div>
          `;
        }
        return;
      }

      let html = `<div class="flex items-center gap-1.5 flex-wrap">`;

      availableStaff.forEach(a => {
        const isSelected = currentSelectedId === a.id;
        const isFemale = isFemaleAssistant(a);
        const avatarBg = isFemale ? "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800" : "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800";
        const nick = a.nickname || a.name;
        const initial = nick ? nick[0] : "พ";
        const selectedClass = isSelected 
          ? "border-herbal-600 bg-herbal-50 dark:bg-herbal-950/60 ring-2 ring-herbal-400 text-herbal-900 dark:text-emerald-300 shadow-2xs font-bold" 
          : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-herbal-400 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 font-medium";

        html += `
          <button type="button" data-asst-id="${a.id}" onclick="selectStaff('${a.id}')"
            class="staff-avatar-chip inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs transition cursor-pointer shadow-2xs ${selectedClass}">
            <span class="w-5 h-5 rounded-lg ${avatarBg} border flex items-center justify-center text-[10px] font-bold">
              ${initial}
            </span>
            <span class="truncate max-w-[90px] font-semibold">${escapeHtml(nick)}</span>
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" title="ว่าง"></span>
          </button>
        `;
      });

      html += `
          <button type="button" onclick="openStaffModal()" 
            class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-herbal-500 dark:hover:border-emerald-500 bg-slate-50/80 dark:bg-slate-800/80 hover:bg-herbal-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-herbal-800 dark:hover:text-emerald-300 text-xs font-medium transition cursor-pointer" title="ค้นหาและดูรายละเอียดผู้ช่วยแพทย์">
            <i data-lucide="search" class="w-3.5 h-3.5"></i>
            <span>ค้นหา...</span>
          </button>
        </div>
      `;

      container.innerHTML = html;
      lucide.createIcons();
    }

    function populateAssistantsDropdown(selectId = "new-assistant-select") {
      const sel = document.getElementById(selectId);
      if (!sel) return;

      const dateVal = document.getElementById("new-book-date")?.value || todayStr;
      const timeSlot = document.getElementById("new-time-slot")?.value || "";
      const twoSlots = isTwoSlotsSelected("new");

      const genderAvail = getGenderAvailability(dateVal, timeSlot, twoSlots);
      const availableStaff = genderAvail.freeStaff;
      let currentVal = sel.value || "female";

      // Auto-fallback if the currently selected option is unavailable
      if (timeSlot) {
        if (currentVal === "female" && !genderAvail.femaleAvailable) {
          if (genderAvail.maleAvailable) {
            currentVal = "male";
            showToast("⚠️ ผู้ช่วยแพทย์หญิงในรอบนี้ติดนัดหมดแล้ว ระบบปรับเป็น 'ขอผู้ชาย' ให้แทน", "warning");
          } else if (availableStaff.length > 0) {
            currentVal = availableStaff[0].id;
          } else {
            currentVal = "";
          }
        } else if (currentVal === "male" && !genderAvail.maleAvailable) {
          if (genderAvail.femaleAvailable) {
            currentVal = "female";
            showToast("⚠️ ผู้ช่วยแพทย์ชายในรอบนี้ติดนัดหมดแล้ว ระบบปรับเป็น 'ขอผู้หญิง' ให้แทน", "warning");
          } else if (availableStaff.length > 0) {
            currentVal = availableStaff[0].id;
          } else {
            currentVal = "";
          }
        } else if (currentVal && currentVal !== "female" && currentVal !== "male" && !availableStaff.some(a => a.id === currentVal)) {
          if (genderAvail.femaleAvailable) currentVal = "female";
          else if (genderAvail.maleAvailable) currentVal = "male";
          else if (availableStaff.length > 0) currentVal = availableStaff[0].id;
          else currentVal = "";
        }
      }

      // Build Select Dropdown Options
      let optsHtml = "";
      if (!timeSlot || genderAvail.femaleAvailable) {
        optsHtml += `<option value="female" ${currentVal === 'female' ? 'selected' : ''}>👩 ขอผู้หญิง (จัดสรรผู้ช่วยฯ หญิง ${timeSlot ? `- ว่าง ${genderAvail.femaleFreeCount} ท่าน` : ''})</option>`;
      } else {
        optsHtml += `<option value="female" disabled class="text-slate-400 bg-slate-100 dark:bg-slate-800 dark:text-slate-500">👩 ขอผู้หญิง (❌ เต็ม - ไม่มีผู้ช่วยฯ หญิงว่าง)</option>`;
      }

      if (!timeSlot || genderAvail.maleAvailable) {
        optsHtml += `<option value="male" ${currentVal === 'male' ? 'selected' : ''}>👨 ขอผู้ชาย (จัดสรรผู้ช่วยฯ ชาย ${timeSlot ? `- ว่าง ${genderAvail.maleFreeCount} ท่าน` : ''})</option>`;
      } else {
        optsHtml += `<option value="male" disabled class="text-slate-400 bg-slate-100 dark:bg-slate-800 dark:text-slate-500">👨 ขอผู้ชาย (❌ เต็ม - ไม่มีผู้ช่วยฯ ชายว่าง)</option>`;
      }

      if (availableStaff.length > 0) {
        const groupLabel = timeSlot ? `🟢 รายชื่อผู้ช่วยฯ ที่ว่างในรอบเวลานี้ (${availableStaff.length} ท่าน)` : "🟢 รายชื่อผู้ช่วยฯ ที่เข้าเวร";
        optsHtml += `<optgroup label="${groupLabel}">`;
        availableStaff.forEach(a => {
          const genderIcon = isMaleAssistant(a) ? '👨' : '👩';
          const nick = a.nickname || a.name;
          optsHtml += `<option value="${a.id}" ${currentVal === a.id ? 'selected' : ''}>${genderIcon} ${escapeHtml(nick)}</option>`;
        });
        optsHtml += `</optgroup>`;
      } else if (timeSlot) {
        optsHtml += `<optgroup label="⚠️ ไม่มีผู้ช่วยฯ ว่างในรอบเวลานี้">`;
        optsHtml += `<option value="" disabled>-- ผู้ช่วยฯ ทุกท่านติดนัดในรอบเวลานี้ --</option>`;
        optsHtml += `</optgroup>`;
      }

      if (timeSlot) {
        const busyStaff = (assistants || []).filter(a => {
          if (!a || a.active === false) return false;
          if (isAssistantOnLeaveOnDate(a.id, dateVal)) return false;
          return (appointments || []).some(apt => {
            if (apt.bookDate === dateVal && (apt.assistantId === a.id || (apt.assistantNick && apt.assistantNick === a.nickname))) {
              if (apt.status === "🔴 ส่งต่อ" || apt.status === "ยกเลิก") return false;
              const aptSlots = (apt.slotsOccupied && apt.slotsOccupied.length > 0) ? apt.slotsOccupied : [apt.timeSlot];
              return aptSlots.includes(timeSlot);
            }
            return false;
          });
        });

        if (busyStaff.length > 0) {
          optsHtml += `<optgroup label="🔒 ผู้ช่วยฯ ที่ติดนัดหมายในรอบเวลานี้ (${busyStaff.length} ท่าน)">`;
          busyStaff.forEach(a => {
            const genderIcon = isMaleAssistant(a) ? '👨' : '👩';
            const nick = a.nickname || a.name;
            optsHtml += `<option value="${a.id}" disabled class="text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800">🔒 ${genderIcon} ${escapeHtml(nick)} (ติดนัดหมาย)</option>`;
          });
          optsHtml += `</optgroup>`;
        }

        const leaveStaff = (assistants || []).filter(a => a.active !== false && isAssistantOnLeaveOnDate(a.id, dateVal));
        if (leaveStaff.length > 0) {
          optsHtml += `<optgroup label="🏖️ ผู้ช่วยฯ ที่ลาเวร / พัก ในวันที่เลือก (${leaveStaff.length} ท่าน)">`;
          leaveStaff.forEach(a => {
            const genderIcon = isMaleAssistant(a) ? '👨' : '👩';
            const nick = a.nickname || a.name;
            optsHtml += `<option value="${a.id}" disabled class="text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800">🏖️ ${genderIcon} ${escapeHtml(nick)} (ลาเวร/พัก)</option>`;
          });
          optsHtml += `</optgroup>`;
        }
      }

      sel.innerHTML = optsHtml;
      sel.value = currentVal;

      // Update Quick Chips UI & Disabled state
      const btnFemale = document.getElementById("chip-staff-female");
      const btnMale = document.getElementById("chip-staff-male");
      const activeClass = "staff-quick-chip min-h-[44px] px-3 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 border transition cursor-pointer font-bold bg-herbal-700 text-white border-herbal-700 ring-2 ring-herbal-400/80 shadow-xs";
      const inactiveClass = "staff-quick-chip min-h-[44px] px-3 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 border transition cursor-pointer font-medium bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600";
      const disabledClass = "staff-quick-chip min-h-[44px] px-3 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 border transition font-medium bg-slate-100 dark:bg-slate-800/60 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700 cursor-not-allowed opacity-60";

      if (btnFemale) {
        if (timeSlot && !genderAvail.femaleAvailable) {
          btnFemale.disabled = true;
          btnFemale.className = disabledClass;
          btnFemale.innerHTML = `<span>👩</span><span class="text-xs">ขอผู้หญิง <span class="text-[10px] text-rose-500 font-extrabold">(เต็ม)</span></span>`;
          btnFemale.title = "ผู้ช่วยฯ หญิงในรอบเวลานี้ติดนัดหมดแล้ว";
        } else {
          btnFemale.disabled = false;
          btnFemale.className = (currentVal === "female") ? activeClass : inactiveClass;
          btnFemale.innerHTML = `<span>👩</span><span class="text-xs">ขอผู้หญิง</span>`;
          btnFemale.title = "ขอผู้ช่วยแพทย์หญิง";
        }
      }

      if (btnMale) {
        if (timeSlot && !genderAvail.maleAvailable) {
          btnMale.disabled = true;
          btnMale.className = disabledClass;
          btnMale.innerHTML = `<span>👨</span><span class="text-xs">ขอผู้ชาย <span class="text-[10px] text-rose-500 font-extrabold">(เต็ม)</span></span>`;
          btnMale.title = "ผู้ช่วยฯ ชายในรอบเวลานี้ติดนัดหมดแล้ว";
        } else {
          btnMale.disabled = false;
          btnMale.className = (currentVal === "male") ? activeClass : inactiveClass;
          btnMale.innerHTML = `<span>👨</span><span class="text-xs">ขอผู้ชาย</span>`;
          btnMale.title = "ขอผู้ช่วยแพทย์ชาย";
        }
      }

      // Update Hint Label
      const hint = document.getElementById("staff-selection-hint");
      if (hint) {
        if (currentVal === "female") {
          hint.textContent = "👩 ขอผู้ช่วยแพทย์หญิง" + (timeSlot ? ` (ว่าง ${genderAvail.femaleFreeCount} ท่าน)` : '');
        } else if (currentVal === "male") {
          hint.textContent = "👨 ขอผู้ช่วยแพทย์ชาย" + (timeSlot ? ` (ว่าง ${genderAvail.maleFreeCount} ท่าน)` : '');
        } else if (currentVal) {
          const matched = assistants.find(a => a.id === currentVal);
          hint.textContent = `👤 ระบุ: ${matched ? (matched.nickname || matched.name) : currentVal}`;
        } else {
          hint.textContent = timeSlot ? "⚠️ ไม่มีผู้ช่วยฯ ว่างในรอบนี้" : "👩 ขอผู้ช่วยแพทย์หญิง";
        }
      }

      renderStaffQuickBadges();
      renderStaffModalList("");
    }

    function onTimeSlotChanged(mode = 'new') {
      populateAssistantsDropdown("new-assistant-select");
    }

    function onExtraServicesChanged(mode = 'new') {
      populateAssistantsDropdown("new-assistant-select");
    }

    function openStaffModal() {
      const modal = document.getElementById("modal-staff-selector");
      if (!modal) return;
      modal.classList.remove("hidden");

      const searchInput = document.getElementById("staff-search-input");
      if (searchInput) {
        searchInput.value = "";
        setTimeout(() => searchInput.focus(), 150);
      }
      const clearBtn = document.getElementById("btn-staff-search-clear");
      if (clearBtn) clearBtn.classList.add("hidden");

      renderStaffModalList("");
      lucide.createIcons();
    }

    function closeStaffModal() {
      const modal = document.getElementById("modal-staff-selector");
      if (!modal) return;
      modal.classList.add("hidden");
    }

    function clearStaffSearch() {
      const searchInput = document.getElementById("staff-search-input");
      if (searchInput) {
        searchInput.value = "";
        searchInput.focus();
      }
      const clearBtn = document.getElementById("btn-staff-search-clear");
      if (clearBtn) clearBtn.classList.add("hidden");
      renderStaffModalList("");
    }

    function filterStaffModalList() {
      const q = (document.getElementById("staff-search-input")?.value || "").trim().toLowerCase();
      const clearBtn = document.getElementById("btn-staff-search-clear");
      if (clearBtn) {
        if (q) clearBtn.classList.remove("hidden");
        else clearBtn.classList.add("hidden");
      }
      renderStaffModalList(q);
    }

    function renderStaffModalList(query = "") {
      const container = document.getElementById("staff-modal-list-container");
      if (!container) return;

      const dateVal = document.getElementById("new-book-date")?.value || todayStr;
      const timeSlot = document.getElementById("new-time-slot")?.value || "";
      const twoSlots = isTwoSlotsSelected("new");
      const currentSelectedId = document.getElementById("new-assistant-select")?.value;

      const availableStaff = getAvailableAssistantsForSlot(dateVal, timeSlot, twoSlots);

      const filtered = availableStaff.filter(a => {
        if (!query) return true;
        const nick = (a.nickname || "").toLowerCase();
        const phone = (a.phone || "").toLowerCase();
        return nick.includes(query) || phone.includes(query);
      });

      if (filtered.length === 0) {
        container.innerHTML = `
          <div class="text-center py-8 text-slate-400 space-y-1.5">
            <div class="text-3xl">🔍</div>
            <p class="text-xs font-semibold text-slate-600">${timeSlot ? 'ไม่พบผู้ช่วยแพทย์ที่ว่างในรอบเวลานี้' : 'ไม่พบรายชื่อผู้ช่วยแพทย์แผนไทย'}</p>
            <p class="text-[11px] text-slate-400">ลองเลือกรอบเวลาอื่น หรือเลือกแบบขอผู้หญิง/ขอผู้ชาย</p>
          </div>
        `;
        return;
      }

      let html = "";
      filtered.forEach(asst => {
        const isSelected = currentSelectedId === asst.id;
        const isFemale = asst.gender === "female" || asst.gender === "หญิง" || (asst.name && (asst.name.startsWith("น.ส.") || asst.name.startsWith("นาง")));
        const avatarBg = isFemale ? "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-800" : "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/80 dark:text-blue-300 dark:border-blue-800";
        const genderBadge = isFemale ? '<span class="text-[10px] text-rose-600 dark:text-rose-400 font-medium">👩 หญิง</span>' : '<span class="text-[10px] text-blue-600 dark:text-blue-400 font-medium">👨 ชาย</span>';
        const nick = asst.nickname || asst.name;
        const initial = nick ? nick[0] : "พ";

        const cardSelectedClass = isSelected 
          ? "border-herbal-600 bg-herbal-50/90 dark:bg-herbal-950/70 ring-2 ring-herbal-500 shadow-sm" 
          : "border-slate-200 dark:border-slate-750 bg-white dark:bg-slate-800 hover:border-herbal-400 hover:bg-slate-50 dark:hover:bg-slate-750";

        html += `
          <div onclick="selectStaff('${asst.id}')" 
            class="p-3 sm:p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-3 ${cardSelectedClass} min-h-[56px]">
            <div class="flex items-center space-x-3 overflow-hidden">
              <div class="w-10 h-10 rounded-2xl ${avatarBg} border flex items-center justify-center font-bold text-base shadow-inner shrink-0">
                ${initial}
              </div>
              <div class="truncate text-left">
                <div class="flex items-center space-x-2">
                  <h5 class="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">${escapeHtml(nick)}</h5>
                  ${genderBadge}
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800">🟢 ว่าง</span>
                </div>
              </div>
            </div>

            <div class="shrink-0 flex items-center space-x-2">
              ${isSelected ? `
                <div class="w-6 h-6 rounded-full bg-herbal-700 dark:bg-herbal-600 text-white flex items-center justify-center text-xs shadow-xs">
                  <i data-lucide="check" class="w-3.5 h-3.5 stroke-[3]"></i>
                </div>
              ` : `
                <div class="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-300 flex items-center justify-center text-xs">
                  <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
                </div>
              `}
            </div>
          </div>
        `;
      });

      container.innerHTML = html;
      lucide.createIcons();
    }

    function updateSelectedSlotButtonUI(mode = 'new', slot = '') {
      const btn = document.getElementById(`btn-slot-checker-${mode}`);
      const display = document.getElementById(`${mode}-selected-slot-display`);
      const sub = document.getElementById(`${mode}-selected-slot-sub`);
      const hiddenInput = document.getElementById(`${mode}-time-slot`);
      if (!btn) return;

      const dateInput = document.getElementById(`${mode}-book-date`);
      const dateVal = dateInput ? dateInput.value : todayStr;
      const holCheck = checkDateHoliday(dateVal);
      const actionBadge = btn.querySelector('.slot-checker-action-badge');

      if (holCheck.isClosed) {
        if (hiddenInput) hiddenInput.value = "";
        if (display) display.innerHTML = `<span class="text-rose-700 dark:text-rose-300">❌ คลินิกปิดทำการ</span>`;
        if (sub) sub.innerHTML = `<span class="text-rose-600 dark:text-rose-400 font-medium">${escapeHtml(holCheck.name || 'วันหยุด/ปิดทำการ')}</span>`;
        if (actionBadge) {
          actionBadge.textContent = 'ดูรายละเอียด';
          actionBadge.className = 'slot-checker-action-badge px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold whitespace-nowrap shadow-2xs transition';
        }
        btn.className = "w-full min-h-[44px] px-3.5 py-2 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 active:bg-rose-200 text-rose-900 dark:text-rose-200 border-2 border-dashed border-rose-400 dark:border-rose-600 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-between transition shadow-xs cursor-pointer group";
        return;
      }

      if (slot) {
        if (hiddenInput) hiddenInput.value = slot;
        if (display) display.innerHTML = `🕒 รอบเวลา: <span class="text-emerald-700 dark:text-emerald-300 font-extrabold">${formatTimeLabel(slot)} น.</span>`;
        if (sub) sub.innerHTML = `<span class="text-emerald-600 dark:text-emerald-400 font-medium">✅ เลือกรอบแล้ว (คลิกเพื่อเปลี่ยนรอบ)</span>`;
        if (actionBadge) {
          actionBadge.textContent = 'เปลี่ยนรอบ';
          actionBadge.className = 'slot-checker-action-badge px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold whitespace-nowrap shadow-2xs transition';
        }
        btn.className = "w-full min-h-[44px] px-3.5 py-2 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/70 active:bg-emerald-200 text-emerald-900 dark:text-emerald-100 border-2 border-solid border-emerald-500 dark:border-emerald-500 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-between transition shadow-xs cursor-pointer group";
      } else {
        if (hiddenInput) hiddenInput.value = "";
        if (display) display.innerHTML = `🕒 เลือกรอบเวลา (เช็คคิวว่าง)`;
        if (sub) sub.innerHTML = `คลิกเพื่อดูและเลือกรอบเวลาที่ว่าง`;
        if (actionBadge) {
          actionBadge.textContent = 'เช็คคิวว่าง';
          actionBadge.className = 'slot-checker-action-badge px-2.5 py-1 bg-herbal-700 hover:bg-herbal-800 text-white rounded-lg text-xs font-bold whitespace-nowrap shadow-2xs transition';
        }
        btn.className = "w-full min-h-[44px] px-3.5 py-2 bg-herbal-50 dark:bg-emerald-950/40 hover:bg-herbal-100 dark:hover:bg-emerald-900/60 active:bg-herbal-200 text-herbal-900 dark:text-emerald-200 border-2 border-dashed border-herbal-400 dark:border-emerald-600 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-between transition shadow-xs cursor-pointer group";
      }
    }

    function onDateChanged(mode, userInitiated = false) {
      const dateInput = document.getElementById(`${mode}-book-date`);
      if (!dateInput) return;
      const dateVal = dateInput.value;
      if (!dateVal) return;

      const holCheck = checkDateHoliday(dateVal);

      if (holCheck.isClosed) {
        updateSelectedSlotButtonUI(mode, "");
        showToast(`${holCheck.title} - กรุณาเลือกวันอื่น`, "warning");
        if (userInitiated) {
          openHolidayAlertModal(holCheck, dateVal);
        }
        return;
      }

      updateSelectedSlotButtonUI(mode, "");
      populateAssistantsDropdown("new-assistant-select");
    }

    let isSubmittingBooking = false;

    
    function resetBookingForm(mode = 'new') {
      const form = document.getElementById(`form-booking-${mode}`);
      if (form) {
        try { form.reset(); } catch(e) {}
      }

      // Reset text inputs
      const nameEl = document.getElementById(`${mode}-patient-name`);
      if (nameEl) nameEl.value = "";
      const hnEl = document.getElementById(`${mode}-citizen-hn`);
      if (hnEl) hnEl.value = "";
      const phoneEl = document.getElementById(`${mode}-phone`);
      if (phoneEl) phoneEl.value = "";

      // Reset Medical Scheme
      const schemeEl = document.getElementById(`${mode}-medicalScheme`);
      if (schemeEl) schemeEl.value = "บัตรทอง";
      const schemeOtherCont = document.getElementById(`${mode}-medicalScheme-other-container`);
      if (schemeOtherCont) schemeOtherCont.classList.add("hidden");
      const schemeOtherInput = document.getElementById(`${mode}-medicalScheme-other`);
      if (schemeOtherInput) schemeOtherInput.value = "";

      // Reset Date to todayStr
      const dateEl = document.getElementById(`${mode}-book-date`);
      if (dateEl) dateEl.value = todayStr;

      // Reset Time Slot Hidden Input and Display UI Button
      const slotEl = document.getElementById(`${mode}-time-slot`);
      if (slotEl) slotEl.value = "";
      if (typeof updateSelectedSlotButtonUI === 'function') {
        updateSelectedSlotButtonUI(mode, "");
      }

      // Reset Main Services (Select first radio)
      const mainRadios = document.querySelectorAll(`#main-services-booking-container input[name='mainService']`);
      mainRadios.forEach((rb, idx) => {
        rb.checked = (idx === 0);
      });

      // Reset Extra Services (Uncheck all)
      const extraCbs = document.querySelectorAll(`#new-extra-services-container input[name='extraService']`);
      extraCbs.forEach(cb => {
        cb.checked = false;
      });

      // Reset Staff Quick Chip & Assistant Dropdown to fresh default (female)
      if (typeof selectQuickChip === 'function') {
        selectQuickChip('female');
      }

      const asstSel = document.getElementById(`${mode}-assistant-select`);
      if (asstSel) asstSel.value = "female";

      const hint = document.getElementById("staff-selection-hint");
      if (hint) hint.textContent = "👩 ขอผู้ช่วยแพทย์หญิง";

      document.querySelectorAll(".staff-avatar-chip").forEach(el => {
        el.classList.remove("border-herbal-600", "bg-herbal-50", "ring-2", "ring-herbal-400", "text-herbal-900", "font-bold", "shadow-xs");
        el.classList.add("border-slate-200", "bg-white", "text-slate-700", "font-medium");
      });

      // Refresh slot counts & availability on date
      if (typeof onDateChanged === 'function') {
        onDateChanged(mode);
      }
    }

    async function handleBookingSubmit(e, mode) {
      e.preventDefault();
      if (isSubmittingBooking) return;

      const form = e.target;
      const submitBtn = form.querySelector("button[type='submit']");
      const originalBtnHtml = submitBtn ? submitBtn.innerHTML : "";

      const formData = new FormData(form);
      const patientName = formData.get("patientName")?.trim();
      const citizenOrHn = formData.get("citizenOrHn")?.trim() || "-";
      const phone = formData.get("phone")?.trim() || "-";
      const medicalScheme = getMedicalSchemeFromUi("new");
      const bookDate = formData.get("bookDate");
      const timeSlot = formData.get("timeSlot");
      const mainService = formData.get("mainService") || "";
      const assistantId = formData.get("assistantId");

      const selectedExtras = [];
      form.querySelectorAll("input[name='extraService']:checked").forEach(cb => {
        selectedExtras.push(cb.value);
      });

      if (!mainService && selectedExtras.length === 0) {
        showToast("กรุณาเลือกหัตถการหลัก หรือบริการเสริมอย่างน้อย 1 รายการ", "warning");
        return;
      }

      if (!bookDate) {
        showToast("กรุณาเลือกวันที่ต้องการนัดหมาย", "warning");
        return;
      }

      if (!timeSlot) {
        showToast("กรุณาคลิกปุ่ม 'เช็คคิวว่าง' เพื่อเลือกรอบเวลาที่ต้องการนัดหมาย", "warning");
        openSlotChecker(mode || 'new');
        return;
      }

      // Check Holiday & Closed Status
      const holCheck = checkDateHoliday(bookDate);
      if (holCheck.isClosed) {
        openHolidayAlertModal(holCheck, bookDate);
        showToast(`ไม่สามารถจองคิวได้: ${holCheck.title}`, "error");
        return;
      }

      // Check capacity limit
      const slotConf = getSlotConfigForDate(bookDate, timeSlot);
      if (slotConf && !slotConf.enabled) {
        openSlotFullAlertModal(timeSlot, `รอบเวลา ${formatCleanTime(timeSlot)} ปิดให้บริการในวันนี้`, "รอบเวลานี้ปิดรับนัดหมายตามการตั้งค่าของคลินิก");
        showToast(`รอบเวลา ${formatCleanTime(timeSlot)} ปิดให้บริการ กรุณาเลือกรอบอื่น`, "error");
        return;
      }

      const requiresTwoSlots = selectedExtras.some(extraName => {
        const svc = extraServicesList.find(s => s.name === extraName);
        return svc && svc.twoSlots;
      });

      const slotsList = getSlotsForDate(bookDate);
      const slotsOccupied = [timeSlot];

      if (requiresTwoSlots) {
        const nextSlot = getNextSlot(timeSlot, slotsList);
        if (!nextSlot) {
          showToast(`รอบเวลานี้เป็นรอบสุดท้ายของวัน ไม่สามารถเลือกหัตถการที่ใช้เวลา 2 รอบเวลาได้`, "error");
          return;
        }

        const nextConf = getSlotConfigForDate(bookDate, nextSlot);
        const nextBookedCount = appointments.filter(a => a.bookDate === bookDate && a.slotsOccupied && a.slotsOccupied.includes(nextSlot)).length;
        if (nextBookedCount >= nextConf.max) {
          showToast(`รอบเวลาต่อเนื่อง (${formatTimeLabel(nextSlot)}) เต็มแล้ว ไม่สามารถจองหัตถการ 2 รอบเวลาได้`, "error");
          return;
        }

        slotsOccupied.push(nextSlot);
      }

      // Assistant Assignment & Conflict Validation
      let assignedAssistantId = assistantId || "auto";
      let assignedNick = "ไม่ระบุ";

      if (assignedAssistantId === "female") {
        assignedNick = "ไม่ระบุ (ขอผู้หญิง)";
      } else if (assignedAssistantId === "male") {
        assignedNick = "ไม่ระบุ (ขอผู้ชาย)";
      } else if (assignedAssistantId !== "auto") {
        const asst = assistants.find(a => a.id === assignedAssistantId);
        assignedNick = asst ? (asst.nickname || asst.name) : assignedAssistantId;
      }

      const conflictCheck = checkAssistantBookingConflict({
        assistantId: assignedAssistantId,
        bookDate,
        timeSlot,
        slotsOccupied,
        requiresTwoSlots,
        patientName
      });

      if (conflictCheck && conflictCheck.hasConflict) {
        showAssistantConflictModal(conflictCheck, timeSlot, bookDate);
        return;
      }

      // Default fallback if auto
      if (assignedAssistantId === "auto") {
        const genderAvail = getGenderAvailability(bookDate, timeSlot, requiresTwoSlots);
        if (genderAvail.femaleAvailable) {
          assignedAssistantId = "female";
          assignedNick = "ไม่ระบุ (ขอผู้หญิง)";
        } else if (genderAvail.maleAvailable) {
          assignedAssistantId = "male";
          assignedNick = "ไม่ระบุ (ขอผู้ชาย)";
        }
      }

      // Lock submit button
      isSubmittingBooking = true;
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.classList.add("opacity-70", "cursor-not-allowed");
        submitBtn.innerHTML = `
          <span class="inline-block animate-spin mr-2">⏳</span> กำลังบันทึกคิวนัดหมาย...
        `;
      }

      try {
        // Create new Appointment Record
        const dev = detectClientDevice();
        const nowIso = new Date().toISOString();
        const bookedBy = currentUser ? `${currentUser.name} (${getRoleBadgeLabel(currentUser.role)})` : "คนไข้ / ออนไลน์";

        const effectiveMainService = mainService || "บริการเสริม";
        const serviceSummaryLabel = mainService || (selectedExtras.length > 0 ? `บริการเสริม (${selectedExtras.join(', ')})` : 'บริการเสริม');

        const newAppointment = {
          id: "APT-" + Date.now(),
          patientName,
          citizenOrHn,
          phone,
          medicalScheme,
          bookDate,
          timeSlot,
          mainService: effectiveMainService,
          extraServices: selectedExtras,
          assistantId: assignedAssistantId,
          assistantNick: assignedNick,
          status: "⚪ ว่าง",
          slotsOccupied,
          createdAt: nowIso,
          statusHistory: [
            {
              status: "⚪ ว่าง",
              timestamp: nowIso,
              durationMin: 0,
              by: bookedBy
            }
          ],
          timings: {
            waitExamMin: 0,
            waitRoomMin: 0,
            treatmentMin: 0,
            totalStayMin: 0
          },
          clientIp: currentClientIp,
          userAgent: dev.deviceText
        };

        // Save to Supabase (if connected)
        if (supabaseClient) {
          const payload = mapAppointmentToSupabase(newAppointment);
          const { error } = await supabaseClient.from("appointments").insert([payload]);
          if (error) {
            console.warn("Supabase insert with medical_scheme failed, attempting fallback without medical_scheme:", error);
            const fallbackPayload = { ...payload };
            delete fallbackPayload.medical_scheme;
            const { error: fallbackError } = await supabaseClient.from("appointments").insert([fallbackPayload]);
            if (fallbackError) {
              console.error("Supabase insert error:", fallbackError);
              showToast("❌ บันทึกลงฐานข้อมูล Cloud ไม่สำเร็จ: " + (fallbackError.message || "กรุณาตรวจสอบการเชื่อมต่อ"), "error");
              return;
            }
          }
        }

        // Add to in-memory store and offline cache
        appointments.push(newAppointment);
        try {
          localStorage.setItem("ttm_appointments", JSON.stringify(appointments));
          // Store in current browser session so Guest patient receives alerts for their own booking
          const existingIds = JSON.parse(sessionStorage.getItem("ttm_my_booking_ids") || "[]");
          if (!existingIds.includes(newAppointment.id)) existingIds.push(newAppointment.id);
          sessionStorage.setItem("ttm_my_booking_ids", JSON.stringify(existingIds));
          sessionStorage.setItem("ttm_guest_phone", phone);
        } catch(e) {}

        // 1. Trigger Notification for Staff & Admin operational queue
        addNotification({
          type: "NEW_BOOKING",
          title: `📅 จองคิวใหม่: คุณ ${patientName}`,
          message: `นัดหมายวันที่ ${formatThaiDateShort(bookDate)} รอบ ${formatTimeLabel(timeSlot)} (${serviceSummaryLabel}) [ผู้ช่วยฯ: ${assignedNick}]`,
          patientName,
          patientPhone: phone,
          patientUserId: currentUser ? currentUser.id : "",
          appointmentId: newAppointment.id,
          targetAssistantId: assignedAssistantId,
          targetAssistantNick: assignedNick,
          targetRole: "staff",
          metadata: {
            bookDate,
            timeSlot,
            mainService: effectiveMainService,
            assistantNick: assignedNick,
            patientPhone: phone,
            patientUserId: currentUser ? currentUser.id : ""
          }
        });

        // 2. Trigger direct Notification for assigned Assistant if specifically chosen
        if (assignedAssistantId && assignedAssistantId !== "auto" && assignedAssistantId !== "female" && assignedAssistantId !== "male") {
          addNotification({
            type: "ASSISTANT_ASSIGNED",
            title: `👤 มีคนไข้นัดเจาะจงตัวคุณ: คุณ ${patientName}`,
            message: `คนไข้ระบุเลือกคุณ (${assignedNick}) วันที่ ${formatThaiDateShort(bookDate)} รอบ ${formatTimeLabel(timeSlot)} (${serviceSummaryLabel})`,
            patientName,
            patientPhone: phone,
            patientUserId: currentUser ? currentUser.id : "",
            appointmentId: newAppointment.id,
            targetAssistantId: assignedAssistantId,
            targetAssistantNick: assignedNick,
            targetRole: "staff"
          });
        }

        // 3. Trigger confirmation notification for the Patient (Owner only)
        addNotification({
          type: "NEW_BOOKING",
          title: `📅 ยืนยันการจองคิวสำเร็จ`,
          message: `นัดหมายของคุณวันที่ ${formatThaiDateShort(bookDate)} รอบ ${formatTimeLabel(timeSlot)} (${serviceSummaryLabel}) [ผู้ช่วยฯ: ${assignedNick}] ได้รับการบันทึกแล้ว`,
          patientName,
          patientPhone: phone,
          patientUserId: currentUser ? currentUser.id : "",
          appointmentId: newAppointment.id,
          targetAssistantId: assignedAssistantId,
          targetAssistantNick: assignedNick,
          targetRole: "user"
        });

        await logActivity("BOOK_QUEUE", `จองคิวใหม่: ${patientName} (${formatTimeLabel(timeSlot)}) วันที่ ${bookDate} หัตถการ: ${serviceSummaryLabel}`, {
          appointmentId: newAppointment.id,
          patientName,
          bookDate,
          timeSlot,
          mainService: effectiveMainService,
          assistantNick: assignedNick,
          extraServices: selectedExtras,
          clientIp: currentClientIp,
          device: dev.deviceText
        });

        showToast(`จองคิวนัดหมายสำเร็จ: ${patientName} (${formatTimeLabel(timeSlot)})`, "success");
        resetBookingForm(mode);

        if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'staff')) {
          renderDeskQueue();
          renderStatsAndShare();
        }

        // Open booking summary slip popup with print PDF & image download options
        showBookingSummaryModal(newAppointment);

      } catch (err) {
        console.error("Booking error:", err);
        showToast("เกิดข้อผิดพลาดในการจองคิว: " + (err.message || "กรุณาลองใหม่อีกครั้ง"), "error");
      } finally {
        isSubmittingBooking = false;
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.classList.remove("opacity-70", "cursor-not-allowed");
          submitBtn.innerHTML = originalBtnHtml;
        }
      }
    }



    function updateDeskCloudSyncBadge() {
      const cloudBadge = document.getElementById("desk-cloud-sync-badge");
      const cloudText = document.getElementById("desk-cloud-sync-text");
      if (!cloudBadge || !cloudText) return;

      if (supabaseClient) {
        cloudBadge.className = "text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/80 flex items-center gap-1.5 cursor-pointer shadow-2xs hover:bg-emerald-100 transition";
        cloudText.textContent = `☁️ Cloud: ${appointments.length} คิว`;
      } else {
        cloudBadge.className = "text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800/80 flex items-center gap-1.5 cursor-pointer shadow-2xs hover:bg-amber-100 transition";
        cloudText.textContent = `💾 ออฟไลน์: ${appointments.length} คิว`;
      }
    }

    async function refreshDeskFromCloud() {
      const icon = document.getElementById("icon-desk-refresh");
      if (icon) icon.classList.add("animate-spin");
      const cloudText = document.getElementById("desk-cloud-sync-text");
      if (cloudText) cloudText.textContent = "กำลังดึงข้อมูล...";

      showToast("กำลังดึงข้อมูลล่าสุดจาก Supabase Cloud...", "info");
      await loadAllDataFromSupabase();

      if (icon) icon.classList.remove("animate-spin");
      updateDeskCloudSyncBadge();
      showToast(`ดึงข้อมูลล่าสุดเรียบร้อย (พบคิวนัดหมายทั้งหมด ${appointments.length} รายการ)`, "success");
    }

    function getEmptyDeskStateHtml(isTable = false) {
      const startDate = document.getElementById("desk-filter-date-start")?.value;
      const endDate = document.getElementById("desk-filter-date-end")?.value;
      const totalInDb = appointments.length;

      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const monthPrefix = `${y}-${m}`;
      const thisMonthCount = appointments.filter(a => a.bookDate && a.bookDate.startsWith(monthPrefix)).length;

      // Find latest appointment date in database
      let latestDateText = "-";
      if (appointments.length > 0) {
        const sorted = [...appointments].sort((a,b) => (b.bookDate || "").localeCompare(a.bookDate || ""));
        latestDateText = formatThaiDateShort(sorted[0]?.bookDate);
      }

      let dateRangeLabel = "วันที่เลือก";
      if (startDate && endDate) {
        dateRangeLabel = (startDate === endDate) ? `วันที่ ${formatThaiDateShort(startDate)}` : `ช่วง ${formatThaiDateShort(startDate)} - ${formatThaiDateShort(endDate)}`;
      }

      const innerHtml = `
        <div class="py-10 px-4 text-center max-w-lg mx-auto space-y-3">
          <div class="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto text-xl shadow-inner border border-amber-200 dark:border-amber-800">
            <i data-lucide="calendar-x" class="w-6 h-6"></i>
          </div>
          <div>
            <h4 class="font-bold text-sm sm:text-base text-slate-800 dark:text-slate-100">ไม่พบคิวนัดหมายใน${dateRangeLabel}</h4>
            ${totalInDb > 0 ? `
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
                ระบบเชื่อมต่อ Cloud ดึงข้อมูลเรียบร้อย (มีคิวทั้งหมด <strong class="text-slate-800 dark:text-slate-200 font-bold">${totalInDb} รายการ</strong> ในระบบ, มีคิวล่าสุดวันที่ ${latestDateText})
              </p>
            ` : `
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
                ยังไม่มีข้อมูลคิวนัดหมายในระบบ หรือกำลังเชื่อมต่อฐานข้อมูล
              </p>
            `}
          </div>

          <div class="flex flex-wrap items-center justify-center gap-2 pt-1">
            ${totalInDb > 0 ? `
              <button type="button" onclick="setDeskDatePreset('month')" class="px-3 py-1.5 rounded-lg bg-herbal-700 hover:bg-herbal-600 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer">
                <i data-lucide="calendar" class="w-3.5 h-3.5"></i>
                <span>ดูคิวเดือนนี้ (${thisMonthCount} คิว)</span>
              </button>
              <button type="button" onclick="setDeskDatePreset('all')" class="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer">
                <i data-lucide="list-filter" class="w-3.5 h-3.5"></i>
                <span>แสดงคิวทั้งหมด (${totalInDb} คิว)</span>
              </button>
            ` : `
              <button type="button" onclick="switchTab('new')" class="px-3.5 py-1.5 rounded-lg bg-herbal-700 hover:bg-herbal-600 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer">
                <i data-lucide="calendar-plus" class="w-3.5 h-3.5"></i>
                <span>+ เพิ่มคิวนัดหมายแรก</span>
              </button>
            `}
            <button type="button" onclick="refreshDeskFromCloud()" class="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer">
              <i data-lucide="refresh-cw" class="w-3.5 h-3.5 text-slate-500"></i>
              <span>ดึงข้อมูล Cloud ซ้ำ</span>
            </button>
          </div>
        </div>
      `;

      if (isTable) {
        return `<tr><td colspan="6">${innerHtml}</td></tr>`;
      }
      return `<div class="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-750 shadow-xs p-4">${innerHtml}</div>`;
    }

    /* =========================================================================
       MEDICAL TREATMENT SCHEME (สิทธิ์การรักษา) HELPER FUNCTIONS
       ========================================================================= */
    const STANDARD_MEDICAL_SCHEMES = ["บัตรทอง", "ประกันสังคม", "ข้าราชการ", "รัฐวิสาหกิจ", "ชำระเงินเอง"];

    function handleMedicalSchemeChange(context) {
      let selectId = "new-medicalScheme";
      let containerId = "new-medicalScheme-other-container";
      let inputId = "new-medicalScheme-other";

      if (context === "patient") {
        selectId = "edit-patient-scheme";
        containerId = "edit-patient-scheme-other-container";
        inputId = "edit-patient-scheme-other";
      } else if (context === "services") {
        selectId = "edit-svc-medical-scheme";
        containerId = "edit-svc-scheme-other-container";
        inputId = "edit-svc-scheme-other";
      }

      const selectEl = document.getElementById(selectId);
      const containerEl = document.getElementById(containerId);
      const inputEl = document.getElementById(inputId);

      if (!selectEl || !containerEl) return;

      if (selectEl.value === "อื่นๆ") {
        containerEl.classList.remove("hidden");
        if (inputEl) {
          inputEl.focus();
        }
      } else {
        containerEl.classList.add("hidden");
        if (inputEl) inputEl.value = "";
      }
    }

    function setMedicalSchemeInUi(context, schemeValue) {
      let selectId = "new-medicalScheme";
      let containerId = "new-medicalScheme-other-container";
      let inputId = "new-medicalScheme-other";

      if (context === "patient") {
        selectId = "edit-patient-scheme";
        containerId = "edit-patient-scheme-other-container";
        inputId = "edit-patient-scheme-other";
      } else if (context === "services") {
        selectId = "edit-svc-medical-scheme";
        containerId = "edit-svc-scheme-other-container";
        inputId = "edit-svc-scheme-other";
      }

      const selectEl = document.getElementById(selectId);
      const containerEl = document.getElementById(containerId);
      const inputEl = document.getElementById(inputId);

      if (!selectEl) return;

      let sc = (schemeValue || "บัตรทอง").trim();
      if (sc === "ข้าราชการ/เบิกตรง" || sc === "ข้าราชการ / รัฐวิสาหกิจ / เบิกได้") {
        sc = "ข้าราชการ";
      }

      if (STANDARD_MEDICAL_SCHEMES.includes(sc)) {
        selectEl.value = sc;
        if (containerEl) containerEl.classList.add("hidden");
        if (inputEl) inputEl.value = "";
      } else {
        selectEl.value = "อื่นๆ";
        if (containerEl) containerEl.classList.remove("hidden");
        if (inputEl) {
          let customText = sc.replace(/^อื่นๆ:?\s*/i, "").trim();
          inputEl.value = customText === "อื่นๆ" ? "" : customText;
        }
      }
    }

    function getMedicalSchemeFromUi(context) {
      let selectId = "new-medicalScheme";
      let inputId = "new-medicalScheme-other";

      if (context === "patient") {
        selectId = "edit-patient-scheme";
        inputId = "edit-patient-scheme-other";
      } else if (context === "services") {
        selectId = "edit-svc-medical-scheme";
        inputId = "edit-svc-scheme-other";
      }

      const selectEl = document.getElementById(selectId);
      const inputEl = document.getElementById(inputId);

      if (!selectEl) return "บัตรทอง";
      const selVal = (selectEl.value || "").trim();

      if (selVal === "อื่นๆ") {
        const otherVal = inputEl ? inputEl.value.trim() : "";
        if (!otherVal) return "อื่นๆ";
        return otherVal.startsWith("อื่นๆ") ? otherVal : `อื่นๆ: ${otherVal}`;
      }
      return selVal || "บัตรทอง";
    }

    function getMedicalSchemeBadgeHtml(scheme, isCompact = true) {
      const sc = (scheme || "บัตรทอง").trim();
      let label = "บัตรทอง";
      let fullTitle = "สิทธิ์: บัตรทอง (UC / 30 บาท)";
      let badgeStyle = "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-800";

      if (sc.includes("ประกันสังคม") || sc === "ปกส." || sc === "SSS") {
        label = "ปกส.";
        fullTitle = "สิทธิ์: ประกันสังคม (SSS)";
        badgeStyle = "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/80 dark:text-blue-300 dark:border-blue-800";
      } else if (sc.includes("รัฐวิสาหกิจ") || sc === "SOE") {
        label = "รัฐวิสาหกิจ";
        fullTitle = "สิทธิ์: รัฐวิสาหกิจ";
        badgeStyle = "bg-indigo-50 text-indigo-800 border-indigo-200 dark:bg-indigo-950/80 dark:text-indigo-300 dark:border-indigo-800";
      } else if (sc.includes("ข้าราชการ") || sc.includes("เบิก") || sc.includes("ขรก") || sc === "OFC") {
        label = "ขรก./เบิกได้";
        fullTitle = "สิทธิ์: ข้าราชการ / เบิกตรง";
        badgeStyle = "bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950/80 dark:text-purple-300 dark:border-purple-800";
      } else if (sc.includes("ชำระ") || sc.includes("จ่าย") || sc.includes("เงินสด") || sc === "Self-pay" || sc === "Self-Pay") {
        label = "ชำระเอง";
        fullTitle = "สิทธิ์: ชำระเงินเอง (Self-Pay)";
        badgeStyle = "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800";
      } else if (sc === "บัตรทอง" || sc === "UC" || sc === "30 บาท") {
        label = "บัตรทอง";
        fullTitle = "สิทธิ์: บัตรทอง (UC / 30 บาท)";
        badgeStyle = "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-800";
      } else {
        let cleanText = sc.replace(/^อื่นๆ:?\s*/i, "").trim();
        if (!cleanText) cleanText = "อื่นๆ";
        label = cleanText.length > 12 ? cleanText.substring(0, 10) + ".." : cleanText;
        fullTitle = `สิทธิ์: ${cleanText}`;
        badgeStyle = "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
      }

      const paddingClass = isCompact ? "px-1.5 py-0.2 text-[10px]" : "px-2 py-0.5 text-[11px]";
      return `<span class="inline-flex items-center font-extrabold rounded border shadow-2xs ${paddingClass} ${badgeStyle} shrink-0" title="${escapeHtml(fullTitle)}">${escapeHtml(label)}</span>`;
    }

    function openEditPatientModalFromApt(aptId) {
      const isStaffOrAdmin = currentUser && (currentUser.role === 'staff' || currentUser.role === 'admin');
      if (!isStaffOrAdmin) {
        showToast("🔒 เฉพาะเจ้าหน้าที่และแอดมินเท่านั้นที่สามารถแก้ไขข้อมูลคนไข้ได้", "warning");
        return;
      }
      const apt = appointments.find(a => a.id === aptId);
      if (!apt) return;

      const hnTrimmed = (apt.citizenOrHn || "").trim();
      const phoneTrimmed = (apt.phone || "").trim().replace(/[^0-9]/g, "");
      const nameTrimmed = (apt.patientName || "").trim().toLowerCase();
      let patientKey = "";
      if (hnTrimmed && hnTrimmed !== "-") patientKey = "HN_" + hnTrimmed.toLowerCase();
      else if (phoneTrimmed) patientKey = "TEL_" + phoneTrimmed;
      else patientKey = "NAME_" + nameTrimmed;

      const allPatients = getUniquePatients();
      let patient = allPatients.find(p => p.key === patientKey);
      if (!patient) {
        patient = {
          key: patientKey,
          patientName: apt.patientName,
          citizenOrHn: apt.citizenOrHn,
          phone: apt.phone,
          medicalScheme: apt.medicalScheme || "บัตรทอง",
          appointments: [apt]
        };
      }

      document.getElementById("edit-patient-key").value = patient.key;
      document.getElementById("edit-patient-name").value = patient.patientName || "";
      document.getElementById("edit-patient-hn").value = (patient.citizenOrHn && patient.citizenOrHn !== "-") ? patient.citizenOrHn : "";
      document.getElementById("edit-patient-phone").value = (patient.phone && patient.phone !== "-") ? patient.phone : "";
      setMedicalSchemeInUi("patient", apt.medicalScheme || patient.medicalScheme || "บัตรทอง");
      document.getElementById("edit-patient-apt-count").textContent = patient.appointments ? patient.appointments.length : 1;

      const modal = document.getElementById("modal-edit-patient");
      if (modal) modal.classList.remove("hidden");
      if (window.lucide) lucide.createIcons();
    }

    function setDeskDatePreset(preset) {
      const startEl = document.getElementById("desk-filter-date-start");
      const endEl = document.getElementById("desk-filter-date-end");
      if (!startEl || !endEl) return;

      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const d = String(now.getDate()).padStart(2, '0');
      const todayFormatted = `${y}-${m}-${d}`;

      // Reset preset buttons styling
      document.querySelectorAll(".desk-preset-btn").forEach(btn => {
        btn.className = "desk-preset-btn px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium transition cursor-pointer";
      });

      const activeBtn = document.getElementById(`preset-btn-${preset}`);
      if (activeBtn) {
        activeBtn.className = "desk-preset-btn px-2.5 py-1.5 rounded-lg bg-herbal-700 text-white font-bold transition shadow-xs cursor-pointer";
      }

      if (preset === 'today') {
        startEl.value = todayFormatted;
        endEl.value = todayFormatted;
      } else if (preset === 'tomorrow') {
        const tmr = new Date(now);
        tmr.setDate(tmr.getDate() + 1);
        const tmrFormatted = `${tmr.getFullYear()}-${String(tmr.getMonth() + 1).padStart(2, '0')}-${String(tmr.getDate()).padStart(2, '0')}`;
        startEl.value = tmrFormatted;
        endEl.value = tmrFormatted;
      } else if (preset === 'week') {
        const startWeek = new Date(now);
        startWeek.setDate(startWeek.getDate() - 7);
        const endWeek = new Date(now);
        endWeek.setDate(endWeek.getDate() + 7);
        startEl.value = `${startWeek.getFullYear()}-${String(startWeek.getMonth() + 1).padStart(2, '0')}-${String(startWeek.getDate()).padStart(2, '0')}`;
        endEl.value = `${endWeek.getFullYear()}-${String(endWeek.getMonth() + 1).padStart(2, '0')}-${String(endWeek.getDate()).padStart(2, '0')}`;
      } else if (preset === 'month') {
        startEl.value = `${y}-${m}-01`;
        const lastDay = new Date(y, now.getMonth() + 1, 0).getDate();
        endEl.value = `${y}-${m}-${String(lastDay).padStart(2, '0')}`;
      } else if (preset === 'all') {
        startEl.value = '';
        endEl.value = '';
      }

      renderDeskQueue();
    }

    let currentDeskViewMode = localStorage.getItem("ttm_desk_view_mode") || "table";

    function setDeskViewMode(mode) {
      currentDeskViewMode = mode;
      try { localStorage.setItem("ttm_desk_view_mode", mode); } catch(e) {}
      updateDeskViewSwitcherUI();
      renderDeskQueue();
    }

    function updateDeskViewSwitcherUI() {
      const modes = ["table", "kanban", "assistant", "compact", "rooms"];
      modes.forEach(m => {
        const btn = document.getElementById("btn-desk-view-" + m);
        if (btn) {
          if (m === currentDeskViewMode) {
            btn.className = "px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 bg-herbal-700 text-white shadow-xs";
          } else {
            btn.className = "px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center space-x-1.5 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white";
          }
        }
      });

      modes.forEach(m => {
        const container = document.getElementById("desk-view-container-" + m);
        if (container) {
          if (m === currentDeskViewMode) {
            container.classList.remove("hidden");
          } else {
            container.classList.add("hidden");
          }
        }
      });
    }


