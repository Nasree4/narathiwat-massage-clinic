/**
 * Module 5: 05_supabase_and_sync.js
 * Description: Supabase Integration, Cloud Sync & Slot Configs
 * Generated from lines 8145 to 9850 of original index.html
 */

    /* =========================================================================
       SUPABASE DATABASE & REALTIME CLIENT INTEGRATION
       ========================================================================= */
    let supabaseClient = null;
    let realtimeChannel = null;

    const DEFAULT_SUPABASE_URL = "https://tqxmdvawxskpqteofqiq.supabase.co";
    const DEFAULT_SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxeG1kdmF3eHNrcHF0ZW9mcWlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg5NDcwNzIsImV4cCI6MjEwNDUyMzA3Mn0.5g2nItoWExFdgiTGWCUcFP43X2hmFLJCpK6HSKsEWys";

    async function applyAuthSession(session) {
      if (!session || !session.user) {
        // Only clear if currentUser was authenticated specifically via Supabase Auth
        if (currentUser && currentUser.authSource === 'supabase') {
          currentUser = null;
          clearAuthSession();
          updateAuthUI();
        }
        return;
      }

      let profile = null;
      if (supabaseClient) {
        try {
          const { data } = await supabaseClient
            .from("users")
            .select("id,auth_user_id,name,phone,email,role,active")
            .eq("auth_user_id", session.user.id)
            .maybeSingle();
          profile = data || null;
        } catch(e) {}
      }

      const metadata = session.user.user_metadata || {};
      const appRole = session.user.app_metadata && session.user.app_metadata.role;
      currentUser = {
        id: profile?.id || ("usr-" + session.user.id),
        authUserId: session.user.id,
        name: profile?.name || metadata.name || "ผู้รับบริการ",
        phone: profile?.phone || metadata.phone || "",
        email: profile?.email || session.user.email || "",
        role: profile?.role || appRole || "user",
        active: profile?.active !== false,
        authSource: 'supabase',
        loggedInAt: currentUser?.loggedInAt || new Date().toISOString()
      };
      if (!currentUser.active) {
        await supabaseClient.auth.signOut();
        currentUser = null;
        clearAuthSession();
        updateAuthUI();
        return;
      }
      saveAuthSession(currentUser, true, 'supabase');
      updateAuthUI();
    }

    async function initSupabase(retryCount = 0) {
      let savedUrl = localStorage.getItem("ttm_supabase_url");
      let savedKey = localStorage.getItem("ttm_supabase_key");

      // Fallback to official defaults if empty or invalid
      if (!savedUrl || !savedUrl.startsWith("http") || savedUrl.includes("undefined")) {
        savedUrl = DEFAULT_SUPABASE_URL;
        localStorage.setItem("ttm_supabase_url", DEFAULT_SUPABASE_URL);
      }
      if (!savedKey || savedKey.length < 50 || savedKey.includes("undefined")) {
        savedKey = DEFAULT_SUPABASE_KEY;
        localStorage.setItem("ttm_supabase_key", DEFAULT_SUPABASE_KEY);
      }

      const urlInput = document.getElementById("supabase-url-input");
      const keyInput = document.getElementById("supabase-key-input");
      if (urlInput && !urlInput.value) urlInput.value = savedUrl;
      if (keyInput && !keyInput.value) keyInput.value = savedKey;

      // If Supabase CDN library is still loading, retry up to 50 times (5 seconds)
      if (!window.supabase) {
        if (retryCount < 50) {
          setTimeout(() => initSupabase(retryCount + 1), 100);
          return;
        }
        console.warn("[Supabase] window.supabase CDN not available, operating in offline fallback mode");
        updateSupabaseStatusUI(false, "CDN โหลดไม่สำเร็จ (โหมดออฟไลน์)");
        return;
      }

      try {
        supabaseClient = window.supabase.createClient(savedUrl, savedKey, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            storage: window.localStorage
          }
        });

        updateSupabaseStatusUI(true, "เชื่อมต่อ Supabase สำเร็จ (Realtime Live ทุกเครื่อง)");

        // 1. Subscribe to Realtime Immediately
        subscribeToRealtime();

        // 2. Load all authoritative data from Cloud immediately
        loadAllDataFromSupabase(false);

        // 3. Handle Auth in background without blocking data load
        supabaseClient.auth.onAuthStateChange((event, session) => {
          if (session) {
            setTimeout(() => applyAuthSession(session), 0);
          } else if (event === 'SIGNED_OUT' && currentUser && currentUser.authSource === 'supabase') {
            setTimeout(() => applyAuthSession(null), 0);
          }
        });

        supabaseClient.auth.getSession().then(({ data }) => {
          if (data && data.session) {
            applyAuthSession(data.session);
          }
        }).catch(err => console.warn("[Supabase] getSession background warning:", err));

      } catch (err) {
        console.error("[Supabase] init error:", err);
        updateSupabaseStatusUI(false, "ตั้งค่าไม่ถูกต้อง");
      }
    }

    function updateSupabaseStatusUI(isConnected, text) {
      const badge = document.getElementById("supabase-status-badge");
      if (!badge) return;
      if (isConnected) {
        badge.innerHTML = `
          <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-xs">
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            ${text}
          </span>
        `;
      } else {
        badge.innerHTML = `
          <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <span class="w-2 h-2 rounded-full bg-amber-500"></span>
            ${text}
          </span>
        `;
      }
    }

    async function saveAndConnectSupabase() {
      if (!currentUser || currentUser.role !== 'admin') {
        showToast("🔒 เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่สามารถแก้ไขการเชื่อมต่อฐานข้อมูลได้", "error");
        return;
      }
      const url = document.getElementById("supabase-url-input").value.trim();
      const key = document.getElementById("supabase-key-input").value.trim();

      if (!url || !key) {
        showToast("กรุณากรอกทั้ง Supabase URL และ Anon Key", "warning");
        return;
      }

      localStorage.setItem("ttm_supabase_url", url);
      localStorage.setItem("ttm_supabase_key", key);

      try {
        supabaseClient = window.supabase.createClient(url, key);
        // Test query
        const { data, error } = await supabaseClient.from("assistants").select("id").limit(1);
        if (error) throw error;

        updateSupabaseStatusUI(true, "เชื่อมต่อ Supabase สำเร็จ (Realtime Live)");
        subscribeToRealtime();
        await loadAllDataFromSupabase();
        await logActivity("CONFIG_SYSTEM", "เชื่อมต่อและตั้งค่าฐานข้อมูล Supabase Cloud สำเร็จ", { url });
        showToast("เชื่อมต่อฐานข้อมูล Supabase สำเร็จเรียบร้อย!", "success");
      } catch (err) {
        console.error("Connection failed:", err);
        updateSupabaseStatusUI(false, "เชื่อมต่อไม่สำเร็จ");
        showToast("เชื่อมต่อไม่สำเร็จ: " + (err.message || "ตรวจสอบ URL หรือ Key อีกครั้ง"), "error");
      }
    }

    async function testSupabaseConnection() {
      if (!supabaseClient) {
        showToast("ยังไม่ได้เชื่อมต่อ Supabase กรุณากรอก URL และ Key แล้วกดบันทึก", "warning");
        return;
      }
      try {
        const { count, error } = await supabaseClient.from("appointments").select("id", { count: "exact", head: true });
        if (error) throw error;
        showToast(`เชื่อมต่อสมบูรณ์! พบคิวนัดหมายบน Supabase: ${count || 0} รายการ`, "success");
      } catch (err) {
        showToast("ทดสอบล้มเหลว: " + err.message, "error");
      }
    }

    let realtimeReconnectTimer = null;

    function subscribeToRealtime() {
      if (!supabaseClient) return;
      if (realtimeChannel) {
        try { supabaseClient.removeChannel(realtimeChannel); } catch(e) {}
      }

      realtimeChannel = supabaseClient
        .channel("public:clinic_changes")
        .on("postgres_changes", { event: "*", schema: "public", table: "appointments" }, payload => {
          handleRealtimeAppointmentEvent(payload);
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "assistants" }, payload => {
          handleRealtimeAssistantEvent(payload);
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "main_services" }, payload => {
          handleRealtimeMainServicesEvent(payload);
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "extra_services" }, payload => {
          handleRealtimeExtraServicesEvent(payload);
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "slot_configs" }, payload => {
          handleRealtimeSlotConfigsEvent(payload);
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "audit_logs" }, payload => {
          handleRealtimeAuditEvent(payload);
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "reviews" }, payload => {
          handleRealtimeReviewEvent(payload);
        })
        .on("broadcast", { event: "system_reset_appointments" }, payload => {
          console.log("[Realtime] Received system_reset_appointments broadcast:", payload);
          appointments = [];
          lastAppointmentsHash = "";
          const wipedAt = payload?.payload?.wiped_at || new Date().toISOString();
          try {
            localStorage.setItem("ttm_appointments", JSON.stringify([]));
            localStorage.setItem("ttm_last_system_wipe", wipedAt);
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
          } catch(e) {}
          renderDeskQueue();
          renderStatsAndShare();
          if (typeof renderPatientsList === "function") renderPatientsList();
          if (typeof renderDeskCalendar === "function") if (typeof renderDeskCalendar === "function") renderDeskCalendar();
          if (typeof updateRoomQuotaDisplay === "function") updateRoomQuotaDisplay();
          refreshActiveTabUI(typeof silent !== 'undefined' ? silent : false);
          showToast("🔄 ผู้ดูแลระบบได้ล้างข้อมูลคิวและประวัติทั้งหมดแล้ว", "info");
        })
        .subscribe(status => {
          console.log("Supabase Realtime Status:", status);
          if (status === 'SUBSCRIBED') {
            updateSupabaseStatusUI(true, "เชื่อมต่อ Supabase สำเร็จ (Realtime Live ทุกเครื่อง)");
            if (realtimeReconnectTimer) {
              clearTimeout(realtimeReconnectTimer);
              realtimeReconnectTimer = null;
            }
          } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.warn("Supabase Realtime disconnected (" + status + "), reconnecting in 3s...");
            updateSupabaseStatusUI(false, "กำลังเชื่อมต่อระบบ Realtime ใหม่...");
            if (!realtimeReconnectTimer) {
              realtimeReconnectTimer = setTimeout(() => {
                realtimeReconnectTimer = null;
                subscribeToRealtime();
                loadAllDataFromSupabase(true);
              }, 3000);
            }
          }
        });
    }

    function handleRealtimeSlotConfigsEvent(payload) {
      const { eventType, new: newRec } = payload;
      if (eventType === "INSERT" || eventType === "UPDATE") {
        if (!newRec) return;

        if (newRec.scope === "system" && newRec.config_key === "wiped_at") {
          const wipedAt = newRec.slots_json?.wiped_at;
          const lastLocalWipe = localStorage.getItem("ttm_last_system_wipe");
          if (wipedAt && (!lastLocalWipe || new Date(wipedAt) > new Date(lastLocalWipe))) {
            console.log("[Realtime] Cloud system wipe detected:", wipedAt);
            appointments = [];
            lastAppointmentsHash = "";
            try {
              localStorage.setItem("ttm_appointments", JSON.stringify([]));
              localStorage.setItem("ttm_last_system_wipe", wipedAt);
              localStorage.removeItem("ttm_status_histories");
              localStorage.removeItem("ttm_treatment_timings");
              localStorage.removeItem("ttm_deleted_appointment_ids");
              localStorage.removeItem("ttm_my_booking_ids");
              localStorage.removeItem("ttm_patient_history");
              localStorage.removeItem("ttm_patient_records");
              sessionStorage.removeItem("ttm_my_booking_ids");
              sessionStorage.removeItem("ttm_guest_phone");
            } catch(e) {}
            renderDeskQueue();
            renderStatsAndShare();
            if (typeof renderPatientsList === "function") renderPatientsList();
            if (typeof updateRoomQuotaDisplay === "function") updateRoomQuotaDisplay();
            refreshActiveTabUI(typeof silent !== 'undefined' ? silent : false);
          }
        } else if (newRec.scope === "assistants" && newRec.config_key === "master_list" && Array.isArray(newRec.slots_json) && newRec.slots_json.length > 0) {
          console.log("[Realtime] Received updated master assistants shifts from cloud:", newRec.slots_json.length);
          const cloudMap = new Map(newRec.slots_json.map(a => [a.id, a]));
          assistants = assistants.map(a => {
            const cloudAsst = cloudMap.get(a.id);
            if (cloudAsst) {
              return {
                ...a,
                shiftType: cloudAsst.shiftType || a.shiftType,
                slots: Array.isArray(cloudAsst.slots) ? cloudAsst.slots : a.slots,
                active: cloudAsst.active !== undefined ? cloudAsst.active : a.active
              };
            }
            return a;
          });
          try { localStorage.setItem("ttm_assistants", JSON.stringify(assistants)); } catch(e) {}
          if (typeof populateAssistantsDropdown === "function") {
            populateAssistantsDropdown("new-assistant-select");
            populateAssistantsDropdown("edit-assistant-select");
          }
          const manageView = document.getElementById("view-manage");
          if (manageView && !manageView.classList.contains("hidden")) {
            const isUserTyping = document.activeElement && manageView.contains(document.activeElement);
            if (!isUserTyping && typeof renderManageShifts === "function") renderManageShifts();
          }
        } else if (newRec.scope === "services" && newRec.config_key === "main_services") {
          if (Array.isArray(newRec.slots_json) && newRec.slots_json.length > 0) {
            console.log("[Realtime] Received updated main services from cloud:", newRec.slots_json.length);
            mainServicesList = newRec.slots_json;
            persistMainServices();
            renderManageServices();
            renderMainServicesOptions("main-services-booking-container");
            renderStatsAndShare();
            if (typeof refreshActiveTabUI === "function") refreshActiveTabUI(typeof silent !== 'undefined' ? silent : false);
          }
        } else if (newRec.scope === "services" && newRec.config_key === "extra_services") {
          if (Array.isArray(newRec.slots_json) && newRec.slots_json.length > 0) {
            console.log("[Realtime] Received updated extra services from cloud:", newRec.slots_json.length);
            extraServicesList = newRec.slots_json.map(item => {
              const asstPct = parsePercentage(item.asstPercent, 60);
              const target = item.target || item.target_audience || "all";
              return {
                ...item,
                asstPercent: asstPct,
                hospitalPercent: 100 - asstPct,
                target: target,
                target_audience: target
              };
            });
            persistExtraServices();
            renderManageServices();
            renderExtraServicesCheckboxes("new-extra-services-container");
            renderStatsAndShare();
            if (typeof refreshActiveTabUI === "function") refreshActiveTabUI(typeof silent !== 'undefined' ? silent : false);
          }
        } else if (newRec.scope === "holidays" && newRec.config_key === "custom_holidays") {
          if (Array.isArray(newRec.slots_json)) {
            customHolidaysList = newRec.slots_json;
            try { localStorage.setItem("ttm_custom_holidays", JSON.stringify(customHolidaysList)); } catch(e) {}
            if (typeof renderManageHolidays === "function") renderManageHolidays();
          }
        } else if (newRec.scope === "roster") {
          const isRecentLocalEdit = (Date.now() - (typeof lastRosterLocalEditTime !== 'undefined' ? lastRosterLocalEditTime : 0) < 2500);
          const rosterModal = document.getElementById("modal-assistant-roster-matrix");
          const isRosterModalOpen = rosterModal && !rosterModal.classList.contains("hidden");

          if (!isRecentLocalEdit) {
            assistantDutyRosters[newRec.config_key] = newRec.slots_json;
            try { localStorage.setItem("ttm_assistant_duty_rosters", JSON.stringify(assistantDutyRosters)); } catch(e) {}
            renderManageShifts();
            if (isRosterModalOpen && newRec.config_key === currentRosterDate) {
              if (typeof renderAssistantRosterMatrix === "function") renderAssistantRosterMatrix();
            }
          }

          if (typeof renderDeskQueue === "function") renderDeskQueue();
          if (typeof renderStatsAndShare === "function") renderStatsAndShare();
          if (typeof refreshActiveTabUI === "function") refreshActiveTabUI(true);
        } else if (newRec.scope === "daily") {
          customDailySlotConfig[newRec.config_key] = newRec.slots_json;
          try { localStorage.setItem("ttm_daily_slot_config", JSON.stringify(customDailySlotConfig)); } catch(e) {}
          const manageView = document.getElementById("view-manage");
          if (manageView && !manageView.classList.contains("hidden")) {
            const isUserTyping = document.activeElement && manageView.contains(document.activeElement);
            if (!isUserTyping && typeof renderManageSlots === "function") renderManageSlots();
          }
        } else if (newRec.scope === "monthly") {
          customMonthlySlotConfig[newRec.config_key] = newRec.slots_json;
          try { localStorage.setItem("ttm_monthly_slot_config", JSON.stringify(customMonthlySlotConfig)); } catch(e) {}
          const manageView = document.getElementById("view-manage");
          if (manageView && !manageView.classList.contains("hidden")) {
            const isUserTyping = document.activeElement && manageView.contains(document.activeElement);
            if (!isUserTyping && typeof renderManageSlots === "function") renderManageSlots();
          }
        }
      }
    }

    function handleRealtimeMainServicesEvent(payload) {
      const { eventType, new: newRec, old: oldRec } = payload;
      if (eventType === "INSERT" || eventType === "UPDATE") {
        const existing = mainServicesList.find(s => s.id === newRec.id);
        let target = "all";
        if (newRec.target_audience && typeof newRec.target_audience === 'string' && newRec.target_audience.trim()) {
          target = newRec.target_audience.trim();
        } else if (newRec.target && typeof newRec.target === 'string' && newRec.target.trim()) {
          target = newRec.target.trim();
        } else if (existing && (existing.target || existing.target_audience)) {
          target = existing.target || existing.target_audience;
        }

        const item = {
          id: newRec.id,
          name: newRec.name,
          title: newRec.title || newRec.name,
          icon: newRec.icon || (existing ? existing.icon : "💆‍♂️"),
          desc: newRec.desc || (existing ? existing.desc : ""),
          price: Number(newRec.price) || 0,
          priceLabel: newRec.price_label || (newRec.price ? `${newRec.price} บาท` : (existing ? existing.priceLabel : "บริการเฉพาะทาง")),
          durationSlots: Number(newRec.duration_slots) || (existing ? existing.durationSlots : 1),
          durationMin: Number(newRec.duration_min) || (existing ? existing.durationMin : 60),
          target: target,
          target_audience: target,
          active: newRec.active !== undefined ? newRec.active !== false : (existing ? existing.active !== false : true),
          color: newRec.color || (existing ? existing.color : "bg-herbal-100 text-herbal-800 border-herbal-200")
        };
        const idx = mainServicesList.findIndex(s => s.id === item.id);
        if (idx !== -1) {
          mainServicesList[idx] = item;
        } else {
          mainServicesList.push(item);
        }
        persistMainServices();
      } else if (eventType === "DELETE") {
        const idx = mainServicesList.findIndex(s => s.id === oldRec.id);
        if (idx !== -1) {
          mainServicesList.splice(idx, 1);
          persistMainServices();
        }
      }
      renderManageServices();
      renderMainServicesOptions("main-services-booking-container");
      renderStatsAndShare();
    }

    function handleRealtimeExtraServicesEvent(payload) {
      const { eventType, new: newRec, old: oldRec } = payload;
      if (eventType === "INSERT" || eventType === "UPDATE") {
        const existing = extraServicesList.find(s => s.id === newRec.id);
        const price = Number(newRec.price) >= 0 ? Number(newRec.price) : 0;
        let rawAsstPct = 60;
        if (newRec.asst_percent !== undefined && newRec.asst_percent !== null && newRec.asst_percent !== "") {
          rawAsstPct = newRec.asst_percent;
        } else if (existing && existing.asstPercent !== undefined) {
          rawAsstPct = existing.asstPercent;
        } else if (newRec.share60 !== undefined && newRec.share60 !== null && price > 0) {
          rawAsstPct = Math.round((Number(newRec.share60) / price) * 100);
        }
        const asstPercent = parsePercentage(rawAsstPct, 60);
        const hospitalPercent = 100 - asstPercent;
        const share60 = newRec.share60 !== undefined && newRec.share60 !== null ? Number(newRec.share60) : Math.round(price * (asstPercent / 100));

        let target = "all";
        if (newRec.target_audience && typeof newRec.target_audience === 'string' && newRec.target_audience.trim()) {
          target = newRec.target_audience.trim();
        } else if (newRec.target && typeof newRec.target === 'string' && newRec.target.trim()) {
          target = newRec.target.trim();
        } else if (existing && (existing.target || existing.target_audience)) {
          target = existing.target || existing.target_audience;
        }

        const item = {
          id: newRec.id,
          name: newRec.name,
          tag: newRec.tag || `[${newRec.name}]`,
          price: price,
          asstPercent: asstPercent,
          hospitalPercent: hospitalPercent,
          share60: share60,
          target: target,
          target_audience: target,
          twoSlots: Boolean(newRec.two_slots !== undefined ? newRec.two_slots : (existing ? existing.twoSlots : false)),
          active: newRec.active !== undefined ? newRec.active !== false : (existing ? existing.active !== false : true),
          color: newRec.color || (existing ? existing.color : "bg-slate-100 text-slate-800 border border-slate-200")
        };
        const idx = extraServicesList.findIndex(s => s.id === item.id);
        if (idx !== -1) {
          extraServicesList[idx] = item;
        } else {
          extraServicesList.push(item);
        }
        persistExtraServices();
      } else if (eventType === "DELETE") {
        const idx = extraServicesList.findIndex(s => s.id === oldRec.id);
        if (idx !== -1) {
          extraServicesList.splice(idx, 1);
          persistExtraServices();
        }
      }
      renderManageServices();
      renderExtraServicesCheckboxes("new-extra-services-container");
      renderStatsAndShare();
    }

    function handleRealtimeAuditEvent(payload) {
      const { eventType, new: newRec } = payload;
      if (eventType === "INSERT") {
        if (!auditLogs.some(l => l.id === newRec.id)) {
          auditLogs.unshift(newRec);
          const auditView = document.getElementById("subtab-audit");
          if (auditView && !auditView.classList.contains("hidden")) {
            renderAuditLogs();
          }
        }
      }
    }

    function handleRealtimeReviewEvent(payload) {
      const { eventType, new: newRec, old: oldRec } = payload;
      if (eventType === "INSERT") {
        if (!reviewsList.some(r => r.id === newRec.id)) {
          reviewsList.unshift(newRec);
          try { localStorage.setItem("ttm_reviews", JSON.stringify(reviewsList)); } catch(e) {}
          showToast(`⭐ มีการประเมินความพึงพอใจใหม่จากคุณ ${newRec.patient_name} (${newRec.rating_overall} ดาว)`, "info");
          
          const adminSubtab = document.getElementById("subtab-reviews");
          if (adminSubtab && !adminSubtab.classList.contains("hidden")) {
            renderAdminReviewsDashboard();
          }
        }
      } else if (eventType === "UPDATE") {
        const idx = reviewsList.findIndex(r => r.id === newRec.id);
        if (idx !== -1) {
          reviewsList[idx] = newRec;
          try { localStorage.setItem("ttm_reviews", JSON.stringify(reviewsList)); } catch(e) {}
          const adminSubtab = document.getElementById("subtab-reviews");
          if (adminSubtab && !adminSubtab.classList.contains("hidden")) {
            renderAdminReviewsDashboard();
          }
        }
      } else if (eventType === "DELETE") {
        const idx = reviewsList.findIndex(r => r.id === oldRec.id);
        if (idx !== -1) {
          reviewsList.splice(idx, 1);
          try { localStorage.setItem("ttm_reviews", JSON.stringify(reviewsList)); } catch(e) {}
          const adminSubtab = document.getElementById("subtab-reviews");
          if (adminSubtab && !adminSubtab.classList.contains("hidden")) {
            renderAdminReviewsDashboard();
          }
        }
      }
    }

    function mapSupabaseToAppointment(row) {
      let rawExtras = [];
      if (Array.isArray(row.extra_services)) rawExtras = row.extra_services;
      else if (typeof row.extra_services === "string") {
        try { rawExtras = JSON.parse(row.extra_services); } catch(e) { rawExtras = []; }
      }

      // Extract clean string extra services and parse cloud timing metadata (__ttm_meta__)
      let cleanExtras = [];
      let cloudMeta = null;

      (Array.isArray(rawExtras) ? rawExtras : []).forEach(item => {
        if (typeof item === "string") {
          if (item.includes('"__ttm_meta__":true') || item.includes('__ttm_meta__')) {
            try {
              const parsed = JSON.parse(item);
              if (parsed && parsed.__ttm_meta__) cloudMeta = parsed;
            } catch(e) {}
          } else {
            cleanExtras.push(item);
          }
        } else if (typeof item === "object" && item && item.__ttm_meta__) {
          cloudMeta = item;
        }
      });

      let occupied = [row.time_slot];
      if (Array.isArray(row.slots_occupied)) occupied = row.slots_occupied;
      else if (typeof row.slots_occupied === "string") {
        try { occupied = JSON.parse(row.slots_occupied); } catch(e) { occupied = [row.time_slot]; }
      }

      // Check local cache if medical_scheme is not present in row
      let scheme = (row.medical_scheme || row.scheme || row.rights || "").trim();
      if (!scheme) {
        const localApt = (Array.isArray(appointments) ? appointments : []).find(a => a.id === row.id);
        if (localApt && localApt.medicalScheme) {
          scheme = localApt.medicalScheme;
        } else {
          scheme = "บัตรทอง";
        }
      }

      // Preserve local status histories and timings across syncs
      let statusHist = [];
      try {
        const savedHistories = JSON.parse(localStorage.getItem("ttm_status_histories") || "{}");
        if (savedHistories[row.id] && Array.isArray(savedHistories[row.id])) {
          statusHist = savedHistories[row.id];
        }
      } catch(e) {}

      let timings = null;
      try {
        const savedTimings = JSON.parse(localStorage.getItem("ttm_treatment_timings") || "{}");
        if (savedTimings[row.id]) {
          timings = savedTimings[row.id];
        }
      } catch(e) {}

      const localApt = (Array.isArray(appointments) ? appointments : []).find(a => a.id === row.id);
      if (localApt) {
        if (!statusHist.length && Array.isArray(localApt.statusHistory)) statusHist = localApt.statusHistory;
        if (!timings && localApt.timings) timings = localApt.timings;
      }

      // Prioritize cloudMeta timestamps from remote device action
      let treatmentStartTime = null;
      let treatmentEndTime = null;

      if (cloudMeta) {
        if (cloudMeta.treatmentStartTime) treatmentStartTime = cloudMeta.treatmentStartTime;
        if (cloudMeta.treatmentEndTime) treatmentEndTime = cloudMeta.treatmentEndTime;
        if (cloudMeta.timings && typeof cloudMeta.timings === 'object') timings = cloudMeta.timings;
        if (Array.isArray(cloudMeta.statusHistory) && cloudMeta.statusHistory.length > 0) {
          statusHist = cloudMeta.statusHistory;
        }
      }

      if (!treatmentStartTime && localApt) treatmentStartTime = localApt.treatmentStartTime || null;
      if (!treatmentEndTime && localApt) treatmentEndTime = localApt.treatmentEndTime || null;

      if (!treatmentStartTime && timings && timings.treatmentStartTime) {
        treatmentStartTime = timings.treatmentStartTime;
      }
      if (!treatmentEndTime && timings && timings.treatmentEndTime) {
        treatmentEndTime = timings.treatmentEndTime;
      }

      // Persist unpacked metadata to local memory caches
      if (treatmentStartTime || treatmentEndTime || statusHist.length > 0 || timings) {
        try {
          const memHist = getMemStatusHistories();
          if (statusHist.length > 0) memHist[row.id] = statusHist;
          const memTimings = getMemTreatmentTimings();
          if (timings || treatmentStartTime || treatmentEndTime) {
            memTimings[row.id] = {
              ...(timings || {}),
              treatmentStartTime: treatmentStartTime || null,
              treatmentEndTime: treatmentEndTime || null
            };
          }
          scheduleSaveStatusHistories();
          scheduleSaveTreatmentTimings();
        } catch(e) {}
      }

      return {
        id: row.id,
        patientName: row.patient_name,
        citizenOrHn: row.citizen_or_hn || "-",
        phone: row.phone,
        medicalScheme: scheme,
        bookDate: row.book_date,
        timeSlot: row.time_slot,
        mainService: row.main_service,
        extraServices: cleanExtras,
        assistantId: row.assistant_id,
        assistantNick: row.assistant_nick,
        status: row.status,
        slotsOccupied: occupied,
        statusHistory: statusHist,
        timings: timings,
        treatmentStartTime: treatmentStartTime,
        treatmentEndTime: treatmentEndTime,
        clientIp: row.client_ip || "127.0.0.1",
        userAgent: row.user_agent || ""
      };
    }

    function mapAppointmentToSupabase(apt) {
      const cleanExtras = Array.isArray(apt.extraServices)
        ? apt.extraServices.filter(s => typeof s === 'string' && !s.includes('__ttm_meta__'))
        : [];

      // Pack timing and status history metadata into extra_services JSON bundle
      const meta = {
        __ttm_meta__: true,
        treatmentStartTime: apt.treatmentStartTime || null,
        treatmentEndTime: apt.treatmentEndTime || null,
        timings: apt.timings || null,
        statusHistory: Array.isArray(apt.statusHistory) ? apt.statusHistory.slice(-20) : []
      };

      const extrasWithMeta = [...cleanExtras, JSON.stringify(meta)];

      return {
        id: apt.id,
        patient_name: apt.patientName,
        citizen_or_hn: apt.citizenOrHn || "-",
        phone: apt.phone || "-",
        medical_scheme: apt.medicalScheme || "บัตรทอง",
        book_date: apt.bookDate,
        time_slot: apt.timeSlot,
        main_service: apt.mainService,
        extra_services: extrasWithMeta,
        assistant_id: apt.assistantId || "auto",
        assistant_nick: apt.assistantNick || "จัดสรรตามเหมาะสม",
        status: apt.status || "⚪ ว่าง",
        slots_occupied: apt.slotsOccupied || [apt.timeSlot]
      };
    }

    function handleRealtimeAppointmentEvent(payload) {
      const { eventType, new: newRec, old: oldRec } = payload;
      const deletedSet = getDeletedAppointmentIds();

      if (eventType === "INSERT") {
        if (!newRec || !newRec.id || deletedSet.has(String(newRec.id).trim())) return;
        const item = mapSupabaseToAppointment(newRec);
        const itemStrId = String(item.id).trim();
        if (!appointments.some(a => a && String(a.id).trim() === itemStrId)) {
          appointments.push(item);
          try { localStorage.setItem("ttm_appointments", JSON.stringify(appointments)); } catch(e) {}
          
          // Trigger notification for assistant, patient owner, and staff/admin
          if (item.assistantId && item.assistantId !== "auto" && item.assistantId !== "female" && item.assistantId !== "male") {
            addNotification({
              type: "ASSISTANT_ASSIGNED",
              title: `👤 มีคนไข้นัดเจาะจงตัวคุณ: คุณ ${item.patientName}`,
              message: `คนไข้ระบุเลือกคุณ (${item.assistantNick}) วันที่ ${formatThaiDateShort(item.bookDate)} รอบ ${formatTimeLabel(item.timeSlot)} (${item.mainService})`,
              patientName: item.patientName,
              patientPhone: item.phone || "",
              patientUserId: item.userId || item.user_id || "",
              appointmentId: item.id,
              targetAssistantId: item.assistantId,
              targetAssistantNick: item.assistantNick,
              targetRole: "staff"
            });
          } else {
            addNotification({
              type: "NEW_BOOKING",
              title: `📅 จองคิวใหม่: คุณ ${item.patientName}`,
              message: `นัดหมายวันที่ ${formatThaiDateShort(item.bookDate)} รอบ ${formatTimeLabel(item.timeSlot)} (${item.mainService})`,
              patientName: item.patientName,
              patientPhone: item.phone || "",
              patientUserId: item.userId || item.user_id || "",
              appointmentId: item.id,
              targetAssistantId: item.assistantId,
              targetAssistantNick: item.assistantNick,
              targetRole: "staff"
            });
          }
          refreshActiveTabUI(typeof silent !== 'undefined' ? silent : false);
        }
      } else if (eventType === "UPDATE") {
        if (!newRec || !newRec.id || deletedSet.has(String(newRec.id).trim())) return;
        const item = mapSupabaseToAppointment(newRec);
        const itemStrId = String(item.id).trim();
        if (inFlightStatusUpdates && inFlightStatusUpdates.has(itemStrId)) {
          const localApt = appointments.find(a => a && String(a.id).trim() === itemStrId);
          if (localApt) item.status = localApt.status;
        }
        if (inFlightAssistantUpdates && inFlightAssistantUpdates.has(itemStrId)) {
          const localApt = appointments.find(a => a && String(a.id).trim() === itemStrId);
          if (localApt) {
            item.assistantId = localApt.assistantId;
            item.assistantNick = localApt.assistantNick;
          }
        }
        const idx = appointments.findIndex(a => a && String(a.id).trim() === itemStrId);
        if (idx !== -1) {
          const oldItem = appointments[idx];
          const statusChanged = oldItem.status !== item.status;
          const assistantChanged = oldItem.assistantId !== item.assistantId;

          appointments[idx] = item;
          try { localStorage.setItem("ttm_appointments", JSON.stringify(appointments)); } catch(e) {}

          if (statusChanged && (!item.statusHistory || item.statusHistory.length <= 1)) {
            recordStatusTransition(item, item.status, "การอัปเดตแบบเรียลไทม์");
          }

          if (assistantChanged && item.assistantId && item.assistantId !== "auto" && item.assistantId !== "female" && item.assistantId !== "male") {
            addNotification({
              type: "ASSISTANT_ASSIGNED",
              title: `👤 คุณได้รับมอบหมายคนไข้ใหม่: คุณ ${item.patientName}`,
              message: `คุณได้รับการมอบหมายให้ดูแลคุณ ${item.patientName} (รอบ ${formatTimeLabel(item.timeSlot)} วันที่ ${formatThaiDateShort(item.bookDate)}) สถานะ: ${item.status}`,
              patientName: item.patientName,
              patientPhone: item.phone || "",
              patientUserId: item.userId || item.user_id || "",
              appointmentId: item.id,
              targetAssistantId: item.assistantId,
              targetAssistantNick: item.assistantNick,
              targetRole: "staff"
            });
          }
        } else {
          appointments.push(item);
          try { localStorage.setItem("ttm_appointments", JSON.stringify(appointments)); } catch(e) {}
        }
        refreshActiveTabUI(typeof silent !== 'undefined' ? silent : false);
      } else if (eventType === "DELETE") {
        const delId = oldRec ? String(oldRec.id).trim() : "";
        if (delId) {
          markAppointmentDeleted(delId);
          const idx = appointments.findIndex(a => a && String(a.id).trim() === delId);
          if (idx !== -1) {
            const oldItem = appointments[idx];
            appointments.splice(idx, 1);
            try { localStorage.setItem("ttm_appointments", JSON.stringify(appointments)); } catch(e) {}
            
            if (oldItem.assistantId && oldItem.assistantId !== "auto" && oldItem.assistantId !== "female" && oldItem.assistantId !== "male") {
              addNotification({
                type: "CANCEL_BOOKING",
                title: `❌ ยกเลิกนัดหมาย: คุณ ${oldItem.patientName}`,
                message: `คิวนัดหมายของคุณ ${oldItem.patientName} (รอบ ${formatTimeLabel(oldItem.timeSlot)} วันที่ ${formatThaiDateShort(oldItem.bookDate)}) ถูกยกเลิก`,
                patientName: oldItem.patientName,
                patientPhone: oldItem.phone || "",
                patientUserId: oldItem.userId || oldItem.user_id || "",
                appointmentId: oldItem.id,
                targetAssistantId: oldItem.assistantId,
                targetAssistantNick: oldItem.assistantNick,
                targetRole: "staff"
              });
            }
            refreshActiveTabUI(typeof silent !== 'undefined' ? silent : false);
          }
        }
      }
    }

    let lastAssistantLocalEditTime = 0;

    function handleRealtimeAssistantEvent(payload) {
      const { eventType, new: newRec, old: oldRec } = payload;
      const isRecentLocalEdit = (Date.now() - (typeof lastAssistantLocalEditTime !== 'undefined' ? lastAssistantLocalEditTime : 0) < 2500);

      if (eventType === "INSERT" || eventType === "UPDATE") {
        if (!newRec || !newRec.id) return;
        const deletedIds = getDeletedAssistantIds();
        if (deletedIds.has(newRec.id)) return;

        const idx = assistants.findIndex(a => a.id === newRec.id);
        if (idx !== -1) {
          assistants[idx] = {
            ...assistants[idx],
            ...newRec,
            active: newRec.active !== false,
            shiftType: assistants[idx].shiftType || (newRec.active !== false ? 'full' : 'off'),
            slots: assistants[idx].slots || (newRec.active !== false ? [...ALL_WORKING_SLOTS] : [])
          };
        } else {
          assistants.push({
            ...newRec,
            active: newRec.active !== false,
            shiftType: newRec.active !== false ? 'full' : 'off',
            slots: newRec.active !== false ? [...ALL_WORKING_SLOTS] : []
          });
        }
        assistants = deduplicateAssistants(assistants);
        try { localStorage.setItem("ttm_assistants", JSON.stringify(assistants)); } catch(e) {}
        populateAssistantsDropdown("new-assistant-select");
        if (!isRecentLocalEdit) {
          renderManageShifts();
        }
      } else if (eventType === "DELETE") {
        if (!oldRec || !oldRec.id) return;
        recordDeletedAssistantId(oldRec.id);
        const idx = assistants.findIndex(a => a.id === oldRec.id);
        if (idx !== -1) {
          assistants.splice(idx, 1);
          assistants = deduplicateAssistants(assistants);
          try { localStorage.setItem("ttm_assistants", JSON.stringify(assistants)); } catch(e) {}
          populateAssistantsDropdown("new-assistant-select");
          if (!isRecentLocalEdit) {
            renderManageShifts();
          }
        }
      }
    }

    // ==================== DELETED APPOINTMENTS & TOMBSTONES ====================
    function getDeletedAppointmentIds() {
      try {
        const raw = localStorage.getItem("ttm_deleted_appointment_ids");
        if (raw) {
          const arr = JSON.parse(raw);
          if (Array.isArray(arr)) return new Set(arr.map(id => String(id).trim()));
        }
      } catch(e) {}
      return new Set();
    }

    function markAppointmentDeleted(id) {
      if (!id) return;
      const strId = String(id).trim();
      const deletedSet = getDeletedAppointmentIds();
      deletedSet.add(strId);
      const arr = Array.from(deletedSet).slice(-2000);
      try {
        localStorage.setItem("ttm_deleted_appointment_ids", JSON.stringify(arr));
      } catch(e) {}
    }

    function isAppointmentDeleted(id) {
      if (!id) return false;
      const deletedSet = getDeletedAppointmentIds();
      return deletedSet.has(String(id).trim());
    }

    async function syncOfflineBookingsToCloud() {
      if (!supabaseClient) return;
      try {
        // Check if there was a system wipe on Cloud
        let cloudWipedAt = null;
        try {
          const { data: wipeConfig } = await supabaseClient
            .from("slot_configs")
            .select("slots_json")
            .eq("scope", "system")
            .eq("config_key", "wiped_at")
            .maybeSingle();
          if (wipeConfig && wipeConfig.slots_json && wipeConfig.slots_json.wiped_at) {
            cloudWipedAt = wipeConfig.slots_json.wiped_at;
          }
        } catch(e) {}

        const localLastWipe = localStorage.getItem("ttm_last_system_wipe");
        if (cloudWipedAt) {
          if (!localLastWipe || new Date(cloudWipedAt) > new Date(localLastWipe)) {
            // Stale local data before cloud wipe: clear local instead of re-uploading
            localStorage.setItem("ttm_appointments", JSON.stringify([]));
            localStorage.setItem("ttm_last_system_wipe", cloudWipedAt);
            localStorage.removeItem("ttm_status_histories");
            localStorage.removeItem("ttm_treatment_timings");
            localStorage.removeItem("ttm_deleted_appointment_ids");
            localStorage.removeItem("ttm_my_booking_ids");
            appointments = [];
            return;
          }
        }

        const deletedSet = getDeletedAppointmentIds();
        
        // 1. Sync any local deletions to Cloud
        if (deletedSet.size > 0) {
          const deletedArr = Array.from(deletedSet);
          for (let i = 0; i < deletedArr.length; i += 50) {
            const batch = deletedArr.slice(i, i + 50);
            try {
              await supabaseClient.from("appointments").delete().in("id", batch);
            } catch(e) {}
          }
        }

        const localSaved = localStorage.getItem("ttm_appointments");
        if (!localSaved) return;
        const localApts = JSON.parse(localSaved);
        if (!Array.isArray(localApts) || localApts.length === 0) return;

        // Fetch existing IDs from Cloud
        const { data: cloudList, error } = await supabaseClient
          .from("appointments")
          .select("id");
        if (error || !Array.isArray(cloudList)) return;

        const cloudIdSet = new Set(cloudList.map(item => String(item.id).trim()));
        
        // Filter unsynced: must not be in cloud, not deleted, and created after cloudWipedAt
        const unsynced = localApts.filter(a => {
          if (!a || !a.id) return false;
          const idStr = String(a.id).trim();
          if (cloudIdSet.has(idStr) || deletedSet.has(idStr)) return false;
          if (cloudWipedAt && a.createdAt && new Date(a.createdAt) < new Date(cloudWipedAt)) return false;
          return true;
        });

        if (unsynced.length > 0) {
          console.log(`[Auto-Sync] พบข้อมูลการจองในเครื่องที่ยังไม่ได้ซิงค์ ${unsynced.length} รายการ กำลังซิงค์ขึ้น Cloud...`);
          for (const apt of unsynced) {
            if (deletedSet.has(String(apt.id).trim())) continue;
            const payload = mapAppointmentToSupabase(apt);
            const { error: insErr } = await supabaseClient.from("appointments").upsert([payload]);
            if (insErr) {
              const fallback = { ...payload };
              delete fallback.medical_scheme;
              await supabaseClient.from("appointments").upsert([fallback]);
            }
          }
          console.log(`[Auto-Sync] ซิงค์คิวนัดหมาย ${unsynced.length} รายการขึ้น Cloud สำเร็จเรียบร้อย!`);
        }
      } catch (err) {
        console.warn("[Auto-Sync] ข้ามการซิงค์ออฟไลน์:", err);
      }
    }

    let lastAppointmentsHash = "";
    let lastDataFetchTime = 0;
    const inFlightStatusUpdates = new Set();
    const inFlightAssistantUpdates = new Set();
    let isUserInteractingWithDropdown = false;
    let lastDropdownInteractionTime = 0;
    let pendingDeskQueueRender = false;
    let pendingStatsRender = false;

    function isAnyDropdownActive() {
      const active = document.activeElement;
      if (active && (active.tagName === 'SELECT' || active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) {
        return true;
      }
      if (isUserInteractingWithDropdown && (Date.now() - lastDropdownInteractionTime < 60000)) {
        return true;
      }
      return false;
    }

    function extractSlotMinutes(s) {
      if (!s) return 9999;
      const clean = String(s).replace(/[^0-9:]/g, '').replace('.', ':');
      const parts = clean.split(':');
      if (parts.length >= 2) return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
      const single = parseInt(clean, 10);
      if (!isNaN(single)) return single * 60;
      return 9999;
    }

    function computeAppointmentsHash(list) {
      if (!Array.isArray(list)) return "";
      const sorted = [...list].sort((a, b) => String(a.id || '').localeCompare(String(b.id || '')));
      return sorted.map(a => `${a.id}_${a.status}_${a.assistant_id || a.assistantId}_${a.book_date || a.bookDate}_${a.time_slot || a.timeSlot}`).join(",");
    }

    async function loadAllDataFromSupabase(silent = false) {
      if (!supabaseClient) {
        if (!silent) showToast("ยังไม่ได้เชื่อมต่อระบบ Cloud Supabase", "warning");
        return;
      }
      const now = Date.now();
      if (silent && (now - lastDataFetchTime < 1200)) return;
      lastDataFetchTime = now;

      try {
        // 1. Check for system wipe timestamp on Cloud first
        try {
          const { data: wipeRec } = await supabaseClient
            .from("slot_configs")
            .select("slots_json")
            .eq("scope", "system")
            .eq("config_key", "wiped_at")
            .maybeSingle();

          if (wipeRec && wipeRec.slots_json && wipeRec.slots_json.wiped_at) {
            const cloudWipedAt = wipeRec.slots_json.wiped_at;
            const localLastWipe = localStorage.getItem("ttm_last_system_wipe");
            if (!localLastWipe || new Date(cloudWipedAt) > new Date(localLastWipe)) {
              console.log("[Supabase Sync] Cloud wipe timestamp detected:", cloudWipedAt);
              localStorage.setItem("ttm_last_system_wipe", cloudWipedAt);
              localStorage.removeItem("ttm_deleted_appointment_ids");
              localStorage.removeItem("ttm_my_booking_ids");
              localStorage.removeItem("ttm_status_histories");
              localStorage.removeItem("ttm_treatment_timings");
            }
          }
        } catch(e) {}

        // 2. Fetch Authoritative Appointments from Cloud (Stably ordered)
        const { data: aptData, error: aptErr } = await supabaseClient
          .from("appointments")
          .select("*")
          .order("book_date", { ascending: false })
          .order("created_at", { ascending: true });

        let aptsChanged = false;
        if (!aptErr && Array.isArray(aptData)) {
          const deletedSet = getDeletedAppointmentIds();
          let validCloudApts = aptData.filter(row => row && row.id && !deletedSet.has(String(row.id).trim()));

          // Preserve any in-flight local status & assistant updates so background sync never reverts active selections
          if (inFlightStatusUpdates.size > 0 || inFlightAssistantUpdates.size > 0) {
            validCloudApts = validCloudApts.map(row => {
              let updatedRow = row;
              if (inFlightStatusUpdates.has(row.id)) {
                const localApt = appointments.find(a => a.id === row.id);
                if (localApt) {
                  updatedRow = { ...updatedRow, status: localApt.status };
                }
              }
              if (inFlightAssistantUpdates.has(row.id)) {
                const localApt = appointments.find(a => a.id === row.id);
                if (localApt) {
                  updatedRow = { ...updatedRow, assistant_id: localApt.assistantId, assistant_nick: localApt.assistantNick };
                }
              }
              return updatedRow;
            });
          }

          // Deterministic stable sorting
          validCloudApts.sort((a, b) => {
            const dateCmp = (b.book_date || '').localeCompare(a.book_date || '');
            if (dateCmp !== 0) return dateCmp;
            const slotCmp = extractSlotMinutes(a.time_slot) - extractSlotMinutes(b.time_slot);
            if (slotCmp !== 0) return slotCmp;
            const tA = a.created_at || a.id || '';
            const tB = b.created_at || b.id || '';
            return String(tA).localeCompare(String(tB));
          });

          const newHash = computeAppointmentsHash(validCloudApts);
          if (newHash !== lastAppointmentsHash || !silent) {
            aptsChanged = true;
            lastAppointmentsHash = newHash;
            appointments = validCloudApts.map(mapSupabaseToAppointment);
            try { localStorage.setItem("ttm_appointments", JSON.stringify(appointments)); } catch(e) {}
          }
          if (validCloudApts.length === 0) {
            appointments = [];
            lastAppointmentsHash = "";
            try { localStorage.setItem("ttm_appointments", JSON.stringify([])); } catch(e) {}
          }
        } else if (aptErr) {
          console.warn("[Supabase Sync] Appointment fetch warning:", aptErr);
        }

        // 3. Sync Assistants (Preserving shiftType, custom slots, roles & merging local additions)
        try {
          const { data: asstData, error: asstErr } = await supabaseClient
            .from("assistants")
            .select("*")
            .order("created_at", { ascending: true });
          if (!asstErr && asstData && asstData.length > 0) {
            const deletedIds = getDeletedAssistantIds();
            const validCloudAssts = asstData.filter(a => a && a.id && !deletedIds.has(a.id));
            const localMap = new Map((assistants || []).map(a => [a.id, a]));
            const cloudMapped = validCloudAssts.map(a => {
              const local = localMap.get(a.id);
              return {
                ...a,
                active: a.active !== false,
                shiftType: (local && local.shiftType) || (a.active !== false ? 'full' : 'off'),
                slots: (local && Array.isArray(local.slots)) ? local.slots : (a.active !== false ? [...ALL_WORKING_SLOTS] : [])
              };
            });
            // Merge cloud assistants with any locally added assistants that are not yet returned
            const merged = [...cloudMapped, ...(assistants || [])];
            assistants = deduplicateAssistants(merged);
            try { localStorage.setItem("ttm_assistants", JSON.stringify(assistants)); } catch(e) {}
            if (typeof populateAssistantsDropdown === "function") {
              populateAssistantsDropdown("new-assistant-select");
              populateAssistantsDropdown("edit-assistant-select");
            }
            const manageView = document.getElementById("view-manage");
            if (!manageView || manageView.classList.contains("hidden")) {
              if (typeof renderManageShifts === "function") renderManageShifts();
            }
            if (typeof renderStaffModalList === "function") renderStaffModalList();
          }
        } catch(e) {}

        // 4. Sync Main & Extra Services
        try {
          const { data: mainData, error: mainErr } = await supabaseClient.from("main_services").select("*").order("created_at", { ascending: true });
          if (!mainErr && mainData && mainData.length > 0) {
            mainServicesList = mainData.map(m => ({
              id: m.id,
              name: m.name,
              title: m.title || m.name,
              icon: m.icon || "💆‍♂️",
              desc: m.desc || "",
              price: Number(m.price) || 0,
              priceLabel: m.price_label || m.priceLabel || (m.price ? `${m.price} บาท` : "บริการเฉพาะทาง"),
              durationSlots: Number(m.duration_slots || m.durationSlots) || 1,
              durationMin: Number(m.duration_min || m.durationMin) || 60,
              target: m.target || m.target_audience || "all",
              active: m.active !== false,
              color: m.color || "bg-herbal-100 text-herbal-800 border-herbal-200"
            }));
            persistMainServices();
          }
        } catch(e) {}

        try {
          const { data: svcData, error: svcErr } = await supabaseClient.from("extra_services").select("*").order("created_at", { ascending: true });
          if (!svcErr && svcData && svcData.length > 0) {
            extraServicesList = svcData.map(s => {
              const price = Number(s.price) || 0;
              const asstPct = parsePercentage(s.asst_percent, 60);
              return {
                id: s.id,
                name: s.name,
                tag: s.tag,
                price: price,
                asstPercent: asstPct,
                hospitalPercent: 100 - asstPct,
                share60: s.share60 !== undefined && s.share60 !== null ? Number(s.share60) : Math.round(price * (asstPct / 100)),
                target: s.target || s.target_audience || "all",
                target_audience: s.target || s.target_audience || "all",
                twoSlots: Boolean(s.two_slots),
                active: s.active !== false,
                color: s.color || "bg-slate-100 text-slate-800 border border-slate-200"
              };
            });
            persistExtraServices();
          }
        } catch(e) {}

        // 5. Sync Slot Configs, Holidays & Duty Roster Matrix
        try {
          const { data: confData } = await supabaseClient.from("slot_configs").select("*");
          if (confData) {
            confData.forEach(c => {
              if (c.scope === "daily") customDailySlotConfig[c.config_key] = c.slots_json;
              else if (c.scope === "monthly") customMonthlySlotConfig[c.config_key] = c.slots_json;
              else if (c.scope === "roster") assistantDutyRosters[c.config_key] = c.slots_json;
              else if (c.scope === "assistants" && c.config_key === "master_list" && Array.isArray(c.slots_json) && c.slots_json.length > 0) {
                // Merge master shift configs from cloud & deduplicate
                const cloudMaster = c.slots_json;
                const combined = [...(assistants || []), ...cloudMaster];
                assistants = deduplicateAssistants(combined);
                try { localStorage.setItem("ttm_assistants", JSON.stringify(assistants)); } catch(e) {}
              }
              else if (c.scope === "holidays" && c.config_key === "custom_holidays") {
                if (Array.isArray(c.slots_json)) customHolidaysList = c.slots_json;
              } else if (c.scope === "services" && c.config_key === "main_services") {
                if (Array.isArray(c.slots_json) && c.slots_json.length > 0) {
                  mainServicesList = c.slots_json;
                  persistMainServices();
                }
              } else if (c.scope === "services" && c.config_key === "extra_services") {
                if (Array.isArray(c.slots_json) && c.slots_json.length > 0) {
                  extraServicesList = c.slots_json.map(item => {
                    const asstPct = parsePercentage(item.asstPercent, 60);
                    const target = item.target || item.target_audience || "all";
                    return {
                      ...item,
                      asstPercent: asstPct,
                      hospitalPercent: 100 - asstPct,
                      target: target,
                      target_audience: target
                    };
                  });
                  persistExtraServices();
                }
              }
            });
            try { localStorage.setItem("ttm_daily_slot_config", JSON.stringify(customDailySlotConfig)); } catch(e) {}
            try { localStorage.setItem("ttm_monthly_slot_config", JSON.stringify(customMonthlySlotConfig)); } catch(e) {}
            try { localStorage.setItem("ttm_assistant_duty_rosters", JSON.stringify(assistantDutyRosters)); } catch(e) {}
            try { localStorage.setItem("ttm_custom_holidays", JSON.stringify(customHolidaysList)); } catch(e) {}
            try { localStorage.setItem("ttm_main_services", JSON.stringify(mainServicesList)); } catch(e) {}
          }
        } catch(e) {}

        // 6. Refresh UI everywhere
        refreshActiveTabUI(typeof silent !== 'undefined' ? silent : false);

        if (!silent) {
          showToast(`⚡ ซิงค์ข้อมูลกับ Cloud สำเร็จ (พบคิวนัดหมาย ${appointments.length} รายการ)`, "success");
        }

      } catch (err) {
        if (!silent) {
          console.error("Error loading data from Supabase:", err);
          showToast("ไม่สามารถดึงข้อมูลจาก Cloud ได้: " + (err.message || "กรุณาลองใหม่"), "error");
        }
      }
    }

    async function seedInitialDataToSupabase() {
      if (!supabaseClient) {
        showToast("กรุณาเชื่อมต่อ Supabase ก่อนนำเข้าข้อมูล", "warning");
        return;
      }
      showToast("กำลังนำเข้าข้อมูลเริ่มต้นขึ้น Supabase...", "info");
      try {
        // Seed Assistants
        for (const a of assistants) {
          await supabaseClient.from("assistants").upsert(a);
        }
        // Seed Services
        for (const s of extraServicesList) {
          await supabaseClient.from("extra_services").upsert({
            id: s.id,
            name: s.name,
            tag: s.tag,
            price: s.price,
            asst_percent: s.asstPercent,
            hospital_percent: s.hospitalPercent,
            share60: s.share60,
            target_audience: s.target || "all",
            two_slots: s.twoSlots,
            active: s.active,
            color: s.color
          });
        }
        // Seed Appointments
        for (const apt of appointments) {
          const payload = mapAppointmentToSupabase(apt);
          const { error } = await supabaseClient.from("appointments").upsert(payload);
          if (error) {
            const fallbackPayload = { ...payload };
            delete fallbackPayload.medical_scheme;
            await supabaseClient.from("appointments").upsert(fallbackPayload);
          }
        }
        // Seed Reviews
        for (const r of DEFAULT_REVIEWS) {
          await supabaseClient.from("reviews").upsert(r);
        }

        showToast("นำเข้าข้อมูลเริ่มต้นขึ้น Supabase สำเร็จทั้งหมดแล้ว!", "success");
      } catch (err) {
        showToast("เกิดข้อผิดพลาด: " + err.message, "error");
      }
    }

    function refreshActiveTabUI(silent = false) {
      if (silent && typeof isAnyDropdownActive === 'function' && isAnyDropdownActive()) {
        pendingDeskQueueRender = true;
        pendingStatsRender = true;
        return;
      }
      // 1. Refresh booking slot availability for main forms
      onDateChanged("new");
      onDateChanged("old");

      // 2. Refresh Wizard Step 2 visual slot picker (if wizard modal is open)
      const wizardModal = document.getElementById("modal-booking-wizard");
      if (wizardModal && !wizardModal.classList.contains("hidden")) {
        if (typeof renderWizardSlotGrid === "function") {
          renderWizardSlotGrid(wizardBookingData.bookDate || todayStr, false);
        }
      }
      // Refresh Next Appointment modal slots if open
      const nextAptModal = document.getElementById("modal-next-appointment");
      if (nextAptModal && !nextAptModal.classList.contains("hidden") && nextAptCurrentData) {
        if (typeof renderNextAptSlots === "function") {
          renderNextAptSlots(nextAptCurrentData.bookDate || todayStr);
        }
      }

      // 3. Desk Queue & Calendar (โต๊ะตรวจ)
      const deskView = document.getElementById("view-desk");
      if (deskView && !deskView.classList.contains("hidden")) {
        renderDeskQueue();
      } else if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'staff')) {
        renderDeskQueue();
      }

      // 4. Patients Registry (ทะเบียนประวัติคนไข้)
      const patientsView = document.getElementById("view-patients");
      if (patientsView && !patientsView.classList.contains("hidden")) {
        renderPatientsList();
      }

      // 5. Stats & Financial Share Reports (สถิติ & สรุปค่าบริการ)
      const statsView = document.getElementById("view-stats");
      if (statsView && !statsView.classList.contains("hidden")) {
        renderStatsAndShare();
      }

      // 6. Manage Tab (หน้าจัดการระบบ) - Smooth Non-Destructive Refresh
      const manageView = document.getElementById("view-manage");
      if (manageView && !manageView.classList.contains("hidden")) {
        const isUserTyping = document.activeElement && manageView.contains(document.activeElement) && 
          (document.activeElement.tagName === "INPUT" || document.activeElement.tagName === "SELECT" || document.activeElement.tagName === "TEXTAREA");
        
        if (!isUserTyping) {
          const activeBtn = document.querySelector(".manage-subtab-btn.border-herbal-700");
          const activeSubtabId = activeBtn ? activeBtn.id.replace("subtab-btn-", "") : "slots";
          const selDate = document.getElementById("manage-selected-date")?.value || todayStr;
          
          if (activeSubtabId === "slots" && typeof renderManageSlots === "function") renderManageSlots(selDate);
          else if (activeSubtabId === "shifts" && typeof renderManageShifts === "function") renderManageShifts(selDate);
          else if (activeSubtabId === "services" && typeof renderManageServices === "function") renderManageServices();
          else if (activeSubtabId === "holidays" && typeof renderManageHolidays === "function") renderManageHolidays();
        }
      }

      // 7. Update timing modal if active
      if (currentTimingModalAptId) {
        const apt = appointments.find(a => a.id === currentTimingModalAptId);
        if (apt) renderPatientTimingModal(apt);
      }

      lucide.createIcons();
    }

    function formatTimeLabel(slot) {
      if (!slot) return "-";
      let s = String(slot).trim();
      s = s.replace(/รอบเวลา/g, '').replace(/รอบ/g, '').replace(/น\.?/g, '').trim();
      s = s.replace(':', '.');
      return `รอบ ${s} น.`;
    }

    function formatCleanTime(slot) {
      if (!slot) return "-";
      let s = String(slot).trim();
      s = s.replace(/รอบเวลา/g, '').replace(/รอบ/g, '').replace(/น\.?/g, '').trim();
      s = s.replace(':', '.');
      return `${s} น.`;
    }

    function formatThaiDateShort(dateStr) {
      if (!dateStr) return "-";
      try {
        const parts = dateStr.split("-");
        const d = parseInt(parts[2], 10);
        const m = parseInt(parts[1], 10) - 1;
        const y = parseInt(parts[0], 10);
        const months = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
        const thaiYearShort = (y + 543) % 100;
        return `${d} ${months[m]} ${thaiYearShort}`;
      } catch(e) {
        return dateStr;
      }
    }

    function formatThaiDate(dateStr) {
      if (!dateStr) return "-";
      try {
        const parts = dateStr.split("-");
        const d = parseInt(parts[2], 10);
        const m = parseInt(parts[1], 10) - 1;
        const y = parseInt(parts[0], 10);
        const fullMonths = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
        const thaiYearFull = y + 543;
        const dateObj = new Date(dateStr + "T00:00:00");
        const days = ["วันอาทิตย์", "วันจันทร์", "วันอังคาร", "วันพุธ", "วันพฤหัสบดี", "วันศุกร์", "วันเสาร์"];
        const dayName = days[dateObj.getDay()] || "";
        return `${dayName}ที่ ${d} ${fullMonths[m]} พ.ศ. ${thaiYearFull}`;
      } catch(e) {
        return dateStr;
      }
    }

    function checkDateHoliday(dateStr) {
      if (!dateStr || typeof dateStr !== 'string') {
        return {
          isClosed: false,
          holidayType: 'unknown',
          title: 'วันที่ไม่ถูกต้อง',
          name: '',
          reason: '',
          description: '',
          slots: WEEKDAY_SLOTS
        };
      }

      const parts = dateStr.split('-');
      if (parts.length !== 3) {
        return {
          isClosed: false,
          holidayType: 'unknown',
          title: '',
          name: '',
          reason: '',
          description: '',
          slots: WEEKDAY_SLOTS
        };
      }

      const d = new Date(dateStr + "T00:00:00");
      const dayOfWeek = d.getDay(); // 0 = Sun, 6 = Sat
      const monthDay = `${parts[1]}-${parts[2]}`; // MM-DD

      // 1. Check Sunday (Closed)
      if (dayOfWeek === 0) {
        return {
          isClosed: true,
          holidayType: 'sunday',
          title: 'วันอาทิตย์ คลินิกปิดทำการ',
          name: 'วันอาทิตย์ (Sunday Closed)',
          reason: 'คลินิกแพทย์แผนไทยปิดให้บริการประจำสัปดาห์ในวันอาทิตย์',
          description: 'คลินิกแพทย์แผนไทย โรงพยาบาลนราธิวาสราชนครินทร์ ปิดทำการทุกวันอาทิตย์ กรุณาเลือกวันนัดหมายใหม่ (เปิดบริการวันจันทร์ - เสาร์)',
          slots: []
        };
      }

      // 2. Check Custom / Additional Clinic Holidays (วันหยุดเพิ่มเติม/พิเศษของคลินิก)
      const customHol = (customHolidaysList || []).find(h => h.date === dateStr);
      if (customHol) {
        const noteText = customHol.note ? ` (${customHol.note})` : '';
        return {
          isClosed: true,
          holidayType: 'custom_holiday',
          title: 'วันหยุดพิเศษ คลินิกปิดทำการ',
          name: customHol.name || 'วันหยุดพิเศษคลินิก',
          reason: `${customHol.name}${noteText}`,
          description: `คลินิกปิดทำการเนื่องจาก: ${customHol.name}${noteText} กรุณาเลือกวันนัดหมายใหม่`,
          customHoliday: customHol,
          slots: []
        };
      }

      // 3. Check Thai Public Holidays (วันหยุดนักขัตฤกษ์)
      let publicHolidayName = THAI_DYNAMIC_PUBLIC_HOLIDAYS[dateStr] || THAI_FIXED_PUBLIC_HOLIDAYS[monthDay];
      if (publicHolidayName) {
        return {
          isClosed: true,
          holidayType: 'public_holiday',
          title: 'วันหยุดนักขัตฤกษ์ คลินิกปิดทำการ',
          name: publicHolidayName,
          reason: `วันหยุดนักขัตฤกษ์: ${publicHolidayName}`,
          description: `คลินิกแพทย์แผนไทยปิดทำการเนื่องในวันหยุดนักขัตฤกษ์ (${publicHolidayName}) กรุณาเลือกวันนัดหมายใหม่`,
          slots: []
        };
      }

      // 4. Check Saturday (Open Half-Day 08:30 - 12:30 น.)
      if (dayOfWeek === 6) {
        return {
          isClosed: false,
          holidayType: 'saturday',
          title: 'วันเสาร์ (เปิดบริการครึ่งวัน)',
          name: 'วันเสาร์ (เปิดบริการ 08:30 - 12:30 น.)',
          reason: 'เปิดบริการเฉพาะรอบเช้า 08:30 - 12:30 น. (4 รอบเวลา)',
          description: 'วันเสาร์เปิดบริการครึ่งวันเช้า เวลา 08:30 - 12:30 น.',
          slots: SATURDAY_SLOTS
        };
      }

      // 5. Normal Weekday (Monday - Friday 08:00 - 19:00 น.)
      return {
        isClosed: false,
        holidayType: 'weekday',
        title: 'วันทำการปกติ (จันทร์ - ศุกร์)',
        name: 'วันทำการปกติ',
        reason: 'เปิดบริการเต็มวัน 08:00 - 19:00 น.',
        description: 'เปิดให้บริการตามปกติ',
        slots: WEEKDAY_SLOTS
      };
    }

    function getSlotsForDate(dateStr) {
      if (!dateStr) return [];
      const holCheck = checkDateHoliday(dateStr);
      if (holCheck.isClosed) return [];
      return holCheck.slots;
    }

    function openHolidayAlertModal(holResult, dateStr) {
      const modal = document.getElementById("modal-holiday-alert");
      if (!modal) return;

      const titleEl = document.getElementById("holiday-alert-title");
      const reasonEl = document.getElementById("holiday-alert-reason");
      const descEl = document.getElementById("holiday-alert-desc");
      const dateBadgeEl = document.getElementById("holiday-alert-date-badge");
      const typeBadgeEl = document.getElementById("holiday-alert-type-badge");

      if (titleEl) titleEl.textContent = holResult.title || "คลินิกปิดทำการ";
      if (reasonEl) reasonEl.textContent = holResult.name || holResult.reason || "วันหยุดคลินิก";
      if (descEl) descEl.textContent = holResult.description || "ขออภัยในความไม่สะดวก คลินิกปิดทำการในวันที่เลือก กรุณาเลือกวันนัดหมายใหม่";
      
      if (dateBadgeEl) {
        dateBadgeEl.textContent = `📅 วันที่เลือก: ${formatThaiDate(dateStr)} (${dateStr})`;
      }

      if (typeBadgeEl) {
        if (holResult.holidayType === 'sunday') {
          typeBadgeEl.className = "px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200 border border-rose-300 dark:border-rose-800";
          typeBadgeEl.textContent = "วันหยุดประจำสัปดาห์ (Sunday)";
        } else if (holResult.holidayType === 'public_holiday') {
          typeBadgeEl.className = "px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-800";
          typeBadgeEl.textContent = "วันหยุดนักขัตฤกษ์ (Public Holiday)";
        } else if (holResult.holidayType === 'custom_holiday') {
          typeBadgeEl.className = "px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200 border border-purple-300 dark:border-purple-800";
          typeBadgeEl.textContent = "วันหยุดพิเศษของคลินิก (Custom Holiday)";
        } else {
          typeBadgeEl.className = "px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border border-slate-300";
          typeBadgeEl.textContent = "คลินิกปิดทำการ";
        }
      }

      modal.classList.remove("hidden");
      lucide.createIcons();
    }

    function closeHolidayAlertModal(focusDateInput = false) {
      const modal = document.getElementById("modal-holiday-alert");
      if (modal) modal.classList.add("hidden");
      if (focusDateInput) {
        const dateInput = document.getElementById("new-book-date");
        if (dateInput) {
          dateInput.focus();
          try { dateInput.showPicker(); } catch(e) {}
        }
      }
    }

    function openSlotFullAlertModal(slot, customTitle, customDesc) {
      const modal = document.getElementById("modal-slot-full-alert");
      if (!modal) return;

      const titleEl = document.getElementById("slot-full-alert-title");
      const badgeEl = document.getElementById("slot-full-alert-badge");
      const descEl = document.getElementById("slot-full-alert-desc");

      const cleanSlot = slot ? (String(slot).replace(/รอบเวลา/g, '').replace(/รอบ/g, '').replace(/น\.?/g, '').trim()) : "-";
      const slotText = cleanSlot !== "-" ? (cleanSlot.includes('.') ? `${cleanSlot} น.` : `${cleanSlot.replace(':', '.')} น.`) : "-";

      if (titleEl) {
        titleEl.textContent = customTitle || `รอบเวลา ${slotText} คิวเต็มแล้ว กรุณาเลือกรอบอื่น`;
      }
      if (badgeEl) {
        badgeEl.textContent = `⏰ รอบเวลา: ${slotText}`;
      }
      if (descEl) {
        descEl.textContent = customDesc || "ขออภัยในความไม่สะดวก เนื่องจากในรอบเวลานี้มีผู้รับบริการจองคิวเต็มจำนวน หรือผู้ช่วยแพทย์ติดนัดหมายครบทุกท่านแล้ว กรุณาเลือกรอบเวลาอื่นที่ยังว่าง";
      }

      modal.classList.remove("hidden");
      if (typeof lucide !== "undefined" && lucide.createIcons) {
        lucide.createIcons();
      }
    }

    function closeSlotFullAlertModal() {
      const modal = document.getElementById("modal-slot-full-alert");
      if (modal) modal.classList.add("hidden");
      const wizardModal = document.getElementById("modal-booking-wizard");
      const isWizardOpen = wizardModal && !wizardModal.classList.contains("hidden");
      if (isWizardOpen && typeof currentWizardStep !== "undefined" && currentWizardStep !== 2) {
        if (typeof goToWizardStep === "function") goToWizardStep(2);
      }
    }

    function getNextSlot(currentSlot, slotList) {
      const idx = slotList.indexOf(currentSlot);
      if (idx !== -1 && idx < slotList.length - 1) {
        return slotList[idx + 1];
      }
      return null;
    }

    function showToast(msg, type = "info") {
      const box = document.getElementById("toast-box");
      if (!box) return;
      const toast = document.createElement("div");
      let bg = "bg-slate-900/95 text-slate-100 border-slate-700/90";
      let dotColor = "bg-cyan-400";
      let sizeClass = "px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl shadow-lg border";
      if (type === "success") {
        bg = "bg-emerald-950/95 text-emerald-100 border-emerald-600/80";
        dotColor = "bg-emerald-400";
      } else if (type === "warning") {
        bg = "bg-amber-950/95 text-amber-100 border-amber-500/80";
        dotColor = "bg-amber-400";
        sizeClass = "px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl shadow-xl border-2";
      } else if (type === "error") {
        bg = "bg-rose-950/95 text-rose-100 border-rose-500/80";
        dotColor = "bg-rose-400";
        sizeClass = "px-4 py-2.5 text-xs sm:text-sm font-black rounded-xl shadow-xl border-2";
      }

      toast.className = `${sizeClass} transition-all transform duration-200 opacity-0 translate-y-2 pointer-events-auto flex items-center space-x-2.5 backdrop-blur-md max-w-full break-words ${bg}`;
      toast.innerHTML = `<span class="w-2.5 h-2.5 rounded-full ${dotColor} shrink-0 animate-pulse"></span><span class="leading-snug">${msg}</span>`;
      box.appendChild(toast);

      setTimeout(() => {
        toast.classList.remove("opacity-0", "translate-y-2");
      }, 30);

      const duration = (type === "error" || type === "warning") ? 4200 : 2800;
      setTimeout(() => {
        toast.classList.add("opacity-0", "translate-y-2");
        setTimeout(() => toast.remove(), 250);
      }, duration);
    }

    function toggleAudio() {
      isAudioEnabled = !isAudioEnabled;
      const icon = document.getElementById("icon-sound");
      const label = document.getElementById("label-sound");
      if (isAudioEnabled) {
        icon.setAttribute("data-lucide", "volume-2");
        label.textContent = "เสียงเรียก: เปิด";
        showToast("เปิดเสียงเรียกคิวเรียบร้อย", "info");
      } else {
        icon.setAttribute("data-lucide", "volume-x");
        label.textContent = "เสียงเรียก: ปิด";
        showToast("ปิดเสียงเรียกคิวแล้ว", "warning");
      }
      lucide.createIcons();
    }

    function playQueueAnnouncement(patientName, timeSlot) {
      if (!isAudioEnabled) {
        showToast(`เรียกคิวคุณ ${patientName} (โหมดปิดเสียง)`, "info");
        return;
      }

      // 1. Play Hospital 2-Tone Chime (F5 -> A5) via Web Audio API
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        
        // Tone 1: High Bell (F5 698.46 Hz)
        const osc1 = audioCtx.createOscillator();
        const gain1 = audioCtx.createGain();
        osc1.type = "sine";
        osc1.frequency.setValueAtTime(698.46, audioCtx.currentTime);
        gain1.gain.setValueAtTime(0.25, audioCtx.currentTime);
        gain1.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.45);
        osc1.connect(gain1);
        gain1.connect(audioCtx.destination);
        osc1.start(audioCtx.currentTime);
        osc1.stop(audioCtx.currentTime + 0.45);

        // Tone 2: Warm Bell (A5 880 Hz)
        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.type = "sine";
        osc2.frequency.setValueAtTime(880, audioCtx.currentTime + 0.18);
        gain2.gain.setValueAtTime(0.28, audioCtx.currentTime + 0.18);
        gain2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.75);
        osc2.connect(gain2);
        gain2.connect(audioCtx.destination);
        osc2.start(audioCtx.currentTime + 0.18);
        osc2.stop(audioCtx.currentTime + 0.75);
      } catch (err) {
        console.warn("Audio Context chime notice:", err);
      }

      // 2. Thai Speech Synthesis Utterance - Calling First Name & Last Name clearly
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        setTimeout(() => {
          let timeSpoken = "";
          if (timeSlot) {
            const parts = timeSlot.split(":");
            const hour = parseInt(parts[0], 10);
            const min = parseInt(parts[1], 10);
            timeSpoken = (min === 0) ? `${hour} นาฬิกาตรง` : `${hour} นาฬิกา ${min} นาที`;
          }

          const fullName = (patientName || "").trim();
          const text = `ขอเชิญคุณ ${fullName} เข้ารับบริการรอบ ${timeSpoken} ที่โต๊ะตรวจค่ะ`;
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.lang = "th-TH";
          utterance.rate = 0.9;
          utterance.pitch = 1.0;
          
          try {
            const voices = window.speechSynthesis.getVoices();
            const thaiVoice = voices.find(v => v.lang === 'th-TH' || v.lang.startsWith('th'));
            if (thaiVoice) utterance.voice = thaiVoice;
          } catch(e) {}

          window.speechSynthesis.speak(utterance);
        }, 450);
      }

      showToast(`📢 กำลังเรียกคิว: คุณ ${patientName} (${formatTimeLabel(timeSlot)})`, "success");
    }

