/**
 * Module 2: 02_notifications_and_alerts.js
 * Description: Notifications, Toasts, Realtime Alerts & Sounds
 * Generated from lines 6049 to 6538 of original index.html
 */

    /* =========================================================================
       NOTIFICATION CENTER & REALTIME ALERT ENGINE (🔔 ระบบการแจ้งเตือน)
       ========================================================================= */
    let notifications = [];
    try {
      const savedNotifs = localStorage.getItem("ttm_notifications_v1");
      if (savedNotifs) {
        notifications = JSON.parse(savedNotifs);
      }
    } catch(e) {
      notifications = [];
    }

    let currentNotifFilter = "all";
    let currentTimingModalAptId = null;

    function saveNotifications() {
      try {
        localStorage.setItem("ttm_notifications_v1", JSON.stringify(notifications.slice(0, 100)));
      } catch(e) {}
    }

    function isNotificationForCurrentUser(notif) {
      if (!notif) return false;

      // 1. Admin gets all operational clinic notifications
      if (currentUser && currentUser.role === 'admin') return true;

      // 2. Extract current user identifiers
      const userPhone = currentUser ? (currentUser.phone || "").replace(/[^0-9]/g, "") : "";
      const userName = currentUser ? (currentUser.name || "").trim() : "";
      const userCleanId = currentUser ? (currentUser.id || "").replace(/^usr-/, "") : "";
      const userAuthId = currentUser?.authUserId || "";
      const asstId = currentUser?.assistantId || "";

      // 3. Extract notification target identifiers
      const targetAsstId = notif.targetAssistantId;
      const targetAsstNick = notif.targetAssistantNick;
      const notifPatientPhone = (notif.patientPhone || notif.metadata?.patientPhone || "").replace(/[^0-9]/g, "");
      const notifPatientName = (notif.patientName || "").trim();
      const notifPatientUserId = notif.patientUserId || notif.metadata?.patientUserId || "";
      const notifAptId = notif.appointmentId || "";

      // 4. Check if notification is for current user as the PATIENT (คนไข้เจ้าของนัด)
      let isTargetPatient = false;
      if (currentUser && currentUser.role === 'user') {
        if (notifPatientPhone && userPhone && notifPatientPhone === userPhone) isTargetPatient = true;
        else if (notifPatientUserId && (notifPatientUserId === currentUser.id || notifPatientUserId === userCleanId || notifPatientUserId === userAuthId)) isTargetPatient = true;
        else if (notifPatientName && userName && (notifPatientName === userName || userName.includes(notifPatientName) || notifPatientName.includes(userName))) isTargetPatient = true;
      } else if (!currentUser) {
        // Unauthenticated Guest: only match appointments booked during this browser session
        try {
          const myBookings = JSON.parse(sessionStorage.getItem("ttm_my_booking_ids") || "[]");
          const guestPhone = (sessionStorage.getItem("ttm_guest_phone") || "").replace(/[^0-9]/g, "");
          if (notifAptId && myBookings.includes(notifAptId)) isTargetPatient = true;
          else if (notifPatientPhone && guestPhone && notifPatientPhone === guestPhone) isTargetPatient = true;
        } catch(e) {}
      }

      // 5. Check if notification is for current user as the ASSIGNED ASSISTANT (หมอนวดประจำคิว)
      let isTargetAssistant = false;
      if (currentUser && (currentUser.role === 'staff' || asstId)) {
        // A. Direct Assistant ID comparison
        if (targetAsstId && targetAsstId !== "auto" && targetAsstId !== "female" && targetAsstId !== "male") {
          const targetClean = (targetAsstId || "").replace(/^usr-/, "");
          if (targetClean === userCleanId || targetClean === asstId || targetAsstId === currentUser.id || targetAsstId === userAuthId || ("usr-" + targetAsstId) === currentUser.id) {
            isTargetAssistant = true;
          }
        }

        // B. Match assistant object in assistants table
        if (!isTargetAssistant && (targetAsstId || targetAsstNick)) {
          const asst = assistants.find(a => 
            (targetAsstId && a.id === targetAsstId) ||
            (targetAsstNick && (a.nickname === targetAsstNick || a.name === targetAsstNick || a.name.includes(targetAsstNick)))
          );

          if (asst) {
            const asstPhone = (asst.phone || "").replace(/[^0-9]/g, "");
            const asstEmail = (asst.email || "").toLowerCase().trim();
            const userEmail = (currentUser.email || "").toLowerCase().trim();
            if (asst.id === asstId || asst.id === userCleanId || ("usr-" + asst.id) === currentUser.id) isTargetAssistant = true;
            else if (asstPhone && userPhone && asstPhone === userPhone) isTargetAssistant = true;
            else if (asstEmail && userEmail && asstEmail === userEmail) isTargetAssistant = true;
            else if (asst.nickname && userName && userName.includes(asst.nickname)) isTargetAssistant = true;
            else if (asst.name && userName && (asst.name === userName || asst.name.includes(userName) || userName.includes(asst.name))) isTargetAssistant = true;
          }
        }

        // C. Direct Nickname match
        if (!isTargetAssistant && targetAsstNick && !["auto", "female", "male", "จัดสรรตามเหมาะสม", "ไม่ระบุ", "หญิง", "ชาย"].includes(targetAsstNick)) {
          const userEmail = (currentUser.email || "").toLowerCase().trim();
          if (userName.includes(targetAsstNick) || (userEmail && userEmail.includes(targetAsstNick.toLowerCase()))) {
            isTargetAssistant = true;
          }
        }
      }

      // 6. Handle notification routing by type and role
      // A. Patient-specific notifications
      if (isTargetPatient) return true;

      // B. Assistant-specific assignments / queue changes
      if (isTargetAssistant) return true;

      // C. General / System Broadcast without private appointment data
      if (notif.type === "GENERAL") {
        if (notif.targetRole === "all" && !notif.patientName && !notif.appointmentId) return true;
        if (notif.targetRole === "staff" && currentUser && (currentUser.role === "staff" || currentUser.role === "admin")) return true;
        if (notif.targetRole === "user" && currentUser && currentUser.role === "user") return true;
      }

      // If user is a patient or guest and this was an appointment for someone else -> BLOCKED
      // If user is a staff member and this was an appointment for another assistant -> BLOCKED
      return false;
    }

    function requestNotificationPermission() {
      if (typeof window !== 'undefined' && "Notification" in window && window.Notification && window.Notification.permission === "default") {
        window.Notification.requestPermission().then(permission => {
          if (permission === "granted") {
            showToast("เปิดใช้งานการแจ้งเตือนผ่านบราวเซอร์เรียบร้อย 🔔", "success");
          }
        });
      }
    }

    let isNotificationsMuted = localStorage.getItem("ttm_mute_notifications") === "true";
    let isSoundMuted = localStorage.getItem("ttm_mute_sound") === "true";

    function toggleMuteNotifications(forceState) {
      isNotificationsMuted = (typeof forceState === 'boolean') ? forceState : !isNotificationsMuted;
      localStorage.setItem("ttm_mute_notifications", isNotificationsMuted ? "true" : "false");
      updateNotificationBadgeUI();
      if (typeof renderLoginView === 'function') renderLoginView();
      showToast(isNotificationsMuted ? "🔕 ปิดการแจ้งเตือนเรียบร้อย (ไม่ส่งเสียงและ Pop-up รบกวน)" : "🔔 เปิดการแจ้งเตือนตามปกติเรียบร้อย", "info");
      if (window.lucide) lucide.createIcons();

      // Restore scroll positions seamlessly
      if (tableScrollContainer) {
        tableScrollContainer.scrollTop = savedTableScrollTop;
        tableScrollContainer.scrollLeft = savedTableScrollLeft;
      }
      if (modalBody) {
        modalBody.scrollTop = savedModalScrollTop;
      }

      // Restore focus if appropriate
      if (focusedRowId) {
        const tr = document.getElementById(focusedRowId);
        if (tr) {
          const targetInput = tr.querySelector(`input[type="${focusedInputType}"]`) || tr.querySelector('input');
          if (targetInput && document.activeElement !== targetInput) {
            targetInput.focus();
          }
        }
      }
    }

    function toggleMuteSound(forceState) {
      isSoundMuted = (typeof forceState === 'boolean') ? forceState : !isSoundMuted;
      localStorage.setItem("ttm_mute_sound", isSoundMuted ? "true" : "false");
      if (typeof renderLoginView === 'function') renderLoginView();
      showToast(isSoundMuted ? "🔇 ปิดเสียงเตือนเรียบร้อย" : "🔊 เปิดเสียงเตือนเรียบร้อย", "info");
      if (window.lucide) lucide.createIcons();
    }

    function addNotification({
      type = "GENERAL", // ASSISTANT_ASSIGNED, STATUS_CHANGED, NEW_BOOKING, CANCEL_BOOKING, DELAY_ALERT
      title,
      message,
      patientName = "",
      patientPhone = "",
      patientUserId = "",
      appointmentId = "",
      targetAssistantId = null,
      targetAssistantNick = null,
      targetRole = "staff", // Default to staff/admin, never broadcast patient data to public
      metadata = {}
    }) {
      const cleanPatientPhone = (patientPhone || metadata.patientPhone || "").replace(/[^0-9]/g, "");
      const cleanPatientUserId = patientUserId || metadata.patientUserId || "";

      const newNotif = {
        id: "NOTIF-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
        type,
        title: title || "การแจ้งเตือนจากระบบ",
        message: message || "",
        patientName,
        patientPhone: cleanPatientPhone,
        patientUserId: cleanPatientUserId,
        appointmentId,
        targetAssistantId,
        targetAssistantNick,
        targetRole,
        metadata: {
          ...metadata,
          patientPhone: cleanPatientPhone,
          patientUserId: cleanPatientUserId
        },
        timestamp: new Date().toISOString(),
        read: false
      };

      notifications.unshift(newNotif);
      if (notifications.length > 100) notifications.pop();
      saveNotifications();
      updateNotificationBadgeUI();
      renderNotificationDrawer();
      if (typeof renderLoginView === 'function') renderLoginView();

      const isForMe = isNotificationForCurrentUser(newNotif);
      if (isForMe) {
        // 1. Play chime sound if enabled and not muted
        if (!isNotificationsMuted && !isSoundMuted) {
          playNotificationChime();
        }

        // 2. Show in-app Toast popup immediately for user / assistant if not muted
        if (!isNotificationsMuted) {
          const toastType = type === "CANCEL_BOOKING" ? "warning" : (type === "ASSISTANT_ASSIGNED" ? "success" : "info");
          showToast(`🔔 ${newNotif.title}\n${newNotif.message}`, toastType);
        }

        // 3. Trigger Browser Web Notification (if permission granted and not muted)
        if (!isNotificationsMuted && typeof window !== 'undefined' && "Notification" in window && window.Notification && window.Notification.permission === "granted") {
          try {
            new window.Notification(newNotif.title, {
              body: newNotif.message,
              icon: "icon-192.png",
              badge: "icon-192.png",
              tag: newNotif.id
            });
          } catch(e) {}
        }

        // 4. Mobile Haptic Vibration (if supported and not muted)
        if (!isNotificationsMuted && typeof navigator !== 'undefined' && navigator.vibrate) {
          try { navigator.vibrate([200, 100, 200]); } catch(e) {}
        }
      }

      return newNotif;
    }

    function getUnreadNotificationCount() {
      return notifications.filter(n => !n.read && isNotificationForCurrentUser(n)).length;
    }

    function updateNotificationBadgeUI() {
      const badge = document.getElementById("notif-badge-count");
      const modalBadge = document.getElementById("notif-modal-unread-badge");
      const muteIndicator = document.getElementById("notif-bell-mute-icon");
      const unreadCount = getUnreadNotificationCount();

      if (badge) {
        if (unreadCount > 0) {
          badge.textContent = unreadCount > 99 ? "99+" : unreadCount;
          badge.classList.remove("hidden");
        } else {
          badge.classList.add("hidden");
        }
      }

      if (modalBadge) {
        modalBadge.textContent = `${unreadCount} ใหม่`;
      }

      if (muteIndicator) {
        if (isNotificationsMuted) {
          muteIndicator.classList.remove("hidden");
        } else {
          muteIndicator.classList.add("hidden");
        }
      }

      const modalMuteBtn = document.getElementById("notif-modal-mute-toggle");
      if (modalMuteBtn) {
        modalMuteBtn.innerHTML = `
          <i data-lucide="${isNotificationsMuted ? 'bell-off' : 'bell'}" class="w-3.5 h-3.5"></i>
          <span>${isNotificationsMuted ? 'เปิดแจ้งเตือน' : 'ปิดแจ้งเตือน'}</span>
        `;
        modalMuteBtn.className = isNotificationsMuted
          ? "text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer bg-amber-100/60 dark:bg-amber-950/60 px-2 py-0.5 rounded-lg border border-amber-300 dark:border-amber-700"
          : "text-xs font-semibold text-slate-600 dark:text-slate-300 hover:underline flex items-center gap-1 cursor-pointer";
      }
    }

    function markNotificationAsRead(notifId) {
      const notif = notifications.find(n => n.id === notifId);
      if (notif) {
        notif.read = true;
        saveNotifications();
        updateNotificationBadgeUI();
        renderNotificationDrawer();
        if (typeof renderLoginView === 'function') renderLoginView();
      }
    }

    function markAllNotificationsAsRead() {
      notifications.forEach(n => n.read = true);
      saveNotifications();
      updateNotificationBadgeUI();
      renderNotificationDrawer();
      if (typeof renderLoginView === 'function') renderLoginView();
      showToast("อ่านการแจ้งเตือนทั้งหมดแล้ว", "info");
    }

    function clearAllNotifications() {
      if (!confirm("คุณต้องการล้างประวัติการแจ้งเตือนทั้งหมดหรือไม่?")) return;
      notifications = [];
      saveNotifications();
      updateNotificationBadgeUI();
      renderNotificationDrawer();
      if (typeof renderLoginView === 'function') renderLoginView();
      showToast("ล้างการแจ้งเตือนเรียบร้อย", "info");
    }

    function openNotificationModal() {
      const modal = document.getElementById("modal-notifications");
      const permBanner = document.getElementById("notif-permission-banner");
      if (permBanner) {
        if (typeof window !== 'undefined' && "Notification" in window && window.Notification && window.Notification.permission === "default") {
          permBanner.classList.remove("hidden");
        } else {
          permBanner.classList.add("hidden");
        }
      }
      if (modal) {
        modal.classList.remove("hidden");
        renderNotificationDrawer();
        lucide.createIcons();
      }
    }

    function closeNotificationModal() {
      const modal = document.getElementById("modal-notifications");
      if (modal) modal.classList.add("hidden");
    }

    function filterNotifications(tab) {
      currentNotifFilter = tab;
      ["all", "staff", "patient"].forEach(t => {
        const btn = document.getElementById("notif-tab-" + t);
        if (btn) {
          if (t === tab) {
            btn.className = "px-3 py-1.5 rounded-lg text-xs font-bold transition bg-white dark:bg-herbal-700 text-herbal-800 dark:text-white shadow-2xs cursor-pointer";
          } else {
            btn.className = "px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition cursor-pointer";
          }
        }
      });
      renderNotificationDrawer();
    }

    function renderNotificationDrawer() {
      const container = document.getElementById("notification-list-container");
      if (!container) return;

      let filtered = [...notifications];
      if (currentNotifFilter === "staff") {
        filtered = filtered.filter(n => n.type === "ASSISTANT_ASSIGNED" || n.targetRole === "staff" || n.targetAssistantId || n.targetAssistantNick);
      } else if (currentNotifFilter === "patient") {
        filtered = filtered.filter(n => n.type === "STATUS_CHANGED" || n.type === "NEW_BOOKING" || n.type === "CANCEL_BOOKING");
      }

      // Filter to relevant notifications for the logged in user
      filtered = filtered.filter(isNotificationForCurrentUser);

      if (filtered.length === 0) {
        container.innerHTML = `
          <div class="py-12 px-4 text-center text-slate-400 dark:text-slate-500 space-y-2">
            <div class="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center text-xl border border-slate-200 dark:border-slate-700">
              <i data-lucide="bell-off" class="w-6 h-6"></i>
            </div>
            <p class="text-xs font-bold text-slate-600 dark:text-slate-300">ไม่มีรายการแจ้งเตือนในหมวดนี้</p>
            <p class="text-[11px] text-slate-400">เมื่อมีคนไข้นัดเจาะจง เปลี่ยนสถานะ หรือยกเลิกคิว จะแจ้งเตือนที่นี่ทันที</p>
          </div>
        `;
        lucide.createIcons();
        return;
      }

      container.innerHTML = filtered.map(n => {
        let iconBg = "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800";
        let icon = "bell";

        if (n.type === "ASSISTANT_ASSIGNED") {
          iconBg = "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-200 dark:border-purple-800";
          icon = "user-check";
        } else if (n.type === "STATUS_CHANGED") {
          iconBg = "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800";
          icon = "activity";
        } else if (n.type === "CANCEL_BOOKING") {
          iconBg = "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-200 dark:border-rose-800";
          icon = "calendar-x";
        } else if (n.type === "NEW_BOOKING") {
          iconBg = "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border-sky-200 dark:border-sky-800";
          icon = "calendar-plus";
        }

        const isUnread = !n.read;
        const unreadIndicator = isUnread
          ? `<span class="w-2 h-2 rounded-full bg-rose-500 inline-block shrink-0 animate-ping"></span>`
          : '';

        const isDirectForAsst = Boolean(n.targetAssistantId || n.targetAssistantNick);
        const directBadge = isDirectForAsst
          ? `<span class="px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800 shrink-0">สำหรับคุณ</span>`
          : '';

        return `
          <div onclick="handleNotificationClick('${n.id}', '${n.appointmentId}')" class="p-3 sm:p-3.5 rounded-2xl border transition cursor-pointer flex items-start space-x-3 ${isUnread ? 'bg-amber-50/70 dark:bg-slate-800 border-amber-300 dark:border-amber-700/60 shadow-2xs' : 'bg-white dark:bg-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800'}">
            <div class="w-9 h-9 rounded-xl ${iconBg} border flex items-center justify-center shrink-0 shadow-2xs">
              <i data-lucide="${icon}" class="w-4 h-4"></i>
            </div>
            <div class="flex-grow min-w-0 space-y-1">
              <div class="flex items-center justify-between gap-1">
                <h4 class="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100 truncate flex items-center gap-1.5">
                  <span>${escapeHtml(n.title)}</span>
                  ${directBadge}
                  ${unreadIndicator}
                </h4>
                <span class="text-[10px] text-slate-400 shrink-0 font-medium">${formatRelativeTime(n.timestamp)}</span>
              </div>
              <p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">${escapeHtml(n.message)}</p>
              ${n.appointmentId ? `
                <div class="pt-1 flex items-center gap-2 text-[11px] font-bold text-herbal-700 dark:text-emerald-400">
                  <span class="inline-flex items-center gap-1 hover:underline">
                    <i data-lucide="timer" class="w-3 h-3"></i>
                    <span>ดูไทม์ไลน์เวลา & คิว</span>
                  </span>
                </div>
              ` : ''}
            </div>
          </div>
        `;
      }).join("");

      lucide.createIcons();
    }

    function handleNotificationClick(notifId, appointmentId) {
      markNotificationAsRead(notifId);
      if (appointmentId) {
        closeNotificationModal();
        openPatientTimingModal(appointmentId);
      }
    }

    function playAlertSound() {
      try {
        if (typeof playNotificationChime === "function") {
          playNotificationChime();
        }
      } catch(e) {}
    }

    function renderDeskCalendar() {
      // Safe no-op / compatibility hook for desk calendar views
      return;
    }

    function renderCustomHolidaysList() {
      if (typeof renderManageHolidays === "function") {
        renderManageHolidays();
      }
    }

    function playNotificationChime() {
      if (isNotificationsMuted || isSoundMuted) return;
      if (typeof isAudioEnabled !== 'undefined' && !isAudioEnabled) return;
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      } catch(e) {}
    }

