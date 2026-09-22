/**
 * Module 7: 07_ui_components_and_reviews.js
 * Description: Hero Clock, Booking Toggle, Audit Logs, Patient Reviews
 * Generated from lines 10940 to 12146 of original index.html
 */

    /* =========================================================================
       HERO CLOCK & BOOKING FORM TOGGLE
       ========================================================================= */

    function updateHeroLiveClock() {
      const clockEl = document.getElementById("hero-live-clock");
      const dateEl = document.getElementById("hero-live-date");
      if (!clockEl && !dateEl) return;

      const now = new Date();
      const timeStr = now.toLocaleTimeString("th-TH", { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) + " น.";
      const dateStr = now.toLocaleDateString("th-TH", {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      if (clockEl) clockEl.textContent = timeStr;
      if (dateEl) dateEl.textContent = dateStr;
    }

    function toggleBookingForm(show) {
      const formWrapper = document.getElementById("booking-form-wrapper");
      const toggleBtnLabel = document.getElementById("btn-toggle-booking-label");
      const toggleBtnIcon = document.getElementById("btn-toggle-booking-icon");
      if (!formWrapper) return;

      const isHidden = formWrapper.classList.contains("hidden");
      const shouldShow = (show !== undefined) ? show : isHidden;

      if (shouldShow) {
        formWrapper.classList.remove("hidden");
        if (toggleBtnLabel) toggleBtnLabel.textContent = "🔽 กำลังเปิดแบบฟอร์มการจอง (กรอกข้อมูลด้านล่าง)";
        if (toggleBtnIcon) toggleBtnIcon.setAttribute("data-lucide", "chevron-up");
        lucide.createIcons();
        setTimeout(() => {
          formWrapper.scrollIntoView({ behavior: "smooth", block: "start" });
          const firstInput = document.getElementById("new-patientName");
          if (firstInput) firstInput.focus();
        }, 120);
      } else {
        formWrapper.classList.add("hidden");
        if (toggleBtnLabel) toggleBtnLabel.textContent = "✨ จองคิวนัดหมายออนไลน์ (คลิกเพื่อกรอกข้อมูล)";
        if (toggleBtnIcon) toggleBtnIcon.setAttribute("data-lucide", "chevron-down");
        lucide.createIcons();
      }
    }

    function navigateDefaultTabForUser(user) {
      if (!user) {
        switchTab("new");
        return;
      }
      if (user.role === 'admin') {
        switchTab("desk"); // Admin -> โต๊ะตรวจ
      } else if (user.role === 'staff') {
        switchTab("stats"); // Staff -> สถิติ & รายงาน
      } else {
        switchTab("new"); // User / Guest -> จองคิวนัดหมาย
      }
    }

    function switchTab(tabId, autoRenderManage = true) {
      // Role-Based Navigation Guards
      const isStaffOrAdmin = currentUser && (currentUser.role === 'staff' || currentUser.role === 'admin');
      const isAdmin = currentUser && currentUser.role === 'admin';

      if (tabId === "desk" || tabId === "patients" || tabId === "stats") {
        if (!currentUser) {
          showToast("กรุณาเข้าสู่ระบบด้วยบัญชีเจ้าหน้าที่หรือผู้ดูแลระบบ", "warning");
          openAuthModal('login');
          return;
        } else if (!isStaffOrAdmin) {
          showToast("หน้านี้สำหรับเจ้าหน้าที่ (Staff) และผู้ดูแลระบบ (Admin) เท่านั้น", "error");
          return;
        }
      }

      if (tabId === "manage") {
        if (!currentUser) {
          showToast("กรุณาเข้าสู่ระบบด้วยบัญชีผู้ดูแลระบบ (Admin)", "warning");
          openAuthModal('login');
          return;
        } else if (!isAdmin) {
          showToast("🔒 เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่สามารถเข้าหน้าจัดการและแก้ไขระบบได้", "error");
          return;
        }
      }

      document.querySelectorAll(".tab-view").forEach(v => v.classList.add("hidden"));
      document.querySelectorAll(".tab-btn").forEach(b => {
        b.classList.remove("bg-white/20", "text-white", "font-bold");
        b.classList.add("text-herbal-200");
      });

      const targetView = document.getElementById(`view-${tabId}`);
      const targetBtn = document.getElementById(`tab-${tabId}`);
      if (targetView) targetView.classList.remove("hidden");
      if (targetBtn) {
        targetBtn.classList.add("bg-white/20", "text-white", "font-bold");
        targetBtn.classList.remove("text-herbal-200");
      }

      if (tabId === "login") renderLoginView();
      if (tabId === "desk") renderDeskQueue();
      if (tabId === "patients") renderPatientsList();
      if (tabId === "stats") renderStatsAndShare();
      if (tabId === "manage" && autoRenderManage) {
        const dateInput = document.getElementById("manage-selected-date");
        if (dateInput && !dateInput.value) dateInput.value = todayStr;
        renderManageSubTab();
      }
      lucide.createIcons();
    }

    /* =========================================================================
       AUDIT LOGGING & ACTIVITY TRAIL SYSTEM
       ========================================================================= */

    let lastActivityLogHash = "";
    let lastActivityLogTime = 0;

    async function logActivity(actionType, description, details = {}) {
      const now = Date.now();
      const aptKey = details?.appointmentId || details?.aptId || "";
      const logKey = `${actionType}___${description}___${aptKey}`;

      // Anti-duplicate protection: ignore identical duplicate logs within 1500ms
      if (logKey === lastActivityLogHash && (now - lastActivityLogTime) < 1500) {
        return;
      }
      lastActivityLogHash = logKey;
      lastActivityLogTime = now;

      if (!currentClientIp || currentClientIp.includes("กำลัง") || currentClientIp === "127.0.0.1") {
        try {
          await initClientIp();
        } catch(e) {}
      }

      const userName = currentUser ? currentUser.name : "ผู้รับบริการ (Guest)";
      const userRole = currentUser ? currentUser.role : "user";
      const dev = detectClientDevice();
      const clientIp = currentClientIp || "127.0.0.1";
      
      const logDetails = {
        ...(details || {}),
        ip: clientIp,
        ip_address: clientIp,
        device: dev.deviceText,
        user_agent: dev.userAgent
      };

      const newLog = {
        id: "log-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
        user_name: userName,
        user_role: userRole,
        action_type: actionType,
        description: description,
        details: logDetails,
        created_at: new Date().toISOString()
      };

      // In-memory properties for local display & CSV export
      newLog.ip_address = clientIp;
      newLog.user_agent = dev.deviceText;

      auditLogs.unshift(newLog);
      try {
        localStorage.setItem("ttm_audit_logs", JSON.stringify(auditLogs.slice(0, 500)));
      } catch(e) {}

      if (supabaseClient) {
        try {
          // Send only schema-valid columns to Supabase audit_logs
          const supabasePayload = {
            id: newLog.id,
            user_name: newLog.user_name,
            user_role: newLog.user_role,
            action_type: newLog.action_type,
            description: newLog.description,
            details: newLog.details,
            created_at: newLog.created_at
          };
          const { error } = await supabaseClient.from("audit_logs").insert([supabasePayload]);
          if (error) {
            console.warn("Supabase audit log insert warning:", error);
          }
        } catch(err) {
          console.warn("Supabase audit log insert error:", err);
        }
      }

      const auditView = document.getElementById("subtab-audit");
      if (auditView && !auditView.classList.contains("hidden")) {
        renderAuditLogs();
      }
    }

    async function refreshAuditLogsFromSupabase(silent = false) {
      if (!supabaseClient) {
        renderAuditLogs();
        return;
      }
      if (!silent) showToast("กำลังดึงประวัติกิจกรรมล่าสุดจาก Supabase...", "info");
      try {
        const { data, error } = await supabaseClient.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(500);
        if (!error && data) {
          auditLogs = data.map(item => ({
            ...item,
            ip_address: item.ip_address || (item.details && (item.details.ip || item.details.ip_address)) || "127.0.0.1",
            user_agent: item.user_agent || (item.details && (item.details.device || item.details.user_agent)) || "Web Browser"
          }));
          try { localStorage.setItem("ttm_audit_logs", JSON.stringify(auditLogs)); } catch(e) {}
          if (!silent) showToast(`โหลดประวัติกิจกรรมสำเร็จ (${data.length} รายการ)`, "success");
        }
      } catch(e) {
        console.error("Error refreshing audit logs:", e);
      }
      renderAuditLogs();
    }

    function setAuditDateRange(mode) {
      const startEl = document.getElementById("audit-filter-start");
      const endEl = document.getElementById("audit-filter-end");
      if (!startEl || !endEl) return;

      const now = new Date();
      const formatYMD = (d) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      if (mode === 'all') {
        startEl.value = "";
        endEl.value = "";
      } else if (mode === 'today') {
        startEl.value = formatYMD(now);
        endEl.value = formatYMD(now);
      } else if (mode === '7days') {
        const past7 = new Date(now.getTime() - 7 * 86400000);
        startEl.value = formatYMD(past7);
        endEl.value = formatYMD(now);
      } else if (mode === '30days') {
        const past30 = new Date(now.getTime() - 30 * 86400000);
        startEl.value = formatYMD(past30);
        endEl.value = formatYMD(now);
      }
      updateAuditPresetButtonsUI(mode);
      renderAuditLogs();
    }

    function updateAuditPresetButtonsUI(activeMode) {
      ['all', 'today', '7days', '30days'].forEach(m => {
        const btn = document.getElementById(`btn-audit-preset-${m}`);
        if (btn) {
          if (m === activeMode) {
            btn.className = "px-2.5 py-1 rounded-lg bg-herbal-700 text-white font-bold transition shadow-2xs";
          } else {
            btn.className = "px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition";
          }
        }
      });
    }

    function resetAuditFilters() {
      const searchEl = document.getElementById("audit-filter-search");
      const actEl = document.getElementById("audit-filter-action");
      const roleEl = document.getElementById("audit-filter-role");
      const startEl = document.getElementById("audit-filter-start");
      const endEl = document.getElementById("audit-filter-end");

      if (searchEl) searchEl.value = "";
      if (actEl) actEl.value = "ALL";
      if (roleEl) roleEl.value = "ALL";
      if (startEl) startEl.value = "";
      if (endEl) endEl.value = "";

      updateAuditPresetButtonsUI('all');
      renderAuditLogs();
    }

    function renderAuditLogs() {
      const tableBody = document.getElementById("audit-logs-table-body");
      if (!tableBody) return;

      const searchKeyword = (document.getElementById("audit-filter-search")?.value || "").trim().toLowerCase();
      const selectedAction = document.getElementById("audit-filter-action")?.value || "ALL";
      const selectedRole = document.getElementById("audit-filter-role")?.value || "ALL";
      const startDate = document.getElementById("audit-filter-start")?.value;
      const endDate = document.getElementById("audit-filter-end")?.value;

      const formatLogDateYMD = (isoStr) => {
        if (!isoStr) return "";
        const d = new Date(isoStr);
        if (isNaN(d.getTime())) return (isoStr || "").substring(0, 10);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      const filtered = auditLogs.filter(log => {
        if (selectedAction !== "ALL" && log.action_type !== selectedAction) return false;
        if (selectedRole !== "ALL" && log.user_role !== selectedRole) return false;

        const logDate = formatLogDateYMD(log.created_at);

        if (startDate && logDate && logDate < startDate) return false;
        if (endDate && logDate && logDate > endDate) return false;

        if (searchKeyword) {
          const uName = (log.user_name || "").toLowerCase();
          const desc = (log.description || "").toLowerCase();
          const act = (log.action_type || "").toLowerCase();
          const ip = (log.ip_address || (log.details && (log.details.ip || log.details.ip_address)) || "").toLowerCase();
          const ua = (log.user_agent || (log.details && (log.details.device || log.details.user_agent)) || "").toLowerCase();
          const det = JSON.stringify(log.details || {}).toLowerCase();
          if (!uName.includes(searchKeyword) && !desc.includes(searchKeyword) && !act.includes(searchKeyword) && !ip.includes(searchKeyword) && !ua.includes(searchKeyword) && !det.includes(searchKeyword)) {
            return false;
          }
        }
        return true;
      });

      // Update summary mini cards
      const totalEl = document.getElementById("audit-stat-total");
      const loginsEl = document.getElementById("audit-stat-logins");
      const editsEl = document.getElementById("audit-stat-edits");
      const queuesEl = document.getElementById("audit-stat-queues");

      if (totalEl) totalEl.textContent = auditLogs.length.toLocaleString();
      if (loginsEl) loginsEl.textContent = auditLogs.filter(l => l.action_type === "LOGIN" || l.action_type === "FAILED_LOGIN").length.toLocaleString();
      if (editsEl) editsEl.textContent = auditLogs.filter(l => l.action_type === "EDIT_PATIENT" || l.action_type === "EDIT_SERVICE").length.toLocaleString();
      if (queuesEl) queuesEl.textContent = auditLogs.filter(l => ["BOOK_QUEUE", "CANCEL_QUEUE", "CHANGE_STATUS", "CHANGE_ASSISTANT"].includes(l.action_type)).length.toLocaleString();

      tableBody.innerHTML = "";
      if (filtered.length === 0) {
        tableBody.innerHTML = `
          <tr>
            <td colspan="6" class="py-10 px-4 text-center">
              <div class="flex flex-col items-center justify-center gap-2 text-slate-400">
                <i data-lucide="shield-alert" class="w-8 h-8 text-slate-300"></i>
                <div class="text-sm font-semibold text-slate-600">ไม่พบประวัติกิจกรรมตามเงื่อนไขที่เลือก</div>
                <p class="text-xs text-slate-400 max-w-sm">หากเลือกตัวกรอง "วันนี้" แล้วยังไม่มีกิจกรรมเกิดขึ้นในวันนี้ สามารถกดดูย้อนหลัง 7 วัน หรือดูทั้งหมดได้</p>
                <div class="flex items-center gap-2 mt-2">
                  <button type="button" onclick="setAuditDateRange('all')" class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition cursor-pointer">
                    <i data-lucide="list-filter" class="w-3.5 h-3.5"></i> แสดงประวัติกิจกรรมทั้งหมด (${auditLogs.length} รายการ)
                  </button>
                  <button type="button" onclick="refreshAuditLogsFromSupabase()" class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition cursor-pointer">
                    <i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i> ดึงข้อมูลล่าสุด
                  </button>
                </div>
              </div>
            </td>
          </tr>`;
        if (window.lucide) lucide.createIcons();
        return;
      }

      const actionConfig = {
        LOGIN: { text: "🔑 เข้าสู่ระบบ", class: "bg-emerald-50 text-emerald-700 border-emerald-200" },
        FAILED_LOGIN: { text: "⚠️ รหัสผ่านผิด", class: "bg-rose-50 text-rose-700 border-rose-200" },
        LOGOUT: { text: "🚪 ออกจากระบบ", class: "bg-slate-100 text-slate-600 border-slate-200" },
        REGISTER: { text: "📝 ลงทะเบียน", class: "bg-blue-50 text-blue-700 border-blue-200" },
        EDIT_PATIENT: { text: "✏️ แก้ไขคนไข้", class: "bg-amber-50 text-amber-800 border-amber-200" },
        EDIT_SERVICE: { text: "🛠️ แก้ไขบริการ", class: "bg-amber-50 text-amber-800 border-amber-200" },
        BOOK_QUEUE: { text: "📅 จองคิว", class: "bg-teal-50 text-teal-700 border-teal-200" },
        CANCEL_QUEUE: { text: "❌ ยกเลิกคิว", class: "bg-rose-50 text-rose-700 border-rose-200" },
        CHANGE_STATUS: { text: "🔄 เปลี่ยนสถานะ", class: "bg-indigo-50 text-indigo-700 border-indigo-200" },
        CHANGE_ASSISTANT: { text: "👥 จัดสรรผู้ช่วย", class: "bg-sky-50 text-sky-700 border-sky-200" },
        CONFIG_SYSTEM: { text: "⚙️ ตั้งค่าระบบ", class: "bg-purple-50 text-purple-700 border-purple-200" },
        REVIEW_SUBMITTED: { text: "⭐ ประเมินความพึงพอใจ", class: "bg-yellow-50 text-yellow-800 border-yellow-200" }
      };

      filtered.forEach(log => {
        const tr = document.createElement("tr");
        tr.className = "hover:bg-slate-50 transition";

        const d = new Date(log.created_at);
        const dateFormatted = isNaN(d.getTime()) ? "-" : d.toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "numeric" });
        const timeFormatted = isNaN(d.getTime()) ? "-" : d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

        let roleBadge = `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">User</span>`;
        if (log.user_role === "admin") {
          roleBadge = `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">🛡️ Admin</span>`;
        } else if (log.user_role === "staff") {
          roleBadge = `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">🩺 Staff</span>`;
        }

        const actInfo = actionConfig[log.action_type] || { text: log.action_type, class: "bg-slate-100 text-slate-700 border-slate-200" };
        const detailsStr = log.details && Object.keys(log.details).length > 0 ? JSON.stringify(log.details, null, 2) : "";
        const ipText = log.ip_address || (log.details && (log.details.ip || log.details.ip_address)) || "127.0.0.1";
        const deviceText = log.user_agent || (log.details && (log.details.device || log.details.user_agent)) || "Web Browser";

        tr.innerHTML = `
          <td class="py-2.5 px-3 whitespace-nowrap text-slate-600 font-mono text-[11px]">
            <div>${dateFormatted}</div>
            <div class="text-[10px] text-slate-400">${timeFormatted}</div>
          </td>
          <td class="py-2.5 px-3 whitespace-nowrap font-medium text-slate-800">
            ${escapeHtml(log.user_name || "ไม่ระบุ")}
          </td>
          <td class="py-2.5 px-3 whitespace-nowrap">
            ${roleBadge}
          </td>
          <td class="py-2.5 px-3 whitespace-nowrap">
            <div class="flex flex-col">
              <span class="inline-flex items-center gap-1 font-mono font-bold text-[11px] text-slate-700">
                <span class="w-1.5 h-1.5 rounded-full ${ipText && !ipText.includes('Local') && !ipText.includes('กำลัง') ? 'bg-emerald-500' : 'bg-slate-400'} inline-block"></span>
                🌐 ${escapeHtml(ipText)}
              </span>
              <span class="text-[10px] text-slate-400 font-medium truncate max-w-[130px]" title="${escapeHtml(deviceText)}">
                💻 ${escapeHtml(deviceText)}
              </span>
            </div>
          </td>
          <td class="py-2.5 px-3 whitespace-nowrap">
            <span class="inline-block px-2 py-0.5 rounded text-[11px] font-bold border ${actInfo.class}">
              ${actInfo.text}
            </span>
          </td>
          <td class="py-2.5 px-3 text-slate-700">
            <div class="font-medium leading-relaxed">${escapeHtml(log.description || "")}</div>
            ${detailsStr ? `
              <details class="mt-1 text-[11px] text-slate-500 cursor-pointer">
                <summary class="hover:text-herbal-700 font-medium">ดูข้อมูลเพิ่มเติม</summary>
                <pre class="mt-1 p-2 bg-slate-900 text-slate-200 rounded font-mono text-[10px] overflow-x-auto whitespace-pre-wrap">${escapeHtml(detailsStr)}</pre>
              </details>
            ` : ""}
          </td>
        `;
        tableBody.appendChild(tr);
      });
      if (window.lucide) lucide.createIcons();
    }

    function exportAuditLogsToCSV() {
      if (!auditLogs || auditLogs.length === 0) {
        showToast("ไม่มีข้อมูลประวัติกิจกรรมสำหรับส่งออก", "warning");
        return;
      }
      let csvContent = "\uFEFFวัน-เวลา,ผู้ดำเนินการ,ระดับสิทธิ์,IP Address,อุปกรณ์,ประเภทกิจกรรม,รายละเอียด,ข้อมูลเพิ่มเติม (JSON)\n";
      auditLogs.forEach(log => {
        const d = new Date(log.created_at).toLocaleString("th-TH");
        const uname = `"${(log.user_name || "").replace(/"/g, '""')}"`;
        const role = `"${(log.user_role || "").replace(/"/g, '""')}"`;
        const ip = `"${(log.ip_address || (log.details && (log.details.ip || log.details.ip_address)) || "127.0.0.1").replace(/"/g, '""')}"`;
        const ua = `"${(log.user_agent || (log.details && (log.details.device || log.details.user_agent)) || "Web Browser").replace(/"/g, '""')}"`;
        const action = `"${(log.action_type || "").replace(/"/g, '""')}"`;
        const desc = `"${(log.description || "").replace(/"/g, '""')}"`;
        const det = `"${JSON.stringify(log.details || {}).replace(/"/g, '""')}"`;
        csvContent += `${d},${uname},${role},${ip},${ua},${action},${desc},${det}\n`;
      });

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `TTM_Audit_Logs_${todayStr}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast("ส่งออกประวัติกิจกรรมเป็นไฟล์ CSV เรียบร้อยแล้ว", "success");
    }

    /* =========================================================================
       PATIENT SATISFACTION & REVIEWS SYSTEM (การประเมินความพึงพอใจและรีวิว)
       ========================================================================= */

    function renderDimensionStars(dim, val) {
      const container = document.getElementById(`star-dim-${dim}-container`);
      if (!container) return;
      let html = "";
      for (let i = 1; i <= 5; i++) {
        const active = i <= val;
        html += `
          <button type="button" onclick="setDimensionRating('${dim}', ${i})" 
            class="text-base sm:text-lg transition-transform hover:scale-125 focus:outline-none cursor-pointer ${active ? 'opacity-100 filter drop-shadow-xs' : 'opacity-30 grayscale'}" 
            title="${i} ดาว">
            ⭐
          </button>
        `;
      }
      container.innerHTML = html;
    }

    function setDimensionRating(dim, score) {
      const input = document.getElementById(`review-${dim}-rating`);
      if (input) input.value = score;
      renderDimensionStars(dim, score);
    }

    function setOverallRating(score) {
      const hiddenInput = document.getElementById("review-overall-rating");
      if (hiddenInput) hiddenInput.value = score;

      const container = document.getElementById("star-rating-overall-container");
      if (container) {
        const buttons = container.querySelectorAll(".star-btn");
        buttons.forEach((btn, idx) => {
          const val = idx + 1;
          if (val <= score) {
            btn.classList.remove("opacity-30", "grayscale", "scale-90");
            btn.classList.add("opacity-100", "scale-105");
          } else {
            btn.classList.add("opacity-30", "grayscale", "scale-90");
            btn.classList.remove("opacity-100", "scale-105");
          }
        });
      }

      const labelEl = document.getElementById("star-rating-overall-label");
      if (labelEl) {
        const labels = {
          5: "⭐⭐⭐⭐⭐ ยอดเยี่ยมมาก / ประทับใจมากที่สุด (5/5)",
          4: "⭐⭐⭐⭐ ดีมาก / พึงพอใจมาก (4/5)",
          3: "⭐⭐⭐ ปานกลาง / พอใช้ (3/5)",
          2: "⭐⭐ ต้องปรับปรุง (2/5)",
          1: "⭐ ไม่พึงพอใจ / ควรปรับปรุงเร่งด่วน (1/5)"
        };
        labelEl.textContent = labels[score] || `${score}/5 ดาว`;
      }
    }

    function initReviewModalStars() {
      setOverallRating(5);
      setDimensionRating("service", 5);
      setDimensionRating("clean", 5);
      setDimensionRating("outcome", 5);
    }

    function openReviewModal(aptId, prefill) {
      let apt = null;
      if (aptId) {
        apt = appointments.find(a => a.id === aptId);
      }
      if (!apt && prefill) {
        apt = prefill;
      }
      if (!apt && currentUser) {
        const userApts = appointments.filter(a => 
          (currentUser.phone && a.phone && a.phone.replace(/[^0-9]/g, '') === currentUser.phone.replace(/[^0-9]/g, '')) ||
          (a.patientName && currentUser.name && (a.patientName.includes(currentUser.name) || currentUser.name.includes(a.patientName)))
        );
        if (userApts.length > 0) {
          userApts.sort((a, b) => (b.bookDate || "").localeCompare(a.bookDate || ""));
          apt = userApts[0];
        }
      }

      const pName = apt ? (apt.patientName || "") : (currentUser ? currentUser.name : "");
      const pPhone = apt ? (apt.phone || "") : (currentUser ? (currentUser.phone || "") : "");
      let asstName = "เจ้าหน้าที่คลินิก";
      let asstId = "";

      if (apt) {
        asstId = apt.assistantId || "";
        if (apt.assistantNick && apt.assistantNick !== "auto" && apt.assistantNick !== "ไม่ระบุ") {
          asstName = apt.assistantNick;
        } else if (apt.assistantName) {
          asstName = apt.assistantName;
        }
      }

      let serviceName = "นวดประคบสมุนไพรและหัตถการ";
      if (apt) {
        if (apt.mainService && apt.mainService !== "-" && apt.mainService !== "บริการเสริม") {
          serviceName = apt.mainService + ((apt.extraServices && apt.extraServices.length) ? ` + ${apt.extraServices.join(", ")}` : "");
        } else if (apt.extraServices && apt.extraServices.length > 0) {
          serviceName = `บริการเสริม: ${apt.extraServices.join(", ")}`;
        } else {
          serviceName = "บริการแผนไทย";
        }
      }

      const elAptId = document.getElementById("review-apt-id");
      const elPName = document.getElementById("review-patient-name");
      const elPhone = document.getElementById("review-phone");
      const elAsstId = document.getElementById("review-asst-id");
      const elAsstName = document.getElementById("review-asst-name");
      const elSvcName = document.getElementById("review-service-name");
      const elComment = document.getElementById("review-comment");

      if (elAptId) elAptId.value = apt ? (apt.id || "") : "";
      if (elPName) elPName.value = pName;
      if (elPhone) elPhone.value = pPhone;
      if (elAsstId) elAsstId.value = asstId;
      if (elAsstName) elAsstName.value = asstName;
      if (elSvcName) elSvcName.value = serviceName;
      if (elComment) elComment.value = "";

      // Default NPS radio to recommend
      const defaultNps = document.querySelector('input[name="nps_recommend"][value="recommend"]');
      if (defaultNps) defaultNps.checked = true;

      // Fill Context Box
      const contextEl = document.getElementById("review-modal-context");
      if (contextEl) {
        contextEl.innerHTML = `
          <div class="flex items-center space-x-2">
            <span class="font-bold text-emerald-900">👤 คนไข้: ${escapeHtml(pName || "ผู้รับบริการ")}</span>
            ${pPhone ? `<span class="text-slate-500 font-mono">(${escapeHtml(pPhone)})</span>` : ""}
          </div>
          <div class="flex items-center space-x-2 text-slate-600">
            <span>🩺 บริการ: <strong class="text-emerald-800">${escapeHtml(serviceName)}</strong></span>
            <span>•</span>
            <span>👥 ผู้ช่วยฯ: <strong class="text-emerald-800">${escapeHtml(asstName)}</strong></span>
          </div>
        `;
      }

      initReviewModalStars();

      const modal = document.getElementById("modal-review-assessment");
      if (modal) modal.classList.remove("hidden");
      lucide.createIcons();
    }

    function openReviewModalFromSlip() {
      if (lastBookedAppointment) {
        openReviewModal(lastBookedAppointment.id, lastBookedAppointment);
      } else {
        openReviewModal();
      }
    }

    function closeReviewModal() {
      const modal = document.getElementById("modal-review-assessment");
      if (modal) modal.classList.add("hidden");
    }

    async function handleReviewSubmit(event) {
      event.preventDefault();

      const aptId = document.getElementById("review-apt-id")?.value || `apt-manual-${Date.now()}`;
      let pName = (document.getElementById("review-patient-name")?.value || "").trim();
      let phone = (document.getElementById("review-phone")?.value || "").trim();
      const asstId = document.getElementById("review-asst-id")?.value || "";
      const asstName = document.getElementById("review-asst-name")?.value || "เจ้าหน้าที่คลินิก";
      const serviceName = document.getElementById("review-service-name")?.value || "บริการแพทย์แผนไทย";
      const ratingOverall = parseInt(document.getElementById("review-overall-rating")?.value, 10) || 5;
      const ratingService = parseInt(document.getElementById("review-service-rating")?.value, 10) || 5;
      const ratingClean = parseInt(document.getElementById("review-clean-rating")?.value, 10) || 5;
      const ratingOutcome = parseInt(document.getElementById("review-outcome-rating")?.value, 10) || 5;
      const comment = (document.getElementById("review-comment")?.value || "").trim();
      
      const npsRadio = document.querySelector('input[name="nps_recommend"]:checked');
      const npsRecommend = npsRadio ? npsRadio.value : "recommend";

      if (!pName) {
        if (currentUser) {
          pName = currentUser.name;
          phone = currentUser.phone || phone;
        } else {
          pName = "ผู้รับบริการทั่วไป";
        }
      }

      const newReview = {
        id: "rev-" + Date.now(),
        appointment_id: aptId,
        patient_name: pName,
        phone: phone,
        assistant_id: asstId,
        assistant_name: asstName,
        service_name: serviceName,
        rating_overall: ratingOverall,
        rating_service: ratingService,
        rating_cleanliness: ratingClean,
        rating_outcome: ratingOutcome,
        nps_recommend: npsRecommend,
        comment: comment,
        created_at: new Date().toISOString()
      };

      reviewsList.unshift(newReview);
      try {
        localStorage.setItem("ttm_reviews", JSON.stringify(reviewsList));
      } catch(e) { console.error(e); }

      await logActivity(
        "REVIEW_SUBMITTED",
        `ผู้รับบริการประเมินความพึงพอใจ: ${newReview.patient_name} ให้คะแนน ${ratingOverall} ดาว`,
        { rating: ratingOverall, service: serviceName, assistant: asstName, nps: npsRecommend }
      );

      // Sync to Supabase
      if (supabaseClient) {
        try {
          await supabaseClient.from("reviews").insert([newReview]);
        } catch(err) {
          console.warn("Error inserting review to Supabase:", err);
        }
      }

      closeReviewModal();
      showToast("ขอบพระคุณสำหรับคะแนนประเมินและความคิดเห็นอันมีค่าครับ ⭐⭐⭐⭐⭐", "success");

      // Re-render admin dashboard if active
      const adminReviewsSubtab = document.getElementById("subtab-reviews");
      if (adminReviewsSubtab && !adminReviewsSubtab.classList.contains("hidden")) {
        renderAdminReviewsDashboard();
      }

      // Re-render login view if on user profile
      const loginView = document.getElementById("view-login");
      if (loginView && !loginView.classList.contains("hidden")) {
        renderLoginView();
      }
    }

    function renderAdminReviewsDashboard() {
      const subtab = document.getElementById("subtab-reviews");
      if (!subtab) return;

      // 1. Populate assistant filter dropdown
      const asstSelect = document.getElementById("review-filter-assistant");
      if (asstSelect) {
        const currentVal = asstSelect.value;
        asstSelect.innerHTML = `<option value="ALL">👥 ผู้ช่วยฯ: ทั้งหมด</option>`;
        assistants.forEach(a => {
          const opt = document.createElement("option");
          opt.value = a.id;
          opt.textContent = `${a.nickname || a.name} (${a.name})`;
          asstSelect.appendChild(opt);
        });
        asstSelect.value = currentVal || "ALL";
      }

      // 2. Metrics calculation
      const total = reviewsList.length;
      let avgOverall = 0;
      let count5Star = 0;
      let countRecommend = 0;
      let sumService = 0;
      let sumClean = 0;
      let sumOutcome = 0;

      const starCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

      if (total > 0) {
        let sumOverall = 0;
        reviewsList.forEach(r => {
          const score = Number(r.rating_overall) || 5;
          sumOverall += score;
          if (starCounts[score] !== undefined) starCounts[score]++;
          if (score === 5) count5Star++;
          if (r.nps_recommend === "recommend") countRecommend++;
          sumService += (Number(r.rating_service) || score);
          sumClean += (Number(r.rating_cleanliness) || score);
          sumOutcome += (Number(r.rating_outcome) || score);
        });
        avgOverall = (sumOverall / total).toFixed(1);
      }

      const percent5Star = total > 0 ? Math.round((count5Star / total) * 100) : 0;
      const percentRecommend = total > 0 ? Math.round((countRecommend / total) * 100) : 0;
      const avgService = total > 0 ? (sumService / total).toFixed(1) : "0.0";
      const avgClean = total > 0 ? (sumClean / total).toFixed(1) : "0.0";
      const avgOutcome = total > 0 ? (sumOutcome / total).toFixed(1) : "0.0";

      // Update summary cards
      const elAvgScore = document.getElementById("review-stat-avg-score");
      const elAvgStars = document.getElementById("review-stat-avg-stars");
      const elTotalCount = document.getElementById("review-stat-total-count");
      const el5StarPct = document.getElementById("review-stat-5star-percent");
      const el5StarCnt = document.getElementById("review-stat-5star-count");
      const elRecRate = document.getElementById("review-stat-recommend-rate");

      if (elAvgScore) elAvgScore.textContent = total > 0 ? avgOverall : "0.0";
      if (elAvgStars) {
        const starNum = Math.round(Number(avgOverall)) || 5;
        elAvgStars.textContent = "⭐".repeat(starNum);
      }
      if (elTotalCount) elTotalCount.textContent = total.toLocaleString();
      if (el5StarPct) el5StarPct.textContent = `${percent5Star}%`;
      if (el5StarCnt) el5StarCnt.textContent = `${count5Star} จาก ${total} รายการ`;
      if (elRecRate) elRecRate.textContent = `${percentRecommend}%`;

      // Star distribution progress bars
      const starBarsContainer = document.getElementById("review-star-distribution-bars");
      if (starBarsContainer) {
        let barsHtml = "";
        [5, 4, 3, 2, 1].forEach(star => {
          const count = starCounts[star] || 0;
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          const colors = {
            5: "bg-emerald-500",
            4: "bg-teal-500",
            3: "bg-amber-400",
            2: "bg-orange-400",
            1: "bg-rose-500"
          };
          barsHtml += `
            <div class="flex items-center space-x-2 text-xs">
              <span class="w-12 font-bold text-slate-700 flex items-center gap-1">${star} ⭐</span>
              <div class="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div class="${colors[star]} h-2.5 rounded-full transition-all duration-500" style="width: ${pct}%"></div>
              </div>
              <span class="w-16 text-right text-[11px] font-semibold text-slate-500">${count} (${pct}%)</span>
            </div>
          `;
        });
        starBarsContainer.innerHTML = barsHtml;
      }

      // Dimension average scores
      const elScoreDimService = document.getElementById("review-score-dim-service");
      const elBarDimService = document.getElementById("review-bar-dim-service");
      const elScoreDimClean = document.getElementById("review-score-dim-clean");
      const elBarDimClean = document.getElementById("review-bar-dim-clean");
      const elScoreDimOutcome = document.getElementById("review-score-dim-outcome");
      const elBarDimOutcome = document.getElementById("review-bar-dim-outcome");

      if (elScoreDimService) elScoreDimService.textContent = `${avgService} / 5.0`;
      if (elBarDimService) elBarDimService.style.width = `${(Number(avgService) / 5) * 100}%`;

      if (elScoreDimClean) elScoreDimClean.textContent = `${avgClean} / 5.0`;
      if (elBarDimClean) elBarDimClean.style.width = `${(Number(avgClean) / 5) * 100}%`;

      if (elScoreDimOutcome) elScoreDimOutcome.textContent = `${avgOutcome} / 5.0`;
      if (elBarDimOutcome) elBarDimOutcome.style.width = `${(Number(avgOutcome) / 5) * 100}%`;

      // Assistant Ranking Cards
      const rankingContainer = document.getElementById("review-assistants-ranking-list");
      if (rankingContainer) {
        if (assistants.length === 0) {
          rankingContainer.innerHTML = `<div class="col-span-full text-center py-4 text-xs text-slate-400">ไม่มีข้อมูลผู้ช่วยแพทย์</div>`;
        } else {
          const asstStats = assistants.map(a => {
            const asstReviews = reviewsList.filter(r => 
              r.assistant_id === a.id || 
              (r.assistant_name && (r.assistant_name.includes(a.nickname) || r.assistant_name.includes(a.name)))
            );
            const count = asstReviews.length;
            let avg = 0;
            if (count > 0) {
              const sum = asstReviews.reduce((acc, cur) => acc + (Number(cur.rating_overall) || 5), 0);
              avg = (sum / count).toFixed(1);
            }
            return { asst: a, count, avg: Number(avg) };
          });

          asstStats.sort((a, b) => b.avg - a.avg || b.count - a.count);

          let rankingHtml = "";
          asstStats.forEach((stat, idx) => {
            const medals = ["🥇", "🥈", "🥉", "🏅"];
            const medal = idx < 4 ? medals[idx] : "⭐";
            rankingHtml += `
              <div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-amber-300 hover:bg-amber-50/30 transition shadow-2xs space-y-2">
                <div class="flex items-start justify-between">
                  <div class="flex items-center space-x-2">
                    <span class="text-xl">${medal}</span>
                    <div>
                      <h6 class="text-xs font-bold text-slate-800">${escapeHtml(stat.asst.nickname || stat.asst.name)}</h6>
                      <p class="text-[10px] text-slate-500 truncate max-w-[120px]">${escapeHtml(stat.asst.name)}</p>
                    </div>
                  </div>
                  <div class="text-right">
                    <div class="flex items-center text-xs font-black text-amber-600">
                      <span>${stat.avg > 0 ? stat.avg.toFixed(1) : "-"}</span>
                      <span class="text-[10px] text-amber-400 ml-0.5">⭐</span>
                    </div>
                    <div class="text-[10px] text-slate-400 font-medium">${stat.count} รีวิว</div>
                  </div>
                </div>
                <div class="w-full bg-slate-200/60 rounded-full h-1.5 overflow-hidden">
                  <div class="bg-amber-500 h-1.5 rounded-full" style="width: ${stat.avg > 0 ? (stat.avg / 5) * 100 : 0}%"></div>
                </div>
              </div>
            `;
          });
          rankingContainer.innerHTML = rankingHtml;
        }
      }

      // 3. Render reviews list
      renderAdminReviewsList();
      lucide.createIcons();
    }

    function renderAdminReviewsList() {
      const container = document.getElementById("admin-reviews-feed");
      if (!container) return;

      const keyword = (document.getElementById("review-filter-search")?.value || "").trim().toLowerCase();
      const ratingFilter = document.getElementById("review-filter-rating")?.value || "ALL";
      const asstFilter = document.getElementById("review-filter-assistant")?.value || "ALL";

      const filtered = reviewsList.filter(r => {
        if (ratingFilter !== "ALL" && String(r.rating_overall) !== ratingFilter) return false;
        if (asstFilter !== "ALL") {
          const matchesId = r.assistant_id === asstFilter;
          const targetAsst = assistants.find(a => a.id === asstFilter);
          const matchesName = targetAsst && r.assistant_name && (r.assistant_name.includes(targetAsst.nickname) || r.assistant_name.includes(targetAsst.name));
          if (!matchesId && !matchesName) return false;
        }

        if (keyword) {
          const pName = (r.patient_name || "").toLowerCase();
          const phone = (r.phone || "").toLowerCase();
          const asst = (r.assistant_name || "").toLowerCase();
          const svc = (r.service_name || "").toLowerCase();
          const comment = (r.comment || "").toLowerCase();
          if (!pName.includes(keyword) && !phone.includes(keyword) && !asst.includes(keyword) && !svc.includes(keyword) && !comment.includes(keyword)) {
            return false;
          }
        }
        return true;
      });

      if (filtered.length === 0) {
        container.innerHTML = `
          <div class="text-center py-10 bg-slate-50 rounded-2xl border border-slate-200 text-slate-400 space-y-2">
            <div class="text-3xl">🔍</div>
            <p class="text-xs font-semibold">ไม่พบข้อมูลการประเมินความพึงพอใจตามเงื่อนไขที่เลือก</p>
          </div>
        `;
        return;
      }

      let html = "";
      filtered.forEach(rev => {
        const d = new Date(rev.created_at);
        const dateFormatted = isNaN(d.getTime()) ? "-" : d.toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "numeric" });
        const timeFormatted = isNaN(d.getTime()) ? "" : d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });

        const npsConfig = {
          recommend: { label: "😍 แนะนำอย่างยิ่ง", class: "bg-emerald-50 text-emerald-700 border-emerald-200" },
          neutral: { label: "😐 อาจจะแนะนำ", class: "bg-amber-50 text-amber-700 border-amber-200" },
          not_recommend: { label: "🙁 ไม่แนะนำ", class: "bg-rose-50 text-rose-700 border-rose-200" }
        };
        const npsBadge = npsConfig[rev.nps_recommend] || npsConfig.recommend;

        const starsStr = "⭐".repeat(Number(rev.rating_overall) || 5);

        html += `
          <div class="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 hover:border-amber-300 transition shadow-2xs space-y-3">
            <!-- Top Info Row -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
              <div class="flex items-center space-x-3">
                <div class="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-lg border border-amber-200 shadow-inner shrink-0">
                  ${rev.rating_overall}
                </div>
                <div>
                  <div class="flex items-center space-x-2">
                    <h5 class="text-xs sm:text-sm font-bold text-slate-900">${escapeHtml(rev.patient_name || "ผู้รับบริการ")}</h5>
                    ${rev.phone ? `<span class="text-[11px] text-slate-500 font-mono">(${escapeHtml(rev.phone)})</span>` : ""}
                  </div>
                  <div class="flex items-center space-x-2 text-[11px] text-slate-400 mt-0.5">
                    <span>📅 ${dateFormatted} ${timeFormatted} น.</span>
                  </div>
                </div>
              </div>

              <div class="flex items-center space-x-2 shrink-0">
                <span class="text-amber-400 text-sm tracking-wider">${starsStr}</span>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold border ${npsBadge.class}">${npsBadge.label}</span>
                ${currentUser && currentUser.role === 'admin' ? `
                  <button onclick="deleteReviewByAdmin('${rev.id}')" class="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition" title="ลบรีวิวนี้">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                  </button>
                ` : ""}
              </div>
            </div>

            <!-- Service & Assistant tags -->
            <div class="flex flex-wrap items-center gap-2 text-xs">
              <span class="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 font-medium flex items-center gap-1 border border-slate-200/80">
                <i data-lucide="stethoscope" class="w-3.5 h-3.5 text-slate-500"></i>
                <span>บริการ: <strong>${escapeHtml(rev.service_name || "-")}</strong></span>
              </span>
              <span class="px-2.5 py-1 rounded-xl bg-herbal-50 text-herbal-800 font-medium flex items-center gap-1 border border-herbal-200">
                <i data-lucide="user-check" class="w-3.5 h-3.5 text-herbal-600"></i>
                <span>ผู้ช่วยฯ: <strong>${escapeHtml(rev.assistant_name || "ไม่ระบุ")}</strong></span>
              </span>
            </div>

            <!-- Dimension mini scores -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl text-[11px] text-slate-600 border border-slate-200/70">
              <div>🩺 การบริการ: <strong class="text-emerald-700">${rev.rating_service || rev.rating_overall}/5</strong> ⭐</div>
              <div>🌿 ความสะอาด: <strong class="text-blue-700">${rev.rating_cleanliness || rev.rating_overall}/5</strong> ⭐</div>
              <div>💆 ผลการรักษา: <strong class="text-purple-700">${rev.rating_outcome || rev.rating_overall}/5</strong> ⭐</div>
            </div>

            <!-- Comment Quote -->
            ${rev.comment ? `
              <div class="p-3 rounded-xl bg-amber-50/60 border border-amber-200/70 text-xs text-amber-950 flex items-start space-x-2">
                <span class="text-amber-500 font-bold text-base leading-none">“</span>
                <p class="italic leading-relaxed flex-1">${escapeHtml(rev.comment)}</p>
                <span class="text-amber-500 font-bold text-base leading-none">”</span>
              </div>
            ` : ""}
          </div>
        `;
      });

      container.innerHTML = html;
      lucide.createIcons();
    }

    async function deleteReviewByAdmin(reviewId) {
      if (!currentUser || currentUser.role !== 'admin') {
        showToast("เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่สามารถลบรีวิวได้", "error");
        return;
      }

      if (!confirm("คุณต้องการลบข้อมูลการประเมินนี้ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้")) {
        return;
      }

      const idx = reviewsList.findIndex(r => r.id === reviewId);
      const deletedReview = idx !== -1 ? reviewsList[idx] : null;

      if (idx !== -1) {
        reviewsList.splice(idx, 1);
        try {
          localStorage.setItem("ttm_reviews", JSON.stringify(reviewsList));
        } catch(e) {}
      }

      if (supabaseClient) {
        try {
          await supabaseClient.from("reviews").delete().eq("id", reviewId);
        } catch(err) {
          console.warn("Supabase delete review error:", err);
        }
      }

      await logActivity(
        "CONFIG_SYSTEM",
        `ผู้ดูแลระบบลบการประเมินความพึงพอใจ: ${deletedReview ? deletedReview.patient_name : reviewId}`,
        { reviewId }
      );

      showToast("ลบข้อมูลการประเมินความพึงพอใจเรียบร้อยแล้ว", "success");
      renderAdminReviewsDashboard();
    }

    function exportReviewsToCSV() {
      if (!reviewsList || reviewsList.length === 0) {
        showToast("ไม่มีข้อมูลการประเมินสำหรับส่งออก", "warning");
        return;
      }

      let csv = "\uFEFFรหัสรีวิว,วันที่-เวลา,ชื่อคนไข้,เบอร์โทรศัพท์,ผู้ช่วยแพทย์แผนไทย,บริการ,คะแนนภาพรวม(ดาว),คะแนนการบริการ,คะแนนความสะอาด,คะแนนผลการรักษา,การแนะนำบอกต่อ(NPS),ข้อคิดเห็นและข้อเสนอแนะ\n";

      reviewsList.forEach(r => {
        const d = new Date(r.created_at).toLocaleString("th-TH");
        const id = `"${(r.id || "").replace(/"/g, '""')}"`;
        const name = `"${(r.patient_name || "").replace(/"/g, '""')}"`;
        const phone = `"${(r.phone || "").replace(/"/g, '""')}"`;
        const asst = `"${(r.assistant_name || "").replace(/"/g, '""')}"`;
        const svc = `"${(r.service_name || "").replace(/"/g, '""')}"`;
        const overall = r.rating_overall || 5;
        const sService = r.rating_service || overall;
        const sClean = r.rating_cleanliness || overall;
        const sOutcome = r.rating_outcome || overall;
        const nps = `"${r.nps_recommend === 'recommend' ? 'แนะนำอย่างยิ่ง' : (r.nps_recommend === 'neutral' ? 'อาจจะแนะนำ' : 'ไม่แนะนำ')}"`;
        const comment = `"${(r.comment || "").replace(/"/g, '""')}"`;

        csv += `${id},${d},${name},${phone},${asst},${svc},${overall},${sService},${sClean},${sOutcome},${nps},${comment}\n`;
      });

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `TTM_Satisfaction_Reviews_${todayStr}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast("ส่งออกรายงานการประเมินความพึงพอใจเป็น CSV เรียบร้อยแล้ว", "success");
    }

    function escapeHtml(str) {
      if (typeof str !== 'string') return str;
      return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
    }

    function renderMainServicesOptions(containerId = "main-services-booking-container") {
      const container = document.getElementById(containerId);
      if (!container) return;
      container.innerHTML = "";

      const isStaffOrAdmin = Boolean(currentUser && (currentUser.role === 'staff' || currentUser.role === 'admin'));
      const activeList = mainServicesList.filter(s => s.active !== false);

      if (activeList.length === 0) {
        container.innerHTML = `<div class="col-span-2 text-center text-slate-400 py-3 text-xs">ไม่มีรายการหัตถการหลักในระบบ</div>`;
        return;
      }

      activeList.forEach(svc => {
        const target = (svc.target || svc.target_audience || 'all').trim().toLowerCase();
        if (target === 'staff_only' && !isStaffOrAdmin) return;

        const staffBadge = target === 'staff_only'
          ? `<span class="text-[10px] font-bold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800/60">🩺 เฉพาะ จนท.</span>`
          : '';

        const priceText = svc.priceLabel || (svc.price ? `${svc.price} บาท` : 'บริการเฉพาะทาง');
        const durationText = `${svc.durationSlots || 1} รอบเวลา (${svc.durationMin || (svc.durationSlots === 2 ? 120 : 60)} นาที)`;
        const isPurple = svc.name.includes("หลังคลอด") || (svc.color && svc.color.includes("purple"));
        const cardBorderHover = isPurple ? "hover:border-purple-400 has-[:checked]:border-purple-600 has-[:checked]:bg-purple-50/80 dark:has-[:checked]:bg-purple-950/40 has-[:checked]:ring-purple-500" : "hover:border-herbal-400 has-[:checked]:border-herbal-600 has-[:checked]:bg-herbal-50/80 dark:has-[:checked]:bg-herbal-950/40 has-[:checked]:ring-herbal-500";
        const iconBg = isPurple ? "bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300" : "bg-herbal-100 dark:bg-emerald-950/80 text-herbal-800 dark:text-emerald-300";
        const accentRadio = isPurple ? "accent-purple-700 text-purple-700 focus:ring-purple-500" : "accent-herbal-700 text-herbal-700 focus:ring-herbal-500";
        const priceBg = isPurple ? "text-purple-800 dark:text-purple-300 bg-purple-100/70 dark:bg-purple-950/70 border-purple-200/60 dark:border-purple-800/50" : "text-herbal-800 dark:text-emerald-300 bg-herbal-100/70 dark:bg-emerald-950/70 border-herbal-200/60 dark:border-emerald-800/50";

        const label = document.createElement("label");
        label.className = `relative flex flex-col justify-between p-3.5 border-2 border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer transition-all bg-white dark:bg-slate-800/90 ${cardBorderHover} has-[:checked]:ring-2 shadow-sm`;
        label.innerHTML = `
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <div class="flex items-center space-x-2">
                <span class="p-1.5 ${iconBg} rounded-lg text-lg">${svc.icon || '💆‍♂️'}</span>
                <div class="flex items-center gap-1.5">
                  <span class="font-bold text-sm text-slate-800 dark:text-slate-100">${escapeHtml(svc.name)}</span>
                  ${staffBadge}
                </div>
              </div>
              <input type="radio" name="mainService" value="${escapeHtml(svc.name)}" onclick="handleMainServiceRadioClick(this)" class="${accentRadio} w-4 h-4">
            </div>
            <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">${escapeHtml(svc.desc || '')}</p>
          </div>
          <div class="mt-2.5 flex items-center justify-between text-[11px]">
            <span class="font-semibold ${priceBg} border px-2 py-0.5 rounded">${priceText}</span>
            <span class="text-slate-500 dark:text-slate-400 font-medium">${durationText}</span>
          </div>
        `;
        container.appendChild(label);
      });
    }

    function renderEditMainServicesRadios(containerId = "edit-svc-main-container", selectedName = "") {
      const container = document.getElementById(containerId);
      if (!container) return;
      container.innerHTML = "";

      const isStaffOrAdmin = Boolean(currentUser && (currentUser.role === 'staff' || currentUser.role === 'admin'));
      const activeList = mainServicesList.filter(s => s.active !== false);

      activeList.forEach(svc => {
        const target = (svc.target || svc.target_audience || 'all').trim().toLowerCase();
        if (target === 'staff_only' && !isStaffOrAdmin) return;

        const isChecked = selectedName === svc.name || (selectedName && selectedName.includes(svc.name));
        const isPurple = svc.name.includes("หลังคลอด") || (svc.color && svc.color.includes("purple"));
        const cardBorder = isPurple
          ? "has-[:checked]:border-purple-600 has-[:checked]:bg-purple-50/70 dark:has-[:checked]:bg-purple-900/40"
          : "has-[:checked]:border-herbal-600 has-[:checked]:bg-herbal-50/70 dark:has-[:checked]:bg-herbal-900/40";
        const radioColor = isPurple ? "text-purple-700 focus:ring-purple-500" : "text-herbal-700 focus:ring-herbal-500";
        const titleColor = isPurple ? "text-purple-900 dark:text-purple-300" : "text-slate-800 dark:text-slate-100";

        const label = document.createElement("label");
        label.className = `flex items-start space-x-3 p-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/60 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 transition ${cardBorder}`;
        label.innerHTML = `
          <input type="radio" name="editMainService" value="${escapeHtml(svc.name)}" ${isChecked ? 'checked' : ''} class="mt-0.5 ${radioColor}" onclick="handleMainServiceRadioClick(this)" onchange="onEditServiceFormChange()">
          <div>
            <span class="font-bold ${titleColor} block text-xs sm:text-sm">${svc.icon || '💆‍♂️'} ${escapeHtml(svc.name)}</span>
            <span class="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">${svc.durationSlots === 2 ? 'ครอง 2 รอบเวลา (2 ชม.)' : 'ครอง 1 รอบเวลา (1 ชม.)'}</span>
          </div>
        `;
        container.appendChild(label);
      });
    }

    function renderExtraServicesCheckboxes(containerId = "new-extra-services-container") {
      const container = document.getElementById(containerId);
      if (!container) return;
      container.innerHTML = "";

      const isStaffOrAdmin = Boolean(currentUser && (currentUser.role === 'staff' || currentUser.role === 'admin'));

      extraServicesList.filter(s => s.active !== false).forEach(svc => {
        const target = (svc.target || svc.target_audience || 'all').trim().toLowerCase();

        // If service is configured as staff_only, only show if user is staff or admin
        if (target === 'staff_only' && !isStaffOrAdmin) {
          return;
        }

        const staffBadge = target === 'staff_only'
          ? `<span class="text-[10px] font-bold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800/60">🩺 เฉพาะ จนท.</span>`
          : '';

        const label = document.createElement("label");
        label.className = "flex items-center space-x-2 p-2.5 rounded-lg bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-herbal-50/70 dark:hover:bg-slate-700 transition shadow-sm";
        label.innerHTML = `
          <input type="checkbox" name="extraService" value="${escapeHtml(svc.name)}" onchange="onExtraServicesChanged()" class="rounded text-herbal-700 focus:ring-herbal-500 w-4 h-4">
          <span class="text-xs font-semibold text-slate-800 dark:text-slate-100 flex-1 flex items-center justify-between">
            <span>${escapeHtml(svc.name)} (${svc.price} บ.)</span>
            ${staffBadge}
          </span>
          <span class="badge-service ${svc.color || 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200'}">${escapeHtml(svc.tag)}</span>
        `;
        container.appendChild(label);
      });
    }

