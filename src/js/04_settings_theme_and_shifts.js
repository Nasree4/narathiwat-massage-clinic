/**
 * Module 4: 04_settings_theme_and_shifts.js
 * Description: System Settings, 3D Theme, Shift Config, Rate Limiting
 * Generated from lines 7266 to 8144 of original index.html
 */

    /* =========================================================================
       SYSTEM SETTINGS, THEME (3D TOGGLE) & BILINGUAL LANGUAGE (TH/ENG)
       ========================================================================= */

    const TRANSLATIONS = {
      th: {
        app_title: "คลินิกการแพทย์แผนไทย",
        app_hospital: "โรงพยาบาลนราธิวาสราชนครินทร์",
        service_status: "เปิดบริการปกติ",
        btn_pwa: "ติดตั้งแอป",
        sound_on: "เสียงเรียก: เปิด",
        sound_off: "เสียงเรียก: ปิด",
        btn_login: "เข้าสู่ระบบ",
        btn_logout: "ออกจากระบบ",
        btn_settings: "ตั้งค่า",
        tab_new: "จองคิวนัดหมาย",
        tab_desk: "โต๊ะตรวจ/เจ้าหน้าที่",
        tab_patients: "ประวัติคนไข้",
        tab_stats: "สถิติ & รายงาน",
        tab_manage: "จัดการระบบ & ตั้งค่า",
        tab_login: "เข้าสู่ระบบ",
        
        // Settings modal
        settings_title: "การตั้งค่าระบบ & จัดการ",
        settings_subtitle: "Settings & Administrative Hub",
        theme_heading: "โหมดหน้าจอ (Theme)",
        theme_sub: "โหมดสว่าง (Light Mode) / โหมดมืด (Dark Mode)",
        lang_heading: "ภาษา (Language)",
        lang_sub: "เลือกภาษาที่ต้องการใช้งานในระบบ",
        patient_records_title: "ประวัติและข้อมูลคนไข้ (Patient Records)",
        patient_records_desc: "ค้นหาประวัติการรักษา นัดหมายย้อนหลัง และข้อมูล EMR คนไข้",
        btn_open_patients: "เปิดดูประวัติคนไข้",
        staff_leave_title: "บันทึกการลาของฉัน (My Leave Record)",
        staff_leave_desc: "บันทึกวันลาเวร / ลาป่วย / ลาพักผ่อน ระบบจะตัดชื่อออกจากรอบบริการ",
        btn_record_my_leave: "บันทึกการลาของฉัน",
        admin_hub_title: "การตั้งค่าคลินิก & จัดการระบบ (Clinic Settings & Management)",
        admin_sub_slots: "จำนวนคิวแต่ละรอบ",
        admin_sub_slots_desc: "ตั้งค่าโควตา & ล็อครอบเวลา",
        admin_sub_shifts: "จัดตารางเวรผู้ช่วยฯ",
        admin_sub_shifts_desc: "เพิ่ม/แก้ไขผู้ช่วยและตารางเวร",
        admin_sub_services: "จัดการหัตถการ & เสริม",
        admin_sub_services_desc: "เพิ่มหัตถการ ค่าบริการ ส่วนแบ่ง",
        admin_sub_supabase: "Supabase & Cloud Sync",
        admin_sub_supabase_desc: "ตั้งค่าคลาวด์และสำรองข้อมูล",
        admin_sub_audit: "ประวัติกิจกรรม & ล็อกอิน",
        admin_sub_audit_desc: "Audit Trail ตรวจสอบความปลอดภัย",
        admin_sub_reviews: "ความพึงพอใจ & รีวิว",
        admin_sub_reviews_desc: "ดูคะแนนและข้อเสนอแนะคนไข้",
        btn_close: "ปิดหน้าต่าง",
        
        // Booking form
        booking_title: "จองคิวนัดหมายออนไลน์",
        booking_subtitle: "กรุณากรอกข้อมูลเพื่อความสะดวกรวดเร็วในการเข้ารับบริการ ณ คลินิกการแพทย์แผนไทย"
      },
      en: {
        app_title: "Thai Traditional Medicine Clinic",
        app_hospital: "Naradhiwas Rajanagarindra Hospital",
        service_status: "Open as Normal",
        btn_pwa: "Install App",
        sound_on: "Chime: ON",
        sound_off: "Chime: OFF",
        btn_login: "Sign In",
        btn_logout: "Sign Out",
        btn_settings: "Settings",
        tab_new: "Book Appointment",
        tab_desk: "Staff Desk",
        tab_patients: "Patient Records",
        tab_stats: "Stats & Reports",
        tab_manage: "Admin System",
        tab_login: "Sign In",
        
        // Settings modal
        settings_title: "System Settings & Admin",
        settings_subtitle: "Settings & Administrative Hub",
        theme_heading: "Display Theme",
        theme_sub: "Light Mode / Dark Mode (3D Switch)",
        lang_heading: "System Language",
        lang_sub: "Choose your preferred system language",
        patient_records_title: "Patient Records & EMR",
        patient_records_desc: "Search patient history, past visits, and EMR records",
        btn_open_patients: "Open Patient Records",
        staff_leave_title: "My Leave Request",
        staff_leave_desc: "Record duty off / sick / vacation leave to exclude from bookings",
        btn_record_my_leave: "Record My Leave",
        admin_hub_title: "Admin Management Hub",
        admin_sub_slots: "Time Slots & Quotas",
        admin_sub_slots_desc: "Configure capacity and lock slots",
        admin_sub_shifts: "Assistant & Duty Shifts",
        admin_sub_shifts_desc: "Manage assistants and duty rosters",
        admin_sub_services: "Procedures & Add-ons",
        admin_sub_services_desc: "Manage procedures, prices & split share",
        admin_sub_supabase: "Supabase & Cloud Sync",
        admin_sub_supabase_desc: "Configure cloud database & backups",
        admin_sub_audit: "Audit Trail & Activity Log",
        admin_sub_audit_desc: "Security audit trail and login logs",
        admin_sub_reviews: "Patient Reviews & Ratings",
        admin_sub_reviews_desc: "View patient feedback and satisfaction",
        btn_close: "Close Window",
        
        // Booking form
        booking_title: "Online Appointment Booking",
        booking_subtitle: "Please fill out the form for convenient service at Thai Traditional Medicine Clinic"
      }
    };

    let currentLang = localStorage.getItem("ttm_lang") || "th";

    function setLanguage(lang) {
      currentLang = lang;
      try { localStorage.setItem("ttm_lang", lang); } catch(e) {}
      applyLanguage(lang);
      showToast(lang === "th" ? "เปลี่ยนภาษาเป็น ภาษาไทย เรียบร้อย 🇹🇭" : "Switched language to English 🇬🇧", "info");
    }

    function applyLanguage(lang = currentLang) {
      const dict = TRANSLATIONS[lang] || TRANSLATIONS.th;
      
      document.querySelectorAll("[data-i18n]").forEach(el => {
        const key = el.getAttribute("data-i18n");
        if (dict[key]) {
          el.textContent = dict[key];
        }
      });

      // Update active language switcher button styling
      const btnTh = document.getElementById("btn-lang-th");
      const btnEn = document.getElementById("btn-lang-en");
      if (btnTh && btnEn) {
        if (lang === "th") {
          btnTh.className = "px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1 bg-white dark:bg-herbal-700 text-herbal-800 dark:text-white shadow-xs";
          btnEn.className = "px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition flex items-center space-x-1";
        } else {
          btnEn.className = "px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1 bg-white dark:bg-herbal-700 text-herbal-800 dark:text-white shadow-xs";
          btnTh.className = "px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition flex items-center space-x-1";
        }
      }
    }

    function toggleDarkMode(isDark) {
      if (isDark) {
        document.documentElement.classList.add("dark");
        try { localStorage.setItem("ttm_theme", "dark"); } catch(e) {}
      } else {
        document.documentElement.classList.remove("dark");
        try { localStorage.setItem("ttm_theme", "light"); } catch(e) {}
      }
      const themeDesc = document.getElementById("theme-label-desc");
      if (themeDesc) {
        themeDesc.textContent = isDark 
          ? (currentLang === "en" ? "Dark Mode is Active 🌙" : "โหมดมืด (Dark Mode) เปิดใช้งานอยู่ 🌙") 
          : (currentLang === "en" ? "Light Mode is Active ☀️" : "โหมดสว่าง (Light Mode) เปิดใช้งานอยู่ ☀️");
      }
    }

    function initTheme() {
      const savedTheme = localStorage.getItem("ttm_theme");
      const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      const isDark = savedTheme === "dark" || (!savedTheme && prefersDark);
      
      const themeInput = document.getElementById("theme");
      if (themeInput) {
        themeInput.checked = isDark;
      }
      if (isDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }

    function renderSettingsAccountCard() {
      const container = document.getElementById("settings-account-card");
      if (!container) return;

      if (currentUser) {
        let roleBadge = "";
        let roleClass = "";
        if (currentUser.role === 'admin') {
          roleBadge = "🛡️ ผู้ดูแลระบบ (Admin)";
          roleClass = "bg-purple-100 text-purple-800 dark:bg-purple-900/80 dark:text-purple-200 border-purple-300 dark:border-purple-700";
        } else if (currentUser.role === 'staff') {
          roleBadge = "🩺 เจ้าหน้าที่ (Staff)";
          roleClass = "bg-amber-100 text-amber-800 dark:bg-amber-900/80 dark:text-amber-200 border-amber-300 dark:border-amber-700";
        } else {
          roleBadge = "👤 ผู้รับบริการ (User)";
          roleClass = "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/80 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700";
        }

        container.innerHTML = `
          <div class="flex items-center space-x-3">
            <div class="w-12 h-12 rounded-2xl bg-herbal-100 dark:bg-herbal-900/60 text-herbal-800 dark:text-herbal-200 flex items-center justify-center font-bold text-2xl border border-herbal-300 dark:border-herbal-700 shadow-inner flex-shrink-0">
              ${currentUser.role === 'admin' ? '🛡️' : (currentUser.role === 'staff' ? '🩺' : '👤')}
            </div>
            <div>
              <div class="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <h4 class="font-bold text-sm sm:text-base text-slate-800 dark:text-white leading-tight">${escapeHtml(currentUser.name)}</h4>
                <span class="px-2 py-0.5 rounded-md text-[10px] font-bold border ${roleClass}">
                  ${roleBadge}
                </span>
              </div>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 flex flex-wrap items-center gap-1.5">
                <span>📱 ${escapeHtml(currentUser.phone || '-')}</span>
                ${currentUser.email ? `<span>• ✉️ ${escapeHtml(currentUser.email)}</span>` : ''}
              </p>
              <p class="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5 mt-0.5">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>จดจำการเข้าสู่ระบบ 30 วัน</span>
              </p>
            </div>
          </div>
          <div class="flex items-center space-x-2 shrink-0">
            <button onclick="goToSettingsSection('login')" class="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center space-x-1 border border-slate-200 dark:border-slate-600 shadow-2xs">
              <i data-lucide="user" class="w-3.5 h-3.5 text-herbal-600 dark:text-herbal-400"></i>
              <span data-i18n="btn_view_profile">${currentLang === 'en' ? 'Profile' : 'โปรไฟล์/บัญชี'}</span>
            </button>
            <button onclick="closeSettingsModal(); handleLogout();" class="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition flex items-center space-x-1 shadow-xs">
              <i data-lucide="log-out" class="w-3.5 h-3.5"></i>
              <span data-i18n="btn_logout">${currentLang === 'en' ? 'Sign Out' : 'ออกจากระบบ'}</span>
            </button>
          </div>
        `;
      } else {
        container.innerHTML = `
          <div class="flex items-center space-x-3">
            <div class="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center text-xl border border-slate-200 dark:border-slate-700 shadow-inner flex-shrink-0">
              <i data-lucide="key-round" class="w-6 h-6 text-amber-500"></i>
            </div>
            <div>
              <h4 class="font-bold text-sm text-slate-800 dark:text-white leading-tight" data-i18n="account_guest_title">${currentLang === 'en' ? 'Not Signed In (Guest Mode)' : 'ยังไม่ได้เข้าสู่ระบบ (Guest Mode)'}</h4>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5" data-i18n="account_guest_desc">${currentLang === 'en' ? 'Sign in to access staff desk, records & system management' : 'เข้าสู่ระบบเพื่อใช้งานโต๊ะตรวจคนไข้และจัดการระบบ'}</p>
            </div>
          </div>
          <button onclick="closeSettingsModal(); openAuthModal('login');" class="px-4 py-2 rounded-xl bg-herbal-700 hover:bg-herbal-600 text-white text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow-sm whitespace-nowrap">
            <i data-lucide="log-in" class="w-4 h-4"></i>
            <span data-i18n="btn_login_full">${currentLang === 'en' ? 'Sign In / Register' : 'เข้าสู่ระบบ / ลงทะเบียน'}</span>
          </button>
        `;
      }
      lucide.createIcons();
    }

    function openSettingsModal() {
      if (typeof syncVersionTags === 'function') syncVersionTags();
      initTheme();
      applyLanguage(currentLang);
      renderSettingsAccountCard();
      
      const isStaffOrAdmin = Boolean(currentUser && (currentUser.role === 'staff' || currentUser.role === 'admin'));
      const isAdmin = Boolean(currentUser && currentUser.role === 'admin');

      // Hide or show Patient Records card based on permission
      const patientRecordsCard = document.getElementById("settings-patient-records-card");
      if (patientRecordsCard) {
        if (isStaffOrAdmin) {
          patientRecordsCard.classList.remove("hidden");
        } else {
          patientRecordsCard.classList.add("hidden");
        }
      }

      // Hide or show Staff Leave Record card based on permission (Staff & Admin)
      const staffLeaveCard = document.getElementById("settings-staff-leave-card");
      if (staffLeaveCard) {
        if (isStaffOrAdmin) {
          staffLeaveCard.classList.remove("hidden");
        } else {
          staffLeaveCard.classList.add("hidden");
        }
      }

      // Hide or show Admin Management Hub card based on permission (Strictly Admin Only)
      const adminHubCard = document.getElementById("settings-admin-hub-card");
      if (adminHubCard) {
        if (isAdmin) {
          adminHubCard.classList.remove("hidden");
        } else {
          adminHubCard.classList.add("hidden");
        }
      }

      // Update admin badge in settings
      const adminBadge = document.getElementById("settings-admin-badge");
      if (adminBadge) {
        if (currentUser && currentUser.role === "admin") {
          adminBadge.textContent = "🛡️ Admin Access (Full)";
          adminBadge.className = "px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-200 dark:bg-purple-900 text-purple-800 dark:text-purple-200";
        } else if (currentUser && currentUser.role === "staff") {
          adminBadge.textContent = "🩺 Staff Access";
          adminBadge.className = "px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-200";
        } else {
          adminBadge.textContent = "🔒 Login Required";
          adminBadge.className = "px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300";
        }
      }

      const modal = document.getElementById("modal-settings");
      if (modal) {
        modal.classList.remove("hidden");
        lucide.createIcons();
      }
    }

    function closeSettingsModal() {
      const modal = document.getElementById("modal-settings");
      if (modal) modal.classList.add("hidden");
    }

    function goToSettingsSection(tabId, subTabId) {
      closeSettingsModal();
      if (tabId === "manage" && subTabId) {
        const manageDateInput = document.getElementById("manage-selected-date");
        if (manageDateInput && !manageDateInput.value) {
          manageDateInput.value = todayStr;
        }
        switchTab("manage", false);
        if (typeof switchManageSubTab === "function") {
          switchManageSubTab(subTabId);
        }
      } else {
        switchTab(tabId);
      }
    }

    // Immediate Theme & Language Init
    try { initTheme(); applyLanguage(currentLang); } catch(e) {}

    let auditLogs = [];
    try {
      const storedLogs = localStorage.getItem("ttm_audit_logs");
      auditLogs = storedLogs ? JSON.parse(storedLogs) : [];
    } catch(e) {
      auditLogs = [];
    }

    const DEFAULT_REVIEWS = [
      {
        id: "rev-1",
        appointment_id: "apt-demo-1",
        assistant_id: "asst-1",
        assistant_name: "นัสรีน (น.ส. นัสรีน ดือราแม)",
        service_name: "นวดตัว",
        rating_overall: 5,
        rating_service: 5,
        rating_cleanliness: 5,
        rating_outcome: 5,
        nps_recommend: "recommend",
        comment: "คุณหมอนวดดีมาก อาการปวดหลังและไหล่ดีขึ้นชัดเจน คลินิกสะอาดมากครับ",
        created_at: new Date(Date.now() - 2 * 86400000).toISOString()
      },
      {
        id: "rev-2",
        appointment_id: "apt-demo-2",
        assistant_id: "asst-2",
        assistant_name: "มีนี (น.ส. มีนี สาและ)",
        service_name: "นวดเท้า + อบสมุนไพร",
        rating_overall: 5,
        rating_service: 5,
        rating_cleanliness: 4,
        rating_outcome: 5,
        nps_recommend: "recommend",
        comment: "บริการสุภาพ ยิ้มแย้มแจ่มใส กลิ่นสมุนไพรหอมผ่อนคลาย ประทับใจมากค่ะ",
        created_at: new Date(Date.now() - 1 * 86400000).toISOString()
      },
      {
        id: "rev-3",
        appointment_id: "apt-demo-3",
        assistant_id: "asst-4",
        assistant_name: "เลาะห์ (นาย เลาะห์ มามุ)",
        service_name: "นวดตัว",
        rating_overall: 4,
        rating_service: 4,
        rating_cleanliness: 5,
        rating_outcome: 4,
        nps_recommend: "recommend",
        comment: "นวดคลายเส้นได้ตรงจุด น้ำหนักมือกำลังดี จะกลับมาใช้บริการอีกแน่นอนครับ",
        created_at: new Date(Date.now() - 6 * 3600000).toISOString()
      }
    ];

    let reviewsList = [];
    try {
      const storedReviews = localStorage.getItem("ttm_reviews");
      reviewsList = storedReviews ? JSON.parse(storedReviews) : [...DEFAULT_REVIEWS];
    } catch(e) {
      reviewsList = [...DEFAULT_REVIEWS];
    }

    let isAudioEnabled = true;

    // Time Slots Configuration (12 slots weekday, 4 slots Saturday)
    const WEEKDAY_SLOTS = [
      "08:00", "09:00", "10:00", "11:00", "12:00",
      "13:00", "14:00", "15:00", "16:00",
      "17:00", "18:00", "19:00"
    ];
    const SATURDAY_SLOTS = ["08:30", "09:30", "10:30", "11:30"];

    // ==================== SHIFTS & WORKING HOURS CONFIGURATION ====================

    function getAssistantWorkSlots(asst) {
      if (!asst || asst.active === false) return [];
      const shiftType = asst.shiftType || 'full';
      if (shiftType === 'off') return [];
      if (shiftType === 'official') return IN_HOURS_SLOTS;
      if (shiftType === 'ot') return OUT_OF_HOURS_SLOTS;
      if (shiftType === 'custom') {
        return (Array.isArray(asst.slots) && asst.slots.length > 0) ? asst.slots : ALL_WORKING_SLOTS;
      }
      return ALL_WORKING_SLOTS;
    }

    function isAssistantOnDutyForSlot(asst, timeSlot, dateStr) {
      if (!asst || asst.active === false) return false;
      if (!timeSlot) return true;
      
      // 1. If date-specific matrix roster exists for this date, check date-specific entry
      if (dateStr && typeof assistantDutyRosters !== "undefined" && assistantDutyRosters[dateStr]) {
        const dateRoster = assistantDutyRosters[dateStr];
        const hasRosterEntries = Object.keys(dateRoster).length > 0;
        if (hasRosterEntries) {
          if (dateRoster[asst.id] !== undefined) {
            const entry = normalizeAssistantRosterEntry(dateRoster[asst.id]);
            if (entry.isExplicitlyEmpty || entry.shiftType === 'off') return false;
            const slots = Array.isArray(entry.slots) ? entry.slots : [];
            return slots.includes(timeSlot);
          } else {
            // Check if dateStr is TODAY
            const isToday = (typeof getTodayDateString === "function" && dateStr === getTodayDateString());
            const hasActiveCheckInsToday = isToday && Object.values(dateRoster).some(e => {
              const norm = normalizeAssistantRosterEntry(e);
              return !norm.isExplicitlyEmpty && norm.shiftType !== 'off' && Array.isArray(norm.slots) && norm.slots.length > 0;
            });
            if (hasActiveCheckInsToday) {
              // Live roster is actively ongoing today, but this assistant has not checked in yet
              return false;
            }
            // For future or other dates: assistant did not take leave on this date, so available on default shift
            const slots = getAssistantWorkSlots(asst);
            return slots.includes(timeSlot);
          }
        }
      }

      // 2. Fallback to assistant's default shift configuration
      const slots = getAssistantWorkSlots(asst);
      return slots.includes(timeSlot);
    }

    function getShiftBadgeInfo(asst) {
      if (!asst || asst.active === false || asst.shiftType === 'off') {
        return {
          type: 'off',
          label: '⚪ ลาเวร / พัก',
          shortLabel: '⚪ ลาเวร',
          badgeClass: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
          slotsText: 'ไม่ได้เข้าเวร'
        };
      }
      const shiftType = asst.shiftType || 'full';
      if (shiftType === 'official') {
        return {
          type: 'official',
          label: '☀️ ในเวลา (08:00 - 16:00)',
          shortLabel: '☀️ ในเวลา',
          badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
          slotsText: '9 รอบ (08:00 - 16:00)'
        };
      }
      if (shiftType === 'ot') {
        return {
          type: 'ot',
          label: '🌙 นอกเวลา / OT (17:00 - 19:00)',
          shortLabel: '🌙 นอกเวลา (OT)',
          badgeClass: 'bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800',
          slotsText: '3 รอบ (17:00 - 19:00)'
        };
      }
      if (shiftType === 'custom') {
        const count = (asst.slots || []).length;
        return {
          type: 'custom',
          label: `⚙️ กำหนดรอบเอง (${count} รอบ)`,
          shortLabel: `⚙️ ${count} รอบ`,
          badgeClass: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
          slotsText: (asst.slots || []).join(', ') || 'ไม่ได้ระบุรอบ'
        };
      }
      return {
        type: 'full',
        label: '⭐ ทั้งวัน (08:00 - 19:00)',
        shortLabel: '⭐ ทั้งวัน',
        badgeClass: 'bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800',
        slotsText: '12 รอบ (08:00 - 19:00)'
      };
    }


    // Thai Official Public Holidays Definition (วันหยุดนักขัตฤกษ์ประจำปีของไทย)
    const THAI_FIXED_PUBLIC_HOLIDAYS = {
      "01-01": "วันขึ้นปีใหม่",
      "04-06": "วันพระบาทสมเด็จพระพุทธยอดฟ้าจุฬาโลกมหาราช และวันที่ระลึกมหาจักรีบรมราชวงศ์ (วันจักรี)",
      "04-13": "วันสงกรานต์",
      "04-14": "วันสงกรานต์ (วันครอบครัว)",
      "04-15": "วันสงกรานต์",
      "05-01": "วันแรงงานแห่งชาติ",
      "05-04": "วันฉัตรมงคล",
      "06-03": "วันเฉลิมพระชนมพรรษาสมเด็จพระนางเจ้าฯ พระบรมราชินี",
      "07-28": "วันเฉลิมพระชนมพรรษาพระบาทสมเด็จพระเจ้าอยู่หัว (ร.10)",
      "08-12": "วันเฉลิมพระชนมพรรษาสมเด็จพระบรมราชชนนีพันปีหลวง และวันแม่แห่งชาติ",
      "10-13": "วันนวมินทรมหาราช (วันคล้ายวันสวรรคต ร.9)",
      "10-23": "วันปิยมหาราช",
      "12-05": "วันคล้ายวันพระบรมราชสมภพ ร.9 วันชาติ และวันพ่อแห่งชาติ",
      "12-10": "วันรัฐธรรมนูญ",
      "12-31": "วันสิ้นปี"
    };

    const THAI_DYNAMIC_PUBLIC_HOLIDAYS = {
      // 2025
      "2025-01-02": "วันหยุดราชการกรณีพิเศษ (ขึ้นปีใหม่)",
      "2025-02-12": "วันมาฆบูชา",
      "2025-04-07": "วันหยุดชดเชยวันจักรี",
      "2025-05-05": "วันหยุดชดเชยวันฉัตรมงคล",
      "2025-05-11": "วันวิสาขบูชา",
      "2025-05-12": "วันหยุดชดเชยวันวิสาขบูชา",
      "2025-06-02": "วันหยุดราชการกรณีพิเศษ",
      "2025-07-10": "วันอาสาฬหบูชา",
      "2025-07-11": "วันเข้าพรรษา",
      "2025-08-11": "วันหยุดราชการกรณีพิเศษ",
      // 2026
      "2026-01-02": "วันหยุดกรณีพิเศษ (ปีใหม่)",
      "2026-03-03": "วันมาฆบูชา",
      "2026-04-06": "วันจักรี",
      "2026-05-31": "วันวิสาขบูชา",
      "2026-06-01": "วันหยุดชดเชยวันวิสาขบูชา",
      "2026-07-29": "วันอาสาฬหบูชา",
      "2026-07-30": "วันเข้าพรรษา",
      // 2027
      "2027-02-21": "วันมาฆบูชา",
      "2027-02-22": "วันหยุดชดเชยวันมาฆบูชา",
      "2027-05-20": "วันวิสาขบูชา",
      "2027-07-18": "วันอาสาฬหบูชา",
      "2027-07-19": "วันหยุดชดเชยวันอาสาฬหบูชา / วันเข้าพรรษา",
      // 2028
      "2028-02-09": "วันมาฆบูชา",
      "2028-05-08": "วันวิสาขบูชา",
      "2028-07-06": "วันอาสาฬหบูชา",
      "2028-07-07": "วันเข้าพรรษา"
    };

    // Custom / Additional Clinic Holidays (วันหยุดพิเศษเพิ่มเติมของคลินิก)
    let customHolidaysList = [];
    try {
      const savedHolidays = localStorage.getItem("ttm_custom_holidays");
      if (savedHolidays) {
        const parsed = JSON.parse(savedHolidays);
        if (Array.isArray(parsed)) customHolidaysList = parsed;
      }
    } catch(e) {
      customHolidaysList = [];
    }

    // Main Services Definition (ประเภทหัตถการหลัก)
    let mainServicesList = [
      {
        id: "main-massage",
        name: "จองนวด",
        title: "จองนวด (ตรวจรักษา/นวดบำบัด/ประคบสมุนไพร)",
        icon: "💆‍♂️",
        desc: "ตรวจรักษา นวดบำบัดและประคบสมุนไพร บรรเทาอาการปวดกล้ามเนื้อและข้อต่อ",
        price: 200,
        priceLabel: "200 บาท",
        durationSlots: 1,
        durationMin: 60,
        target: "all",
        active: true,
        color: "bg-herbal-100 text-herbal-800 border-herbal-200"
      },
      {
        id: "main-postpartum",
        name: "จองฟื้นฟูหลังคลอด",
        title: "จองฟื้นฟูหลังคลอด (บริบาลมารดาหลังคลอด/ทับหม้อเกลือ)",
        icon: "🤱",
        desc: "บริบาลมารดาหลังคลอด ทับหม้อเกลือ อบสมุนไพร ประคบ ขับน้ำคาวปลา ฟื้นฟูสุขภาพ",
        price: 0,
        priceLabel: "บริการเฉพาะทาง",
        durationSlots: 1,
        durationMin: 60,
        target: "all",
        active: true,
        color: "bg-purple-100 text-purple-800 border-purple-200"
      }
    ];
    try {
      const savedMain = localStorage.getItem("ttm_main_services");
      if (savedMain) {
        const parsed = JSON.parse(savedMain);
        if (Array.isArray(parsed) && parsed.length > 0) mainServicesList = parsed;
      }
    } catch(e) {}

    function persistMainServices() {
      try { localStorage.setItem("ttm_main_services", JSON.stringify(mainServicesList)); } catch(e) {}
    }

    async function syncMainServicesToSupabase() {
      persistMainServices();
      if (!supabaseClient) return;
      try {
        await supabaseClient.from("slot_configs").upsert({
          id: "config_main_services",
          scope: "services",
          config_key: "main_services",
          slots_json: mainServicesList,
          updated_at: new Date().toISOString()
        }, { onConflict: "id" });
      } catch(e) {
        console.warn("Supabase slot_configs main_services sync error:", e);
      }
    }

    function persistExtraServices() {
      try { localStorage.setItem("ttm_extra_services", JSON.stringify(extraServicesList)); } catch(e) {}
    }

    async function syncExtraServicesToSupabase() {
      persistExtraServices();
      if (!supabaseClient) return;
      try {
        await supabaseClient.from("slot_configs").upsert({
          id: "config_extra_services",
          scope: "services",
          config_key: "extra_services",
          slots_json: extraServicesList,
          updated_at: new Date().toISOString()
        }, { onConflict: "id" });
      } catch(e) {
        console.warn("Supabase slot_configs extra_services sync error:", e);
      }
    }

    function persistAppointments() {
      try {
        localStorage.setItem("ttm_appointments", JSON.stringify(appointments));
      } catch(e) {
        console.warn("Failed to persist appointments:", e);
      }
    }

    function parsePercentage(val, defaultVal = 60) {
      if (val === undefined || val === null || val === "") return defaultVal;
      const n = Number(val);
      if (isNaN(n)) return defaultVal;
      return Math.max(0, Math.min(100, Math.round(n)));
    }

    // Extra Services Definition
    let extraServicesList = [
      { id: "svc-body", name: "นวดตัว", tag: "[ตัว]", price: 300, asstPercent: 60, hospitalPercent: 40, share60: 180, target: "all", twoSlots: true, active: true, color: "bg-emerald-100 text-emerald-800 border border-emerald-200" },
      { id: "svc-foot", name: "นวดเท้า", tag: "[เท้า]", price: 200, asstPercent: 60, hospitalPercent: 40, share60: 120, target: "all", twoSlots: true, active: true, color: "bg-blue-100 text-blue-800 border border-blue-200" },
      { id: "svc-herbal", name: "อบสมุนไพร", tag: "[อบ]", price: 150, asstPercent: 60, hospitalPercent: 40, share60: 90, target: "all", twoSlots: false, active: true, color: "bg-purple-100 text-purple-800 border border-purple-200" },
      { id: "svc-belly", name: "นวดท้อง", tag: "[ท้อง]", price: 100, asstPercent: 60, hospitalPercent: 40, share60: 60, target: "all", twoSlots: false, active: true, color: "bg-amber-100 text-amber-800 border border-amber-200" }
    ];
    try {
      const savedSvc = localStorage.getItem("ttm_extra_services");
      if (savedSvc) {
        const parsed = JSON.parse(savedSvc);
        if (Array.isArray(parsed) && parsed.length > 0) {
          extraServicesList = parsed.map(item => {
            const asstPct = parsePercentage(item.asstPercent, 60);
            const target = item.target || item.target_audience || "all";
            return {
              ...item,
              target: target,
              target_audience: target,
              asstPercent: asstPct,
              hospitalPercent: 100 - asstPct,
              share60: Math.round((Number(item.price) || 0) * (asstPct / 100))
            };
          });
        }
      }
    } catch(e) {}

    // Room quota limits (Default bed capacities per room)
    let ROOM_CAPACITIES = {
      "ห้อง 1": 5,
      "ห้อง 2": 5,
      "ห้อง 3": 6,
      "ห้อง 4": 6,
      "ห้อง 5": 5
    };
    try {
      const savedCaps = localStorage.getItem("ttm_room_capacities");
      if (savedCaps) {
        const parsed = JSON.parse(savedCaps);
        if (parsed && typeof parsed === 'object') ROOM_CAPACITIES = { ...ROOM_CAPACITIES, ...parsed };
      }
    } catch(e) {}

    let slotScopeMode = 'daily'; // 'daily' or 'monthly'
    let customDailySlotConfig = {}; 
    try {
      const savedDaily = localStorage.getItem("ttm_daily_slot_config");
      if (savedDaily) customDailySlotConfig = JSON.parse(savedDaily);
    } catch(e) { customDailySlotConfig = {}; }

    let customMonthlySlotConfig = {}; 
    try {
      const savedMonthly = localStorage.getItem("ttm_monthly_slot_config");
      if (savedMonthly) customMonthlySlotConfig = JSON.parse(savedMonthly);
    } catch(e) { customMonthlySlotConfig = {}; } 

    function getDefaultSlotConfig(slot, dateStr) {
      if (SATURDAY_SLOTS.includes(slot)) {
        return { max: 10, enabled: true };
      }
      if (dateStr) {
        const d = new Date(dateStr + "T00:00:00");
        if (d.getDay() === 6) {
          return { max: 10, enabled: true };
        }
      }

      if (slot === "12:00") {
        return { max: 5, enabled: true };
      }

      if (["16:00", "17:00", "18:00", "19:00"].includes(slot)) {
        return { max: 6, enabled: true };
      }

      return { max: 20, enabled: true };
    }

    function getSlotConfigForDate(dateStr, slot) {
      if (!dateStr) return getDefaultSlotConfig(slot, dateStr);
      if (customDailySlotConfig[dateStr] && customDailySlotConfig[dateStr][slot]) {
        return customDailySlotConfig[dateStr][slot];
      }
      const monthKey = dateStr.substring(0, 7);
      if (customMonthlySlotConfig[monthKey] && customMonthlySlotConfig[monthKey][slot]) {
        return customMonthlySlotConfig[monthKey][slot];
      }
      return getDefaultSlotConfig(slot, dateStr);
    }

    function getTodayDateString() {
      const d = new Date();
      const yr = d.getFullYear();
      const mo = String(d.getMonth() + 1).padStart(2, '0');
      const da = String(d.getDate()).padStart(2, '0');
      return `${yr}-${mo}-${da}`;
    }

    const todayStr = getTodayDateString();

    let appointments = (() => {
      try {
        const cached = localStorage.getItem("ttm_appointments");
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch (e) {}
      return [];
    })();

    /* =========================================================================
       SECURITY, CLIENT IP AUDITING & RATE LIMITING SYSTEM
       ========================================================================= */
    let currentClientIp = sessionStorage.getItem("ttm_client_ip") || localStorage.getItem("ttm_client_ip") || "";
    let isFetchingIp = false;
    let failedLoginAttempts = JSON.parse(localStorage.getItem("ttm_failed_logins") || "{}");

    async function initClientIp() {
      if (currentClientIp && currentClientIp !== "กำลังตรวจสอบ..." && !currentClientIp.includes("กำลังตรวจสอบ") && currentClientIp !== "127.0.0.1") {
        updateSecurityIpBadges();
        return currentClientIp;
      }
      if (isFetchingIp) return currentClientIp || "127.0.0.1";
      isFetchingIp = true;

      const endpoints = [
        async () => {
          const r = await fetch("https://api.ipify.org?format=json", { signal: AbortSignal.timeout(2500) });
          const d = await r.json();
          return d.ip;
        },
        async () => {
          const r = await fetch("https://api64.ipify.org?format=json", { signal: AbortSignal.timeout(2500) });
          const d = await r.json();
          return d.ip;
        },
        async () => {
          const r = await fetch("https://ipwho.is/", { signal: AbortSignal.timeout(2500) });
          const d = await r.json();
          return d.ip;
        },
        async () => {
          const r = await fetch("https://api.my-ip.io/v2/ip.json", { signal: AbortSignal.timeout(2500) });
          const d = await r.json();
          return d.ip;
        },
        async () => {
          const r = await fetch("https://ipapi.co/json/", { signal: AbortSignal.timeout(2500) });
          const d = await r.json();
          return d.ip;
        }
      ];

      for (const fn of endpoints) {
        try {
          const ip = await fn();
          if (ip && typeof ip === 'string' && ip.length >= 7) {
            currentClientIp = ip.trim();
            try {
              sessionStorage.setItem("ttm_client_ip", currentClientIp);
              localStorage.setItem("ttm_client_ip", currentClientIp);
            } catch(e) {}
            updateSecurityIpBadges();
            isFetchingIp = false;
            return currentClientIp;
          }
        } catch(err) {}
      }

      if (!currentClientIp || currentClientIp.includes("กำลัง")) {
        currentClientIp = "127.0.0.1 (Local / Protected)";
      }
      updateSecurityIpBadges();
      isFetchingIp = false;
      return currentClientIp;
    }

    function updateSecurityIpBadges() {
      const displayIp = currentClientIp || "127.0.0.1";
      document.querySelectorAll(".current-ip-label").forEach(el => {
        el.textContent = displayIp;
      });
      const profileIpEl = document.getElementById("profile-current-ip");
      if (profileIpEl) profileIpEl.textContent = displayIp;
    }

    function detectDevice() { return detectClientDevice(); }
    function detectClientDevice() {
      const ua = navigator.userAgent || "";
      let os = "Device";
      if (ua.includes("Win")) os = "Windows";
      else if (ua.includes("Mac")) os = "macOS";
      else if (ua.includes("Android")) os = "Android";
      else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";
      else if (ua.includes("Linux")) os = "Linux";

      let browser = "Browser";
      if (ua.includes("Edg")) browser = "Edge";
      else if (ua.includes("Chrome")) browser = "Chrome";
      else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari";
      else if (ua.includes("Firefox")) browser = "Firefox";

      return {
        os,
        browser,
        deviceText: `${browser} (${os})`,
        userAgent: ua
      };
    }

    function recordFailedLogin(identifier) {
      const now = Date.now();
      const key = (identifier || "unknown").toLowerCase();
      const record = failedLoginAttempts[key] || { count: 0, lastAttempt: 0 };
      record.count += 1;
      record.lastAttempt = now;
      record.ip = currentClientIp;
      failedLoginAttempts[key] = record;
      try { localStorage.setItem("ttm_failed_logins", JSON.stringify(failedLoginAttempts)); } catch(e) {}
      return { count: record.count, locked: record.count >= 5 };
    }

    function clearFailedLogins(identifier) {
      const key = (identifier || "").toLowerCase();
      if (failedLoginAttempts[key]) {
        delete failedLoginAttempts[key];
        try { localStorage.setItem("ttm_failed_logins", JSON.stringify(failedLoginAttempts)); } catch(e) {}
      }
    }

    function checkLoginLockout(identifier) {
      const key = (identifier || "").toLowerCase();
      const record = failedLoginAttempts[key];
      if (!record) return { locked: false, count: 0 };
      const now = Date.now();
      const lockDuration = 60 * 1000; // 60-second lock
      if (record.count >= 5 && (now - record.lastAttempt) < lockDuration) {
        const remainingSeconds = Math.ceil((lockDuration - (now - record.lastAttempt)) / 1000);
        return { locked: true, remainingSeconds, remainingSec: remainingSeconds, count: record.count };
      }
      if (record.count >= 5 && (now - record.lastAttempt) >= lockDuration) {
        clearFailedLogins(identifier);
        return { locked: false, count: 0 };
      }
      return { locked: false, count: record.count };
    }

    // Trigger IP lookup immediately in background
    initClientIp();

