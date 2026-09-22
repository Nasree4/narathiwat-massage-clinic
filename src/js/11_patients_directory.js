/**
 * Module 11: 11_patients_directory.js
 * Description: Patients Directory, Search & Treatment History
 * Generated from lines 17039 to 18778 of original index.html
 */

    /* =========================================================================
       PATIENTS DIRECTORY & TREATMENT HISTORY FUNCTIONS (ประวัติคนไข้)
       ========================================================================= */
    function getUniquePatients() {
      const patientMap = new Map();

      appointments.forEach(apt => {
        let key = "";
        const hnTrimmed = (apt.citizenOrHn || "").trim();
        const phoneTrimmed = (apt.phone || "").trim().replace(/[^0-9]/g, "");
        const nameTrimmed = (apt.patientName || "").trim().toLowerCase();

        if (hnTrimmed && hnTrimmed !== "-") {
          key = "HN_" + hnTrimmed.toLowerCase();
        } else if (phoneTrimmed) {
          key = "TEL_" + phoneTrimmed;
        } else {
          key = "NAME_" + nameTrimmed;
        }

        if (!patientMap.has(key)) {
          patientMap.set(key, {
            key,
            patientName: apt.patientName,
            citizenOrHn: apt.citizenOrHn,
            phone: apt.phone,
            appointments: []
          });
        }

        const p = patientMap.get(key);
        if ((!p.citizenOrHn || p.citizenOrHn === "-") && hnTrimmed && hnTrimmed !== "-") {
          p.citizenOrHn = apt.citizenOrHn;
        }
        if ((!p.phone || p.phone === "-") && phoneTrimmed) {
          p.phone = apt.phone;
        }
        p.appointments.push(apt);
      });

      return Array.from(patientMap.values()).map(p => {
        // Sort appointments by bookDate desc, timeSlot desc
        p.appointments.sort((a, b) => {
          if (a.bookDate !== b.bookDate) {
            return b.bookDate.localeCompare(a.bookDate);
          }
          return b.timeSlot.localeCompare(a.timeSlot);
        });

        const totalVisits = p.appointments.length;
        const completedVisits = p.appointments.filter(a => a.status === "🟢 กลับบ้าน").length;
        const lastVisit = p.appointments[0];

        const allServices = new Set();
        const allAssistants = new Set();
        let hasMassage = false;
        let hasPostpartum = false;

        p.appointments.forEach(a => {
          if (a.mainService) {
            allServices.add(a.mainService);
            if (a.mainService === "จองนวด" || a.mainService.includes("นวด")) hasMassage = true;
            if (a.mainService === "จองฟื้นฟูหลังคลอด" || a.mainService.includes("หลังคลอด")) hasPostpartum = true;
          }
          if (a.extraServices && Array.isArray(a.extraServices)) {
            a.extraServices.forEach(s => allServices.add(s));
          }
          if (a.assistantNick && a.assistantNick !== "จัดสรรตามเหมาะสม" && a.assistantNick !== "ไม่ระบุ" && a.assistantNick !== "auto") {
            allAssistants.add(a.assistantNick);
          }
        });

        const lastMedicalScheme = lastVisit?.medicalScheme || p.appointments.find(a => a.medicalScheme)?.medicalScheme || "บัตรทอง";

        return {
          ...p,
          medicalScheme: lastMedicalScheme,
          totalVisits,
          completedVisits,
          hasMassage,
          hasPostpartum,
          lastVisitDate: lastVisit ? lastVisit.bookDate : "-",
          lastVisitSlot: lastVisit ? lastVisit.timeSlot : "-",
          servicesList: Array.from(allServices),
          assistantsList: Array.from(allAssistants)
        };
      });
    }

    function renderPatientsList() {
      const allPatients = getUniquePatients();
      const searchQuery = (document.getElementById("patients-search-input")?.value || "").toLowerCase().trim();
      const serviceFilter = document.getElementById("patients-service-filter")?.value || "all";
      const sortOption = document.getElementById("patients-sort-select")?.value || "recent";

      // Global Stats
      const totalCount = allPatients.length;
      const massageCount = allPatients.filter(p => p.hasMassage).length;
      const postpartumCount = allPatients.filter(p => p.hasPostpartum).length;
      const returningCount = allPatients.filter(p => p.totalVisits >= 2).length;

      const totalBadge = document.getElementById("patients-total-badge");
      if (totalBadge) totalBadge.textContent = `${totalCount} คน`;

      const statTotal = document.getElementById("pstat-total-count");
      if (statTotal) statTotal.textContent = `${totalCount} คน`;

      const statMassage = document.getElementById("pstat-massage-count");
      if (statMassage) statMassage.textContent = `${massageCount} คน`;

      const statPostpartum = document.getElementById("pstat-postpartum-count");
      if (statPostpartum) statPostpartum.textContent = `${postpartumCount} คน`;

      const statReturning = document.getElementById("pstat-returning-count");
      if (statReturning) statReturning.textContent = `${returningCount} คน`;

      // Filter patients
      let filtered = allPatients.filter(p => {
        if (serviceFilter === "massage" && !p.hasMassage) return false;
        if (serviceFilter === "postpartum" && !p.hasPostpartum) return false;
        if (searchQuery) {
          const matchName = (p.patientName || "").toLowerCase().includes(searchQuery);
          const matchHn = (p.citizenOrHn || "").toLowerCase().includes(searchQuery);
          const matchPhone = (p.phone || "").replace(/[^0-9]/g, "").includes(searchQuery.replace(/[^0-9]/g, ""));
          const matchScheme = (p.medicalScheme || "").toLowerCase().includes(searchQuery);
          if (!matchName && !matchHn && !matchPhone && !matchScheme) return false;
        }
        return true;
      });

      // Sort patients
      if (sortOption === "recent") {
        filtered.sort((a, b) => {
          if (a.lastVisitDate !== b.lastVisitDate) {
            return b.lastVisitDate.localeCompare(a.lastVisitDate);
          }
          return b.lastVisitSlot.localeCompare(a.lastVisitSlot);
        });
      } else if (sortOption === "visits_desc") {
        filtered.sort((a, b) => b.totalVisits - a.totalVisits);
      } else if (sortOption === "name_asc") {
        filtered.sort((a, b) => a.patientName.localeCompare(b.patientName, 'th'));
      }

      const tbody = document.getElementById("patients-table-body");
      const cardsContainer = document.getElementById("patients-cards-container");
      if (!tbody || !cardsContainer) return;

      tbody.innerHTML = "";
      cardsContainer.innerHTML = "";

      if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center py-10 text-slate-400">ไม่พบข้อมูลคนไข้ตามเงื่อนไขที่ค้นหา</td></tr>`;
        cardsContainer.innerHTML = `<div class="bg-white p-6 rounded-xl border border-slate-200 text-center text-slate-400 text-xs">ไม่พบข้อมูลคนไข้ตามเงื่อนไขที่ค้นหา</div>`;
        return;
      }

      filtered.forEach(p => {
        const isReturning = p.totalVisits >= 2;
        const patientTypeBadge = isReturning
          ? `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-100 text-amber-800 border border-amber-300">⭐ ประจำ (${p.totalVisits} ครั้ง)</span>`
          : `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">รายใหม่</span>`;

        const servicesBadges = p.servicesList.map(s => {
          if (s === "จองฟื้นฟูหลังคลอด") return `<span class="badge-service bg-purple-100 text-purple-800 border border-purple-200">🤱 ฟื้นฟูหลังคลอด</span>`;
          if (s === "จองนวด") return `<span class="badge-service bg-herbal-100 text-herbal-800 border border-herbal-200">💆‍♂️ นวดรักษา</span>`;
          return `<span class="badge-service bg-slate-100 text-slate-700 border border-slate-200">[${s}]</span>`;
        }).join("");

        const safeKey = p.key.replace(/'/g, "\\'");

        // Desktop Row
        const tr = document.createElement("tr");
        tr.className = "hover:bg-slate-50 transition border-b border-slate-100";
        tr.innerHTML = `
          <td class="py-3 px-4 font-medium text-slate-800">
            <div class="flex items-center space-x-2 flex-wrap gap-1">
              <span class="font-bold text-slate-900">${p.patientName}</span>
              ${getMedicalSchemeBadgeHtml(p.medicalScheme)}
              ${patientTypeBadge}
            </div>
          </td>
          <td class="py-3 px-4 font-mono text-xs font-semibold text-slate-700">
            ${p.citizenOrHn || "-"}
          </td>
          <td class="py-3 px-4 whitespace-nowrap">
            <a href="tel:${p.phone}" class="text-herbal-700 hover:underline font-mono text-xs font-bold inline-flex items-center space-x-1">
              <i data-lucide="phone" class="w-3 h-3"></i>
              <span>${p.phone}</span>
            </a>
          </td>
          <td class="py-3 px-4 text-center">
            <span class="inline-block font-bold text-xs text-slate-800 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
              ${p.totalVisits} ครั้ง
            </span>
          </td>
          <td class="py-3 px-4 whitespace-nowrap">
            <div class="text-xs font-bold text-slate-800">${formatThaiDateShort(p.lastVisitDate)}</div>
            <div class="text-[11px] text-slate-500 font-medium">${formatTimeLabel(p.lastVisitSlot)}</div>
          </td>
          <td class="py-3 px-4">
            <div class="flex flex-wrap gap-1">${servicesBadges}</div>
          </td>
          <td class="py-3 px-4 text-center whitespace-nowrap">
            <div class="flex items-center justify-center space-x-1.5">
              <button onclick="openPatientHistory('${safeKey}')" class="px-2.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs inline-flex items-center space-x-1 shadow-xs transition" title="คลิกดูประวัติการรักษาทั้งหมด">
                <i data-lucide="folder-open" class="w-3.5 h-3.5"></i>
                <span>ประวัติ</span>
              </button>
              <button onclick="openEditPatientModal('${safeKey}')" class="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-bold text-xs inline-flex items-center space-x-1 shadow-xs transition" title="แก้ไขข้อมูลคนไข้">
                <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
                <span>แก้ไข</span>
              </button>
            </div>
          </td>
        `;
        tbody.appendChild(tr);

        // Mobile Card
        const card = document.createElement("div");
        card.className = "bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2.5";
        card.innerHTML = `
          <div class="flex items-center justify-between border-b border-slate-100 pb-2">
            <div>
              <div class="flex items-center gap-1.5 flex-wrap">
                <span class="font-bold text-slate-900 text-base">${p.patientName}</span>
                ${getMedicalSchemeBadgeHtml(p.medicalScheme)}
              </div>
              <div class="text-xs text-slate-500 font-mono">HN: ${p.citizenOrHn || "-"}</div>
            </div>
            ${patientTypeBadge}
          </div>
          <div class="flex items-center justify-between text-xs">
            <a href="tel:${p.phone}" class="inline-flex items-center space-x-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg font-mono font-bold">
              <i data-lucide="phone" class="w-3 h-3"></i>
              <span>${p.phone}</span>
            </a>
            <span class="text-slate-500 font-medium">มาแล้ว <strong class="text-slate-800 font-bold">${p.totalVisits} ครั้ง</strong> (ล่าสุด ${formatThaiDateShort(p.lastVisitDate)})</span>
          </div>
          <div class="pt-1">
            <div class="flex flex-wrap gap-1">${servicesBadges}</div>
          </div>
          <div class="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2">
            <button onclick="openPatientHistory('${safeKey}')" class="py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center justify-center space-x-1 shadow-xs transition">
              <i data-lucide="folder-open" class="w-3.5 h-3.5"></i>
              <span>ดูประวัติ (${p.totalVisits})</span>
            </button>
            <button onclick="openEditPatientModal('${safeKey}')" class="py-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-bold text-xs flex items-center justify-center space-x-1 shadow-xs transition">
              <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
              <span>แก้ไขข้อมูล</span>
            </button>
          </div>
        `;
        cardsContainer.appendChild(card);
      });

      lucide.createIcons();
    }

    function openPatientHistory(patientKey) {
      const allPatients = getUniquePatients();
      const patient = allPatients.find(p => p.key === patientKey);
      if (!patient) {
        showToast("ไม่พบประวัติคนไข้ที่เลือก", "warning");
        return;
      }

      // Populate Header
      document.getElementById("ph-modal-title").textContent = `ประวัติการรักษา: ${patient.patientName}`;
      document.getElementById("ph-patient-name").textContent = patient.patientName;
      document.getElementById("ph-patient-hn").textContent = patient.citizenOrHn || "-";
      
      const phoneLink = document.getElementById("ph-patient-phone-link");
      if (phoneLink) {
        phoneLink.textContent = patient.phone;
        phoneLink.href = `tel:${patient.phone}`;
      }

      const callBtn = document.getElementById("ph-call-btn");
      if (callBtn) {
        callBtn.href = `tel:${patient.phone}`;
      }

      const editBtn = document.getElementById("ph-edit-btn");
      if (editBtn) {
        const safeKey = patient.key.replace(/'/g, "\\'");
        editBtn.setAttribute("onclick", `openEditPatientModal('${safeKey}')`);
      }

      const rebookBtn = document.getElementById("ph-rebook-btn");
      if (rebookBtn) {
        const safeName = (patient.patientName || "").replace(/'/g, "\\'");
        const safeHn = (patient.citizenOrHn || "").replace(/'/g, "\\'");
        const safePhone = (patient.phone || "").replace(/'/g, "\\'");
        const safeScheme = (patient.medicalScheme || "บัตรทอง").replace(/'/g, "\\'");
        rebookBtn.setAttribute("onclick", `bookAgainForPatient('${safeName}', '${safeHn}', '${safePhone}', '${safeScheme}')`);
      }

      const badge = document.getElementById("ph-patient-badge");
      if (badge) {
        badge.textContent = patient.totalVisits >= 2 ? `คนไข้ประจำ (${patient.totalVisits} ครั้ง)` : "คนไข้รายใหม่";
        badge.className = patient.totalVisits >= 2
          ? "text-xs px-2.5 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800 border border-amber-300"
          : "text-xs px-2.5 py-0.5 rounded-full font-bold bg-herbal-100 text-herbal-800 border border-herbal-200";
      }

      // Summary 4-grid
      document.getElementById("ph-total-visits").textContent = `${patient.totalVisits} ครั้ง`;
      document.getElementById("ph-completed-visits").textContent = `${patient.completedVisits} ครั้ง`;
      document.getElementById("ph-last-visit-date").textContent = `${formatThaiDateShort(patient.lastVisitDate)} (${patient.lastVisitSlot} น.)`;
      document.getElementById("ph-assistants-seen").textContent = patient.assistantsList.length > 0 ? patient.assistantsList.join(", ") : "ไม่ระบุ";

      document.getElementById("ph-visits-count").textContent = `ทั้งหมด ${patient.appointments.length} รายการ`;

      // Render visits table
      const tbody = document.getElementById("ph-visits-tbody");
      tbody.innerHTML = "";

      patient.appointments.forEach(apt => {
        const isPostpartum = (apt.mainService === "จองฟื้นฟูหลังคลอด" || (apt.mainService && apt.mainService.includes("หลังคลอด")));
        const isMassage = (apt.mainService === "จองนวด" || (apt.mainService && apt.mainService.includes("นวด")));
        const isExtraOnly = (!apt.mainService || apt.mainService === "-" || apt.mainService === "บริการเสริม");

        let mainBadge = `<span class="badge-service bg-emerald-100 text-emerald-800 border border-emerald-200">💆‍♂️ นวดรักษา</span>`;
        if (isPostpartum) {
          mainBadge = `<span class="badge-service bg-purple-100 text-purple-800 border border-purple-200">🤱 ฟื้นฟูหลังคลอด</span>`;
        } else if (isExtraOnly) {
          mainBadge = "";
        } else if (!isMassage) {
          mainBadge = `<span class="badge-service bg-slate-100 text-slate-800 border border-slate-200">${escapeHtml(apt.mainService)}</span>`;
        }

        const extraTags = (apt.extraServices && apt.extraServices.length > 0)
          ? apt.extraServices.map(ex => `<span class="badge-service bg-slate-100 text-slate-700 border border-slate-200">[${ex}]</span>`).join("")
          : (isExtraOnly ? `<span class="text-xs text-slate-400 italic">บริการเสริม</span>` : "");

        const tr = document.createElement("tr");
        tr.className = "hover:bg-slate-50 transition border-b border-slate-100";
        tr.innerHTML = `
          <td class="py-2.5 px-3 font-bold text-slate-800 whitespace-nowrap">
            ${formatThaiDateShort(apt.bookDate)}
          </td>
          <td class="py-2.5 px-3 font-bold text-herbal-800 whitespace-nowrap">
            ${formatTimeLabel(apt.timeSlot)}
          </td>
          <td class="py-2.5 px-3">
            <div class="flex flex-wrap gap-1">${mainBadge}${extraTags}</div>
          </td>
          <td class="py-2.5 px-3 whitespace-nowrap font-medium text-slate-700">
            ${(apt.assistantNick === 'ไม่ระบุ (ขอผู้หญิง)' || apt.assistantId === 'female') ? '<span class="text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200 text-xs">👩 ขอผู้หญิง</span>' : (apt.assistantNick === 'ไม่ระบุ (ขอผู้ชาย)' || apt.assistantId === 'male') ? '<span class="text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-xs">👨 ขอผู้ชาย</span>' : (!apt.assistantNick || apt.assistantNick === 'auto' || apt.assistantNick === 'ไม่ระบุ' || apt.assistantNick === 'จัดสรรตามเหมาะสม') ? '<span class="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-xs">✨ ไม่ระบุ</span>' : `👤 ${apt.assistantNick}`}
          </td>
          <td class="py-2.5 px-3 whitespace-nowrap">
            <span class="inline-block px-2 py-0.5 rounded text-[11px] font-bold ${apt.status === '🟢 กลับบ้าน' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-slate-100 text-slate-700 border border-slate-200'}">
              ${apt.status}
            </span>
          </td>
          <td class="py-2.5 px-3 text-center whitespace-nowrap">
            <button onclick="showBookingSummaryModal('${apt.id}')" class="px-2 py-1 rounded bg-herbal-50 hover:bg-herbal-100 text-herbal-800 border border-herbal-200 text-xs font-bold transition flex items-center space-x-1 mx-auto" title="ดูใบนัด">
              <i data-lucide="file-text" class="w-3.5 h-3.5"></i>
              <span>ใบนัด</span>
            </button>
          </td>
        `;
        tbody.appendChild(tr);
      });

      const modal = document.getElementById("modal-patient-history");
      if (modal) modal.classList.remove("hidden");
      lucide.createIcons();
    }

    function closePatientHistoryModal() {
      const modal = document.getElementById("modal-patient-history");
      if (modal) modal.classList.add("hidden");
    }

    function openEditPatientModal(patientKey) {
      const allPatients = getUniquePatients();
      const patient = allPatients.find(p => p.key === patientKey);
      if (!patient) {
        showToast("ไม่พบข้อมูลคนไข้ที่เลือก", "warning");
        return;
      }

      document.getElementById("edit-patient-key").value = patient.key;
      document.getElementById("edit-patient-name").value = patient.patientName || "";
      document.getElementById("edit-patient-hn").value = (patient.citizenOrHn && patient.citizenOrHn !== "-") ? patient.citizenOrHn : "";
      document.getElementById("edit-patient-phone").value = (patient.phone && patient.phone !== "-") ? patient.phone : "";
      document.getElementById("edit-patient-apt-count").textContent = patient.appointments.length;
      setMedicalSchemeInUi("patient", patient.medicalScheme || "บัตรทอง");

      const modal = document.getElementById("modal-edit-patient");
      if (modal) modal.classList.remove("hidden");
      lucide.createIcons();
    }

    function closeEditPatientModal() {
      const modal = document.getElementById("modal-edit-patient");
      if (modal) modal.classList.add("hidden");
    }

    async function handleSavePatientEdit(e) {
      e.preventDefault();
      const patientKey = document.getElementById("edit-patient-key").value;
      const newName = document.getElementById("edit-patient-name").value.trim();
      const newHn = document.getElementById("edit-patient-hn").value.trim() || "-";
      const newPhone = document.getElementById("edit-patient-phone").value.trim() || "-";
      const newScheme = getMedicalSchemeFromUi("patient");

      if (!newName) {
        showToast("กรุณาระบุชื่อ-นามสกุลคนไข้", "warning");
        return;
      }

      const allPatients = getUniquePatients();
      const patient = allPatients.find(p => p.key === patientKey);
      if (!patient) {
        showToast("ไม่พบข้อมูลคนไข้", "error");
        return;
      }

      const aptIds = patient.appointments.map(a => a.id);

      // Update all local appointments for this patient
      appointments.forEach(apt => {
        if (aptIds.includes(apt.id)) {
          apt.patientName = newName;
          apt.citizenOrHn = newHn;
          apt.phone = newPhone;
          apt.medicalScheme = newScheme;
        }
      });
      persistAppointments();

      // Update in Supabase
      if (supabaseClient && aptIds.length > 0) {
        try {
          for (const aptId of aptIds) {
            const { error: updateErr } = await supabaseClient.from("appointments").update({
              patient_name: newName,
              citizen_or_hn: newHn,
              phone: newPhone,
              medical_scheme: newScheme
            }).eq("id", aptId);

            if (updateErr) {
              console.warn("Supabase update patient with medical_scheme failed, attempting fallback:", updateErr);
              await supabaseClient.from("appointments").update({
                patient_name: newName,
                citizen_or_hn: newHn,
                phone: newPhone
              }).eq("id", aptId);
            }
          }
          showToast("ซิงค์ข้อมูลคนไข้ขึ้น Cloud เรียบร้อย", "info");
        } catch(err) {
          console.error("Supabase update patient exception:", err);
          showToast("เกิดข้อผิดพลาดในการบันทึกบน Cloud: " + err.message, "error");
        }
      }

      await logActivity("EDIT_PATIENT", `แก้ไขข้อมูลคนไข้: จาก "${patient.patientName || patient.name}" เป็น "${newName}" (HN: ${newHn}, โทร: ${newPhone}, สิทธิ์: ${newScheme})`, {
        patientKey,
        oldData: { name: patient.patientName || patient.name, hn: patient.citizenOrHn || patient.hn, phone: patient.phone, scheme: patient.medicalScheme },
        newData: { name: newName, hn: newHn, phone: newPhone, scheme: newScheme },
        updatedVisitsCount: aptIds.length
      });

      closeEditPatientModal();
      showToast(`อัปเดตข้อมูลคนไข้ "${newName}" เรียบร้อยแล้ว`, "success");

      // Refresh UI
      renderPatientsList();
      renderDeskQueue();

      // If patient history modal is open, re-open with new key
      const historyModal = document.getElementById("modal-patient-history");
      if (historyModal && !historyModal.classList.contains("hidden")) {
        let newKey = "";
        const hnTrimmed = newHn.trim();
        const phoneTrimmed = newPhone.trim().replace(/[^0-9]/g, "");
        const nameTrimmed = newName.trim().toLowerCase();
        if (hnTrimmed && hnTrimmed !== "-") {
          newKey = "HN_" + hnTrimmed.toLowerCase();
        } else if (phoneTrimmed) {
          newKey = "TEL_" + phoneTrimmed;
        } else {
          newKey = "NAME_" + nameTrimmed;
        }
        openPatientHistory(newKey);
      }
    }

    function bookAgainForPatient(name, hn, phone, scheme) {
      closePatientHistoryModal();
      switchTab("new");
      
      const nameInput = document.getElementById("new-patientName");
      const hnInput = document.getElementById("new-citizenOrHn");
      const phoneInput = document.getElementById("new-phone");
      
      if (nameInput) nameInput.value = name;
      if (hnInput) hnInput.value = hn === "-" ? "" : hn;
      if (phoneInput) phoneInput.value = phone;
      setMedicalSchemeInUi("new", scheme || "บัตรทอง");

      selectQuickChip("auto");
      showToast(`ดึงข้อมูลคุณ ${name} ลงฟอร์มนัดหมายเรียบร้อยแล้ว`, "success");
    }

    function getLoggedInAssistant() {
      if (!currentUser) return null;
      if (currentUser.role === 'admin') return null; // Admin has unrestricted full clinic view

      // 1. Match by clean ID (e.g. 'usr-asst-1' -> 'asst-1', or direct 'asst-1')
      const cleanId = (currentUser.id || "").replace(/^usr-/, "");
      let found = assistants.find(a => a.id === cleanId || a.id === currentUser.id || ("usr-" + a.id) === currentUser.id);
      if (found) return found;

      // 2. Match by clean phone
      const userPhone = (currentUser.phone || "").replace(/[^0-9]/g, "");
      if (userPhone) {
        found = assistants.find(a => (a.phone || "").replace(/[^0-9]/g, "") === userPhone);
        if (found) return found;
      }

      // 3. Match by email
      if (currentUser.email) {
        found = assistants.find(a => (a.email || "").toLowerCase() === currentUser.email.toLowerCase());
        if (found) return found;
      }

      // 4. Match by nickname or name substring
      if (currentUser.name) {
        found = assistants.find(a => 
          currentUser.name.includes(a.nickname) || 
          currentUser.name.includes(a.name) ||
          a.name.includes(currentUser.name)
        );
        if (found) return found;
      }

      // Fallback: If currentUser has role 'staff', return the first assistant
      if (currentUser.role === 'staff' && assistants.length > 0) {
        return assistants[0];
      }

      return null;
    }

    
    let currentStatsSlotFilter = "all";
    let currentStatsViewMode = "auto";

    function setStatsViewMode(mode) {
      currentStatsViewMode = mode;
      const tableCont = document.getElementById("stats-table-container");
      const cardCont = document.getElementById("stats-patient-cards");
      const btnCard = document.getElementById("btn-stats-view-card");
      const btnTable = document.getElementById("btn-stats-view-table");

      if (mode === "card") {
        if (tableCont) {
          tableCont.classList.add("hidden");
          tableCont.classList.remove("md:block");
          tableCont.style.display = "none";
        }
        if (cardCont) {
          cardCont.classList.remove("hidden", "md:hidden");
          cardCont.style.display = "block";
        }
        if (btnCard) {
          btnCard.className = "px-3 py-1 rounded-lg transition flex items-center gap-1.5 bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-2xs font-extrabold cursor-pointer";
        }
        if (btnTable) {
          btnTable.className = "px-3 py-1 rounded-lg transition flex items-center gap-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer";
        }
      } else if (mode === "table") {
        if (tableCont) {
          tableCont.classList.remove("hidden", "md:block");
          tableCont.style.display = "block";
        }
        if (cardCont) {
          cardCont.classList.add("hidden");
          cardCont.style.display = "none";
        }
        if (btnTable) {
          btnTable.className = "px-3 py-1 rounded-lg transition flex items-center gap-1.5 bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-2xs font-extrabold cursor-pointer";
        }
        if (btnCard) {
          btnCard.className = "px-3 py-1 rounded-lg transition flex items-center gap-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer";
        }
      }
    }

    function filterStatsBySlot(slot) {
      currentStatsSlotFilter = slot;
      renderStatsAndShare();
    }

    
    function toggleStatsServicesSummary(forceState) {
      const content = document.getElementById("stats-services-collapse-content");
      const icon = document.getElementById("stats-services-toggle-icon");
      const badge = document.getElementById("stats-services-toggle-badge");
      const text = document.getElementById("stats-services-toggle-text");
      if (!content) return;

      const isCurrentlyHidden = content.classList.contains("hidden");
      const shouldShow = typeof forceState === "boolean" ? forceState : isCurrentlyHidden;

      if (shouldShow) {
        content.classList.remove("hidden");
        if (icon) icon.style.transform = "rotate(180deg)";
        if (badge) {
          badge.textContent = "เปิดอยู่";
          badge.className = "px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800";
        }
        if (text) text.textContent = "🙈 ซ่อนรายละเอียด";
      } else {
        content.classList.add("hidden");
        if (icon) icon.style.transform = "rotate(0deg)";
        if (badge) {
          badge.textContent = "ซ่อนอยู่";
          badge.className = "px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700";
        }
        if (text) text.textContent = "👁️ ดูรายละเอียด";
      }

      if (typeof lucide !== "undefined" && lucide.createIcons) {
        lucide.createIcons();
      }
    }

    function renderStatsAndShare() {
      const loggedInAsst = getLoggedInAssistant();
      const asstSelect = document.getElementById("stats-assistant-filter");
      const asstLabel = document.getElementById("stats-assistant-filter-label");
      const noticeBanner = document.getElementById("stats-staff-notice-banner");
      const noticeName = document.getElementById("stats-staff-notice-name");

      if (loggedInAsst) {
        // STAFF ROLE: Lock to their own assistant account only
        if (asstSelect) {
          asstSelect.innerHTML = `<option value="${loggedInAsst.id}" selected>👤 ${escapeHtml(loggedInAsst.nickname)} (${escapeHtml(loggedInAsst.name)}) [ของคุณ]</option>`;
          asstSelect.value = loggedInAsst.id;
          asstSelect.disabled = true;
          asstSelect.className = "px-2.5 py-1.5 border border-amber-300 rounded-lg outline-none bg-amber-50 font-bold text-amber-900 cursor-not-allowed opacity-90 shadow-2xs";
        }
        if (asstLabel) {
          asstLabel.innerHTML = `ผู้ช่วยแพทย์แผนไทย <span class="text-[10px] text-amber-700 font-bold bg-amber-100 px-1.5 py-0.5 rounded border border-amber-200">🩺 บัญชีของคุณ</span>`;
        }
        if (noticeBanner) {
          noticeBanner.classList.add("hidden");
        }
      } else {
        // ADMIN ROLE: Can view all assistants or any individual assistant
        if (asstSelect) {
          const currentVal = asstSelect.value || "all";
          const existingOptions = Array.from(asstSelect.options || []).map(o => o.value);
          const needsRebuild = existingOptions.length !== (assistants.length + 1);
          if (needsRebuild) {
            let optsHtml = `<option value="all">-- ผู้ช่วยฯ ทุกท่าน (ทั้งหมด) --</option>`;
            assistants.forEach(a => {
              optsHtml += `<option value="${a.id}">👤 ${escapeHtml(a.nickname)} (${escapeHtml(a.name)})</option>`;
            });
            asstSelect.innerHTML = optsHtml;
          }
          asstSelect.value = currentVal;
          asstSelect.disabled = false;
          asstSelect.className = "px-3 py-1.5 border border-emerald-300 dark:border-emerald-700 rounded-xl outline-none font-bold text-xs bg-white dark:bg-slate-800 text-emerald-950 dark:text-emerald-200 focus:ring-2 focus:ring-emerald-500 shadow-2xs cursor-pointer";
        }
        if (asstLabel) {
          asstLabel.innerHTML = `เลือกผู้ช่วยแพทย์แผนไทย`;
        }
        if (noticeBanner) {
          noticeBanner.classList.add("hidden");
        }
      }

      // Determine active assistant filter
      let asstFilter = "all";
      if (loggedInAsst) {
        asstFilter = loggedInAsst.id;
      } else if (asstSelect) {
        asstFilter = asstSelect.value || "all";
      }

      const mode = document.getElementById("stats-mode-filter")?.value || "daily";
      const dateVal = document.getElementById("stats-date-input")?.value || todayStr;
      const monthVal = document.getElementById("stats-month-input")?.value || todayStr.substring(0, 7);

      const asstObj = assistants.find(a => a.id === asstFilter);

      let filtered = appointments.filter(a => {
        if (asstFilter !== "all") {
          const targetAsst = loggedInAsst || asstObj;
          let isMatch = false;
          if (targetAsst) {
            const aId = a.assistantId;
            const aNick = (a.assistantNick || "").trim();
            const tId = targetAsst.id;
            const tNick = (targetAsst.nickname || "").trim();
            const tName = (targetAsst.name || "").trim();

            isMatch = (aId === tId) ||
                      (tNick && aNick === tNick) ||
                      (tName && aNick === tName);
          } else {
            isMatch = (a.assistantId === asstFilter);
          }
          if (!isMatch) return false;
        }
        if (mode === "daily") {
          if (dateVal && a.bookDate !== dateVal) return false;
        } else {
          if (monthVal && !a.bookDate.startsWith(monthVal)) return false;
        }
        return true;
      });

      // 1. TOP SECTION: Patient List Grouped by Time Slots (ตัวแบ่งข้อมูลเป็นรอบๆ & ปรับสำหรับมือถือ)
      const tbody = document.getElementById("stats-patient-table-body");
      const cards = document.getElementById("stats-patient-cards");
      const chipsContainer = document.getElementById("stats-slot-chips-container");
      const countBadge = document.getElementById("stats-patient-count");

      if (tbody) tbody.innerHTML = "";
      if (cards) cards.innerHTML = "";
      if (chipsContainer) chipsContainer.innerHTML = "";
      if (countBadge) countBadge.textContent = `${filtered.length} คน`;

      if (filtered.length === 0) {
        if (tbody) tbody.innerHTML = `<tr><td colspan="5" class="text-center py-8 text-slate-400 dark:text-slate-500 text-xs font-semibold">ไม่มีคิวคนไข้ตามเงื่อนไขที่เลือก</td></tr>`;
        if (cards) cards.innerHTML = `<div class="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl text-center text-slate-400 dark:text-slate-500 text-xs font-semibold">ไม่มีคิวคนไข้ตามเงื่อนไขที่เลือก</div>`;
      } else {
        // Sort chronologically by time slot
        function extractSlotMinutes(s) {
          if (!s) return 9999;
          const clean = String(s).replace(/[^0-9:]/g, '').replace('.', ':');
          const parts = clean.split(':');
          if (parts.length >= 2) return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
          return 9999;
        }

        const sortedApts = [...filtered].sort((a, b) => {
          const slotCmp = extractSlotMinutes(a.timeSlot) - extractSlotMinutes(b.timeSlot);
          if (slotCmp !== 0) return slotCmp;
          const tA = a.createdAt || a.created_at || a.id || '';
          const tB = b.createdAt || b.created_at || b.id || '';
          return String(tA).localeCompare(String(tB));
        });

        // Group into map: slot -> array of appointments
        const slotGroups = {};
        sortedApts.forEach(apt => {
          const slotKey = apt.timeSlot || "ไม่ระบุรอบ";
          if (!slotGroups[slotKey]) slotGroups[slotKey] = [];
          slotGroups[slotKey].push(apt);
        });

        const allSlots = Object.keys(slotGroups);

        // Render Quick Slot Filter Chips
        if (chipsContainer) {
          const allChip = document.createElement("button");
          allChip.type = "button";
          allChip.className = `px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${currentStatsSlotFilter === 'all' ? 'bg-emerald-700 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'}`;
          allChip.innerHTML = `<span>ทั้งหมด</span> <span class="px-1.5 py-0.2 rounded-full text-[10px] ${currentStatsSlotFilter === 'all' ? 'bg-emerald-900 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}">${filtered.length}</span>`;
          allChip.onclick = () => filterStatsBySlot('all');
          chipsContainer.appendChild(allChip);

          allSlots.forEach(s => {
            const count = slotGroups[s].length;
            const chip = document.createElement("button");
            chip.type = "button";
            chip.className = `px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${currentStatsSlotFilter === s ? 'bg-emerald-700 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'}`;
            chip.innerHTML = `<span>${formatTimeLabel(s)}</span> <span class="px-1.5 py-0.2 rounded-full text-[10px] ${currentStatsSlotFilter === s ? 'bg-emerald-900 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}">${count}</span>`;
            chip.onclick = () => filterStatsBySlot(s);
            chipsContainer.appendChild(chip);
          });
        }

        // Determine which slots to show based on filter
        const visibleSlots = currentStatsSlotFilter === "all" ? allSlots : allSlots.filter(s => s === currentStatsSlotFilter);

        visibleSlots.forEach(slot => {
          const aptsInSlot = slotGroups[slot];

          // Slot status counts
          const doneCount = aptsInSlot.filter(a => a.status === "🟢 กลับบ้าน").length;
          const inRoomCount = aptsInSlot.filter(a => a.status && (a.status.startsWith("ห้อง") || a.status.includes("ปฏิบัติ"))).length;
          const waitCount = aptsInSlot.length - doneCount - inRoomCount;

          const slotBadgesHtml = `
            ${doneCount > 0 ? `<span class="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10.5px] font-bold border border-emerald-300 dark:border-emerald-800">🟢 เสร็จสิ้น ${doneCount}</span>` : ''}
            ${inRoomCount > 0 ? `<span class="px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 text-[10.5px] font-bold border border-purple-300 dark:border-purple-800">🟣 ในห้อง ${inRoomCount}</span>` : ''}
            ${waitCount > 0 ? `<span class="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10.5px] font-bold border border-slate-300 dark:border-slate-700">⚪ รอ ${waitCount}</span>` : ''}
          `;

          // Count male / female in this slot
          let statsSlotMale = 0;
          let statsSlotFemale = 0;
          aptsInSlot.forEach(a => {
            const g = getAppointmentGender(a);
            if (g === "male") statsSlotMale++;
            else if (g === "female") statsSlotFemale++;
          });

          // A. Desktop Table: Render Section Header Row + Rows
          if (tbody) {
            const headerTr = document.createElement("tr");
            headerTr.className = "bg-gradient-to-r from-emerald-100/80 via-teal-50 to-slate-50 dark:from-emerald-950/80 dark:via-teal-950/50 dark:to-slate-900 border-y-2 border-emerald-300 dark:border-emerald-700";
            headerTr.innerHTML = `
              <td colspan="5" class="py-2.5 px-3.5">
                <div class="flex items-center justify-between flex-wrap gap-2">
                  <div class="flex items-center space-x-2">
                    <span class="px-3 py-1 rounded-xl bg-emerald-700 text-white font-mono font-black text-xs sm:text-sm shadow-2xs">
                      ⏰ ${formatTimeLabel(slot)}
                    </span>
                    <span class="text-xs font-extrabold text-emerald-950 dark:text-emerald-200">
                      (รวม ${aptsInSlot.length} คน)
                    </span>
                    <span class="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 border border-sky-300 dark:border-sky-800">
                      👨 ชาย ${statsSlotMale}
                    </span>
                    <span class="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                      👩 หญิง ${statsSlotFemale}
                    </span>
                  </div>
                  <div class="flex items-center gap-1.5 flex-wrap">
                    ${slotBadgesHtml}
                  </div>
                </div>
              </td>
            `;
            tbody.appendChild(headerTr);

            aptsInSlot.forEach(apt => {
              const tags = apt.extraServices && apt.extraServices.length > 0
                ? apt.extraServices.map(ex => `<span class="badge-service bg-herbal-50 dark:bg-emerald-950 text-herbal-800 dark:text-emerald-300 border border-herbal-200 dark:border-emerald-800">[${escapeHtml(ex)}]</span>`).join(" ")
                : `<span class="text-xs text-slate-400">-</span>`;

              const tr = document.createElement("tr");
              tr.className = "hover:bg-slate-50 dark:hover:bg-slate-800/60 transition border-b border-slate-100 dark:border-slate-800";
              tr.innerHTML = `
                <td class="py-2.5 px-3 font-mono font-bold text-emerald-800 dark:text-emerald-300 text-xs whitespace-nowrap text-center align-middle">
                  <button type="button" onclick="openEditAppointmentTimeModal('${apt.id}')" class="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/80 hover:bg-emerald-100 dark:hover:bg-emerald-900 border border-emerald-200 dark:border-emerald-800 font-black inline-flex items-center gap-1 transition cursor-pointer shadow-2xs" title="คลิกเพื่อแก้ไขรอบเวลา">
                    <span>${slot}</span>
                    <i data-lucide="calendar-clock" class="w-3 h-3 text-emerald-600 dark:text-emerald-400"></i>
                  </button>
                </td>
                <td class="py-2.5 px-3 text-xs font-semibold text-slate-800 dark:text-slate-200 align-middle">
                  <div class="font-extrabold text-slate-900 dark:text-white text-sm">${escapeHtml(apt.patientName)}</div>
                  <div class="text-slate-500 dark:text-slate-400 text-[11px] font-normal flex items-center gap-1.5 mt-0.5 flex-wrap">
                    <span>🪪 HN: ${escapeHtml(apt.citizenOrHn || '-')}</span>
                    <span>•</span>
                    <a href="tel:${apt.phone}" class="font-mono text-emerald-700 dark:text-emerald-400 hover:underline font-bold">📞 ${escapeHtml(apt.phone || '-')}</a>
                    <span>•</span>
                    <span class="text-slate-600 dark:text-slate-300">👤 ผู้ดูแล: <strong class="text-emerald-800 dark:text-emerald-300">${escapeHtml(apt.assistantNick || 'ไม่ระบุ')}</strong></span>
                  </div>
                </td>
                <td class="py-2.5 px-3 text-xs align-middle">${tags}</td>
                <td class="py-2.5 px-3 whitespace-nowrap align-middle">
                  <div class="flex flex-col gap-1">
                    ${generateStatusDropdownHtml(apt.id, apt.status, apt.bookDate)}
                    <div>${generateStatusTimerBadgeHtml(apt)}</div>
                  </div>
                </td>
                <td class="py-2.5 px-3 text-center whitespace-nowrap align-middle">
                  ${generateDeskActionButtonHtml(apt)}
                </td>
              `;
              tbody.appendChild(tr);
            });
          }

          // B. Mobile View: Section Container with Sticky Slot Header + Large Touch Cards
          if (cards) {
            const slotSection = document.createElement("div");
            slotSection.className = "space-y-2.5 pb-2";

            const slotHeader = document.createElement("div");
            slotHeader.className = "sticky top-14 z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm p-3 rounded-2xl border-2 border-emerald-300 dark:border-emerald-700 shadow-sm flex items-center justify-between flex-wrap gap-2";
            slotHeader.innerHTML = `
              <div class="flex items-center gap-2">
                <span class="px-3 py-1 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-mono font-black text-xs sm:text-sm shadow-2xs">
                  ⏰ ${formatTimeLabel(slot)}
                </span>
                <span class="text-xs font-black text-slate-900 dark:text-white">
                  ${aptsInSlot.length} คน
                </span>
              </div>
              <div class="flex items-center gap-1.5 flex-wrap">
                ${slotBadgesHtml}
              </div>
            `;
            slotSection.appendChild(slotHeader);

            aptsInSlot.forEach(apt => {
              const tags = apt.extraServices && apt.extraServices.length > 0
                ? apt.extraServices.map(ex => `<span class="px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 border-2 border-emerald-300 dark:border-emerald-800 text-sm sm:text-base font-black">[${escapeHtml(ex)}]</span>`).join(" ")
                : `<span class="text-sm sm:text-base font-semibold text-slate-400">-</span>`;

              const c = document.createElement("div");
              c.className = "bg-white dark:bg-slate-850 p-4 sm:p-5 rounded-3xl border-2 border-slate-200 dark:border-slate-750 shadow-md space-y-3.5 transition hover:border-emerald-400";
              c.innerHTML = `
                <!-- Top Row: Name + Call Button (ตัวหนังสือขนาดใหญ่ ชัดเจน อ่านง่ายสำหรับผู้สูงอายุ) -->
                <div class="flex justify-between items-start gap-3 border-b border-slate-100 dark:border-slate-750 pb-3">
                  <div class="min-w-0 flex-1 space-y-1">
                    <div class="font-black text-lg sm:text-xl text-slate-900 dark:text-white leading-snug tracking-tight">
                      ${escapeHtml(apt.patientName)}
                    </div>
                    <div class="flex items-center gap-2 text-sm sm:text-base text-slate-600 dark:text-slate-300 font-bold flex-wrap">
                      <span>🪪 HN: <strong class="text-slate-900 dark:text-slate-100 font-black">${escapeHtml(apt.citizenOrHn || '-')}</strong></span>
                      <span class="text-slate-400">•</span>
                      <span class="px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-black text-xs sm:text-sm border border-slate-300 dark:border-slate-700">${escapeHtml(apt.medicalScheme || 'บัตรทอง')}</span>
                    </div>
                  </div>
                  ${apt.phone && apt.phone !== '-' ? `
                    <a href="tel:${apt.phone}" class="shrink-0 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-sm sm:text-base flex items-center gap-1.5 shadow-md transition">
                      <span class="text-base">📞</span> <span>โทร</span>
                    </a>
                  ` : ''}
                </div>

                <!-- Middle Info: Service & Staff (ขนาดตัวอักษรใหญ่ คมชัด สบายตา) -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-sm sm:text-base font-bold">
                  <div class="flex items-start gap-1.5">
                    <span class="text-slate-500 dark:text-slate-400 shrink-0 font-bold">🌿 หัตถการ:</span>
                    <div class="flex flex-wrap gap-1.5">${tags}</div>
                  </div>
                  <div class="flex items-center gap-1.5">
                    <span class="text-slate-500 dark:text-slate-400 shrink-0 font-bold">👤 ผู้ดูแล:</span>
                    <span class="font-black text-emerald-800 dark:text-emerald-300 text-sm sm:text-base">${escapeHtml(apt.assistantNick || 'ไม่ระบุ')}</span>
                  </div>
                </div>

                <!-- Bottom Status & Action Buttons (Touch Friendly ขนาดใหญ่ กดง่ายสำหรับผู้สูงอายุ) -->
                <div class="pt-3 border-t border-slate-100 dark:border-slate-750 space-y-3">
                  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div class="w-full sm:w-auto flex-1">
                      ${generateStatusDropdownHtml(apt.id, apt.status, apt.bookDate, "w-full text-sm sm:text-base font-bold py-2.5 sm:py-3 px-3.5 rounded-2xl border-2 border-emerald-400 dark:border-emerald-600 shadow-xs cursor-pointer")}
                    </div>
                    <div class="shrink-0 flex items-center">
                      ${generateStatusTimerBadgeHtml(apt, "px-3.5 py-1.5 text-xs sm:text-sm font-bold rounded-xl")}
                    </div>
                  </div>

                  <div class="w-full">
                    ${generateDeskActionButtonHtml(apt, "w-full py-3 sm:py-3.5 text-sm sm:text-base font-black justify-center shadow-md rounded-2xl")}
                  </div>
                </div>
              `;
              slotSection.appendChild(c);
            });

            cards.appendChild(slotSection);
          }
        });
      }

      // 2 & 3. DYNAMIC REVENUE & REMUNERATION SHARE CALCULATION (Strict Rule: ONLY "🟢 กลับบ้าน")
      const completedList = filtered.filter(a => a.status === "🟢 กลับบ้าน");

      const serviceStats = [];
      let totalRevenue = 0;
      let totalAsstShare = 0;
      let totalHospitalShare = 0;

      // 1. Process Main Services
      (mainServicesList || []).forEach(ms => {
        const matchingApts = completedList.filter(apt => {
          if (!apt.mainService) return false;
          return apt.mainService === ms.name || apt.mainService.includes(ms.name) || (ms.id === 'main-massage' && (apt.mainService === 'จองนวด' || apt.mainService.includes('นวดประคบ')));
        });
        const count = matchingApts.length;
        const price = Number(ms.price) || 0;
        const asstPct = parsePercentage(ms.asstPercent, 60);
        const hospPct = 100 - asstPct;
        const asstSharePerUnit = ms.share60 !== undefined && ms.share60 !== null ? Number(ms.share60) : Math.round(price * (asstPct / 100));
        const hospSharePerUnit = Math.max(0, price - asstSharePerUnit);

        const sumRevenue = count * price;
        const sumAsstShare = count * asstSharePerUnit;
        const sumHospShare = count * hospSharePerUnit;

        totalRevenue += sumRevenue;
        totalAsstShare += sumAsstShare;
        totalHospitalShare += sumHospShare;

        serviceStats.push({
          type: 'main',
          id: ms.id,
          name: ms.name,
          tag: ms.icon || '💆‍♂️',
          color: ms.color || 'bg-herbal-100 text-herbal-800 border-herbal-200',
          price: price,
          asstPercent: asstPct,
          hospitalPercent: hospPct,
          asstSharePerUnit: asstSharePerUnit,
          hospSharePerUnit: hospSharePerUnit,
          count: count,
          sumRevenue: sumRevenue,
          sumAsstShare: sumAsstShare,
          sumHospShare: sumHospShare
        });
      });

      // 2. Process Extra Services
      (extraServicesList || []).forEach(es => {
        const matchingApts = completedList.filter(apt => {
          return apt.extraServices && apt.extraServices.includes(es.name);
        });
        const count = matchingApts.length;
        const price = Number(es.price) || 0;
        const asstPct = parsePercentage(es.asstPercent, 60);
        const hospPct = 100 - asstPct;
        const asstSharePerUnit = es.share60 !== undefined && es.share60 !== null ? Number(es.share60) : Math.round(price * (asstPct / 100));
        const hospSharePerUnit = Math.max(0, price - asstSharePerUnit);

        const sumRevenue = count * price;
        const sumAsstShare = count * asstSharePerUnit;
        const sumHospShare = count * hospSharePerUnit;

        totalRevenue += sumRevenue;
        totalAsstShare += sumAsstShare;
        totalHospitalShare += sumHospShare;

        serviceStats.push({
          type: 'extra',
          id: es.id,
          name: es.name,
          tag: es.tag || `[${es.name}]`,
          color: es.color || 'bg-emerald-100 text-emerald-800 border-emerald-200',
          price: price,
          asstPercent: asstPct,
          hospitalPercent: hospPct,
          asstSharePerUnit: asstSharePerUnit,
          hospSharePerUnit: hospSharePerUnit,
          count: count,
          sumRevenue: sumRevenue,
          sumAsstShare: sumAsstShare,
          sumHospShare: sumHospShare
        });
      });

      // 3. Render Dynamic Service Performance Cards
      const servicesContainer = document.getElementById("stats-services-summary-container");
      if (servicesContainer) {
        servicesContainer.innerHTML = "";
        if (serviceStats.length === 0) {
          servicesContainer.innerHTML = `<div class="col-span-full py-6 text-center text-xs text-slate-400">ไม่มีรายการหัตถการในระบบ</div>`;
        } else {
          serviceStats.forEach(stat => {
            const card = document.createElement("div");
            card.className = "bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-col justify-between transition hover:shadow-xs";
            card.innerHTML = `
              <div>
                <div class="flex items-center justify-between gap-1">
                  <span class="text-xs font-bold px-2 py-0.5 rounded ${stat.color}">${escapeHtml(stat.tag)} ${escapeHtml(stat.name)}</span>
                  <span class="text-[11px] font-bold text-slate-500 dark:text-slate-400">${stat.count} เคส</span>
                </div>
                <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 leading-snug">
                  ราคา ${stat.price.toLocaleString()} บ. (ส่วนแบ่ง ${stat.asstSharePerUnit.toLocaleString()} บ. / ${stat.asstPercent}%)
                </p>
              </div>
              <div class="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700 flex items-baseline justify-between">
                <span class="text-2xl font-black text-slate-800 dark:text-white">${stat.count}</span>
                <div class="text-right">
                  <div class="text-xs font-bold text-emerald-700 dark:text-emerald-400">${stat.sumAsstShare.toLocaleString()} บาท</div>
                  <div class="text-[10px] text-slate-400 dark:text-slate-500">ยอดบริการ ${stat.sumRevenue.toLocaleString()} บ.</div>
                </div>
              </div>
            `;
            servicesContainer.appendChild(card);
          });
        }
      }

      // 4. Update Summary Numbers & Labels
      const totalRevEl = document.getElementById("stat-total-revenue");
      const totalShareEl = document.getElementById("stat-total-share");
      const totalHospShareEl = document.getElementById("stat-total-hospital-share");

      if (totalRevEl) totalRevEl.textContent = `${totalRevenue.toLocaleString()} ฿`;
      if (totalShareEl) totalShareEl.textContent = `${totalAsstShare.toLocaleString()} ฿`;
      if (totalHospShareEl) totalHospShareEl.textContent = `${totalHospitalShare.toLocaleString()} ฿`;

      // Backward compatibility for legacy element IDs if referenced elsewhere
      const compressStat = serviceStats.find(s => s.id === 'main-massage' || s.name === 'จองนวด');
      const bodyStat = serviceStats.find(s => s.name === 'นวดตัว');
      const footStat = serviceStats.find(s => s.name === 'นวดเท้า');
      const bellyStat = serviceStats.find(s => s.name === 'นวดท้อง');

      if (document.getElementById("stat-count-compress")) document.getElementById("stat-count-compress").textContent = compressStat ? compressStat.count : 0;
      if (document.getElementById("stat-sum-compress")) document.getElementById("stat-sum-compress").textContent = compressStat ? `${compressStat.sumAsstShare.toLocaleString()} บาท` : "0 บาท";

      if (document.getElementById("stat-count-body")) document.getElementById("stat-count-body").textContent = bodyStat ? bodyStat.count : 0;
      if (document.getElementById("stat-sum-body")) document.getElementById("stat-sum-body").textContent = bodyStat ? `${bodyStat.sumAsstShare.toLocaleString()} บาท` : "0 บาท";

      if (document.getElementById("stat-count-foot")) document.getElementById("stat-count-foot").textContent = footStat ? footStat.count : 0;
      if (document.getElementById("stat-sum-foot")) document.getElementById("stat-sum-foot").textContent = footStat ? `${footStat.sumAsstShare.toLocaleString()} บาท` : "0 บาท";

      if (document.getElementById("stat-count-belly")) document.getElementById("stat-count-belly").textContent = bellyStat ? bellyStat.count : 0;
      if (document.getElementById("stat-sum-belly")) document.getElementById("stat-sum-belly").textContent = bellyStat ? `${bellyStat.sumAsstShare.toLocaleString()} บาท` : "0 บาท";

      const summarySub = document.getElementById("stat-summary-sub");
      if (summarySub) {
        if (loggedInAsst) {
          summarySub.textContent = `ผู้ช่วยฯ: ${loggedInAsst.nickname} (${loggedInAsst.name}) [ดูเฉพาะยอดของตนเอง]`;
        } else {
          summarySub.textContent = `ผู้ช่วยฯ: ${asstObj ? asstObj.nickname + " (" + asstObj.name + ")" : "ทุกท่าน"}`;
        }
      }

      // 5. Clinic Efficiency Analytics Calculation
      const analytics = getClinicTimeAnalytics(filtered);
      const avgWaitEl = document.getElementById("stat-avg-wait");
      const avgTreatEl = document.getElementById("stat-avg-treatment");
      const avgStayEl = document.getElementById("stat-avg-stay");
      const countTimingEl = document.getElementById("stat-timing-cases");

      if (avgWaitEl) avgWaitEl.textContent = formatElapsedDuration(analytics.avgWaitMin);
      if (avgTreatEl) avgTreatEl.textContent = formatElapsedDuration(analytics.avgTreatmentMin);
      if (avgStayEl) avgStayEl.textContent = formatElapsedDuration(analytics.avgTotalStayMin);
      if (countTimingEl) countTimingEl.textContent = `${analytics.count} เคส`;

      lucide.createIcons();
    }

    function toggleStatsMode() {
      const mode = document.getElementById("stats-mode-filter").value;
      const dateCont = document.getElementById("stats-date-container");
      const monthCont = document.getElementById("stats-month-container");
      if (mode === "daily") {
        dateCont.classList.remove("hidden");
        monthCont.classList.add("hidden");
      } else {
        dateCont.classList.add("hidden");
        monthCont.classList.remove("hidden");
      }
      renderStatsAndShare();
    }

    function renderManageSubTab() {
      const activeBtn = document.querySelector(".manage-subtab-btn.border-herbal-700");
      if (activeBtn) {
        const id = activeBtn.id.replace("subtab-btn-", "");
        switchManageSubTab(id);
      }
    }

    function setSlotScope(scope) {
      slotScopeMode = scope;
      const dayBtn = document.getElementById("scope-btn-day");
      const monthBtn = document.getElementById("scope-btn-month");

      if (scope === 'daily') {
        dayBtn.className = "px-3 py-1 text-xs font-bold rounded-md bg-herbal-700 text-white transition";
        monthBtn.className = "px-3 py-1 text-xs font-medium text-herbal-800 hover:bg-herbal-50 rounded-md transition";
      } else {
        monthBtn.className = "px-3 py-1 text-xs font-bold rounded-md bg-herbal-700 text-white transition";
        dayBtn.className = "px-3 py-1 text-xs font-medium text-herbal-800 hover:bg-herbal-50 rounded-md transition";
      }

      const selDate = document.getElementById("manage-selected-date").value || todayStr;
      renderManageSlots(selDate);
    }

    function applyDefaultSlotPreset() {
      if (!currentUser || currentUser.role !== 'admin') {
        showToast("🔒 เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่สามารถรีเซ็ตค่ามาตรฐานได้", "error");
        return;
      }
      const selDate = document.getElementById("manage-selected-date").value || todayStr;
      const slots = getSlotsForDate(selDate);

      slots.forEach(slot => {
        const config = getDefaultSlotConfig(slot, selDate);
        const safeSlotId = slot.replace(':', '-');
        const inputEl = document.getElementById(`slot-max-${safeSlotId}`);
        const toggleEl = document.getElementById(`slot-toggle-${safeSlotId}`);
        if (inputEl) inputEl.value = config.max;
        if (toggleEl) toggleEl.checked = true;
      });

      showToast("รีเซ็ตค่าเริ่มต้น: 08-15 น. (20) / 12 น. (5) / 16-19 น. (6) / เสาร์ (10) แล้ว", "info");
    }

    function renderManageSlots(dateStr) {
      const grid = document.getElementById("slots-capacity-grid");
      grid.innerHTML = "";

      const holCheck = checkDateHoliday(dateStr);
      if (holCheck.isClosed) {
        grid.innerHTML = `<div class="col-span-full p-6 text-center text-rose-600 dark:text-rose-400 font-semibold bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl space-y-1">
          <div class="text-base sm:text-lg font-bold">🗓️ ${escapeHtml(holCheck.title)}</div>
          <div class="text-xs text-rose-500 dark:text-rose-300">${escapeHtml(holCheck.description)}</div>
        </div>`;
        return;
      }

      const slots = holCheck.slots;
      if (slots.length === 0) {
        grid.innerHTML = `<div class="col-span-full p-6 text-center text-rose-500 font-semibold bg-rose-50 rounded-xl">คลินิกปิดทำการในวันที่เลือก ไม่สามารถตั้งค่ารอบเวลาได้</div>`;
        return;
      }

      slots.forEach(slot => {
        const config = getSlotConfigForDate(dateStr, slot);
        const safeSlotId = slot.replace(':', '-');

        let badgeHtml = '';
        let cardBorderClass = 'border-slate-200 bg-slate-50';

        if (SATURDAY_SLOTS.includes(slot)) {
          badgeHtml = '<span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-300">วันเสาร์ (10 คิว)</span>';
          cardBorderClass = 'border-purple-200 bg-purple-50/40';
        } else if (slot === "12:00") {
          badgeHtml = '<span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-300">รอบเที่ยง (5 คิว)</span>';
          cardBorderClass = 'border-blue-200 bg-blue-50/40';
        } else if (["16:00", "17:00", "18:00", "19:00"].includes(slot)) {
          badgeHtml = '<span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300">รอบเย็น/นอกเวลา (6 คิว)</span>';
          cardBorderClass = 'border-amber-200 bg-amber-50/40';
        } else {
          badgeHtml = '<span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">รอบปกติ (20 คิว)</span>';
        }

        const card = document.createElement("div");
        card.className = `p-3 rounded-xl border ${cardBorderClass} flex flex-col justify-between shadow-sm space-y-2`;
        
        card.innerHTML = `
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-1.5">
              <span class="font-bold text-xs text-slate-800">${formatTimeLabel(slot)}</span>
              ${badgeHtml}
            </div>
            <label class="relative inline-flex items-center cursor-pointer" title="เปิด/ปิดการจองในรอบนี้">
              <input type="checkbox" id="slot-toggle-${safeSlotId}" ${config.enabled ? 'checked' : ''} class="sr-only peer">
              <div class="w-8 h-4 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3.5 after:transition-all peer-checked:bg-herbal-600"></div>
            </label>
          </div>

          <div class="flex items-center justify-between pt-1 border-t border-slate-200/80">
            <span class="text-[11px] text-slate-500 font-medium">ความจุคิวสูงสุด</span>
            <div class="flex items-center space-x-1">
              <input type="number" id="slot-max-${safeSlotId}" min="1" max="50" value="${config.max}" class="w-14 px-2 py-1 text-xs border border-slate-300 rounded text-center font-bold outline-none bg-white focus:ring-1 focus:ring-herbal-500 shadow-inner">
              <span class="text-[11px] text-slate-500 font-semibold">คิว</span>
            </div>
          </div>
        `;
        grid.appendChild(card);
      });

      lucide.createIcons();
    }

    async function saveSlotCapacities() {
      if (!currentUser || currentUser.role !== 'admin') {
        showToast("🔒 เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่สามารถบันทึกหรือแก้ไขโควตารอบเวลาได้", "error");
        return;
      }
      const selDate = document.getElementById("manage-selected-date").value || todayStr;
      const slots = getSlotsForDate(selDate);
      if (slots.length === 0) return;

      const currentConfigs = {};
      slots.forEach(slot => {
        const safeSlotId = slot.replace(':', '-');
        const inputEl = document.getElementById(`slot-max-${safeSlotId}`);
        const toggleEl = document.getElementById(`slot-toggle-${safeSlotId}`);
        const maxVal = inputEl ? parseInt(inputEl.value) || 20 : 20;
        const enabledVal = toggleEl ? toggleEl.checked : true;

        currentConfigs[slot] = {
          max: maxVal,
          enabled: enabledVal
        };
      });

      if (slotScopeMode === 'daily') {
        customDailySlotConfig[selDate] = currentConfigs;
        try { localStorage.setItem("ttm_daily_slot_config", JSON.stringify(customDailySlotConfig)); } catch(e) {}
        await logActivity("CONFIG_SYSTEM", `บันทึกการตั้งค่าโควต้ารอบเวลารายวัน: ${selDate}`, {
          scope: "daily",
          date: selDate,
          configs: currentConfigs
        });
        showToast(`บันทึกการตั้งค่าคิวสำหรับวันที่ ${selDate} สำเร็จ`, "success");
        if (supabaseClient) {
          try {
            await supabaseClient.from("slot_configs").upsert({
              id: "daily_" + selDate,
              scope: "daily",
              config_key: selDate,
              slots_json: currentConfigs
            });
          } catch(e) { console.error(e); }
        }
      } else {
        const monthKey = selDate.substring(0, 7);
        customMonthlySlotConfig[monthKey] = currentConfigs;
        try { localStorage.setItem("ttm_monthly_slot_config", JSON.stringify(customMonthlySlotConfig)); } catch(e) {}
        await logActivity("CONFIG_SYSTEM", `บันทึกการตั้งค่าโควต้ารอบเวลารายเดือน: ${monthKey}`, {
          scope: "monthly",
          month: monthKey,
          configs: currentConfigs
        });
        showToast(`บันทึกการตั้งค่าคิวสำหรับทั้งเดือน (${monthKey}) สำเร็จ`, "success");
        if (supabaseClient) {
          try {
            await supabaseClient.from("slot_configs").upsert({
              id: "monthly_" + monthKey,
              scope: "monthly",
              config_key: monthKey,
              slots_json: currentConfigs
            });
          } catch(e) { console.error(e); }
        }
      }

      onDateChanged("new");
      onDateChanged("old");
    }

    function switchManageSubTab(subTabId) {
      document.querySelectorAll(".manage-subtab-content").forEach(el => el.classList.add("hidden"));
      document.querySelectorAll(".manage-subtab-btn").forEach(btn => {
        btn.classList.remove("border-herbal-700", "font-bold", "text-herbal-800");
        btn.classList.add("border-transparent", "text-slate-600");
      });

      const content = document.getElementById(`subtab-${subTabId}`);
      const btn = document.getElementById(`subtab-btn-${subTabId}`);
      if (content) content.classList.remove("hidden");
      if (btn) {
        btn.classList.add("border-herbal-700", "font-bold", "text-herbal-800");
        btn.classList.remove("border-transparent", "text-slate-600");
      }

      const selDate = document.getElementById("manage-selected-date").value || todayStr;

      if (subTabId === "slots") renderManageSlots(selDate);
      if (subTabId === "shifts") renderManageShifts(selDate);
      if (subTabId === "services") renderManageServices();
      if (subTabId === "audit") {
        renderAuditLogs();
        refreshAuditLogsFromSupabase(true);
      }
      if (subTabId === "reviews") renderAdminReviewsDashboard();
      if (subTabId === "holidays") renderManageHolidays();
    }

    function renderManageHolidays() {
      const container = document.getElementById("custom-holidays-list-container");
      const badge = document.getElementById("custom-holidays-count-badge");
      if (badge) {
        badge.textContent = `${(customHolidaysList || []).length} วัน`;
      }

      if (!container) return;

      if (!customHolidaysList || customHolidaysList.length === 0) {
        container.innerHTML = `
          <div class="p-8 text-center text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-900/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
            <div class="text-3xl">🗓️✨</div>
            <p class="text-xs font-bold text-slate-700 dark:text-slate-300">ยังไม่มีการกำหนดวันหยุดพิเศษเพิ่มเติม</p>
            <p class="text-[11px] text-slate-400">คุณสามารถเพิ่มวันหยุดคลินิกพิเศษ เช่น ปิดปรับปรุงห้องหัตถการ หรืออบรมบุคลากร ได้จากแบบฟอร์มด้านบน</p>
          </div>
        `;
      } else {
        let rowsHtml = "";
        customHolidaysList.forEach((hol, idx) => {
          const thaiDate = formatThaiDate(hol.date);
          const isPast = hol.date < getTodayDateString();
          rowsHtml += `
            <tr class="border-b border-slate-100 dark:border-slate-800/80 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition">
              <td class="px-3.5 py-3 text-center text-xs font-bold text-slate-500 dark:text-slate-400">
                ${idx + 1}
              </td>
              <td class="px-3.5 py-3 whitespace-nowrap">
                <div class="font-bold text-xs text-slate-800 dark:text-white flex items-center gap-1.5">
                  <i data-lucide="calendar" class="w-3.5 h-3.5 text-rose-500"></i>
                  <span>${thaiDate}</span>
                </div>
                <div class="text-[11px] text-slate-400 font-mono">${hol.date}</div>
              </td>
              <td class="px-3.5 py-3">
                <div class="font-bold text-xs text-rose-700 dark:text-rose-300">${escapeHtml(hol.name)}</div>
                ${hol.note ? `<div class="text-[11px] text-slate-500 dark:text-slate-400 font-normal mt-0.5">💬 ${escapeHtml(hol.note)}</div>` : ''}
              </td>
              <td class="px-3.5 py-3 whitespace-nowrap text-xs text-slate-600 dark:text-slate-300">
                <div class="flex items-center gap-1 text-[11px]">
                  <i data-lucide="user" class="w-3 h-3 text-slate-400"></i>
                  <span>${escapeHtml(hol.createdBy || 'Admin')}</span>
                </div>
                ${isPast ? '<span class="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[10px] bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">ผ่านไปแล้ว</span>' : '<span class="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-bold">มีผลบังคับใช้</span>'}
              </td>
              <td class="px-3.5 py-3 text-right whitespace-nowrap">
                <button onclick="deleteCustomHoliday('${hol.id}')" class="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-300 text-xs font-bold transition border border-rose-200 dark:border-rose-800" title="ลบวันหยุดนี้">
                  <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                </button>
              </td>
            </tr>
          `;
        });

        container.innerHTML = `
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="border-b border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/40 text-[11px] font-bold text-slate-600 dark:text-slate-400">
                <th class="px-3.5 py-2.5 text-center w-12">ลำดับ</th>
                <th class="px-3.5 py-2.5">วันที่ปิดทำการ</th>
                <th class="px-3.5 py-2.5">ชื่อวันหยุด / เหตุผล</th>
                <th class="px-3.5 py-2.5">ผู้บันทึก & สถานะ</th>
                <th class="px-3.5 py-2.5 text-right w-16">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        `;
      }

      renderPublicHolidaysTable();
      lucide.createIcons();
    }

    function renderPublicHolidaysTable(selectedYear) {
      const container = document.getElementById("public-holidays-table-container");
      if (!container) return;

      const yearSelect = document.getElementById("holiday-public-year-select");
      const year = selectedYear || (yearSelect ? yearSelect.value : "2026");

      // Compile list of public holidays for this year
      const holidaysList = [];

      // 1. Fixed
      Object.keys(THAI_FIXED_PUBLIC_HOLIDAYS).forEach(md => {
        const fullDate = `${year}-${md}`;
        holidaysList.push({
          date: fullDate,
          name: THAI_FIXED_PUBLIC_HOLIDAYS[md],
          type: "fixed"
        });
      });

      // 2. Dynamic for selected year
      Object.keys(THAI_DYNAMIC_PUBLIC_HOLIDAYS).forEach(dt => {
        if (dt.startsWith(year + "-")) {
          // Avoid duplicate date if already added
          const existing = holidaysList.find(h => h.date === dt);
          if (!existing) {
            holidaysList.push({
              date: dt,
              name: THAI_DYNAMIC_PUBLIC_HOLIDAYS[dt],
              type: "dynamic"
            });
          }
        }
      });

      // Sort chronologically
      holidaysList.sort((a, b) => a.date.localeCompare(b.date));

      let rowsHtml = "";
      holidaysList.forEach((hol, idx) => {
        const thaiDate = formatThaiDate(hol.date);
        rowsHtml += `
          <tr class="border-b border-slate-100 dark:border-slate-800/70 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
            <td class="px-3 py-2.5 text-center text-xs font-bold text-slate-400">${idx + 1}</td>
            <td class="px-3 py-2.5 whitespace-nowrap">
              <span class="font-bold text-xs text-slate-800 dark:text-slate-100">${thaiDate}</span>
              <span class="text-[10.5px] text-slate-400 font-mono ml-1.5">(${hol.date})</span>
            </td>
            <td class="px-3 py-2.5 text-xs text-slate-700 dark:text-slate-200 font-medium">
              ${escapeHtml(hol.name)}
            </td>
            <td class="px-3 py-2.5 text-right whitespace-nowrap">
              <span class="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200 border border-amber-200 dark:border-amber-800">
                🔒 คลินิกปิดทำการ
              </span>
            </td>
          </tr>
        `;
      });

      container.innerHTML = `
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/40 text-[11px] font-bold text-slate-600 dark:text-slate-400">
              <th class="px-3 py-2 text-center w-10">ลำดับ</th>
              <th class="px-3 py-2">วันที่</th>
              <th class="px-3 py-2">วันหยุดนักขัตฤกษ์</th>
              <th class="px-3 py-2 text-right">สถานะระบบ</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      `;
      lucide.createIcons();
    }

    async function handleAddCustomHoliday(e) {
      e.preventDefault();
      const dateInput = document.getElementById("input-custom-holiday-date");
      const nameInput = document.getElementById("input-custom-holiday-name");
      const noteInput = document.getElementById("input-custom-holiday-note");

      if (!dateInput || !nameInput) return;
      const dateVal = dateInput.value.trim();
      const nameVal = nameInput.value.trim();
      const noteVal = noteInput ? noteInput.value.trim() : "";

      if (!dateVal || !nameVal) {
        showToast("กรุณาระบุวันที่และชื่อวันหยุด/เหตุผล", "warning");
        return;
      }

      const d = new Date(dateVal + "T00:00:00");
      if (isNaN(d.getTime())) {
        showToast("รูปแบบวันที่ไม่ถูกต้อง", "error");
        return;
      }

      if (d.getDay() === 0) {
        showToast("วันที่เลือกตรงกับวันอาทิตย์ ซึ่งคลินิกปิดทำการตามปกติอยู่แล้ว", "warning");
      }

      const existing = (customHolidaysList || []).find(h => h.date === dateVal);
      if (existing) {
        showToast(`วันที่ ${dateVal} มีการกำหนดวันหยุดไว้แล้ว (${existing.name})`, "warning");
        return;
      }

      const newHoliday = {
        id: "hol-" + Date.now(),
        date: dateVal,
        name: nameVal,
        note: noteVal,
        createdBy: currentUser ? currentUser.name : "Admin",
        createdAt: new Date().toISOString()
      };

      customHolidaysList.push(newHoliday);
      customHolidaysList.sort((a, b) => a.date.localeCompare(b.date));

      await saveCustomHolidays(true);

      e.target.reset();
      renderManageHolidays();
      refreshActiveTabUI(typeof silent !== 'undefined' ? silent : false);
      showToast(`เพิ่มวันหยุดพิเศษ '${nameVal}' (${dateVal}) เรียบร้อยแล้ว`, "success");
    }

    async function deleteCustomHoliday(id) {
      const target = (customHolidaysList || []).find(h => h.id === id);
      const name = target ? target.name : "วันหยุดพิเศษ";
      if (!confirm(`ยืนยันการลบวันหยุดพิเศษ '${name}' หรือไม่?`)) return;

      customHolidaysList = (customHolidaysList || []).filter(h => h.id !== id);
      await saveCustomHolidays(true);
      renderManageHolidays();
      refreshActiveTabUI(typeof silent !== 'undefined' ? silent : false);
      showToast(`ลบ '${name}' ออกจากรายการวันหยุดแล้ว`, "info");
    }

    async function saveCustomHolidays(showToastMsg = false) {
      if (!currentUser || currentUser.role !== 'admin') {
        showToast("🔒 เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่สามารถบันทึกหรือแก้ไขวันหยุดคลินิกได้", "error");
        return;
      }
      try {
        localStorage.setItem("ttm_custom_holidays", JSON.stringify(customHolidaysList));
      } catch(e) {
        console.warn("Failed to persist custom holidays to localStorage:", e);
      }

      if (supabaseClient) {
        try {
          await supabaseClient.from("slot_configs").upsert({
            id: "holidays_custom",
            scope: "holidays",
            config_key: "custom_holidays",
            slots_json: customHolidaysList,
            updated_at: new Date().toISOString()
          }, { onConflict: "id" });
        } catch(err) {
          console.error("Failed to sync custom holidays to Supabase:", err);
        }
      }

      try {
        await logActivity("CONFIG_SYSTEM", `อัปเดตรายการวันหยุดพิเศษของคลินิก (${customHolidaysList.length} วัน)`, {
          count: customHolidaysList.length,
          holidays: customHolidaysList
        });
      } catch(e) {}
    }

    async function refreshHolidaysFromSupabase(manual = false) {
      if (!supabaseClient) {
        if (manual) showToast("ยังไม่ได้เชื่อมต่อกับ Supabase", "warning");
        return;
      }

      try {
        const { data, error } = await supabaseClient
          .from("slot_configs")
          .select("*")
          .eq("scope", "holidays")
          .eq("config_key", "custom_holidays")
          .maybeSingle();

        if (!error && data && Array.isArray(data.slots_json)) {
          customHolidaysList = data.slots_json;
          try { localStorage.setItem("ttm_custom_holidays", JSON.stringify(customHolidaysList)); } catch(e) {}
        }
        renderManageHolidays();
        refreshActiveTabUI(typeof silent !== 'undefined' ? silent : false);
        if (manual) showToast("ซิงค์ข้อมูลวันหยุดคลินิกจาก Supabase สำเร็จ", "success");
      } catch(e) {
        console.error("Error syncing holidays from Supabase:", e);
        if (manual) showToast("เกิดข้อผิดพลาดในการซิงค์: " + e.message, "error");
      }
    }

    function onManageDateChanged() {
      renderManageSubTab();
    }

    function setManageDateToday() {
      document.getElementById("manage-selected-date").value = todayStr;
      renderManageSubTab();
    }

    function setManageDateTomorrow() {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      const yr = d.getFullYear();
      const mo = String(d.getMonth() + 1).padStart(2, '0');
      const da = String(d.getDate()).padStart(2, '0');
      document.getElementById("manage-selected-date").value = `${yr}-${mo}-${da}`;
      renderManageSubTab();
    }

    function syncAssistantToUsersList(asst) {
      if (!asst) return;
      const cleanPhone = (asst.phone || "").replace(/[^0-9]/g, "");
      let user = usersList.find(u => 
        u.id === "usr-" + asst.id || 
        (cleanPhone && u.phone && u.phone.replace(/[^0-9]/g, "") === cleanPhone) ||
        (asst.email && u.email && u.email.toLowerCase() === asst.email.toLowerCase())
      );

      if (user) {
        user.name = asst.nickname + " (" + asst.name + ")";
        if (asst.phone) user.phone = asst.phone;
        if (asst.email) user.email = asst.email;
        user.role = asst.role || "staff";
        user.active = asst.active !== false;
      } else if (asst.phone || asst.email) {
        usersList.push({
          id: "usr-" + asst.id,
          name: asst.nickname + " (" + asst.name + ")",
          phone: asst.phone || ("08" + Math.floor(10000000 + Math.random() * 90000000)),
          email: asst.email || "",
          role: asst.role || "staff",
          active: asst.active !== false,
          created_at: new Date().toISOString()
        });
      }
    }

    function persistAssistants() {
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
    }

    let currentAssistantViewMode = localStorage.getItem("ttm_asst_view_mode") || "grid";

    function setAssistantViewMode(mode) {
      currentAssistantViewMode = mode;
      try { localStorage.setItem("ttm_asst_view_mode", mode); } catch(e) {}
      updateAssistantViewSwitcherUI();
      renderManageShifts();
    }

    function updateAssistantViewSwitcherUI() {
      const modes = ["grid", "list", "table", "grouped"];
      modes.forEach(m => {
        const btn = document.getElementById("btn-asst-view-" + m);
        if (btn) {
          if (m === currentAssistantViewMode) {
            btn.className = "px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 bg-herbal-700 text-white shadow-xs";
          } else {
            btn.className = "px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center space-x-1.5 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white";
          }
        }
      });
    }

    function clearAssistantSearch() {
      const searchInput = document.getElementById("asst-search-input");
      if (searchInput) searchInput.value = "";
      const statusSelect = document.getElementById("asst-filter-status");
      if (statusSelect) statusSelect.value = "all";
      const genderSelect = document.getElementById("asst-filter-gender");
      if (genderSelect) genderSelect.value = "all";
      const roleSelect = document.getElementById("asst-filter-role");
      if (roleSelect) roleSelect.value = "all";
      renderManageShifts();
    }

