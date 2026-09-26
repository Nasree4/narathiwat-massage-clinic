/**
 * Module 1: 01_constants_and_state.js
 * Description: Constants, LocalStorage keys, App State defaults
 * Generated from lines 5802 to 6048 of original index.html
 */

    /* =========================================================================
       APPLICATION STATE & CONSTANTS
       ========================================================================= */
    const APP_VERSION = "v5.5.6";
    const APP_BUILD_DATE = "26 กันยายน 2569";

    // Working Slots & Duty Hours Constants (Defined top-level to prevent TDZ)
    const IN_HOURS_SLOTS = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"];
    const OUT_OF_HOURS_SLOTS = ["17:00", "18:00", "19:00"];
    const ALL_WORKING_SLOTS = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"];

    const DEFAULT_USERS = [
      {
        id: "usr-admin",
        name: "ผู้ดูแลระบบคลินิก (Admin)",
        phone: "0800000001",
        email: "admin@ttm.clinic",
        password: "admin",
        role: "admin",
        active: true
      },
      {
        id: "usr-staff",
        name: "เจ้าหน้าที่คลินิก (Staff)",
        phone: "0800000002",
        email: "staff@ttm.clinic",
        password: "staff",
        role: "staff",
        active: true
      },
      {
        id: "usr-demo",
        name: "นาย สมชาย ผู้รับบริการ (User)",
        phone: "0812345678",
        email: "user@ttm.clinic",
        password: "user",
        role: "user",
        active: true
      }
    ];

    /* =========================================================================
       AUTHENTICATION & PERSISTENT SESSION ENGINE (30-DAY PERSISTENCE)
       ========================================================================= */
    const AUTH_SESSION_STORAGE_KEY = "ttm_auth_session_v2";
    const AUTH_LEGACY_USER_KEY = "ttm_auth_user";
    const DEFAULT_SESSION_EXPIRY_DAYS = 30; // 30 days multi-day persistence on device

    function saveAuthSession(user, remember = true, authSource = 'local') {
      if (!user) return;
      const expiryDays = remember ? DEFAULT_SESSION_EXPIRY_DAYS : 1;
      const expiresAt = Date.now() + (expiryDays * 24 * 60 * 60 * 1000);
      const sessionData = {
        user: { ...user, authSource: authSource || user.authSource || 'local' },
        authSource: authSource || user.authSource || 'local',
        remember: Boolean(remember),
        savedAt: Date.now(),
        expiresAt: expiresAt
      };
      try {
        localStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(sessionData));
        localStorage.setItem(AUTH_LEGACY_USER_KEY, JSON.stringify(sessionData.user));
      } catch (e) {
        console.warn("Unable to save persistent auth session to localStorage:", e);
      }
    }

    function loadAuthSession() {
      try {
        const saved = localStorage.getItem(AUTH_SESSION_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.user) {
            // Check expiration
            if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
              console.log("Auth session expired after 30 days. Clearing session...");
              clearAuthSession();
              return null;
            }
            // Auto-renew (sliding window: if less than 15 days remain and remember is true, extend another 30 days)
            if (parsed.remember !== false && parsed.expiresAt) {
              const daysRemaining = (parsed.expiresAt - Date.now()) / (24 * 60 * 60 * 1000);
              if (daysRemaining < 15) {
                parsed.expiresAt = Date.now() + (DEFAULT_SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
                localStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(parsed));
              }
            }
            return parsed.user;
          }
        }
        // Fallback for legacy key
        const legacySaved = localStorage.getItem(AUTH_LEGACY_USER_KEY);
        if (legacySaved) {
          const legacyUser = JSON.parse(legacySaved);
          if (legacyUser && legacyUser.name) {
            saveAuthSession(legacyUser, true, legacyUser.authSource || 'local');
            return legacyUser;
          }
        }
      } catch (e) {
        console.warn("Failed to load persistent auth session:", e);
      }
      return null;
    }

    function clearAuthSession() {
      try {
        localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
        localStorage.removeItem(AUTH_LEGACY_USER_KEY);
        sessionStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
        sessionStorage.removeItem(AUTH_LEGACY_USER_KEY);
      } catch (e) {}
    }

    // Profiles are loaded from Supabase only after Auth has established a session.
    let usersList = [...DEFAULT_USERS];

    // Load persistent authentication session (preserves login across days/reloads)
    let currentUser = loadAuthSession();

    // Assistant Name Normalization & Deduplication Engine (v5.3.0)
    function normalizeAssistantName(str) {
      if (!str) return "";
      return String(str)
        .trim()
        .toLowerCase()
        .replace(/^(นาย|นางสาว|นาง|น\.ส\.|ด\.ช\.|ด\.ญ\.)\s*/g, "")
        .replace(/\s+/g, " ");
    }

    function getDeletedAssistantIds() {
      try {
        const raw = localStorage.getItem("ttm_deleted_assistant_ids");
        if (raw) {
          const arr = JSON.parse(raw);
          if (Array.isArray(arr)) return new Set(arr.map(id => String(id).trim()));
        }
      } catch(e) {}
      return new Set();
    }

    function recordDeletedAssistantId(id) {
      if (!id) return;
      try {
        const ids = getDeletedAssistantIds();
        ids.add(String(id).trim());
        localStorage.setItem("ttm_deleted_assistant_ids", JSON.stringify(Array.from(ids)));
      } catch(e) {}
    }

    function deduplicateAssistants(list) {
      if (!Array.isArray(list)) return [];
      const deletedIds = getDeletedAssistantIds();
      const seenIds = new Set();
      const seenNames = new Map();
      const result = [];

      for (const asst of list) {
        if (!asst) continue;
        const cleanId = String(asst.id || "").trim();
        if (cleanId && deletedIds.has(cleanId)) continue;

        const rawName = String(asst.name || "").trim();
        const rawNick = String(asst.nickname || "").trim();
        const normName = normalizeAssistantName(rawName);
        const normNick = normalizeAssistantName(rawNick);

        const nameKey = (normName || normNick) ? (normName + "|" + normNick) : cleanId;

        if (cleanId && seenIds.has(cleanId)) {
          const existing = result.find(a => a.id === cleanId);
          if (existing) {
            if (!existing.nickname && asst.nickname) existing.nickname = asst.nickname;
            if (!existing.phone && asst.phone) existing.phone = asst.phone;
            if (!existing.email && asst.email) existing.email = asst.email;
            if (asst.slots && Array.isArray(asst.slots) && asst.slots.length > 0) existing.slots = asst.slots;
            if (asst.shiftType && !existing.shiftType) existing.shiftType = asst.shiftType;
            if (asst.active !== undefined && existing.active === undefined) existing.active = asst.active;
            if (asst.canMassage !== undefined) existing.canMassage = asst.canMassage !== false;
            else if (asst.can_massage !== undefined) existing.canMassage = asst.can_massage !== false;
          }
          continue;
        }

        if (nameKey && seenNames.has(nameKey)) {
          const existing = seenNames.get(nameKey);
          if (!existing.nickname && asst.nickname) existing.nickname = asst.nickname;
          if (!existing.phone && asst.phone) existing.phone = asst.phone;
          if (!existing.email && asst.email) existing.email = asst.email;
          if (asst.slots && Array.isArray(asst.slots) && asst.slots.length > 0) existing.slots = asst.slots;
          if (asst.shiftType && !existing.shiftType) existing.shiftType = asst.shiftType;
          if (asst.active !== undefined && existing.active === undefined) existing.active = asst.active;
          if (asst.canMassage !== undefined) existing.canMassage = asst.canMassage !== false;
          else if (asst.can_massage !== undefined) existing.canMassage = asst.can_massage !== false;
          continue;
        }

        const canMassageVal = (asst.canMassage !== undefined ? asst.canMassage !== false : (asst.can_massage !== undefined ? asst.can_massage !== false : true));

        const cleaned = {
          ...asst,
          id: cleanId || ("asst-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6)),
          name: rawName || rawNick || "ผู้ช่วย",
          nickname: rawNick || rawName || "ผู้ช่วย",
          gender: asst.gender || "female",
          role: asst.role || "staff",
          phone: asst.phone || "",
          email: asst.email || "",
          active: asst.active !== false,
          canMassage: canMassageVal,
          can_massage: canMassageVal,
          shiftType: (asst.shiftType && asst.shiftType !== 'off') ? asst.shiftType : 'full',
          slots: Array.isArray(asst.slots) && asst.slots.length > 0 ? asst.slots : [...(typeof ALL_WORKING_SLOTS !== 'undefined' ? ALL_WORKING_SLOTS : ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"])],
          created_at: asst.created_at || new Date().toISOString()
        };

        if (cleaned.id) seenIds.add(cleaned.id);
        if (nameKey) seenNames.set(nameKey, cleaned);
        result.push(cleaned);
      }

      // Self-heal: Ensure all non-archived clinic staff remain active (leave is stored per-date in duty roster)
      result.forEach(a => {
        if (a.shiftType === 'off') a.shiftType = 'full';
        if (a.active === false && !a.isArchived) a.active = true;
      });

      return result;
    }

    // Default Assistants List
    const DEFAULT_ASSISTANTS = [
      { id: "asst-1", name: "น.ส. นัสรีน ดือราแม", nickname: "นัสรีน", gender: "female", phone: "0800000002", email: "staff@ttm.clinic", role: "staff", active: true },
      { id: "asst-2", name: "น.ส. มีนี สาและ", nickname: "มีนี", gender: "female", phone: "0823456789", email: "meenee@ttm.clinic", role: "staff", active: true },
      { id: "asst-3", name: "น.ส. ฟาตีเมาะห์ ยะลา", nickname: "ฟา", gender: "female", phone: "0834567890", email: "fah@ttm.clinic", role: "staff", active: true },
      { id: "asst-4", name: "นาย เลาะห์ มามุ", nickname: "เลาะห์", gender: "male", phone: "0845678901", email: "loh@ttm.clinic", role: "staff", active: true }
    ];

    let assistants = deduplicateAssistants([...DEFAULT_ASSISTANTS]);
    try {
      const savedAssts = localStorage.getItem("ttm_assistants");
      if (savedAssts) {
        const parsed = JSON.parse(savedAssts);
        if (Array.isArray(parsed) && parsed.length > 0) {
          assistants = deduplicateAssistants(parsed);
        }
      }
    } catch(e) {}

    // Assistant Duty Rosters State (ตารางจัดคิวนวด/เวรของผู้ช่วยแพทย์แผนไทย แยกตามวัน)
    let assistantDutyRosters = {};
    try {
      const savedRosters = localStorage.getItem("ttm_assistant_duty_rosters");
      if (savedRosters) {
        assistantDutyRosters = JSON.parse(savedRosters);
      }
    } catch(e) {
      assistantDutyRosters = {};
    }
    let currentRosterDate = "";

    // Assistant Leaves State (ข้อมูลการลาของผู้ช่วยแพทย์แผนไทย แยกตามวัน/ช่วงเวลา)
    let assistantLeaves = [];
    try {
      const savedLeaves = localStorage.getItem("ttm_assistant_leaves");
      if (savedLeaves) {
        const parsedLeaves = JSON.parse(savedLeaves);
        if (Array.isArray(parsedLeaves)) {
          assistantLeaves = parsedLeaves;
        }
      }
    } catch(e) {
      assistantLeaves = [];
    }

