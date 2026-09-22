const fs = require('fs');
const vm = require('vm');

let content = fs.readFileSync('index.html', 'utf8');

// 1. Add modal-success-alert HTML after modal-assistant-detail
const targetModalEnd = `      <!-- Modal Footer -->
      <div class="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end shrink-0">
        <button type="button" onclick="closeAssistantDetailModal()" class="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition cursor-pointer">
          ปิดหน้าต่าง
        </button>
      </div>

    </div>
  </div>`;

const successAlertModalHTML = `      <!-- Modal Footer -->
      <div class="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end shrink-0">
        <button type="button" onclick="closeAssistantDetailModal()" class="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition cursor-pointer">
          ปิดหน้าต่าง
        </button>
      </div>

    </div>
  </div>

  <!-- Modern Action Success Popup Modal -->
  <div id="modal-success-alert" onclick="if(event.target===this)closeSuccessAlertModal()" class="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-xs hidden p-4 transition-all duration-200">
    <div class="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 w-full max-w-sm shadow-2xl border border-emerald-200 dark:border-emerald-800/80 text-center space-y-4 animate-in fade-in zoom-in-95 duration-150">
      
      <!-- Icon with soft ring -->
      <div class="w-16 h-16 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center ring-8 ring-emerald-50 dark:ring-emerald-900/30">
        <i data-lucide="check-circle" class="w-9 h-9"></i>
      </div>

      <div class="space-y-1">
        <h3 id="success-alert-title" class="text-base sm:text-lg font-black text-slate-800 dark:text-white">บันทึกข้อมูลสำเร็จ!</h3>
        <p id="success-alert-desc" class="text-xs text-slate-500 dark:text-slate-400">ระบบได้บันทึกข้อมูลเรียบร้อยแล้ว</p>
      </div>

      <!-- Detail Box -->
      <div id="success-alert-detail-box" class="bg-slate-50 dark:bg-slate-800/80 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700 text-left text-xs space-y-2">
        <div class="flex items-center justify-between gap-2">
          <span class="text-slate-500 dark:text-slate-400 shrink-0">ผู้ช่วย:</span>
          <span id="success-alert-asst" class="font-bold text-slate-800 dark:text-slate-100 text-right truncate">-</span>
        </div>
        <div class="flex items-center justify-between gap-2">
          <span class="text-slate-500 dark:text-slate-400 shrink-0">วันที่:</span>
          <span id="success-alert-date" class="font-bold text-herbal-800 dark:text-emerald-400 text-right truncate">-</span>
        </div>
        <div class="flex items-center justify-between gap-2">
          <span class="text-slate-500 dark:text-slate-400 shrink-0">รูปแบบเวร:</span>
          <span id="success-alert-shift" class="font-bold text-slate-700 dark:text-slate-300 text-right truncate">-</span>
        </div>
      </div>

      <!-- Action Button -->
      <div>
        <button type="button" onclick="closeSuccessAlertModal()" class="w-full py-2.5 px-4 rounded-xl bg-herbal-700 hover:bg-herbal-600 active:scale-98 text-white font-bold text-xs sm:text-sm transition flex items-center justify-center space-x-1.5 shadow-md shadow-herbal-700/20 cursor-pointer">
          <i data-lucide="check" class="w-4 h-4"></i>
          <span>ตกลง</span>
        </button>
      </div>

    </div>
  </div>`;

if (!content.includes(targetModalEnd)) {
  console.error('Could not find targetModalEnd in index.html');
  process.exit(1);
}
content = content.replace(targetModalEnd, successAlertModalHTML);

// 2. Add showSuccessAlertModal and closeSuccessAlertModal functions
const targetHelperLocation = `    let currentDetailAssistantId = null;
    let currentDetailHistoryPeriod = 'all';`;

const successHelperFunctions = `    let currentDetailAssistantId = null;
    let currentDetailHistoryPeriod = 'all';
    let successAlertTimer = null;

    function showSuccessAlertModal({ title, desc, assistantName, dateText, shiftText, autoCloseMs = 0 }) {
      const modal = document.getElementById("modal-success-alert");
      if (!modal) return;

      const titleEl = document.getElementById("success-alert-title");
      const descEl = document.getElementById("success-alert-desc");
      const asstEl = document.getElementById("success-alert-asst");
      const dateEl = document.getElementById("success-alert-date");
      const shiftEl = document.getElementById("success-alert-shift");
      const detailBox = document.getElementById("success-alert-detail-box");

      if (titleEl) titleEl.textContent = title || "บันทึกข้อมูลสำเร็จ!";
      if (descEl) descEl.textContent = desc || "ระบบได้บันทึกข้อมูลเรียบร้อยแล้ว";

      if (asstEl) asstEl.textContent = assistantName || "-";
      if (dateEl) dateEl.textContent = dateText || "-";
      if (shiftEl) shiftEl.textContent = shiftText || "-";

      if (!assistantName && !dateText && !shiftText && detailBox) {
        detailBox.classList.add("hidden");
      } else if (detailBox) {
        detailBox.classList.remove("hidden");
      }

      modal.classList.remove("hidden");
      if (typeof lucide !== "undefined" && lucide.createIcons) {
        lucide.createIcons();
      }

      if (successAlertTimer) clearTimeout(successAlertTimer);
      if (autoCloseMs > 0) {
        successAlertTimer = setTimeout(() => {
          closeSuccessAlertModal();
        }, autoCloseMs);
      }
    }

    function closeSuccessAlertModal() {
      const modal = document.getElementById("modal-success-alert");
      if (modal) modal.classList.add("hidden");
      if (successAlertTimer) {
        clearTimeout(successAlertTimer);
        successAlertTimer = null;
      }
    }`;

if (!content.includes(targetHelperLocation)) {
  console.error('Could not find targetHelperLocation in index.html');
  process.exit(1);
}
content = content.replace(targetHelperLocation, successHelperFunctions);

// 3. Update saveAssistantShiftFromModal to close modal and show success popup
const oldSaveBlock = `      if (currentModalDutyDateMode === "range") {
        const fromVal = document.getElementById("modal-asst-range-from")?.value;
        const toVal = document.getElementById("modal-asst-range-to")?.value;
        const fromDisp = (typeof formatThaiDisplayDate === "function") ? formatThaiDisplayDate(fromVal) : fromVal;
        const toDisp = (typeof formatThaiDisplayDate === "function") ? formatThaiDisplayDate(toVal) : toVal;
        showToast("บันทึกตารางเวรผู้ช่วย \\"" + asst.nickname + "\\" ในช่วง " + fromDisp + " - " + toDisp + " (" + targetDates.length + " วัน) สำเร็จแล้ว", "success");
      } else {
        showToast("บันทึกตารางเวรผู้ช่วย \\"" + asst.nickname + "\\" สำเร็จแล้ว", "success");
      }

      renderManageShifts();
      openAssistantDetailModal(asst.id, "duty");

      if (currentModalDutyDateMode === "range") {
        setModalDutyDateMode("range");
        const dutyEl = document.getElementById("asst-detail-duty-badge");
        if (dutyEl) {
          const fromVal = document.getElementById("modal-asst-range-from")?.value;
          const toVal = document.getElementById("modal-asst-range-to")?.value;
          const fromDisp = (typeof formatThaiDisplayDate === "function") ? formatThaiDisplayDate(fromVal) : fromVal;
          const toDisp = (typeof formatThaiDisplayDate === "function") ? formatThaiDisplayDate(toVal) : toVal;
          const isOff = shiftType === 'off';
          const shiftLabel = shiftType === 'full' ? '⭐ ทั้งวัน' : (shiftType === 'official' ? '☀️ ในเวลา' : (shiftType === 'ot' ? '🌙 OT' : \`⚙️ \${asst.slots.length} รอบ\`));
          dutyEl.textContent = isOff ? \`⚪ ลาเวร / พัก (\${fromDisp} - \${toDisp})\` : \`🟢 \${shiftLabel} (\${fromDisp} - \${toDisp})\`;
          dutyEl.className = \`font-semibold \${isOff ? 'text-slate-400' : 'text-emerald-600 dark:text-emerald-400'}\`;
        }
      }`;

const newSaveBlock = `      // Close the modal immediately ("ปิดแทบให้เลย")
      closeAssistantDetailModal();

      // Refresh background manage shifts cards/list
      renderManageShifts();

      let dateText = "";
      if (currentModalDutyDateMode === "range") {
        const fromVal = document.getElementById("modal-asst-range-from")?.value;
        const toVal = document.getElementById("modal-asst-range-to")?.value;
        const fromDisp = (typeof formatThaiDisplayDate === "function") ? formatThaiDisplayDate(fromVal) : fromVal;
        const toDisp = (typeof formatThaiDisplayDate === "function") ? formatThaiDisplayDate(toVal) : toVal;
        dateText = \`\${fromDisp} - \${toDisp} (รวม \${targetDates.length} วัน)\`;
      } else {
        const singleDate = targetDates[0];
        dateText = (typeof formatThaiDisplayDate === "function") ? formatThaiDisplayDate(singleDate) : singleDate;
      }

      let shiftLabel = "⭐ เข้าเวรทั้งวัน (08:00 - 19:00 น.)";
      if (shiftType === "official") shiftLabel = "☀️ เวรในเวลา (08:00 - 16:00 น.)";
      else if (shiftType === "ot") shiftLabel = "🌙 เวรนอกเวลา / OT (17:00 - 19:00 น.)";
      else if (shiftType === "custom") shiftLabel = \`⚙️ กำหนดรอบเอง (\${asst.slots.length} รอบเวลา)\`;
      else if (shiftType === "off") shiftLabel = "⚪ ลาเวร / พัก (Off Duty)";

      // Show modern popup alert
      showSuccessAlertModal({
        title: "บันทึกตารางเวรสำเร็จ!",
        desc: "ระบบบันทึกตารางเวรและรอบเวลาปฏิบัติงานเรียบร้อยแล้ว",
        assistantName: \`\${asst.nickname ? '[' + asst.nickname + '] ' : ''}\${asst.name}\`,
        dateText: dateText,
        shiftText: shiftLabel
      });`;

if (!content.includes(oldSaveBlock)) {
  console.error('Could not find oldSaveBlock in index.html');
  process.exit(1);
}
content = content.replace(oldSaveBlock, newSaveBlock);

// 4. Update handleAssistantProfileSubmitFromModal to also close modal and show success popup
const oldProfileSaveBlock = `      showToast(\`บันทึกข้อมูลผู้ช่วย "\${nickname}" สำเร็จแล้ว\`, "success");
      renderManageShifts();
      openAssistantDetailModal(asst.id, 'profile');`;

const newProfileSaveBlock = `      closeAssistantDetailModal();
      renderManageShifts();

      showSuccessAlertModal({
        title: "บันทึกข้อมูลส่วนตัวสำเร็จ!",
        desc: "ปรับปรุงข้อมูลผู้ช่วยและสิทธิ์การใช้งานเรียบร้อยแล้ว",
        assistantName: \`\${nickname ? '[' + nickname + '] ' : ''}\${fullname}\`,
        dateText: "ข้อมูลผู้ช่วยแพทย์แผนไทย",
        shiftText: role === 'admin' ? '🛡️ Admin (ผู้ดูแลระบบ)' : (role === 'user' ? '👤 User (ผู้รับบริการ)' : '🩺 Staff (ผู้ช่วยฯ)')
      });`;

if (!content.includes(oldProfileSaveBlock)) {
  console.error('Could not find oldProfileSaveBlock in index.html');
  process.exit(1);
}
content = content.replace(oldProfileSaveBlock, newProfileSaveBlock);

// 5. Bump version to v5.2.6
content = content.replace(/v5\.2\.5/g, 'v5.2.6');

fs.writeFileSync('index.html', content, 'utf8');
console.log('Successfully updated index.html for success popup and auto-close modal!');

// Validate all script tags in index.html
const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
let match;
let count = 0;
let hasError = false;

while ((match = scriptRegex.exec(content)) !== null) {
  count++;
  const jsCode = match[1];
  if (!jsCode.trim()) continue;
  try {
    new vm.Script(jsCode);
  } catch (err) {
    console.error('SYNTAX ERROR in script tag #' + count + ':', err.message);
    hasError = true;
  }
}

if (!hasError) {
  console.log('ALL ' + count + ' script tags in index.html compiled with 0 syntax errors!');
} else {
  process.exit(1);
}
