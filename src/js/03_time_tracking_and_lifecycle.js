/**
 * Module 3: 03_time_tracking_and_lifecycle.js
 * Description: Patient Treatment Timer & Lifecycle Engine
 * Generated from lines 6539 to 7265 of original index.html
 */

    /* =========================================================================
       PATIENT LIFECYCLE & TIME TRACKING ENGINE (⏱️ ระบบจับเวลาและบันทึกสถานะ)
       ========================================================================= */

    let _memStatusHistories = null;
    let _memTreatmentTimings = null;

    function getMemStatusHistories() {
      if (_memStatusHistories === null) {
        try {
          _memStatusHistories = JSON.parse(localStorage.getItem("ttm_status_histories") || "{}");
        } catch(e) {
          _memStatusHistories = {};
        }
      }
      return _memStatusHistories;
    }

    function getMemTreatmentTimings() {
      if (_memTreatmentTimings === null) {
        try {
          _memTreatmentTimings = JSON.parse(localStorage.getItem("ttm_treatment_timings") || "{}");
        } catch(e) {
          _memTreatmentTimings = {};
        }
      }
      return _memTreatmentTimings;
    }

    let _saveHistoriesDebounce = null;
    function scheduleSaveStatusHistories() {
      if (_saveHistoriesDebounce) clearTimeout(_saveHistoriesDebounce);
      _saveHistoriesDebounce = setTimeout(() => {
        try {
          if (_memStatusHistories) {
            localStorage.setItem("ttm_status_histories", JSON.stringify(_memStatusHistories));
          }
        } catch(e) {}
      }, 300);
    }

    let _saveTimingsDebounce = null;
    function scheduleSaveTreatmentTimings() {
      if (_saveTimingsDebounce) clearTimeout(_saveTimingsDebounce);
      _saveTimingsDebounce = setTimeout(() => {
        try {
          if (_memTreatmentTimings) {
            localStorage.setItem("ttm_treatment_timings", JSON.stringify(_memTreatmentTimings));
          }
        } catch(e) {}
      }, 300);
    }

    function recordStatusTransition(apt, newStatus, userOrRole = "") {
      if (!apt) return;
      const nowIso = new Date().toISOString();
      const recordedBy = userOrRole || (currentUser ? `${currentUser.name} (${getRoleBadgeLabel(currentUser.role)})` : "เจ้าหน้าที่");

      // If entering massage treatment (🟣 ห้อง X), record exact treatment start time (real action timestamp)
      if (newStatus && (newStatus.startsWith("🟣") || (newStatus.startsWith("ห้อง") && !newStatus.startsWith("🔵")))) {
        apt.treatmentEndTime = null;
        if (!apt.treatmentStartTime || (apt.status && !apt.status.startsWith("🟣"))) {
          apt.treatmentStartTime = nowIso;
        }
      }

      // If ending massage treatment (🟢 กลับบ้าน, 🔴 ส่งต่อ), record exact treatment end time (real action timestamp)
      if (newStatus && (newStatus.includes("กลับบ้าน") || newStatus.includes("ส่งต่อ"))) {
        apt.treatmentEndTime = nowIso;
        if (!apt.treatmentStartTime) {
          const mEntry = (apt.statusHistory || []).find(h => (h.status || "").startsWith("🟣") || ((h.status || "").includes("ห้อง") && !(h.status || "").startsWith("🔵")));
          if (mEntry) apt.treatmentStartTime = mEntry.timestamp;
        }
      }

      if (!apt.statusHistory || !Array.isArray(apt.statusHistory) || apt.statusHistory.length === 0) {
        const savedHistories = getMemStatusHistories();
        if (savedHistories[apt.id] && Array.isArray(savedHistories[apt.id])) {
          apt.statusHistory = savedHistories[apt.id];
        }
      }

      if (!apt.statusHistory || apt.statusHistory.length === 0) {
        apt.statusHistory = [
          {
            status: apt.status || "⚪ ว่าง",
            timestamp: apt.createdAt || nowIso,
            durationMin: 0,
            by: "System"
          }
        ];
      }

      // Calculate elapsed minutes in previous status
      const lastEntry = apt.statusHistory[apt.statusHistory.length - 1];
      if (lastEntry && lastEntry.timestamp) {
        const diffMs = new Date(nowIso).getTime() - new Date(lastEntry.timestamp).getTime();
        lastEntry.durationMin = Math.max(0, Math.round(diffMs / 60000));
      }

      // Append new status history entry
      apt.statusHistory.push({
        status: newStatus,
        timestamp: nowIso,
        durationMin: 0,
        by: recordedBy
      });

      // Persist status history map to in-memory cache and debounce save to storage
      const savedHistories = getMemStatusHistories();
      savedHistories[apt.id] = apt.statusHistory;
      scheduleSaveStatusHistories();

      // Recalculate summary timings
      calculateAppointmentTimings(apt);

      // Determine rich status change title & message for assistant and staff
      let statusTitle = `🔄 อัปเดตสถานะ: คุณ ${apt.patientName}`;
      let statusMsg = `เปลี่ยนสถานะเป็น "${newStatus}" (รอบ ${formatTimeLabel(apt.timeSlot)}) โดย ${recordedBy}`;

      const cleanSt = (newStatus || "").replace("🔵 ", "").replace("🟣 ", "").trim();
      if (newStatus.startsWith("🟣")) {
        statusTitle = `🟣 เริ่มนวดในห้อง: คุณ ${apt.patientName}`;
        statusMsg = `คุณ ${apt.patientName} (รอบ ${formatTimeLabel(apt.timeSlot)}) กำลังทำหัตถการใน "${cleanSt}" (เริ่มนับเวลานวด)`;
      } else if (newStatus.startsWith("🔵") && cleanSt.startsWith("ห้อง")) {
        statusTitle = `🔵 คนไข้รอเข้าห้อง: คุณ ${apt.patientName}`;
        statusMsg = `คุณ ${apt.patientName} (รอบ ${formatTimeLabel(apt.timeSlot)}) จัดสรรเข้าสู่ "${newStatus}" แล้ว (รอนักกายภาพ/ผู้ช่วยฯ เริ่มนวด)`;
      } else if (cleanSt.includes("รอนวด") || cleanSt.includes("ตรวจแล้ว")) {
        statusTitle = `🔵 คนไข้ตรวจเสร็จ-รอนวด: คุณ ${apt.patientName}`;
        statusMsg = `คุณ ${apt.patientName} (รอบ ${formatTimeLabel(apt.timeSlot)}) อยู่ในสถานะ "${newStatus}" โปรดเตรียมห้อง/เตียง`;
      } else if (cleanSt.includes("รอตรวจ")) {
        statusTitle = `🟡 คนไข้เช็คอินรอตรวจ: คุณ ${apt.patientName}`;
        statusMsg = `คุณ ${apt.patientName} (รอบ ${formatTimeLabel(apt.timeSlot)}) มาถึงคลินิกแล้ว อยู่ระหว่างรอแพทย์ตรวจ`;
      } else if (cleanSt.includes("กลับบ้าน")) {
        statusTitle = `🟢 เสร็จสิ้นการรักษา: คุณ ${apt.patientName}`;
        statusMsg = `คุณ ${apt.patientName} (รอบ ${formatTimeLabel(apt.timeSlot)}) รับบริการเสร็จสิ้นและบันทึกกลับบ้านแล้ว`;
      }

      // Trigger automatic Notification for status change (Delivered strictly to assigned assistant, patient owner, and admin)
      addNotification({
        type: "STATUS_CHANGED",
        title: statusTitle,
        message: statusMsg,
        patientName: apt.patientName,
        patientPhone: apt.phone || "",
        patientUserId: apt.userId || apt.patientUserId || "",
        appointmentId: apt.id,
        targetAssistantId: apt.assistantId,
        targetAssistantNick: apt.assistantNick,
        targetRole: "staff",
        metadata: {
          bookDate: apt.bookDate,
          timeSlot: apt.timeSlot,
          status: newStatus,
          patientPhone: apt.phone || "",
          patientUserId: apt.userId || apt.patientUserId || ""
        }
      });
    }

    function formatTimeClock(isoString) {
      if (!isoString) return "-";
      try {
        const d = new Date(isoString);
        return d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.';
      } catch(e) {
        return "-";
      }
    }

    function formatTimeRange(startIso, endIso) {
      if (!startIso) return "⚪ ยังไม่เริ่ม";
      const startStr = formatTimeClock(startIso);
      if (endIso) {
        const endStr = formatTimeClock(endIso);
        return `${startStr} - ${endStr}`;
      }
      return `เริ่ม: ${startStr}`;
    }

    function formatElapsedDuration(minutes) {
      if (!minutes || minutes < 0) return "0 นาที";
      if (minutes < 60) return `${minutes} นาที`;
      const hrs = Math.floor(minutes / 60);
      const rem = minutes % 60;
      return rem > 0 ? `${hrs} ชม. ${rem} นาที` : `${hrs} ชม.`;
    }

    function formatRelativeTime(isoString) {
      if (!isoString) return "-";
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffMin = Math.floor(diffMs / 60000);
      if (diffMin < 1) return "เมื่อสักครู่";
      if (diffMin < 60) return `${diffMin} นาทีที่แล้ว`;
      const diffHrs = Math.floor(diffMin / 60);
      if (diffHrs < 24) return `${diffHrs} ชม. ที่แล้ว`;
      return new Date(isoString).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    }

    function ensureAppointmentStatusHistory(apt) {
      if (!apt) return [];

      if (!apt.statusHistory || !Array.isArray(apt.statusHistory) || apt.statusHistory.length === 0) {
        const savedHistories = getMemStatusHistories();
        if (savedHistories[apt.id] && Array.isArray(savedHistories[apt.id]) && savedHistories[apt.id].length > 0) {
          apt.statusHistory = savedHistories[apt.id];
        }
      }

      const history = apt.statusHistory || [];
      const status = apt.status || "⚪ ว่าง";

      // Check if we already have real history entries
      if (history.length >= 1) {
        const hasCurrent = history.some(h => h.status === status || (status.startsWith("🟣") && (h.status || "").startsWith("🟣")));
        const hasMassage = history.some(h => (h.status || "").startsWith("🟣") || ((h.status || "").includes("ห้อง") && !(h.status || "").startsWith("🔵") && !(h.status || "").includes("รอ")));
        
        // If we have at least 1 real entry matching current state or multiple real entries, preserve them!
        if (history.length >= 2 || hasCurrent || hasMassage || status === "⚪ ว่าง") {
          // Ensure treatmentStartTime is aligned if massage entry exists
          if (!apt.treatmentStartTime && hasMassage) {
            const mEntry = history.find(h => (h.status || "").startsWith("🟣") || ((h.status || "").includes("ห้อง") && !(h.status || "").startsWith("🔵") && !(h.status || "").includes("รอ")));
            if (mEntry) apt.treatmentStartTime = mEntry.timestamp;
          }
          return history;
        }
      }

      // If history is empty and needs synthesis (e.g., initial display of an active or completed queue):
      // Anchor on REAL timestamps (apt.treatmentStartTime or current time) rather than slot!
      const nowMs = Date.now();
      const dateStr = apt.bookDate || todayStr;
      const slotStr = apt.timeSlot || "08:30";
      const cleanSlot = slotStr.replace('.', ':');
      const [h, m] = cleanSlot.includes(':') ? cleanSlot.split(':').map(Number) : [8, 30];

      let baseSlotDate = new Date(`${dateStr}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00+07:00`);
      if (isNaN(baseSlotDate.getTime())) {
        baseSlotDate = new Date(nowMs - 3600000);
      }

      const is2Hrs = (apt.slotsOccupied && apt.slotsOccupied.length > 1);
      const treatDurationMin = is2Hrs ? 120 : 60;
      const examDurationMin = 15;
      const waitRoomDurationMin = 10;

      const cleanSt = status.replace("🔵 ", "").replace("🟣 ", "").trim();
      const roomMatch = cleanSt.match(/^(?:รอ)?(ห้อง\s*[1-5])/);
      const roomName = roomMatch ? roomMatch[1].replace(/\s+/g, ' ') : "ห้องหัตถการ";

      // Use real treatmentStartTime if available, otherwise if currently in treatment use Date.now()
      let realTreatmentStartMs;
      if (apt.treatmentStartTime) {
        realTreatmentStartMs = new Date(apt.treatmentStartTime).getTime();
      } else if (status.startsWith("🟣")) {
        realTreatmentStartMs = nowMs;
        apt.treatmentStartTime = new Date(realTreatmentStartMs).toISOString();
      } else {
        realTreatmentStartMs = baseSlotDate.getTime() + (examDurationMin + waitRoomDurationMin) * 60000;
      }

      const realTreatmentEndMs = apt.treatmentEndTime 
        ? new Date(apt.treatmentEndTime).getTime() 
        : (realTreatmentStartMs + treatDurationMin * 60000);

      const t2 = new Date(realTreatmentStartMs); // In room / Treatment start (REAL TIMESTAMP)
      const t1 = new Date(realTreatmentStartMs - waitRoomDurationMin * 60000); // Exam done / Wait room
      const t0 = new Date(t1.getTime() - examDurationMin * 60000); // Check-in / รอตรวจ
      const t3 = new Date(realTreatmentEndMs); // Finish / Home

      if (status.includes("กลับบ้าน") || status.includes("ส่งต่อ")) {
        apt.statusHistory = [
          { status: "🟡 รอตรวจ", timestamp: t0.toISOString(), durationMin: examDurationMin, by: "จุดคัดกรอง / ซักประวัติ" },
          { status: `🔵 รอ${roomName}`, timestamp: t1.toISOString(), durationMin: waitRoomDurationMin, by: "พยาบาล / ผู้จัดสรรคิว" },
          { status: `🟣 ${roomName}`, timestamp: t2.toISOString(), durationMin: Math.max(0, Math.round((realTreatmentEndMs - realTreatmentStartMs) / 60000)), by: `ผู้ช่วยฯ ${apt.assistantNick || 'ผู้ดูแล'}` },
          { status: status, timestamp: t3.toISOString(), durationMin: 0, by: "ห้องจ่ายยา / การเงิน" }
        ];
      } else if (status.startsWith("🟣")) {
        apt.statusHistory = [
          { status: "🟡 รอตรวจ", timestamp: t0.toISOString(), durationMin: examDurationMin, by: "จุดคัดกรอง / ซักประวัติ" },
          { status: `🔵 รอ${roomName}`, timestamp: t1.toISOString(), durationMin: waitRoomDurationMin, by: "พยาบาล / ผู้จัดสรรคิว" },
          { status: status, timestamp: t2.toISOString(), durationMin: 0, by: `ผู้ช่วยฯ ${apt.assistantNick || 'ผู้ดูแล'}` }
        ];
      } else if (status.startsWith("🔵") || status.includes("รอนวด") || status.includes("ตรวจแล้ว")) {
        apt.statusHistory = [
          { status: "🟡 รอตรวจ", timestamp: t0.toISOString(), durationMin: examDurationMin, by: "จุดคัดกรอง / ซักประวัติ" },
          { status: status, timestamp: t1.toISOString(), durationMin: 0, by: "พยาบาล / ผู้จัดสรรคิว" }
        ];
      } else if (status.includes("รอตรวจ")) {
        apt.statusHistory = [
          { status: "🟡 รอตรวจ", timestamp: (apt.createdAt ? new Date(apt.createdAt).toISOString() : t0.toISOString()), durationMin: 0, by: "จุดคัดกรอง / ซักประวัติ" }
        ];
      } else {
        apt.statusHistory = [
          { status: status || "⚪ ว่าง", timestamp: apt.createdAt || baseSlotDate.toISOString(), durationMin: 0, by: "System" }
        ];
      }

      // Persist history to in-memory cache
      const savedHistories = getMemStatusHistories();
      savedHistories[apt.id] = apt.statusHistory;
      scheduleSaveStatusHistories();

      return apt.statusHistory;
    }

    function calculateAppointmentTimings(apt) {
      if (!apt) return { 
        waitExamMin: 0, 
        waitRoomMin: 0, 
        treatmentMin: 0, 
        totalStayMin: 0, 
        hasStarted: false,
        waitExamStart: null,
        waitExamEnd: null,
        waitRoomStart: null,
        waitRoomEnd: null,
        treatmentStart: null,
        treatmentEnd: null,
        totalStart: null,
        totalEnd: null
      };

      const history = ensureAppointmentStatusHistory(apt);
      const nowMs = Date.now();

      // Find key status transition points in history
      const waitEntry = history.find(h => h.status && h.status.includes("รอตรวจ"));
      const examEntry = history.find(h => h.status && (h.status.includes("รอนวด") || h.status.includes("ตรวจแล้ว") || (h.status.startsWith("🔵") && h.status.includes("ห้อง"))));
      const roomEntry = history.find(h => h.status && (h.status.startsWith("🟣") || (h.status.includes("ห้อง") && !h.status.startsWith("🔵") && !h.status.includes("รอห้อง"))));
      const doneEntry = history.find(h => h.status && (h.status.includes("กลับบ้าน") || h.status.includes("ส่งต่อ")));

      const hasStarted = Boolean(waitEntry || examEntry || roomEntry || doneEntry || apt.treatmentStartTime);

      let waitExamMin = 0;
      let waitRoomMin = 0;
      let treatmentMin = 0;
      let totalStayMin = 0;

      let waitExamStart = null;
      let waitExamEnd = null;
      let waitRoomStart = null;
      let waitRoomEnd = null;
      let treatmentStart = null;
      let treatmentEnd = null;
      let totalStart = null;
      let totalEnd = null;

      // 1. Waiting for Exam (รอตรวจ)
      if (waitEntry) {
        waitExamStart = waitEntry.timestamp;
        const endMs = examEntry ? new Date(examEntry.timestamp).getTime() : (roomEntry ? new Date(roomEntry.timestamp).getTime() : (doneEntry ? new Date(doneEntry.timestamp).getTime() : (apt.status?.includes("รอตรวจ") ? nowMs : new Date(waitEntry.timestamp).getTime())));
        waitExamEnd = (examEntry || roomEntry || doneEntry) ? (examEntry?.timestamp || roomEntry?.timestamp || doneEntry?.timestamp) : (apt.status?.includes("รอตรวจ") ? null : waitEntry.timestamp);
        waitExamMin = Math.max(0, Math.round((endMs - new Date(waitExamStart).getTime()) / 60000));
      }

      // 2. Waiting for Room / Waiting for Massage (รอนวด / รอห้อง)
      if (examEntry) {
        waitRoomStart = examEntry.timestamp;
        const endMs = (apt.treatmentStartTime ? new Date(apt.treatmentStartTime).getTime() : (roomEntry ? new Date(roomEntry.timestamp).getTime() : (doneEntry ? new Date(doneEntry.timestamp).getTime() : nowMs)));
        waitRoomEnd = (apt.treatmentStartTime || roomEntry || doneEntry) ? (apt.treatmentStartTime || roomEntry?.timestamp || doneEntry?.timestamp) : null;
        waitRoomMin = Math.max(0, Math.round((endMs - new Date(waitRoomStart).getTime()) / 60000));
      }

      // 3. Treatment Duration (ทำหัตถการ - นวดจริง)
      if (apt.treatmentStartTime || roomEntry) {
        treatmentStart = apt.treatmentStartTime || (roomEntry ? roomEntry.timestamp : null);
        const endMs = (apt.treatmentEndTime ? new Date(apt.treatmentEndTime).getTime() : (doneEntry ? new Date(doneEntry.timestamp).getTime() : nowMs));
        treatmentEnd = (apt.treatmentEndTime || doneEntry) ? (apt.treatmentEndTime || doneEntry?.timestamp) : null;
        if (treatmentStart) {
          treatmentMin = Math.max(0, Math.round((endMs - new Date(treatmentStart).getTime()) / 60000));
        }
      }

      // 4. Total Clinic Stay (เวลารวมคลินิก)
      if (hasStarted) {
        const checkinEntry = waitEntry || examEntry || roomEntry || doneEntry;
        totalStart = checkinEntry ? checkinEntry.timestamp : (apt.treatmentStartTime || null);
        const finalEndMs = (apt.treatmentEndTime ? new Date(apt.treatmentEndTime).getTime() : (doneEntry ? new Date(doneEntry.timestamp).getTime() : nowMs));
        totalEnd = (apt.treatmentEndTime || doneEntry) ? (apt.treatmentEndTime || doneEntry?.timestamp) : null;
        if (totalStart) {
          totalStayMin = Math.max(0, Math.round((finalEndMs - new Date(totalStart).getTime()) / 60000));
        }
      }

      apt.timings = {
        waitExamMin,
        waitRoomMin,
        treatmentMin,
        totalStayMin,
        hasStarted,
        waitExamStart,
        waitExamEnd,
        waitRoomStart,
        waitRoomEnd,
        treatmentStart,
        treatmentEnd,
        totalStart,
        totalEnd
      };

      // Persist timings to in-memory cache and debounce save
      const savedTimings = getMemTreatmentTimings();
      savedTimings[apt.id] = {
        ...apt.timings,
        treatmentStartTime: apt.treatmentStartTime || null,
        treatmentEndTime: apt.treatmentEndTime || null
      };
      scheduleSaveTreatmentTimings();

      return apt.timings;
    }

    function generateStatusTimerBadgeHtml(apt, customClass = "") {
      if (!apt || !apt.id) return "";
      
      const status = apt.status || "";
      const isBlank = !status || status === "⚪ ว่าง" || status === "ว่าง" || status.startsWith("⚪");
      const hasPatient = Boolean(apt.patientName && apt.patientName !== "-" && apt.patientName.trim() !== "" && !isBlank);

      // If slot is completely blank without a patient, do NOT show timer button
      if (!hasPatient && isBlank) {
        return "";
      }

      const timings = calculateAppointmentTimings(apt);
      const isDone = status.includes("กลับบ้าน") || status.includes("ส่งต่อ");
      const isMassaging = status.startsWith("🟣") || (status.includes("ห้อง") && !status.startsWith("🔵") && !status.includes("รอห้อง"));
      const isWaitingRoom = status.startsWith("🔵") && status.includes("ห้อง");
      const isWaitingMassage = status === "🔵 รอนวด" || status === "รอนวด" || status.includes("ตรวจแล้ว");
      const isWaiting = status.includes("รอตรวจ");

      const baseBtnClass = customClass
        ? `${customClass} transition hover:shadow-xs active:scale-95 cursor-pointer inline-flex items-center gap-1 shadow-2xs`
        : `inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10.5px] font-bold border transition hover:shadow-xs active:scale-95 cursor-pointer shadow-2xs`;

      // 1. If not started yet (Pending appointment)
      if (!timings.hasStarted && !isDone) {
        return `
          <button type="button" onclick="event.stopPropagation(); openPatientTimingModal('${apt.id}')" class="${baseBtnClass} bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700" title="คลิกเพื่อดูบันทึกเวลาและการจับเวลา">
            <i data-lucide="clock" class="${customClass ? 'w-3.5 h-3.5' : 'w-3 h-3'} text-slate-500 dark:text-slate-400"></i>
            <span>⏱️ ดูเวลา</span>
          </button>
        `;
      }

      // 2. Completed (เสร็จสิ้น / ส่งต่อ)
      if (isDone) {
        const total = apt.timings ? apt.timings.totalStayMin : 0;
        return `
          <button type="button" onclick="event.stopPropagation(); openPatientTimingModal('${apt.id}')" class="${baseBtnClass} bg-emerald-100 text-emerald-950 dark:bg-emerald-950 dark:text-emerald-100 border-emerald-400 dark:border-emerald-700 hover:bg-emerald-200 dark:hover:bg-emerald-900 font-black" title="คลิกเพื่อดูสรุปเวลาการรักษา (รวม ${formatElapsedDuration(total)})">
            <i data-lucide="check-circle" class="${customClass ? 'w-3.5 h-3.5' : 'w-3 h-3'} text-emerald-700 dark:text-emerald-400"></i>
            <span>⏱️ ดูเวลา (${total} นาที)</span>
          </button>
        `;
      }

      // 3. Active Stages
      const history = apt.statusHistory || [];
      const currentStageEntry = [...history].reverse().find(h => h.status === status) || history[history.length - 1];
      const stageStart = (isMassaging && apt.treatmentStartTime)
        ? new Date(apt.treatmentStartTime).getTime()
        : (currentStageEntry ? new Date(currentStageEntry.timestamp).getTime() : Date.now());
      const elapsedMin = Math.max(0, Math.round((Date.now() - stageStart) / 60000));

      let badgeClass = "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-slate-200";
      let label = `⏱️ ดูเวลา (${elapsedMin} น.)`;
      let icon = "clock";
      let iconColor = "text-slate-500 dark:text-slate-400";

      if (isWaiting) {
        if (elapsedMin < 20) {
          badgeClass = "bg-amber-100 text-amber-950 dark:bg-amber-950 dark:text-amber-100 border-amber-400 dark:border-amber-700 hover:bg-amber-200 font-extrabold";
        } else if (elapsedMin < 40) {
          badgeClass = "bg-amber-200 text-amber-950 dark:bg-amber-900 dark:text-amber-100 border-amber-500 dark:border-amber-600 hover:bg-amber-300 font-black";
        } else {
          badgeClass = "bg-rose-100 text-rose-950 dark:bg-rose-950 dark:text-rose-100 border-rose-400 dark:border-rose-700 hover:bg-rose-200 font-black animate-pulse";
        }
        label = `⏱️ ดูเวลา (รอตรวจ ${elapsedMin} น.)`;
        icon = "timer";
        iconColor = "text-amber-700 dark:text-amber-300";
      } else if (isWaitingRoom) {
        badgeClass = "bg-blue-100 text-blue-950 dark:bg-blue-950 dark:text-blue-100 border-blue-400 dark:border-blue-700 hover:bg-blue-200 font-black";
        const rm = status.replace("🔵 ", "").trim();
        label = `⏱️ ดูเวลา (รอ${rm} ${elapsedMin} น.)`;
        icon = "clock";
        iconColor = "text-blue-700 dark:text-blue-300";
      } else if (isWaitingMassage) {
        badgeClass = "bg-sky-100 text-sky-950 dark:bg-sky-950 dark:text-sky-100 border-sky-400 dark:border-sky-700 hover:bg-sky-200 font-black";
        label = `⏱️ ดูเวลา (รอนวด ${elapsedMin} น.)`;
        icon = "sparkles";
        iconColor = "text-sky-700 dark:text-sky-300";
      } else if (isMassaging) {
        badgeClass = "bg-purple-100 text-purple-950 dark:bg-purple-950 dark:text-purple-100 border-purple-400 dark:border-purple-600 hover:bg-purple-200 font-black";
        const rm = status.replace("🟣 ", "").trim();
        label = `⏱️ ดูเวลา (นวด${rm} ${elapsedMin} น.)`;
        icon = "activity";
        iconColor = "text-purple-700 dark:text-purple-300";
      }

      return `
        <button type="button" onclick="event.stopPropagation(); openPatientTimingModal('${apt.id}')" class="${baseBtnClass} ${badgeClass}" title="คลิกเพื่อดูสรุปเวลาละเอียด (สเตจปัจจุบัน: ${elapsedMin} นาที)">
          <i data-lucide="${icon}" class="${customClass ? 'w-3.5 h-3.5' : 'w-3 h-3'} ${iconColor}"></i>
          <span>${label}</span>
        </button>
      `;
    }

    function generateMassageTimingTextHtml(apt) {
      if (!apt) return "";
      const history = ensureAppointmentStatusHistory(apt);
      const massageEntry = (apt.statusHistory || []).find(h => (h.status || "").startsWith("🟣") || ((h.status || "").includes("ห้อง") && !(h.status || "").startsWith("🔵") && !(h.status || "").includes("รอ")));
      const doneEntry = (apt.statusHistory || []).find(h => (h.status || "").includes("กลับบ้าน") || (h.status || "").includes("ส่งต่อ"));

      const isMassaging = (apt.status || "").startsWith("🟣") || ((apt.status || "").includes("ห้อง") && !(apt.status || "").startsWith("🔵") && !(apt.status || "").includes("รอ"));
      const isDone = (apt.status || "").includes("กลับบ้าน") || (apt.status || "").includes("ส่งต่อ") || Boolean(doneEntry);

      // If currently massaging and treatmentStartTime is not set, initialize it with real action timestamp
      if (isMassaging && !apt.treatmentStartTime) {
        apt.treatmentStartTime = massageEntry ? massageEntry.timestamp : new Date().toISOString();
      }

      // Real start timestamp priority: apt.treatmentStartTime -> massageEntry.timestamp
      let startIso = apt.treatmentStartTime || (massageEntry ? massageEntry.timestamp : null);
      if (!startIso && !isDone) return "";

      let startTimeStr = "-";
      let startD = startIso ? new Date(startIso) : null;
      if (startD && !isNaN(startD.getTime())) {
        const sH = String(startD.getHours()).padStart(2, '0');
        const sM = String(startD.getMinutes()).padStart(2, '0');
        startTimeStr = `${sH}.${sM} น.`;
      }

      const endIso = apt.treatmentEndTime || (doneEntry ? doneEntry.timestamp : null);

      if (isDone) {
        let endD = endIso ? new Date(endIso) : null;
        if (!endD || isNaN(endD.getTime())) {
          endD = new Date();
        }
        const eH = String(endD.getHours()).padStart(2, '0');
        const eM = String(endD.getMinutes()).padStart(2, '0');
        const endTimeStr = `${eH}.${eM} น.`;
        return `
          <span class="inline-flex items-center gap-1 text-[11px] font-black text-sky-950 dark:text-sky-100 bg-sky-100 dark:bg-sky-950 px-2 py-0.5 rounded-md border border-sky-400 dark:border-sky-600 shadow-2xs whitespace-nowrap" title="เวลาเริ่มนวด (เวลาจริงที่กดปุ่ม)">
            <i data-lucide="play" class="w-3 h-3 text-sky-700 dark:text-sky-300 shrink-0"></i>
            <span>เริ่ม ${startTimeStr}</span>
          </span>
          <span class="inline-flex items-center gap-1 text-[11px] font-black text-emerald-950 dark:text-emerald-100 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-md border border-emerald-500 dark:border-emerald-600 shadow-2xs whitespace-nowrap" title="เวลาสิ้นสุดนวด (เวลาจริงที่กดปุ่มเสร็จสิ้น)">
            <i data-lucide="check-circle-2" class="w-3 h-3 text-emerald-700 dark:text-emerald-300 shrink-0"></i>
            <span>สิ้นสุด ${endTimeStr}</span>
          </span>
        `;
      } else {
        const durationMin = (apt.slotsOccupied && apt.slotsOccupied.length > 1) ? 120 : 60;
        const expD = new Date((startD ? startD.getTime() : Date.now()) + durationMin * 60000);
        const expH = String(expD.getHours()).padStart(2, '0');
        const expM = String(expD.getMinutes()).padStart(2, '0');
        const expEndTimeStr = `${expH}.${expM} น.`;
        return `
          <span class="inline-flex items-center gap-1 text-[11px] font-black text-purple-950 dark:text-purple-100 bg-purple-100 dark:bg-purple-950 px-2 py-0.5 rounded-md border border-purple-400 dark:border-purple-600 shadow-2xs whitespace-nowrap" title="เวลาเริ่มนวด (เวลาจริงที่กดปุ่ม)">
            <i data-lucide="play" class="w-3 h-3 text-purple-700 dark:text-purple-300 shrink-0"></i>
            <span>เริ่ม ${startTimeStr}</span>
          </span>
          <span class="inline-flex items-center gap-1 text-[11px] font-black text-amber-950 dark:text-amber-100 bg-amber-100 dark:bg-amber-950 px-2 py-0.5 rounded-md border border-amber-400 dark:border-amber-600 shadow-2xs whitespace-nowrap" title="คาดว่าจะสิ้นสุดการนวด (คำนวณจากเวลาเริ่มจริง)">
            <i data-lucide="clock" class="w-3 h-3 text-amber-700 dark:text-amber-300 shrink-0"></i>
            <span>สิ้นสุด ~${expEndTimeStr}</span>
          </span>
        `;
      }
    }

    function openPatientTimingModal(appointmentId) {
      const apt = appointments.find(a => a.id === appointmentId);
      if (!apt) {
        showToast("ไม่พบข้อมูลนัดหมาย", "warning");
        return;
      }
      currentTimingModalAptId = appointmentId;
      renderPatientTimingModal(apt);
      const modal = document.getElementById("modal-patient-timing");
      if (modal) modal.classList.remove("hidden");
      if (window.lucide) lucide.createIcons();
    }

    function closePatientTimingModal() {
      const modal = document.getElementById("modal-patient-timing");
      if (modal) modal.classList.add("hidden");
      currentTimingModalAptId = null;
    }

    function renderPatientTimingModal(apt) {
      if (!apt) return;

      // Header info
      const nameEl = document.getElementById("patient-timing-patient-name");
      const infoEl = document.getElementById("patient-timing-patient-info") || document.getElementById("patient-timing-modal-info");
      const statusBadge = document.getElementById("patient-timing-status-badge");

      if (nameEl) {
        const rawName = (apt.patientName || apt.name || '').trim();
        nameEl.textContent = rawName ? (rawName.startsWith('คุณ') ? rawName : `คุณ ${rawName}`) : "ไม่ระบุชื่อ";
      }
      if (infoEl) {
        const hn = apt.citizenOrHn || apt.hn || '-';
        const slot = apt.timeSlot ? formatTimeLabel(apt.timeSlot) : (apt.time || '-');
        const date = (apt.bookDate || apt.date) ? formatThaiDate(apt.bookDate || apt.date) : 'วันนี้';
        infoEl.textContent = `HN: ${hn} • รอบ ${slot} วันที่ ${date}`;
      }
      if (statusBadge) {
        statusBadge.innerHTML = `<span class="px-3 py-1 rounded-full text-xs font-black shadow-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800">${escapeHtml(apt.status || '⚪ ว่าง')}</span>`;
      }

      // Calculate authoritative timings and ensure complete history
      const timings = calculateAppointmentTimings(apt);
      const waitExam = timings.waitExamMin || 0;
      const waitRoom = timings.waitRoomMin || 0;
      const treat = timings.treatmentMin || 0;
      const total = timings.totalStayMin || 0;
      const hasStarted = timings.hasStarted;
      const isDone = (apt.status || "").includes("กลับบ้าน") || (apt.status || "").includes("ส่งต่อ");

      // 1. Top 4 Timing Cards (แสดงเวลาเริ่มกด, ช่วงเวลา, และสรุปเป็นนาทีอย่างชัดเจน)
      const topCardsContainer = document.getElementById("patient-timing-kpi-cards") || document.getElementById("patient-timing-top-cards");
      if (topCardsContainer) {
        topCardsContainer.innerHTML = `
          <!-- Card 1: เวลารอตรวจ -->
          <div class="p-3.5 sm:p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700/60 shadow-2xs space-y-1.5 transition">
            <div class="flex items-center justify-between text-xs text-amber-800 dark:text-amber-300 font-bold">
              <span class="flex items-center gap-1">⏳ เวลารอตรวจ</span>
              <div class="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center">
                <i data-lucide="timer" class="w-3.5 h-3.5"></i>
              </div>
            </div>
            <div class="flex items-baseline gap-1.5">
              <span class="text-2xl sm:text-3xl font-black text-amber-950 dark:text-amber-200 font-mono">${waitExam}</span>
              <span class="text-xs font-bold text-amber-800 dark:text-amber-300">นาที</span>
            </div>
            <div class="text-[11px] font-mono font-bold text-amber-900 dark:text-amber-200 bg-amber-100/80 dark:bg-amber-950 px-2 py-0.5 rounded-lg border border-amber-200/80 dark:border-amber-800 truncate">
              ${formatTimeRange(timings.waitExamStart, timings.waitExamEnd)}
            </div>
            <p class="text-[10px] text-amber-700 dark:text-amber-400 font-medium">${hasStarted ? 'เกณฑ์มาตรฐาน: < 20 นาที' : '⚪ รอเริ่มตรวจ'}</p>
          </div>

          <!-- Card 2: รอนวด / รอห้อง -->
          <div class="p-3.5 sm:p-4 rounded-2xl bg-sky-500/10 dark:bg-sky-950/60 border border-sky-300 dark:border-sky-700/60 shadow-2xs space-y-1.5 transition">
            <div class="flex items-center justify-between text-xs text-sky-800 dark:text-sky-300 font-bold">
              <span class="flex items-center gap-1">✨ รอนวด / รอห้อง</span>
              <div class="w-6 h-6 rounded-lg bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300 flex items-center justify-center">
                <i data-lucide="sparkles" class="w-3.5 h-3.5"></i>
              </div>
            </div>
            <div class="flex items-baseline gap-1.5">
              <span class="text-2xl sm:text-3xl font-black text-sky-950 dark:text-sky-200 font-mono">${waitRoom}</span>
              <span class="text-xs font-bold text-sky-800 dark:text-sky-300">นาที</span>
            </div>
            <div class="text-[11px] font-mono font-bold text-sky-900 dark:text-sky-200 bg-sky-100/80 dark:bg-sky-950 px-2 py-0.5 rounded-lg border border-sky-200/80 dark:border-sky-800 truncate">
              ${formatTimeRange(timings.waitRoomStart, timings.waitRoomEnd)}
            </div>
            <p class="text-[10px] text-sky-700 dark:text-sky-400 font-medium">${hasStarted ? 'เกณฑ์มาตรฐาน: < 15 นาที' : '⚪ ยังไม่ถึงขั้นตอนนี้'}</p>
          </div>

          <!-- Card 3: ทำหัตถการ -->
          <div class="p-3.5 sm:p-4 rounded-2xl bg-purple-500/10 dark:bg-purple-950/60 border border-purple-300 dark:border-purple-700/60 shadow-2xs space-y-1.5 transition">
            <div class="flex items-center justify-between text-xs text-purple-800 dark:text-purple-300 font-bold">
              <span class="flex items-center gap-1">🧘 ทำหัตถการ</span>
              <div class="w-6 h-6 rounded-lg bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 flex items-center justify-center">
                <i data-lucide="activity" class="w-3.5 h-3.5"></i>
              </div>
            </div>
            <div class="flex items-baseline gap-1.5">
              <span class="text-2xl sm:text-3xl font-black text-purple-950 dark:text-purple-200 font-mono">${treat}</span>
              <span class="text-xs font-bold text-purple-800 dark:text-purple-300">นาที</span>
            </div>
            <div class="text-[11px] font-mono font-bold text-purple-900 dark:text-purple-200 bg-purple-100/80 dark:bg-purple-950 px-2 py-0.5 rounded-lg border border-purple-200/80 dark:border-purple-800 truncate">
              ${formatTimeRange(timings.treatmentStart, timings.treatmentEnd)}
            </div>
            <p class="text-[10px] text-purple-700 dark:text-purple-400 font-medium">${apt.slotsOccupied && apt.slotsOccupied.length > 1 ? 'คิว 2 ชม.' : 'คิว 1 ชม.'}</p>
          </div>

          <!-- Card 4: เวลารวมคลินิก -->
          <div class="p-3.5 sm:p-4 rounded-2xl bg-emerald-500/10 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700/60 shadow-2xs space-y-1.5 transition">
            <div class="flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300 font-bold">
              <span class="flex items-center gap-1">📇 เวลารวมคลินิก</span>
              <div class="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                <i data-lucide="check-circle" class="w-3.5 h-3.5"></i>
              </div>
            </div>
            <div class="flex items-baseline gap-1.5">
              <span class="text-2xl sm:text-3xl font-black text-emerald-950 dark:text-emerald-200 font-mono">${total}</span>
              <span class="text-xs font-bold text-emerald-800 dark:text-emerald-300">นาที</span>
            </div>
            <div class="text-[11px] font-mono font-bold text-emerald-900 dark:text-emerald-200 bg-emerald-100/80 dark:bg-emerald-950 px-2 py-0.5 rounded-lg border border-emerald-200/80 dark:border-emerald-800 truncate">
              ${timings.totalStart ? (timings.totalEnd ? `เข้า: ${formatTimeClock(timings.totalStart)} • ออก: ${formatTimeClock(timings.totalEnd)}` : `เข้า: ${formatTimeClock(timings.totalStart)} (กำลังรับบริการ)`) : '⚪ ยังไม่เริ่ม'}
            </div>
            <p class="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">${isDone ? '✅ สิ้นสุดการรักษา (บันทึกข้อมูลถาวร)' : (hasStarted ? 'เริ่มนับตั้งแต่ "รอตรวจ"' : '⚪ ยังไม่เริ่มจับเวลา')}</p>
          </div>
        `;
      }

      // 2. Timeline Steps (ประวัติการเปลี่ยนสถานะและเวลาที่กดเปลี่ยนแต่ละช่วง)
      const timelineContainer = document.getElementById("patient-timing-timeline-container");
      if (timelineContainer) {
        const history = ensureAppointmentStatusHistory(apt);

        timelineContainer.innerHTML = history.map((item, idx) => {
          const isLatest = idx === history.length - 1;
          const timeFormatted = formatTimeClock(item.timestamp);
          const dateFormatted = new Date(item.timestamp).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });

          return `
            <div class="relative pl-6 pb-4 border-l-2 ${isLatest ? 'border-transparent pb-1' : 'border-emerald-400 dark:border-emerald-700/80'}">
              <span class="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full border-2 ${isLatest ? 'bg-emerald-500 border-white dark:border-slate-900 ring-4 ring-emerald-400/30 animate-pulse' : 'bg-emerald-600 dark:bg-emerald-500 border-white dark:border-slate-900 shadow-2xs'}"></span>

              <div class="p-3.5 rounded-xl ${isLatest ? 'bg-emerald-500/15 dark:bg-emerald-950/80 border-2 border-emerald-500 dark:border-emerald-400 shadow-xs' : 'bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 shadow-2xs'} space-y-1.5 transition">
                <div class="flex items-center justify-between text-xs flex-wrap gap-1">
                  <span class="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>${escapeHtml(item.status)}</span>
                    ${isLatest ? '<span class="px-1.5 py-0.5 rounded bg-emerald-500 text-white text-[9px] font-black uppercase shadow-2xs">ปัจจุบัน</span>' : ''}
                  </span>
                  <span class="font-mono text-[11px] font-bold text-herbal-700 dark:text-emerald-300 bg-herbal-50 dark:bg-slate-900 px-2 py-0.5 rounded-md border border-herbal-200/60 dark:border-slate-700">${dateFormatted} • ${timeFormatted}</span>
                </div>
                <div class="flex flex-wrap items-center justify-between gap-1 text-[11px] text-slate-500 dark:text-slate-300 pt-0.5">
                  <span>ผู้บันทึก: <strong class="text-slate-800 dark:text-white">${escapeHtml(item.by || 'เจ้าหน้าที่')}</strong></span>
                  ${item.durationMin > 0 ? `<span class="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950 font-bold text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-700/60">⏱️ ใช้เวลาช่วงนี้: ${item.durationMin} นาที</span>` : ''}
                </div>
              </div>
            </div>
          `;
        }).join("");
      }

      // 3. Service Summary Box
      const serviceSummary = document.getElementById("patient-timing-service-summary");
      if (serviceSummary) {
        const extrasList = apt.extraServices && apt.extraServices.length > 0 ? apt.extraServices.join(", ") : "ไม่มี";
        const mainServiceText = (apt.mainService && apt.mainService !== "-" && apt.mainService !== "บริการเสริม") ? apt.mainService : "เฉพาะบริการเสริม";
        serviceSummary.innerHTML = `
          <div class="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-200/60 dark:border-emerald-700/60 pb-2">
            <span class="font-bold text-emerald-900 dark:text-emerald-300">💆‍♂️ บริการหลัก: <span class="text-slate-900 dark:text-white font-semibold">${escapeHtml(mainServiceText)}</span></span>
            <span class="font-bold text-emerald-800 dark:text-emerald-300">ผู้ช่วยฯ: 👤 <span class="text-slate-900 dark:text-white font-semibold">${escapeHtml(apt.assistantNick || 'ไม่ระบุ')}</span></span>
          </div>
          <div class="flex flex-wrap items-center justify-between gap-2 pt-1 text-slate-600 dark:text-slate-300">
            <span>บริการเสริม: <strong class="text-slate-900 dark:text-white">${escapeHtml(extrasList)}</strong></span>
            <span>เบอร์โทร: <a href="tel:${apt.phone}" class="text-herbal-700 dark:text-emerald-400 font-mono font-bold hover:underline">${escapeHtml(apt.phone || '-')}</a></span>
          </div>
        `;
      }
    }

    function getClinicTimeAnalytics(filteredAppointments) {
      const list = filteredAppointments || appointments;
      const completed = list.filter(a => a.status && (a.status.includes("กลับบ้าน") || a.status.includes("ส่งต่อ")));

      let totalWait = 0;
      let totalTreatment = 0;
      let totalStay = 0;
      let count = 0;

      completed.forEach(apt => {
        calculateAppointmentTimings(apt);
        if (apt.timings && apt.timings.totalStayMin > 0) {
          totalWait += (apt.timings.waitExamMin || 0);
          totalTreatment += (apt.timings.treatmentMin || 0);
          totalStay += (apt.timings.totalStayMin || 0);
          count++;
        }
      });

      return {
        count,
        avgWaitMin: count > 0 ? Math.round(totalWait / count) : 0,
        avgTreatmentMin: count > 0 ? Math.round(totalTreatment / count) : 0,
        avgTotalStayMin: count > 0 ? Math.round(totalStay / count) : 0
      };
    }

