const fs = require('fs');
const vm = require('vm');

console.log("Starting assistant deduplication & Supabase insert fix script...");

let content = fs.readFileSync('index.html', 'utf8');

// 1. Helper functions
const helperCode = `    // Assistant Name Normalization & Deduplication Engine (v5.1.8)
    function normalizeAssistantName(str) {
      if (!str) return "";
      return String(str)
        .trim()
        .toLowerCase()
        .replace(/^(นาย|นางสาว|นาง|น\\.ส\\.|ด\\.ช\\.|ด\\.ญ\\.)\\s*/g, "")
        .replace(/\\s+/g, " ");
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
          continue;
        }

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
          shiftType: asst.shiftType || (asst.active !== false ? 'full' : 'off'),
          slots: Array.isArray(asst.slots) ? asst.slots : (asst.active !== false ? [...ALL_WORKING_SLOTS] : []),
          created_at: asst.created_at || new Date().toISOString()
        };

        if (cleaned.id) seenIds.add(cleaned.id);
        if (nameKey) seenNames.set(nameKey, cleaned);
        result.push(cleaned);
      }

      return result;
    }
`;

// Replace assistant initialization section
const oldInit = `    // Default Assistants List
    const DEFAULT_ASSISTANTS = [
      { id: "asst-1", name: "น.ส. นัสรีน ดือราแม", nickname: "นัสรีน", gender: "female", phone: "0800000002", email: "staff@ttm.clinic", role: "staff", active: true },
      { id: "asst-2", name: "น.ส. มีนี สาและ", nickname: "มีนี", gender: "female", phone: "0823456789", email: "meenee@ttm.clinic", role: "staff", active: true },
      { id: "asst-3", name: "น.ส. ฟาตีเมาะห์ ยะลา", nickname: "ฟา", gender: "female", phone: "0834567890", email: "fah@ttm.clinic", role: "staff", active: true },
      { id: "asst-4", name: "นาย เลาะห์ มามุ", nickname: "เลาะห์", gender: "male", phone: "0845678901", email: "loh@ttm.clinic", role: "staff", active: true }
    ];

    let assistants = [...DEFAULT_ASSISTANTS];
    try {
      const savedAssts = localStorage.getItem("ttm_assistants");
      if (savedAssts) {
        const parsed = JSON.parse(savedAssts);
        if (Array.isArray(parsed) && parsed.length > 0) {
          assistants = parsed;
        }
      }
    } catch(e) {}`;

const newInit = `${helperCode}
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
    } catch(e) {}`;

if (!content.includes(oldInit)) {
  console.error("Error: oldInit block not matched in index.html");
  process.exit(1);
}
content = content.replace(oldInit, newInit);
console.log("Replaced assistant initialization block successfully.");

// Replace handleRealtimeAssistantEvent
const oldRealtime = `    function handleRealtimeAssistantEvent(payload) {
      const { eventType, new: newRec, old: oldRec } = payload;
      const isRecentLocalEdit = (Date.now() - (typeof lastAssistantLocalEditTime !== 'undefined' ? lastAssistantLocalEditTime : 0) < 2500);

      if (eventType === "INSERT" || eventType === "UPDATE") {
        if (!newRec || !newRec.id) return;
        const idx = assistants.findIndex(a => a.id === newRec.id);
        if (idx !== -1) assistants[idx] = newRec;
        else assistants.push(newRec);
        populateAssistantsDropdown("new-assistant-select");
        if (!isRecentLocalEdit) {
          renderManageShifts();
        }
      } else if (eventType === "DELETE") {
        if (!oldRec || !oldRec.id) return;
        const idx = assistants.findIndex(a => a.id === oldRec.id);
        if (idx !== -1) {
          assistants.splice(idx, 1);
          populateAssistantsDropdown("new-assistant-select");
          if (!isRecentLocalEdit) {
            renderManageShifts();
          }
        }
      }
    }`;

const newRealtime = `    function handleRealtimeAssistantEvent(payload) {
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
    }`;

if (!content.includes(oldRealtime)) {
  console.error("Error: oldRealtime block not matched");
  process.exit(1);
}
content = content.replace(oldRealtime, newRealtime);
console.log("Replaced handleRealtimeAssistantEvent block successfully.");

// Replace loadAllDataFromSupabase assistant sync
const oldSyncAsst = `        // 3. Sync Assistants (Preserving shiftType, custom slots & roles)
        try {
          const { data: asstData, error: asstErr } = await supabaseClient
            .from("assistants")
            .select("*")
            .order("created_at", { ascending: true });
          if (!asstErr && asstData && asstData.length > 0) {
            const localMap = new Map((assistants || []).map(a => [a.id, a]));
            assistants = asstData.map(a => {
              const local = localMap.get(a.id);
              return {
                ...a,
                active: a.active !== false,
                shiftType: a.shift_type || a.shiftType || (local && local.shiftType) || (a.active !== false ? 'full' : 'off'),
                slots: Array.isArray(a.slots) ? a.slots : ((local && Array.isArray(local.slots)) ? local.slots : (a.active !== false ? ALL_WORKING_SLOTS : []))
              };
            });
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
        } catch(e) {}`;

const newSyncAsst = `        // 3. Sync Assistants (Preserving shiftType, custom slots, roles & merging local additions)
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
        } catch(e) {}`;

if (!content.includes(oldSyncAsst)) {
  console.error("Error: oldSyncAsst block not matched");
  process.exit(1);
}
content = content.replace(oldSyncAsst, newSyncAsst);
console.log("Replaced loadAllDataFromSupabase assistants block successfully.");

// Replace step 5 master_list sync
const oldMasterListSync = `              else if (c.scope === "assistants" && c.config_key === "master_list" && Array.isArray(c.slots_json) && c.slots_json.length > 0) {
                // Merge master shift configs from cloud
                const cloudMap = new Map(c.slots_json.map(a => [a.id, a]));
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
              }`;

const newMasterListSync = `              else if (c.scope === "assistants" && c.config_key === "master_list" && Array.isArray(c.slots_json) && c.slots_json.length > 0) {
                // Merge master shift configs from cloud & deduplicate
                const cloudMaster = c.slots_json;
                const combined = [...(assistants || []), ...cloudMaster];
                assistants = deduplicateAssistants(combined);
                try { localStorage.setItem("ttm_assistants", JSON.stringify(assistants)); } catch(e) {}
              }`;

if (!content.includes(oldMasterListSync)) {
  console.error("Error: oldMasterListSync block not matched");
  process.exit(1);
}
content = content.replace(oldMasterListSync, newMasterListSync);
console.log("Replaced master_list sync block successfully.");

// Replace persistAssistants
const oldPersist = `    function persistAssistants() {
      const safeAssistants = (assistants || []).map(a => ({
        id: a.id, name: a.name, nickname: a.nickname, gender: a.gender,
        phone: a.phone, email: a.email, role: a.role, active: a.active !== false,
        shiftType: a.shiftType || (a.active !== false ? 'full' : 'off'),
        slots: Array.isArray(a.slots) ? a.slots : (a.active !== false ? ALL_WORKING_SLOTS : []),
        created_at: a.created_at
      }));
      try { localStorage.setItem("ttm_assistants", JSON.stringify(safeAssistants)); } catch(e) {}

      if (typeof supabaseClient !== 'undefined' && supabaseClient) {
        try {
          supabaseClient.from("slot_configs").upsert({
            id: "config_assistants_master",
            scope: "assistants",
            config_key: "master_list",
            slots_json: safeAssistants,
            updated_at: new Date().toISOString()
          }, { onConflict: "id" }).then(() => {}).catch(err => {
            console.warn("Supabase assistants master sync warning:", err);
          });
        } catch(e) {}
      }
    }`;

const newPersist = `    function persistAssistants() {
      assistants = deduplicateAssistants(assistants);
      const safeAssistants = (assistants || []).map(a => ({
        id: a.id, name: a.name, nickname: a.nickname, gender: a.gender,
        phone: a.phone, email: a.email, role: a.role, active: a.active !== false,
        shiftType: a.shiftType || (a.active !== false ? 'full' : 'off'),
        slots: Array.isArray(a.slots) ? a.slots : (a.active !== false ? [...ALL_WORKING_SLOTS] : []),
        created_at: a.created_at
      }));
      try { localStorage.setItem("ttm_assistants", JSON.stringify(safeAssistants)); } catch(e) {}

      if (typeof supabaseClient !== 'undefined' && supabaseClient) {
        try {
          supabaseClient.from("slot_configs").upsert({
            id: "config_assistants_master",
            scope: "assistants",
            config_key: "master_list",
            slots_json: safeAssistants,
            updated_at: new Date().toISOString()
          }, { onConflict: "id" }).then(() => {}).catch(err => {
            console.warn("Supabase assistants master sync warning:", err);
          });
        } catch(e) {}
      }
    }`;

if (!content.includes(oldPersist)) {
  console.error("Error: oldPersist block not matched");
  process.exit(1);
}
content = content.replace(oldPersist, newPersist);
console.log("Replaced persistAssistants block successfully.");

// Replace deleteAssistant, handleAddAssistantSubmit, handleEditAssistantSubmit
const oldAssistantCRUD = `    async function deleteAssistant(asstId) {
      if (!currentUser || currentUser.role !== 'admin') {
        showToast("🔒 เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่สามารถลบรายชื่อผู้ช่วยได้", "error");
        return;
      }
      const asst = assistants.find(a => a.id === asstId);
      if (!asst) return;

      if (!confirm(\`คุณต้องการลบรายชื่อผู้ช่วย "\${asst.nickname} (\${asst.name})" ออกจากระบบหรือไม่?\`)) {
        return;
      }

      const idx = assistants.findIndex(a => a.id === asstId);
      if (idx !== -1) {
        assistants.splice(idx, 1);
      }
      persistAssistants();

      // Remove from usersList if linked
      const userIdx = usersList.findIndex(u => u.id === "usr-" + asstId);
      if (userIdx !== -1) {
        usersList.splice(userIdx, 1);
      }

      await logActivity("CHANGE_ASSISTANT", \`ลบรายชื่อผู้ช่วยฯ ออกจากระบบ: \${asst.nickname} (\${asst.name})\`, {
        assistantId: asstId,
        name: asst.name,
        nickname: asst.nickname
      });

      renderManageShifts();
      populateAssistantsDropdown("new-assistant-select");
      showToast(\`ลบรายชื่อผู้ช่วย \${asst.nickname} เรียบร้อยแล้ว\`, "info");

      if (supabaseClient) {
        try {
          const { error } = await supabaseClient.from("assistants").delete().eq("id", asstId);
          if (error) console.error("Supabase delete assistant error:", error);
        } catch(err) {
          console.error("Supabase delete assistant exception:", err);
        }
      }
    }

    function openAddAssistantModal() {
      const modal = document.getElementById("modal-add-assistant");
      if (modal) {
        modal.classList.remove("hidden");
        lucide.createIcons();
      }
    }

    function closeAddAssistantModal() {
      const modal = document.getElementById("modal-add-assistant");
      if (modal) modal.classList.add("hidden");
    }

    async function handleAddAssistantSubmit(e) {
      e.preventDefault();
      lastAssistantLocalEditTime = Date.now();

      const fullname = (document.getElementById("new-asst-fullname")?.value || "").trim();
      const nickname = (document.getElementById("new-asst-nickname")?.value || "").trim();
      const gender = document.getElementById("new-asst-gender")?.value || "female";
      const role = document.getElementById("new-asst-role")?.value || "staff";
      const phone = (document.getElementById("new-asst-phone")?.value || "").trim();
      const email = (document.getElementById("new-asst-email")?.value || "").trim();
      const shiftType = document.getElementById("new-asst-shift-type")?.value || "full";

      if (!fullname || !nickname) return;

      let slots = [...ALL_WORKING_SLOTS];
      let active = true;
      if (shiftType === 'official') slots = [...IN_HOURS_SLOTS];
      else if (shiftType === 'ot') slots = [...OUT_OF_HOURS_SLOTS];
      else if (shiftType === 'off') {
        active = false;
        slots = [];
      }

      const newObj = {
        id: "asst-" + Date.now(),
        name: fullname,
        nickname: nickname,
        gender: gender,
        role: role,
        phone: phone,
        email: email,
        active: active,
        shiftType: shiftType,
        slots: slots,
        created_at: new Date().toISOString()
      };
      assistants.push(newObj);
      persistAssistants();

      closeAddAssistantModal();
      e.target.reset();

      renderManageShifts();
      populateAssistantsDropdown("new-assistant-select");
      showToast(\`เพิ่มผู้ช่วยฯ \${nickname} เรียบร้อยแล้ว\`, "success");

      await logActivity("CHANGE_ASSISTANT", \`เพิ่มรายชื่อผู้ช่วยฯ ใหม่: \${nickname} (\${fullname}) [สิทธิ์: \${role.toUpperCase()}, เวร: \${shiftType}]\`, {
        assistantId: newObj.id,
        name: fullname,
        nickname: nickname,
        gender: gender,
        role: role,
        phone: phone,
        email: email,
        shiftType: shiftType
      });

      if (supabaseClient) {
        try {
          await supabaseClient.from("assistants").insert([{
            id: newObj.id,
            name: newObj.name,
            nickname: newObj.nickname,
            gender: newObj.gender,
            role: newObj.role,
            phone: newObj.phone,
            email: newObj.email,
            active: newObj.active,
            shift_type: newObj.shiftType,
            slots: newObj.slots
          }]);
        } catch(err) { console.error("Supabase insert assistant error:", err); }
      }
    }

    function openEditAssistantModal(asstId) {
      const asst = assistants.find(a => a.id === asstId);
      if (!asst) return;

      document.getElementById("edit-asst-id").value = asst.id;
      document.getElementById("edit-asst-fullname").value = asst.name || "";
      document.getElementById("edit-asst-nickname").value = asst.nickname || "";
      document.getElementById("edit-asst-gender").value = asst.gender || "female";
      document.getElementById("edit-asst-phone").value = asst.phone || "";
      document.getElementById("edit-asst-email").value = asst.email || "";
      document.getElementById("edit-asst-role").value = asst.role || "staff";
      
      const shiftTypeSelect = document.getElementById("edit-asst-shift-type");
      if (shiftTypeSelect) {
        shiftTypeSelect.value = (asst.active === false || asst.shiftType === 'off') ? 'off' : (asst.shiftType || 'full');
      }

      const activeSelect = document.getElementById("edit-asst-active");
      if (activeSelect) {
        activeSelect.value = (asst.active !== false && asst.shiftType !== 'off') ? "true" : "false";
      }

      document.getElementById("modal-edit-assistant").classList.remove("hidden");
      lucide.createIcons();
    }

    function closeEditAssistantModal() {
      document.getElementById("modal-edit-assistant").classList.add("hidden");
    }

    async function handleEditAssistantSubmit(e) {
      e.preventDefault();
      const asstId = document.getElementById("edit-asst-id")?.value;
      const asst = assistants.find(a => a.id === asstId);
      if (!asst) return;

      const oldData = { ...asst };
      const fullname = (document.getElementById("edit-asst-fullname")?.value || "").trim();
      const nickname = (document.getElementById("edit-asst-nickname")?.value || "").trim();
      const gender = document.getElementById("edit-asst-gender")?.value || "female";
      const phone = (document.getElementById("edit-asst-phone")?.value || "").trim();
      const email = (document.getElementById("edit-asst-email")?.value || "").trim();
      const role = document.getElementById("edit-asst-role")?.value || "staff";
      const shiftType = document.getElementById("edit-asst-shift-type")?.value || "full";
      const active = document.getElementById("edit-asst-active")?.value === "true" && shiftType !== "off";

      asst.name = fullname;
      asst.nickname = nickname;
      asst.gender = gender;
      asst.phone = phone;
      asst.email = email;
      asst.role = role;
      asst.shiftType = shiftType;
      asst.active = active;

      if (shiftType === 'official') asst.slots = [...IN_HOURS_SLOTS];
      else if (shiftType === 'ot') asst.slots = [...OUT_OF_HOURS_SLOTS];
      else if (shiftType === 'full') asst.slots = [...ALL_WORKING_SLOTS];
      else if (shiftType === 'off') {
        asst.active = false;
        asst.slots = [];
      }

      persistAssistants();

      await logActivity("CONFIG_SYSTEM", \`แก้ไขข้อมูลผู้ช่วยฯ: \${nickname} (\${fullname}) [สิทธิ์: \${role.toUpperCase()}, เวร: \${shiftType}]\`, {
        assistantId: asstId,
        changes: {
          from: oldData,
          to: asst
        }
      });

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
            active: asst.active,
            shift_type: asst.shiftType,
            slots: asst.slots
          });
        } catch(err) {
          console.warn("Supabase assistant update error:", err);
        }
      }

      closeEditAssistantModal();
      renderManageShifts();
      populateAssistantsDropdown("new-assistant-select");
      showToast(\`บันทึกการแก้ไขข้อมูลผู้ช่วย "\${nickname}" เรียบร้อยแล้ว\`, "success");
    }`;

const newAssistantCRUD = `    async function deleteAssistant(asstId) {
      if (!currentUser || currentUser.role !== 'admin') {
        showToast("🔒 เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่สามารถลบรายชื่อผู้ช่วยได้", "error");
        return;
      }
      const asst = assistants.find(a => a.id === asstId);
      if (!asst) return;

      if (!confirm(\`คุณต้องการลบรายชื่อผู้ช่วย "\${asst.nickname} (\${asst.name})" ออกจากระบบหรือไม่?\`)) {
        return;
      }

      recordDeletedAssistantId(asstId);
      const idx = assistants.findIndex(a => a.id === asstId);
      if (idx !== -1) {
        assistants.splice(idx, 1);
      }
      persistAssistants();

      // Remove from usersList if linked
      const userIdx = usersList.findIndex(u => u.id === "usr-" + asstId);
      if (userIdx !== -1) {
        usersList.splice(userIdx, 1);
      }

      await logActivity("CHANGE_ASSISTANT", \`ลบรายชื่อผู้ช่วยฯ ออกจากระบบ: \${asst.nickname} (\${asst.name})\`, {
        assistantId: asstId,
        name: asst.name,
        nickname: asst.nickname
      });

      renderManageShifts();
      populateAssistantsDropdown("new-assistant-select");
      showToast(\`ลบรายชื่อผู้ช่วย \${asst.nickname} เรียบร้อยแล้ว\`, "info");

      if (supabaseClient) {
        try {
          const { error } = await supabaseClient.from("assistants").delete().eq("id", asstId);
          if (error) console.error("Supabase delete assistant error:", error);
        } catch(err) {
          console.error("Supabase delete assistant exception:", err);
        }
      }
    }

    function openAddAssistantModal() {
      const modal = document.getElementById("modal-add-assistant");
      if (modal) {
        modal.classList.remove("hidden");
        lucide.createIcons();
      }
    }

    function closeAddAssistantModal() {
      const modal = document.getElementById("modal-add-assistant");
      if (modal) modal.classList.add("hidden");
    }

    async function handleAddAssistantSubmit(e) {
      e.preventDefault();
      lastAssistantLocalEditTime = Date.now();

      const fullname = (document.getElementById("new-asst-fullname")?.value || "").trim();
      const nickname = (document.getElementById("new-asst-nickname")?.value || "").trim();
      const gender = document.getElementById("new-asst-gender")?.value || "female";
      const role = document.getElementById("new-asst-role")?.value || "staff";
      const phone = (document.getElementById("new-asst-phone")?.value || "").trim();
      const email = (document.getElementById("new-asst-email")?.value || "").trim();
      const shiftType = document.getElementById("new-asst-shift-type")?.value || "full";

      if (!fullname || !nickname) return;

      // Duplicate check: prevent duplicate assistant creation
      const existing = (assistants || []).find(a => 
        (a.nickname && a.nickname.trim().toLowerCase() === nickname.toLowerCase()) ||
        (a.name && normalizeAssistantName(a.name) === normalizeAssistantName(fullname))
      );
      if (existing) {
        showToast(\`มีรายชื่อผู้ช่วย "\${nickname}" อยู่ในระบบแล้ว\`, "warning");
        closeAddAssistantModal();
        return;
      }

      let slots = [...ALL_WORKING_SLOTS];
      let active = true;
      if (shiftType === 'official') slots = [...IN_HOURS_SLOTS];
      else if (shiftType === 'ot') slots = [...OUT_OF_HOURS_SLOTS];
      else if (shiftType === 'off') {
        active = false;
        slots = [];
      }

      const newObj = {
        id: "asst-" + Date.now(),
        name: fullname,
        nickname: nickname,
        gender: gender,
        role: role,
        phone: phone,
        email: email,
        active: active,
        shiftType: shiftType,
        slots: slots,
        created_at: new Date().toISOString()
      };
      assistants.push(newObj);
      assistants = deduplicateAssistants(assistants);
      persistAssistants();

      closeAddAssistantModal();
      e.target.reset();

      renderManageShifts();
      populateAssistantsDropdown("new-assistant-select");
      showToast(\`เพิ่มผู้ช่วยฯ \${nickname} เรียบร้อยแล้ว\`, "success");

      await logActivity("CHANGE_ASSISTANT", \`เพิ่มรายชื่อผู้ช่วยฯ ใหม่: \${nickname} (\${fullname}) [สิทธิ์: \${role.toUpperCase()}, เวร: \${shiftType}]\`, {
        assistantId: newObj.id,
        name: fullname,
        nickname: nickname,
        gender: gender,
        role: role,
        phone: phone,
        email: email,
        shiftType: shiftType
      });

      if (supabaseClient) {
        try {
          const { error } = await supabaseClient.from("assistants").upsert({
            id: newObj.id,
            name: newObj.name,
            nickname: newObj.nickname,
            gender: newObj.gender,
            role: newObj.role,
            phone: newObj.phone,
            email: newObj.email,
            active: newObj.active
          });
          if (error) console.error("Supabase insert assistant error:", error);
        } catch(err) { console.error("Supabase insert assistant error:", err); }
      }
    }

    function openEditAssistantModal(asstId) {
      const asst = assistants.find(a => a.id === asstId);
      if (!asst) return;

      document.getElementById("edit-asst-id").value = asst.id;
      document.getElementById("edit-asst-fullname").value = asst.name || "";
      document.getElementById("edit-asst-nickname").value = asst.nickname || "";
      document.getElementById("edit-asst-gender").value = asst.gender || "female";
      document.getElementById("edit-asst-phone").value = asst.phone || "";
      document.getElementById("edit-asst-email").value = asst.email || "";
      document.getElementById("edit-asst-role").value = asst.role || "staff";
      
      const shiftTypeSelect = document.getElementById("edit-asst-shift-type");
      if (shiftTypeSelect) {
        shiftTypeSelect.value = (asst.active === false || asst.shiftType === 'off') ? 'off' : (asst.shiftType || 'full');
      }

      const activeSelect = document.getElementById("edit-asst-active");
      if (activeSelect) {
        activeSelect.value = (asst.active !== false && asst.shiftType !== 'off') ? "true" : "false";
      }

      document.getElementById("modal-edit-assistant").classList.remove("hidden");
      lucide.createIcons();
    }

    function closeEditAssistantModal() {
      document.getElementById("modal-edit-assistant").classList.add("hidden");
    }

    async function handleEditAssistantSubmit(e) {
      e.preventDefault();
      const asstId = document.getElementById("edit-asst-id")?.value;
      const asst = assistants.find(a => a.id === asstId);
      if (!asst) return;

      const oldData = { ...asst };
      const fullname = (document.getElementById("edit-asst-fullname")?.value || "").trim();
      const nickname = (document.getElementById("edit-asst-nickname")?.value || "").trim();
      const gender = document.getElementById("edit-asst-gender")?.value || "female";
      const phone = (document.getElementById("edit-asst-phone")?.value || "").trim();
      const email = (document.getElementById("edit-asst-email")?.value || "").trim();
      const role = document.getElementById("edit-asst-role")?.value || "staff";
      const shiftType = document.getElementById("edit-asst-shift-type")?.value || "full";
      const active = document.getElementById("edit-asst-active")?.value === "true" && shiftType !== "off";

      asst.name = fullname;
      asst.nickname = nickname;
      asst.gender = gender;
      asst.phone = phone;
      asst.email = email;
      asst.role = role;
      asst.shiftType = shiftType;
      asst.active = active;

      if (shiftType === 'official') asst.slots = [...IN_HOURS_SLOTS];
      else if (shiftType === 'ot') asst.slots = [...OUT_OF_HOURS_SLOTS];
      else if (shiftType === 'full') asst.slots = [...ALL_WORKING_SLOTS];
      else if (shiftType === 'off') {
        asst.active = false;
        asst.slots = [];
      }

      persistAssistants();

      await logActivity("CONFIG_SYSTEM", \`แก้ไขข้อมูลผู้ช่วยฯ: \${nickname} (\${fullname}) [สิทธิ์: \${role.toUpperCase()}, เวร: \${shiftType}]\`, {
        assistantId: asstId,
        changes: {
          from: oldData,
          to: asst
        }
      });

      if (supabaseClient) {
        try {
          const { error } = await supabaseClient.from("assistants").upsert({
            id: asst.id,
            name: asst.name,
            nickname: asst.nickname,
            gender: asst.gender,
            phone: asst.phone,
            email: asst.email,
            role: asst.role,
            active: asst.active
          });
          if (error) console.warn("Supabase assistant update error:", error);
        } catch(err) {
          console.warn("Supabase assistant update error:", err);
        }
      }

      closeEditAssistantModal();
      renderManageShifts();
      populateAssistantsDropdown("new-assistant-select");
      showToast(\`บันทึกการแก้ไขข้อมูลผู้ช่วย "\${nickname}" เรียบร้อยแล้ว\`, "success");
    }`;

if (!content.includes(oldAssistantCRUD)) {
  console.error("Error: oldAssistantCRUD block not matched");
  process.exit(1);
}
content = content.replace(oldAssistantCRUD, newAssistantCRUD);
console.log("Replaced Assistant CRUD block successfully.");

// Clean other Supabase update calls to assistants table
content = content.replace(
  `      if (supabaseClient) {
        try {
          await supabaseClient.from("assistants").update({
            active: asst.active,
            shift_type: asst.shiftType,
            slots: asst.slots
          }).eq("id", asstId);
        } catch(e) { console.error("Error syncing shift type to Supabase:", e); }
      }`,
  `      if (supabaseClient) {
        try {
          await supabaseClient.from("assistants").update({
            active: asst.active
          }).eq("id", asstId);
        } catch(e) { console.error("Error syncing shift type to Supabase:", e); }
      }`
);

content = content.replace(
  `        try {
          for (const a of assistants) {
            await supabaseClient.from("assistants").update({
              active: a.active,
              shift_type: a.shiftType,
              slots: a.slots
            }).eq("id", a.id);
          }
        } catch(e) { console.error("Error syncing bulk shift preset to Supabase:", e); }`,
  `        try {
          for (const a of assistants) {
            await supabaseClient.from("assistants").update({
              active: a.active
            }).eq("id", a.id);
          }
        } catch(e) { console.error("Error syncing bulk shift preset to Supabase:", e); }`
);

content = content.replace(
  `      if (supabaseClient) {
        try {
          await supabaseClient.from("assistants").update({
            active: asst.active,
            shift_type: asst.shiftType,
            slots: asst.slots
          }).eq("id", asstId);
        } catch(e) { console.error("Error saving slot picker to Supabase:", e); }
      }`,
  `      if (supabaseClient) {
        try {
          await supabaseClient.from("assistants").update({
            active: asst.active
          }).eq("id", asstId);
        } catch(e) { console.error("Error saving slot picker to Supabase:", e); }
      }`
);

// Add deduplicateAssistants at start of renderManageShifts
const oldRenderManageShifts = `    // ==================== RENDER ASSISTANT SHIFTS TAB ====================
    function renderManageShifts(dateStr) {
      const container = document.getElementById("assistants-shifts-list");
      if (!container) return;`;

const newRenderManageShifts = `    // ==================== RENDER ASSISTANT SHIFTS TAB ====================
    function renderManageShifts(dateStr) {
      const container = document.getElementById("assistants-shifts-list");
      if (!container) return;
      assistants = deduplicateAssistants(assistants);`;

if (!content.includes(oldRenderManageShifts)) {
  console.error("Error: oldRenderManageShifts block not matched");
  process.exit(1);
}
content = content.replace(oldRenderManageShifts, newRenderManageShifts);
console.log("Updated renderManageShifts with deduplication.");

// Bump version to v5.1.8
content = content.replace(/v5\.1\.7/g, 'v5.1.8');

// Write back to index.html and all synced files
fs.writeFileSync('index.html', content, 'utf8');
fs.writeFileSync('TTM Booking System.html', content, 'utf8');
fs.writeFileSync('dist/index.html', content, 'utf8');
fs.writeFileSync('dist/TTM Booking System.html', content, 'utf8');

console.log("Synchronized all 4 HTML files.");

// Update Service Worker cache version in sw.js and dist/sw.js
let swContent = fs.readFileSync('sw.js', 'utf8');
swContent = swContent.replace('ttm-clinic-cache-v124', 'ttm-clinic-cache-v125');
fs.writeFileSync('sw.js', swContent, 'utf8');
fs.writeFileSync('dist/sw.js', swContent, 'utf8');

console.log("Updated sw.js and dist/sw.js to ttm-clinic-cache-v125.");

// Validate JavaScript syntax in all modified HTML files
const scriptMatches = content.match(/<script[^>]*>([\s\S]*?)<\/script>/gi);
let totalScripts = 0;
if (scriptMatches) {
  scriptMatches.forEach((tag, idx) => {
    const code = tag.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '');
    if (code.trim().length > 50) {
      try {
        new vm.Script(code);
        totalScripts++;
      } catch (err) {
        console.error("JS Syntax Error in script #" + idx + ":", err);
        process.exit(1);
      }
    }
  });
}

console.log("All " + totalScripts + " script tags validated with vm.Script successfully with 0 errors!");
