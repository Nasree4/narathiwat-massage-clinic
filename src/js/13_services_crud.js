/**
 * Module 13: 13_services_crud.js
 * Description: Main & Extra Treatment Services Management
 * Generated from lines 22339 to 23207 of original index.html
 */

    // =========================================================================
    // MAIN SERVICES CRUD HANDLERS (ประเภทหัตถการหลัก)
    // =========================================================================

    function openAddMainServiceModal() {
      if (!currentUser || currentUser.role !== 'admin') {
        showToast("🔒 เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่สามารถเพิ่มหัตถการหลักได้", "error");
        return;
      }
      const modal = document.getElementById("modal-add-main-service");
      if (modal) {
        modal.classList.remove("hidden");
        lucide.createIcons();
      }
    }

    function closeAddMainServiceModal() {
      const modal = document.getElementById("modal-add-main-service");
      if (modal) modal.classList.add("hidden");
    }

    async function handleAddMainServiceSubmit(e) {
      e.preventDefault();
      if (!currentUser || currentUser.role !== 'admin') {
        showToast("🔒 เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่สามารถเพิ่มหัตถการหลักได้", "error");
        return;
      }
      const name = (document.getElementById("new-main-name")?.value || "").trim();
      const icon = (document.getElementById("new-main-icon")?.value || "💆‍♂️").trim();
      const priceLabel = (document.getElementById("new-main-pricelabel")?.value || "").trim();
      const desc = (document.getElementById("new-main-desc")?.value || "").trim();
      const price = parseInt(document.getElementById("new-main-price")?.value) || 0;
      const durationSlots = parseInt(document.getElementById("new-main-duration")?.value) || 1;
      const target = document.querySelector("input[name='new-main-target']:checked")?.value || "all";

      if (!name) return;

      const newMain = {
        id: "main-" + Date.now(),
        name: name,
        title: `${name}${desc ? ' (' + desc.substring(0, 30) + '...)' : ''}`,
        icon: icon,
        desc: desc,
        price: price,
        priceLabel: priceLabel || (price ? `${price} บาท` : 'บริการเฉพาะทาง'),
        durationSlots: durationSlots,
        durationMin: durationSlots * 60,
        target: target,
        active: true,
        color: durationSlots === 2 ? "bg-purple-100 text-purple-800 border-purple-200" : "bg-herbal-100 text-herbal-800 border-herbal-200"
      };

      mainServicesList.push(newMain);
      persistMainServices();
      await syncMainServicesToSupabase();

      await logActivity("CONFIG_SYSTEM", `เพิ่มประเภทหัตถการหลักใหม่: ${name} (${newMain.priceLabel}, ${durationSlots} รอบ, สิทธิ์: ${target === 'staff_only' ? 'เฉพาะ จนท.' : 'ทุกคน'})`, {
        mainServiceId: newMain.id,
        name,
        price,
        durationSlots,
        target
      });

      if (supabaseClient) {
        try {
          const mainPayload = {
            id: newMain.id,
            name: newMain.name,
            title: newMain.title,
            icon: newMain.icon,
            desc: newMain.desc,
            price: newMain.price,
            price_label: newMain.priceLabel,
            duration_slots: newMain.durationSlots,
            duration_min: newMain.durationMin,
            target_audience: newMain.target,
            target: newMain.target,
            active: newMain.active,
            color: newMain.color
          };

          const { error: mErr } = await supabaseClient.from("main_services").insert([mainPayload]);
          if (mErr) {
            await supabaseClient.from("main_services").insert([{
              id: newMain.id,
              name: newMain.name,
              title: newMain.title,
              icon: newMain.icon,
              desc: newMain.desc,
              price: newMain.price,
              price_label: newMain.priceLabel,
              duration_slots: newMain.durationSlots,
              duration_min: newMain.durationMin,
              active: newMain.active,
              color: newMain.color
            }]);
          }
        } catch(e) {}
      }

      closeAddMainServiceModal();
      e.target.reset();

      renderManageServices();
      renderMainServicesOptions("main-services-booking-container");
      renderStatsAndShare();
      showToast(`เพิ่มหัตถการหลัก "${name}" เรียบร้อยแล้ว`, "success");
    }

    function openEditMainServiceModal(svcId) {
      if (!currentUser || currentUser.role !== 'admin') {
        showToast("🔒 เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่สามารถแก้ไขหัตถการหลักได้", "error");
        return;
      }
      const svc = mainServicesList.find(s => s.id === svcId);
      if (!svc) return;

      document.getElementById("edit-main-id").value = svc.id;
      document.getElementById("edit-main-name").value = svc.name || "";
      document.getElementById("edit-main-icon").value = svc.icon || "💆‍♂️";
      document.getElementById("edit-main-pricelabel").value = svc.priceLabel || "";
      document.getElementById("edit-main-desc").value = svc.desc || "";
      document.getElementById("edit-main-price").value = svc.price !== undefined ? svc.price : 0;
      document.getElementById("edit-main-duration").value = svc.durationSlots === 2 ? "2" : "1";
      document.getElementById("edit-main-active").value = svc.active !== false ? "true" : "false";

      const targetVal = svc.target || "all";
      const radAll = document.getElementById("edit-main-target-all");
      const radStaff = document.getElementById("edit-main-target-staff");
      if (targetVal === "staff_only" && radStaff) {
        radStaff.checked = true;
      } else if (radAll) {
        radAll.checked = true;
      }

      const modal = document.getElementById("modal-edit-main-service-item");
      if (modal) modal.classList.remove("hidden");
      lucide.createIcons();
    }

    function closeEditMainServiceModal() {
      const modal = document.getElementById("modal-edit-main-service-item");
      if (modal) modal.classList.add("hidden");
    }

    async function handleEditMainServiceSubmit(e) {
      e.preventDefault();
      if (!currentUser || currentUser.role !== 'admin') {
        showToast("🔒 เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่สามารถแก้ไขหัตถการหลักได้", "error");
        return;
      }
      const svcId = document.getElementById("edit-main-id")?.value;
      const svc = mainServicesList.find(s => s.id === svcId);
      if (!svc) return;

      const name = (document.getElementById("edit-main-name")?.value || "").trim();
      const icon = (document.getElementById("edit-main-icon")?.value || "💆‍♂️").trim();
      const priceLabel = (document.getElementById("edit-main-pricelabel")?.value || "").trim();
      const desc = (document.getElementById("edit-main-desc")?.value || "").trim();
      const price = parseInt(document.getElementById("edit-main-price")?.value) || 0;
      const durationSlots = parseInt(document.getElementById("edit-main-duration")?.value) || 1;
      const active = document.getElementById("edit-main-active")?.value === "true";
      const target = document.querySelector("input[name='edit-main-target']:checked")?.value || "all";

      if (!name) return;

      svc.name = name;
      svc.icon = icon;
      svc.price = price;
      svc.priceLabel = priceLabel || (price ? `${price} บาท` : 'บริการเฉพาะทาง');
      svc.desc = desc;
      svc.durationSlots = durationSlots;
      svc.durationMin = durationSlots * 60;
      svc.active = active;
      svc.target = target;
      svc.title = `${name}${desc ? ' (' + desc.substring(0, 30) + '...)' : ''}`;

      persistMainServices();
      await syncMainServicesToSupabase();

      await logActivity("CONFIG_SYSTEM", `แก้ไขประเภทหัตถการหลัก: ${name} (${svc.priceLabel}, ${durationSlots} รอบ, สิทธิ์: ${target === 'staff_only' ? 'เฉพาะ จนท.' : 'ทุกคน'}, สถานะ: ${active ? 'เปิด' : 'พัก'})`, {
        mainServiceId: svc.id,
        name,
        price,
        durationSlots,
        target,
        active
      });

      if (supabaseClient) {
        try {
          const mainPayload = {
            id: svc.id,
            name: svc.name,
            title: svc.title,
            icon: svc.icon,
            desc: svc.desc,
            price: svc.price,
            price_label: svc.priceLabel,
            duration_slots: svc.durationSlots,
            duration_min: svc.durationMin,
            target_audience: svc.target,
            target: svc.target,
            active: svc.active,
            color: svc.color
          };

          const { error: mErr } = await supabaseClient.from("main_services").upsert([mainPayload]);
          if (mErr) {
            await supabaseClient.from("main_services").upsert([{
              id: svc.id,
              name: svc.name,
              title: svc.title,
              icon: svc.icon,
              desc: svc.desc,
              price: svc.price,
              price_label: svc.priceLabel,
              duration_slots: svc.durationSlots,
              duration_min: svc.durationMin,
              active: svc.active,
              color: svc.color
            }]);
          }
        } catch(e) {}
      }

      closeEditMainServiceModal();
      renderManageServices();
      renderMainServicesOptions("main-services-booking-container");
      renderStatsAndShare();
      showToast(`บันทึกการแก้ไขหัตถการ "${name}" เรียบร้อยแล้ว`, "success");
    }

    async function deleteMainServiceItem(svcId) {
      if (!currentUser || currentUser.role !== 'admin') {
        showToast("🔒 เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่สามารถลบหัตถการหลักได้", "error");
        return;
      }
      const svc = mainServicesList.find(s => s.id === svcId);
      if (!svc) return;

      if (!confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบประเภทหัตถการหลัก "${svc.name}" ออกจากระบบ?`)) {
        return;
      }

      const idx = mainServicesList.findIndex(s => s.id === svcId);
      if (idx !== -1) {
        const deletedName = svc.name;
        mainServicesList.splice(idx, 1);
        persistMainServices();
        await syncMainServicesToSupabase();

        await logActivity("CONFIG_SYSTEM", `ลบประเภทหัตถการหลัก: ${deletedName}`, { mainServiceId: svcId, name: deletedName });

        if (supabaseClient) {
          try {
            await supabaseClient.from("main_services").delete().eq("id", svcId);
          } catch(e) {}
        }

        renderManageServices();
        renderMainServicesOptions("main-services-booking-container");
        renderStatsAndShare();
        showToast(`ลบหัตถการหลัก "${deletedName}" สำเร็จ`, "success");
      }
    }

    async function toggleMainServiceActive(svcId) {
      if (!currentUser || currentUser.role !== 'admin') {
        showToast("🔒 เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่สามารถเปลี่ยนสถานะหัตถการหลักได้", "error");
        return;
      }
      const svc = mainServicesList.find(s => s.id === svcId);
      if (svc) {
        svc.active = !svc.active;
        persistMainServices();
        await syncMainServicesToSupabase();
        renderManageServices();
        renderMainServicesOptions("main-services-booking-container");
        renderStatsAndShare();
        showToast(`อัปเดตสถานะหัตถการ ${svc.name} แล้ว`, "info");

        await logActivity("CONFIG_SYSTEM", `ปรับสถานะหัตถการหลัก: ${svc.name} เป็น ${svc.active ? 'เปิดใช้งาน' : 'พักใช้งาน'}`, {
          mainServiceId: svcId,
          name: svc.name,
          active: svc.active
        });

        if (supabaseClient) {
          try {
            await supabaseClient.from("main_services").update({ active: svc.active }).eq("id", svcId);
          } catch(e) {}
        }
      }
    }

    // =========================================================================
    // EXTRA SERVICES CRUD HANDLERS (บริการเสริม)
    // =========================================================================

    function openEditServiceModal(svcId) {
      if (!currentUser || currentUser.role !== 'admin') {
        showToast("🔒 เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่สามารถแก้ไขบริการเสริมได้", "error");
        return;
      }
      const svc = extraServicesList.find(s => s.id === svcId);
      if (!svc) return;

      const asstPct = parsePercentage(svc.asstPercent, 60);
      const hospPct = 100 - asstPct;

      document.getElementById("edit-svc-id").value = svc.id;
      document.getElementById("edit-svc-name").value = svc.name;
      document.getElementById("edit-svc-tag").value = svc.tag;
      document.getElementById("edit-svc-price").value = svc.price;
      document.getElementById("edit-svc-asst-percent").value = asstPct;
      document.getElementById("edit-svc-hosp-percent").value = hospPct;
      document.getElementById("edit-svc-twoslot").checked = Boolean(svc.twoSlots);
      document.getElementById("edit-svc-active").value = svc.active !== false ? "true" : "false";

      const targetVal = svc.target || svc.target_audience || "all";
      const radAll = document.getElementById("edit-svc-target-all");
      const radStaff = document.getElementById("edit-svc-target-staff");
      if (targetVal === "staff_only" && radStaff) {
        radStaff.checked = true;
      } else if (radAll) {
        radAll.checked = true;
      }

      updateEditServiceSharePreview();
      const modal = document.getElementById("modal-edit-service-item");
      if (modal) modal.classList.remove("hidden");
      lucide.createIcons();
    }

    function closeEditServiceModal() {
      const modal = document.getElementById("modal-edit-service-item");
      if (modal) modal.classList.add("hidden");
    }

    async function handleEditServiceSubmit(e) {
      e.preventDefault();
      if (!currentUser || currentUser.role !== 'admin') {
        showToast("🔒 เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่สามารถแก้ไขบริการเสริมได้", "error");
        return;
      }
      const svcId = document.getElementById("edit-svc-id").value;
      const svc = extraServicesList.find(s => s.id === svcId);
      if (!svc) return;

      const oldName = svc.name;
      const name = document.getElementById("edit-svc-name").value.trim();
      const tag = document.getElementById("edit-svc-tag").value.trim();
      const price = parseInt(document.getElementById("edit-svc-price").value) || 0;
      const asstPercent = parsePercentage(document.getElementById("edit-svc-asst-percent").value, 60);
      const hospitalPercent = 100 - asstPercent;
      const target = document.querySelector("input[name='edit-svc-target']:checked")?.value || "all";
      const twoSlots = document.getElementById("edit-svc-twoslot").checked;
      const active = document.getElementById("edit-svc-active").value === "true";
      const share60 = Math.round(price * (asstPercent / 100));

      svc.name = name;
      svc.tag = tag.startsWith("[") ? tag : `[${tag}]`;
      svc.price = price;
      svc.asstPercent = asstPercent;
      svc.hospitalPercent = hospitalPercent;
      svc.share60 = share60;
      svc.target = target;
      svc.target_audience = target;
      svc.twoSlots = twoSlots;
      svc.active = active;

      persistExtraServices();
      await syncExtraServicesToSupabase();

      await logActivity("CONFIG_SYSTEM", `แก้ไขบริการเสริม: ${name} (ราคา ${price} บ., ผู้ช่วย ${asstPercent}%, รพ. ${hospitalPercent}%, สิทธิ์: ${target === 'staff_only' ? 'เฉพาะ จนท.' : 'ทุกคน'}, สถานะ: ${active ? 'เปิด' : 'พัก'})`, {
        serviceId: svc.id,
        name,
        tag: svc.tag,
        price,
        asstPercent,
        hospitalPercent,
        target,
        twoSlots,
        active
      });

      if (supabaseClient) {
        try {
          const updatePayload = {
            name: svc.name,
            tag: svc.tag,
            price: svc.price,
            asst_percent: svc.asstPercent,
            hospital_percent: svc.hospitalPercent,
            share60: svc.share60,
            two_slots: svc.twoSlots,
            active: svc.active,
            color: svc.color
          };

          const { error: err1 } = await supabaseClient.from("extra_services").update({
            ...updatePayload,
            target_audience: svc.target,
            target: svc.target
          }).eq("id", svc.id);

          if (err1) {
            console.warn("Supabase update with target_audience+target failed, trying fallback:", err1);
            const { error: err2 } = await supabaseClient.from("extra_services").update({
              ...updatePayload,
              target_audience: svc.target
            }).eq("id", svc.id);
            if (err2) {
              const { error: err3 } = await supabaseClient.from("extra_services").update({
                ...updatePayload,
                target: svc.target
              }).eq("id", svc.id);
              if (err3) {
                await supabaseClient.from("extra_services").update(updatePayload).eq("id", svc.id);
              }
            }
          }
        } catch(e) { console.error("Supabase update extra service error:", e); }
      }

      closeEditServiceModal();
      renderManageServices();
      renderExtraServicesCheckboxes("new-extra-services-container");
      renderStatsAndShare();
      showToast(`บันทึกการแก้ไขบริการ "${name}" สำเร็จเรียบร้อย`, "success");
    }

    async function deleteServiceItem(svcId) {
      if (!currentUser || currentUser.role !== 'admin') {
        showToast("🔒 เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่สามารถลบบริการเสริมได้", "error");
        return;
      }
      const svc = extraServicesList.find(s => s.id === svcId);
      if (!svc) return;

      if (!confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบบริการ "${svc.name}" ออกจากระบบ?`)) {
        return;
      }

      const idx = extraServicesList.findIndex(s => s.id === svcId);
      if (idx !== -1) {
        const deletedName = svc.name;
        extraServicesList.splice(idx, 1);
        persistExtraServices();
        await syncExtraServicesToSupabase();

        await logActivity("CONFIG_SYSTEM", `ลบบริการเสริม: ${deletedName}`, { serviceId: svcId, name: deletedName });

        if (supabaseClient) {
          try {
            await supabaseClient.from("extra_services").delete().eq("id", svcId);
          } catch(e) { console.error("Supabase delete extra service error:", e); }
        }

        renderManageServices();
        renderExtraServicesCheckboxes("new-extra-services-container");
        renderStatsAndShare();
        showToast(`ลบบริการ "${deletedName}" สำเร็จ`, "success");
      }
    }

    async function toggleServiceActive(svcId) {
      if (!currentUser || currentUser.role !== 'admin') {
        showToast("🔒 เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่สามารถเปลี่ยนสถานะบริการเสริมได้", "error");
        return;
      }
      const svc = extraServicesList.find(s => s.id === svcId);
      if (svc) {
        svc.active = !svc.active;
        persistExtraServices();
        await syncExtraServicesToSupabase();
        renderManageServices();
        renderExtraServicesCheckboxes("new-extra-services-container");
        renderStatsAndShare();
        showToast(`อัปเดตสถานะบริการ ${svc.name} แล้ว`, "info");

        await logActivity("CONFIG_SYSTEM", `ปรับสถานะบริการเสริม: ${svc.name} เป็น ${svc.active ? 'เปิดใช้งาน' : 'พักใช้งาน'}`, {
          serviceId: svcId,
          name: svc.name,
          active: svc.active
        });

        if (supabaseClient) {
          try {
            await supabaseClient.from("extra_services").update({ active: svc.active }).eq("id", svcId);
          } catch(e) { console.error(e); }
        }
      }
    }

    function openAddServiceModal() {
      if (!currentUser || currentUser.role !== 'admin') {
        showToast("🔒 เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่สามารถเพิ่มบริการเสริมได้", "error");
        return;
      }
      const modal = document.getElementById("modal-add-service");
      if (modal) {
        modal.classList.remove("hidden");
        updateServiceSharePreview();
        lucide.createIcons();
      }
    }

    function closeAddServiceModal() {
      const modal = document.getElementById("modal-add-service");
      if (modal) modal.classList.add("hidden");
    }

    async function handleAddServiceSubmit(e) {
      e.preventDefault();
      if (!currentUser || currentUser.role !== 'admin') {
        showToast("🔒 เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่สามารถเพิ่มบริการเสริมได้", "error");
        return;
      }
      const name = document.getElementById("new-svc-name").value.trim();
      const tag = document.getElementById("new-svc-tag").value.trim();
      const price = parseInt(document.getElementById("new-svc-price").value) || 0;
      const asstPercent = parsePercentage(document.getElementById("new-svc-asst-percent").value, 60);
      const hospitalPercent = 100 - asstPercent;
      const target = document.querySelector("input[name='new-svc-target']:checked")?.value || "all";
      const twoSlots = document.getElementById("new-svc-twoslot").checked;
      const share60 = Math.round(price * (asstPercent / 100));

      const newSvc = {
        id: "svc-" + Date.now(),
        name,
        tag: tag.startsWith("[") ? tag : `[${tag}]`,
        price,
        asstPercent,
        hospitalPercent,
        share60,
        target,
        target_audience: target,
        twoSlots,
        active: true,
        color: "bg-slate-100 text-slate-800 border border-slate-200"
      };

      extraServicesList.push(newSvc);
      persistExtraServices();
      await syncExtraServicesToSupabase();

      await logActivity("CONFIG_SYSTEM", `เพิ่มบริการเสริมใหม่: ${name} (ราคา ${price} บ., ผู้ช่วย ${asstPercent}%, รพ. ${hospitalPercent}%, สิทธิ์: ${target === 'staff_only' ? 'เฉพาะ จนท.' : 'ทุกคน'})`, {
        serviceId: newSvc.id,
        name,
        tag: newSvc.tag,
        price,
        asstPercent,
        hospitalPercent,
        target,
        twoSlots
      });

      if (supabaseClient) {
        try {
          const insertPayload = {
            id: newSvc.id,
            name: newSvc.name,
            tag: newSvc.tag,
            price: newSvc.price,
            asst_percent: newSvc.asstPercent,
            hospital_percent: newSvc.hospitalPercent,
            share60: newSvc.share60,
            two_slots: newSvc.twoSlots,
            active: newSvc.active,
            color: newSvc.color
          };

          const { error: err1 } = await supabaseClient.from("extra_services").insert([{
            ...insertPayload,
            target_audience: newSvc.target
          }]);

          if (err1) {
            console.warn("Supabase insert with target_audience failed, trying fallback:", err1);
            const { error: err2 } = await supabaseClient.from("extra_services").insert([{
              ...insertPayload,
              target: newSvc.target
            }]);
            if (err2) {
              await supabaseClient.from("extra_services").insert([insertPayload]);
            }
          }
        } catch(e) { console.error(e); }
      }

      closeAddServiceModal();
      e.target.reset();

      renderManageServices();
      renderExtraServicesCheckboxes("new-extra-services-container");
      renderStatsAndShare();
      showToast(`เพิ่มบริการเสริม ${name} เรียบร้อย`, "success");
    }

    function openSlotChecker(mode) {
      const dateVal = document.getElementById(`${mode}-book-date`).value || todayStr;
      document.getElementById("checker-date-label").textContent = `วันที่: ${formatThaiDate(dateVal)} (${dateVal})`;
      const container = document.getElementById("checker-matrix-container");
      container.innerHTML = "";

      const holCheck = checkDateHoliday(dateVal);
      if (holCheck.isClosed) {
        container.innerHTML = `
          <div class="p-6 text-center text-rose-700 dark:text-rose-300 font-bold bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-2xl space-y-2">
            <div class="text-3xl">🗓️❌</div>
            <div class="text-base font-extrabold">${escapeHtml(holCheck.title)}</div>
            <div class="text-xs text-rose-600 dark:text-rose-400 font-normal">${escapeHtml(holCheck.description)}</div>
          </div>
        `;
        document.getElementById("modal-checker").classList.remove("hidden");
        openHolidayAlertModal(holCheck, dateVal);
        return;
      }

      const slots = holCheck.slots;
      if (slots.length === 0) {
        container.innerHTML = `<div class="p-6 text-center text-rose-600 font-bold bg-rose-50 rounded-xl">คลินิกปิดทำการในวันที่เลือก</div>`;
        document.getElementById("modal-checker").classList.remove("hidden");
        return;
      }

      const activeAssts = assistants.filter(a => a.active);

      // 1. Box A: "ไม่ระบุ (แต่ขอผู้ช่วยแพทย์หญิง)"
      const femaleBox = document.createElement("div");
      femaleBox.className = "border border-rose-300 dark:border-rose-900/80 rounded-xl p-2.5 sm:p-3 bg-rose-50/60 dark:bg-rose-950/20 space-y-2 shadow-2xs";

      let femaleSlotPills = slots.map(slot => {
        const slotConf = getSlotConfigForDate(dateVal, slot);
        if (!slotConf.enabled) {
          return `
            <div class="text-center p-1 sm:p-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700 opacity-60 cursor-not-allowed">
              <div class="font-bold text-[11px] sm:text-xs font-mono">${slot}</div>
              <div class="text-[9px] font-normal">ปิดรอบ</div>
            </div>
          `;
        }

        const genderAvail = getGenderAvailability(dateVal, slot, false);
        const femaleFree = genderAvail.femaleFreeCount;
        const isSlotAvailable = femaleFree > 0;

        return `
          <div class="text-center p-1 sm:p-1.5 rounded-lg text-xs font-semibold cursor-pointer transition transform active:scale-95 ${isSlotAvailable ? 'bg-rose-700 hover:bg-rose-800 text-white shadow-2xs' : 'bg-slate-100 dark:bg-slate-800/80 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700 opacity-60 cursor-not-allowed'}" onclick="selectSlotFromChecker('${slot}', 'female', '${mode}', ${isSlotAvailable})" title="${isSlotAvailable ? `คลิกเพื่อเลือกรอบเวลานี้ (ผู้ช่วยแพทย์หญิงว่าง ${femaleFree} ท่าน)` : 'ผู้ช่วยแพทย์หญิงติดนัดหมดแล้ว'}">
            <div class="font-bold text-[11px] sm:text-xs font-mono">${slot}</div>
            <div class="text-[9px] sm:text-[9.5px] ${isSlotAvailable ? 'text-rose-100' : 'text-slate-400 dark:text-slate-500'} font-normal">
              ${isSlotAvailable ? `ว่าง (${femaleFree})` : 'เต็ม'}
            </div>
          </div>
        `;
      }).join("");

      femaleBox.innerHTML = `
        <div class="flex items-center justify-between gap-1 border-b border-rose-200 dark:border-rose-900/60 pb-1.5">
          <div class="font-bold text-xs text-rose-900 dark:text-rose-200 flex items-center space-x-1.5">
            <span class="text-sm">👩</span>
            <span>ไม่ระบุ (แต่ขอผู้ช่วยแพทย์หญิง)</span>
          </div>
          <span class="text-[10px] text-rose-800 dark:text-rose-200 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-800 font-bold shadow-2xs">
            👩 เฉพาะผู้หญิง
          </span>
        </div>
        <p class="text-[10.5px] text-rose-700/80 dark:text-rose-300/80">ระบบจะจัดสรรผู้ช่วยแพทย์หญิงที่ว่างให้ตามความเหมาะสมในรอบเวลาที่เลือก</p>
        <div class="grid grid-cols-4 sm:grid-cols-6 gap-1 sm:gap-1.5 pt-0.5">
          ${femaleSlotPills}
        </div>
      `;
      container.appendChild(femaleBox);

      // 2. Box B: "ไม่ระบุ (แต่ขอผู้ช่วยแพทย์ชาย)"
      const maleBox = document.createElement("div");
      maleBox.className = "border border-sky-300 dark:border-sky-900/80 rounded-xl p-2.5 sm:p-3 bg-sky-50/60 dark:bg-sky-950/20 space-y-2 shadow-2xs";

      let maleSlotPills = slots.map(slot => {
        const slotConf = getSlotConfigForDate(dateVal, slot);
        if (!slotConf.enabled) {
          return `
            <div class="text-center p-1 sm:p-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700 opacity-60 cursor-not-allowed">
              <div class="font-bold text-[11px] sm:text-xs font-mono">${slot}</div>
              <div class="text-[9px] font-normal">ปิดรอบ</div>
            </div>
          `;
        }

        const genderAvail = getGenderAvailability(dateVal, slot, false);
        const maleFree = genderAvail.maleFreeCount;
        const isSlotAvailable = maleFree > 0;

        return `
          <div class="text-center p-1 sm:p-1.5 rounded-lg text-xs font-semibold cursor-pointer transition transform active:scale-95 ${isSlotAvailable ? 'bg-sky-700 hover:bg-sky-800 text-white shadow-2xs' : 'bg-slate-100 dark:bg-slate-800/80 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700 opacity-60 cursor-not-allowed'}" onclick="selectSlotFromChecker('${slot}', 'male', '${mode}', ${isSlotAvailable})" title="${isSlotAvailable ? `คลิกเพื่อเลือกรอบเวลานี้ (ผู้ช่วยแพทย์ชายว่าง ${maleFree} ท่าน)` : 'ผู้ช่วยแพทย์ชายติดนัดหมดแล้ว'}">
            <div class="font-bold text-[11px] sm:text-xs font-mono">${slot}</div>
            <div class="text-[9px] sm:text-[9.5px] ${isSlotAvailable ? 'text-sky-100' : 'text-slate-400 dark:text-slate-500'} font-normal">
              ${isSlotAvailable ? `ว่าง (${maleFree})` : 'เต็ม'}
            </div>
          </div>
        `;
      }).join("");

      maleBox.innerHTML = `
        <div class="flex items-center justify-between gap-1 border-b border-sky-200 dark:border-sky-900/60 pb-1.5">
          <div class="font-bold text-xs text-sky-900 dark:text-sky-200 flex items-center space-x-1.5">
            <span class="text-sm">👨</span>
            <span>ไม่ระบุ (แต่ขอผู้ช่วยแพทย์ชาย)</span>
          </div>
          <span class="text-[10px] text-sky-800 dark:text-sky-200 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-full border border-sky-200 dark:border-sky-800 font-bold shadow-2xs">
            👨 เฉพาะผู้ชาย
          </span>
        </div>
        <p class="text-[10.5px] text-sky-700/80 dark:text-sky-300/80">ระบบจะจัดสรรผู้ช่วยแพทย์ชายที่ว่างให้ตามความเหมาะสมในรอบเวลาที่เลือก</p>
        <div class="grid grid-cols-4 sm:grid-cols-6 gap-1 sm:gap-1.5 pt-0.5">
          ${maleSlotPills}
        </div>
      `;
      container.appendChild(maleBox);

      // Section Header: ระบุผู้ช่วยแพทย์เฉพาะเจาะจง
      const asstHeader = document.createElement("div");
      asstHeader.className = "pt-2 font-bold text-xs text-slate-700 flex items-center gap-1.5";
      asstHeader.innerHTML = `<i data-lucide="users" class="w-4 h-4 text-slate-500"></i> <span>หรือเลือกระบุผู้ช่วยแพทย์เฉพาะเจาะจง:</span>`;
      container.appendChild(asstHeader);

      // 2. Individual Assistants Boxes
      activeAssts.forEach(asst => {
        const asstBox = document.createElement("div");
        asstBox.className = "border border-slate-200 rounded-xl p-3 bg-white space-y-2 shadow-xs";
        
        let slotPills = slots.map(slot => {
          const slotConf = getSlotConfigForDate(dateVal, slot);
          if (!slotConf.enabled) {
            return `
              <div class="text-center p-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700 opacity-60 cursor-not-allowed">
                <div>${slot}</div>
                <div class="text-[10px] font-normal">ปิดรอบ</div>
              </div>
            `;
          }

          const onDuty = isAssistantOnDutyForSlot(asst, slot, dateVal);

          const isOccupied = appointments.some(apt => {
            if (apt.bookDate === dateVal && apt.assistantId === asst.id) {
              if (apt.status === "🔴 ส่งต่อ" || apt.status === "ยกเลิก") return false;
              return apt.slotsOccupied && apt.slotsOccupied.includes(slot);
            }
            return false;
          });

          const genderAvail = getGenderAvailability(dateVal, slot, false);
          const isMale = typeof isMaleAssistant === "function" ? isMaleAssistant(asst) : (asst.gender === 'male');
          const isGenderFull = isMale ? (genderAvail.maleFreeCount <= 0) : (genderAvail.femaleFreeCount <= 0);

          const isAvailable = onDuty && !isOccupied && !isGenderFull;

          let cardClass = "";
          let statusLabel = "ว่าง";

          if (!onDuty) {
            cardClass = "bg-slate-100 dark:bg-slate-800/70 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700 opacity-60 cursor-not-allowed";
            statusLabel = "ไม่อยู่เวร";
          } else if (isOccupied || isGenderFull) {
            cardClass = "bg-rose-100 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50 cursor-not-allowed";
            statusLabel = isOccupied ? "ติดนัด" : "เต็ม";
          } else {
            cardClass = "bg-emerald-100 dark:bg-emerald-950/50 hover:bg-emerald-200 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 cursor-pointer active:scale-95";
            statusLabel = "ว่าง";
          }

          const toolTip = !onDuty ? `${escapeHtml(asst.nickname || asst.name)} ไม่อยู่เวรในรอบนี้` : isOccupied ? 'ติดนัดหมาย' : `คลิกเพื่อเลือกรอบเวลานี้กับ ${escapeHtml(asst.nickname || asst.name)}`;

          return `
            <div class="text-center p-1.5 rounded-lg text-xs font-semibold cursor-pointer transition transform active:scale-95 ${cardClass}" onclick="selectSlotFromChecker('${slot}', '${asst.id}', '${mode}', ${isAvailable})" title="${toolTip}">
              <div>${slot}</div>
              <div class="text-[10px] font-normal">${statusLabel}</div>
            </div>
          `;
        }).join("");

        asstBox.innerHTML = `
          <div class="font-bold text-xs text-slate-800 flex items-center space-x-1">
            <span>👤 ${escapeHtml(asst.nickname || asst.name)}</span>
          </div>
          <div class="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
            ${slotPills}
          </div>
        `;
        container.appendChild(asstBox);
      });

      document.getElementById("modal-checker").classList.remove("hidden");
      lucide.createIcons();
    }

    function selectSlotFromChecker(slot, assistantId, mode, isAvailable) {
      if (!isAvailable) {
        showToast(`รอบเวลา ${formatTimeLabel(slot)} ติดนัดหมายหรือไม่ว่างในขณะนี้`, "warning");
        return;
      }

      const slotSelect = document.getElementById(`${mode}-time-slot`);
      if (slotSelect) {
        slotSelect.value = slot;
      }

      const targetId = (assistantId === 'auto') ? 'female' : assistantId;
      const asstSelect = document.getElementById(`${mode}-assistant-select`);
      if (asstSelect) {
        asstSelect.value = targetId;
      }
      onAssistantSelectChange(targetId);

      updateSelectedSlotButtonUI(mode, slot);
      onTimeSlotChanged(mode);

      closeSlotChecker();
      showToast(`เลือกรอบเวลา ${formatTimeLabel(slot)} เรียบร้อยแล้ว`, "success");
    }

    function closeSlotChecker() {
      document.getElementById("modal-checker").classList.add("hidden");
    }

    function copySupabaseSchemaSql() {
      const code = document.getElementById("supabase-sql-snippet").innerText;
      const textArea = document.createElement("textarea");
      textArea.value = code;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      showToast("คัดลอกคำสั่ง SQL สำหรับ Supabase ลงคลิปบอร์ดแล้ว", "success");
    }

    function exportToCSV() {
      const headers = ["ID", "ชื่อ-นามสกุล", "สิทธิ์การรักษา", "HN/เลขบัตร", "เบอร์โทร", "วันที่นัด", "รอบเวลา", "บริการหลัก", "บริการเสริม", "ผู้ช่วยแพทย์", "สถานะ"];
      const rows = appointments.map(a => [
        `"${a.id}"`,
        `"${a.patientName}"`,
        `"${a.medicalScheme || 'บัตรทอง'}"`,
        `"${a.citizenOrHn}"`,
        `"${a.phone}"`,
        `"${a.bookDate}"`,
        `"${a.timeSlot}"`,
        `"${a.mainService}"`,
        `"${(a.extraServices || []).join(', ')}"`,
        `"${a.assistantNick}"`,
        `"${a.status}"`
      ]);

      const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `นัดหมายแพทย์แผนไทย_รพนราธิวาส_${todayStr}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast("ดาวน์โหลดไฟล์สำรอง CSV เรียบร้อย", "success");
    }

    
