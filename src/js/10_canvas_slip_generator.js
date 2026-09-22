/**
 * Module 10: 10_canvas_slip_generator.js
 * Description: Fast Canvas Slip Generator & Printing
 * Generated from lines 16386 to 17038 of original index.html
 */

    /* =========================================================================
       ULTRA-FAST DIRECT CANVAS SLIP GENERATOR (0.02s Execution, ZERO Phone Freeze)
       ========================================================================= */

    let isDownloadingSlip = false;

    async function generateSlipCanvasDirect(apt) {
      const width = 640;
      const height = 860;
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      // 1. Background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      // Outer Border & Card
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 2;
      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(10, 10, width - 20, height - 20, 24);
        ctx.stroke();
      } else {
        ctx.strokeRect(10, 10, width - 20, height - 20);
      }

      // 2. Top Header Accent Stripe
      const grad = ctx.createLinearGradient(0, 0, width, 0);
      grad.addColorStop(0, '#047857');
      grad.addColorStop(0.5, '#059669');
      grad.addColorStop(1, '#0d9488');
      ctx.fillStyle = grad;
      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(10, 10, width - 20, 12, [24, 24, 0, 0]);
        ctx.fill();
      } else {
        ctx.fillRect(10, 10, width - 20, 12);
      }

      // 3. Hospital Logo (if loaded)
      const logoEl = document.querySelector("#wizard-summary-slip img") || document.querySelector("#booking-summary-slip img") || document.querySelector("img[src='logo.png']");
      if (logoEl && logoEl.complete && logoEl.naturalWidth > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(68, 70, 30, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(logoEl, 38, 40, 60, 60);
        ctx.restore();
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(68, 70, 30, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Badge: ใบนัดหมาย
      ctx.fillStyle = '#ecfdf5';
      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(115, 38, 140, 22, 11);
        ctx.fill();
      }
      ctx.fillStyle = '#065f46';
      ctx.font = 'bold 12px "Sarabun", -apple-system, sans-serif';
      ctx.fillText('• ใบนัดหมายเข้ารับบริการ', 125, 53);

      // Header Titles
      ctx.fillStyle = '#064e3b';
      ctx.font = 'bold 18px "Sarabun", -apple-system, sans-serif';
      ctx.fillText('คลินิกการแพทย์แผนไทย', 115, 80);
      ctx.fillStyle = '#64748b';
      ctx.font = '13px "Sarabun", -apple-system, sans-serif';
      ctx.fillText('โรงพยาบาลนราธิวาสราชนครินทร์', 115, 98);

      // Separator
      ctx.strokeStyle = '#e2e8f0';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(30, 118);
      ctx.lineTo(width - 30, 118);
      ctx.stroke();
      ctx.setLineDash([]);

      // 4. Ticket Schedule Box
      ctx.fillStyle = '#f0fdf4';
      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(30, 130, width - 60, 120, 16);
        ctx.fill();
        ctx.strokeStyle = '#bbf7d0';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Ticket ID Row
      ctx.fillStyle = '#166534';
      ctx.font = 'bold 13px "Sarabun", -apple-system, sans-serif';
      ctx.fillText('🔖 รหัสนัดหมาย:', 48, 158);

      ctx.fillStyle = '#ffffff';
      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(width - 240, 142, 190, 24, 6);
        ctx.fill();
        ctx.strokeStyle = '#86efac';
        ctx.stroke();
      }
      ctx.fillStyle = '#064e3b';
      ctx.font = 'bold 14px "Courier New", monospace';
      ctx.fillText(apt.id || 'APT-ONLINE', width - 230, 159);

      // Date Box
      ctx.fillStyle = '#ffffff';
      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(45, 178, 255, 58, 10);
        ctx.fill();
        ctx.strokeStyle = '#dcfce7';
        ctx.stroke();
      }
      ctx.fillStyle = '#64748b';
      ctx.font = '12px "Sarabun", -apple-system, sans-serif';
      ctx.fillText('📅 วันที่นัดหมาย', 58, 198);
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 14px "Sarabun", -apple-system, sans-serif';
      const formattedDate = (typeof formatThaiDate === "function" && apt.bookDate) ? formatThaiDate(apt.bookDate) : (apt.bookDate || '-');
      ctx.fillText(formattedDate, 58, 222);

      // Time Box
      ctx.fillStyle = '#ffffff';
      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(315, 178, 280, 58, 10);
        ctx.fill();
        ctx.strokeStyle = '#dcfce7';
        ctx.stroke();
      }
      ctx.fillStyle = '#64748b';
      ctx.font = '12px "Sarabun", -apple-system, sans-serif';
      ctx.fillText('⏰ รอบเวลานัดหมาย', 328, 198);
      ctx.fillStyle = '#047857';
      ctx.font = 'bold 16px "Courier New", monospace';
      const formattedTime = (typeof formatTimeLabel === "function" && apt.timeSlot) ? formatTimeLabel(apt.timeSlot) : (apt.timeSlot || '-');
      ctx.fillText(formattedTime, 328, 222);

      // 5. Patient & Booking Information Rows
      ctx.fillStyle = '#f8fafc';
      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(30, 265, width - 60, 285, 16);
        ctx.fill();
        ctx.strokeStyle = '#e2e8f0';
        ctx.stroke();
      }

      const extraText = (apt.extraServices && apt.extraServices.length > 0) ? ` + ${apt.extraServices.join(", ")}` : "";
      const serviceDisplay = (apt.mainService && apt.mainService !== "-" && apt.mainService !== "บริการเสริม") ? `${apt.mainService}${extraText}` : (apt.extraServices && apt.extraServices.length > 0 ? `บริการเสริม: ${apt.extraServices.join(", ")}` : "บริการนวดและหัตถการ");

      const rows = [
        { label: '👤 ชื่อ-สกุล ผู้รับบริการ:', val: apt.patientName || '-', color: '#0f172a', bold: true },
        { label: '🪪 เลข HN / บัตร ปชช.:', val: apt.citizenOrHn || '-', color: '#334155', bold: false },
        { label: '📞 เบอร์โทรศัพท์ติดต่อ:', val: apt.phone || '-', color: '#047857', bold: true },
        { label: '🏥 สิทธิการรักษา:', val: apt.medicalScheme || 'บัตรทอง', color: '#1e293b', bold: true },
        { label: '🌿 บริการที่นัดหมาย:', val: serviceDisplay, color: '#065f46', bold: true },
        { label: '👨‍⚕️ ผู้ช่วยแพทย์ผู้ดูแล:', val: apt.assistantNick || 'ไม่ระบุ (จัดสรรตามเหมาะสม)', color: '#047857', bold: true }
      ];

      let y = 300;
      rows.forEach((r, idx) => {
        ctx.fillStyle = '#64748b';
        ctx.font = '13px "Sarabun", -apple-system, sans-serif';
        ctx.fillText(r.label, 48, y);

        ctx.fillStyle = r.color;
        ctx.font = `${r.bold ? 'bold ' : ''}14px "Sarabun", -apple-system, sans-serif`;
        let textVal = r.val;
        if (ctx.measureText(textVal).width > 340) {
          textVal = textVal.substring(0, 32) + '...';
        }
        const textWidth = ctx.measureText(textVal).width;
        ctx.fillText(textVal, width - 50 - textWidth, y);

        if (idx < rows.length - 1) {
          ctx.strokeStyle = '#f1f5f9';
          ctx.beginPath();
          ctx.moveTo(48, y + 14);
          ctx.lineTo(width - 48, y + 14);
          ctx.stroke();
        }
        y += 42;
      });

      // 6. Instructions Card
      ctx.fillStyle = '#fffbeb';
      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(30, 565, width - 60, 185, 16);
        ctx.fill();
        ctx.strokeStyle = '#fef3c7';
        ctx.stroke();
      }

      ctx.fillStyle = '#78350f';
      ctx.font = 'bold 13px "Sarabun", -apple-system, sans-serif';
      ctx.fillText('📌 ข้อปฏิบัติสำหรับผู้รับบริการ:', 48, 595);

      ctx.fillStyle = '#92400e';
      ctx.font = '12px "Sarabun", -apple-system, sans-serif';
      ctx.fillText('• กรุณามาก่อนเวลานัดหมายอย่างน้อย 15 นาที เพื่อตรวจคัดกรอง', 52, 622);
      ctx.fillText('• โปรดนำบัตรประจำตัวประชาชน หรือบัตรโรงพยาบาลมาแสดง ณ จุดบริการ', 52, 646);
      ctx.fillText('• หากต้องการเลื่อนหรือยกเลิก กรุณาแจ้งล่วงหน้าอย่างน้อย 1 วัน', 52, 670);

      ctx.strokeStyle = '#fde68a';
      ctx.beginPath();
      ctx.moveTo(48, 690);
      ctx.lineTo(width - 48, 690);
      ctx.stroke();

      ctx.fillStyle = '#b45309';
      ctx.font = 'bold 12px "Sarabun", -apple-system, sans-serif';
      ctx.fillText('📞 โทร: 073-510673', 48, 715);
      ctx.fillText('💬 LINE: @690xzaaa', width - 170, 715);

      // 7. Footer Stamp
      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px "Sarabun", -apple-system, sans-serif';
      const footerText = 'กลุ่มงานการแพทย์แผนไทยและการแพทย์ทางเลือก โรงพยาบาลนราธิวาสราชนครินทร์';
      const footW = ctx.measureText(footerText).width;
      ctx.fillText(footerText, (width - footW) / 2, 820);

      return canvas;
    }

    async function downloadSlipFromEl(elementId = "wizard-summary-slip", triggerBtn = null) {
      if (isDownloadingSlip) return;
      isDownloadingSlip = true;

      const btn = triggerBtn || (typeof event !== "undefined" && event ? event.currentTarget : null) || document.querySelector(`button[onclick*="downloadSlip"]`);
      const originalHtml = btn ? btn.innerHTML : "";
      if (btn) {
        btn.disabled = true;
        btn.classList.add("opacity-80");
        btn.innerHTML = `<span class="inline-block animate-spin mr-1">⚡</span> <span>กำลังบันทึกรูป...</span>`;
      }

      try {
        const apt = lastBookedAppointment || {
          id: document.getElementById("slip-id")?.textContent || "APT-" + Date.now(),
          patientName: document.getElementById("slip-name")?.textContent || "คนไข้",
          citizenOrHn: document.getElementById("slip-hn")?.textContent || "-",
          phone: document.getElementById("slip-phone")?.textContent || "-",
          medicalScheme: document.getElementById("slip-scheme")?.textContent || "บัตรทอง",
          bookDate: document.getElementById("slip-date")?.textContent || todayStr,
          timeSlot: document.getElementById("slip-time")?.textContent || "09:00",
          mainService: document.getElementById("slip-service")?.textContent || "บริการนวดแผนไทย",
          assistantNick: document.getElementById("slip-assistant")?.textContent || "ไม่ระบุ"
        };

        // Instant Direct 2D Canvas Generation (0.02s)
        const canvas = await generateSlipCanvasDirect(apt);

        if (canvas.toBlob) {
          canvas.toBlob((blob) => {
            if (!blob) {
              downloadFallbackDataUrl(canvas, apt);
              return;
            }
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            const namePart = (apt.patientName || 'นัดหมาย').replace(/\s+/g, '_');
            const datePart = (apt.bookDate || '').replace(/\s+/g, '_');
            a.href = url;
            a.download = `ใบนัดแพทย์แผนไทย_${namePart}_${datePart}.png`;
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
              if (a.parentNode) document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }, 1000);
            showToast("⚡ บันทึกรูปภาพใบนัดหมาย (PNG) สำเร็จทันที!", "success");
          }, "image/png");
        } else {
          downloadFallbackDataUrl(canvas, apt);
        }

      } catch(err) {
        console.error("Direct canvas download error, falling back to html2canvas:", err);
        await downloadSlipFallbackHtml2Canvas(elementId);
      } finally {
        setTimeout(() => {
          isDownloadingSlip = false;
          if (btn) {
            btn.disabled = false;
            btn.classList.remove("opacity-80");
            btn.innerHTML = originalHtml;
            if (typeof lucide !== "undefined" && lucide.createIcons) lucide.createIcons();
          }
        }, 350);
      }
    }

    async function downloadSlipFallbackHtml2Canvas(elementId) {
      const el = document.getElementById(elementId) || document.getElementById("booking-summary-slip");
      if (!el || typeof html2canvas !== "function") return;
      try {
        const canvas = await html2canvas(el, { scale: 1.5, backgroundColor: "#ffffff", logging: false });
        downloadFallbackDataUrl(canvas, lastBookedAppointment);
      } catch(e) {
        console.error(e);
      }
    }

    function downloadFallbackDataUrl(canvas, apt) {
      const imgData = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      const namePart = apt && apt.patientName ? apt.patientName.replace(/\s+/g, '_') : 'นัดหมาย';
      const datePart = apt && apt.bookDate ? apt.bookDate.replace(/\s+/g, '_') : '';
      a.href = imgData;
      a.download = `ใบนัดแพทย์แผนไทย_${namePart}_${datePart}.png`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { if (a.parentNode) document.body.removeChild(a); }, 1000);
      showToast("⚡ บันทึกรูปภาพใบนัดหมาย (PNG) สำเร็จทันที!", "success");
    }

    async function shareAppointmentSlip() {
      const apt = lastBookedAppointment || {
        id: document.getElementById("slip-id")?.textContent || "APT-" + Date.now(),
        patientName: document.getElementById("slip-name")?.textContent || "คนไข้",
        bookDate: document.getElementById("slip-date")?.textContent || todayStr,
        timeSlot: document.getElementById("slip-time")?.textContent || "09:00",
        mainService: document.getElementById("slip-service")?.textContent || "บริการนวดแผนไทย"
      };

      const shareText = `ใบนัดหมายคลินิกการแพทย์แผนไทย รพ.นราธิวาสราชนครินทร์\n🔖 รหัสนัด: ${apt.id}\n👤 ผู้รับบริการ: ${apt.patientName}\n📅 วันที่: ${formatThaiDate(apt.bookDate)}\n⏰ รอบเวลา: ${formatTimeLabel(apt.timeSlot)}\n🌿 บริการ: ${apt.mainService}\n📌 โปรดมาก่อนเวลานัด 15 นาที\nโทร: 073-510673`;

      if (navigator.share) {
        try {
          // If browser supports file sharing, generate canvas file
          const canvas = await generateSlipCanvasDirect(apt);
          canvas.toBlob(async (blob) => {
            if (blob && navigator.canShare && navigator.canShare({ files: [new File([blob], "appointment-slip.png", { type: "image/png" })] })) {
              const file = new File([blob], `ใบนัดแพทย์แผนไทย_${apt.patientName}.png`, { type: "image/png" });
              await navigator.share({
                title: 'ใบนัดหมายแพทย์แผนไทย',
                text: shareText,
                files: [file]
              });
            } else {
              await navigator.share({
                title: 'ใบนัดหมายแพทย์แผนไทย',
                text: shareText
              });
            }
          }, "image/png");
        } catch(err) {
          if (err.name !== 'AbortError') {
            downloadSlipFromEl();
          }
        }
      } else {
        downloadSlipFromEl();
      }
    }

    function downloadSlipPng() {
      return downloadSlipFromEl("booking-summary-slip");
    }

    function downloadSlipAsImage() {
      return downloadSlipFromEl("booking-summary-slip");
    }

    function printSlipPdf(elementId) {
      let slipEl = null;
      if (elementId && typeof elementId === 'string') {
        slipEl = document.getElementById(elementId);
      }
      if (!slipEl) {
        slipEl = document.getElementById("wizard-summary-slip") || document.getElementById("booking-summary-slip");
      }
      if (!slipEl && lastBookedAppointment) {
        renderWizardSlip(lastBookedAppointment);
        slipEl = document.getElementById("wizard-summary-slip");
      }
      if (!slipEl) {
        showToast("ไม่พบข้อมูลใบนัดหมายสำหรับพิมพ์", "warning");
        return;
      }

      // Clone the slip element
      const clone = slipEl.cloneNode(true);
      clone.querySelectorAll("button, .no-print").forEach(el => el.remove());

      // Remove preexisting print iframe
      const existingIframe = document.getElementById("hidden-print-iframe");
      if (existingIframe) existingIframe.remove();

      const iframe = document.createElement("iframe");
      iframe.id = "hidden-print-iframe";
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "0";
      iframe.style.visibility = "hidden";
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow.document;
      doc.open();

      const scriptEnd = "<" + "/script>";
      doc.write(
        '<!DOCTYPE html>' +
        '<html lang="th">' +
        '<head>' +
        '<meta charset="UTF-8">' +
        '<title>ใบนัดหมาย - คลินิกการแพทย์แผนไทย โรงพยาบาลนราธิวาสราชนครินทร์</title>' +
        '<link rel="preconnect" href="https://fonts.googleapis.com">' +
        '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' +
        '<link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700;800&family=Prompt:wght@400;600;700;800&display=swap" rel="stylesheet">' +
        '<script src="https://cdn.tailwindcss.com">' + scriptEnd +
        '<script>' +
        '  tailwind.config = {' +
        '    theme: {' +
        '      extend: {' +
        '        colors: {' +
        '          herbal: {' +
        '            50: "#f0fdf4", 100: "#dcfce7", 200: "#bbf7d0", 300: "#86efac",' +
        '            400: "#4ade80", 500: "#22c55e", 600: "#16a34a", 700: "#15803d",' +
        '            800: "#166534", 900: "#14532d", 950: "#052e16"' +
        '          }' +
        '        }' +
        '      }' +
        '    }' +
        '  };' +
        scriptEnd +
        '<style>' +
        '  * { box-sizing: border-box; }' +
        '  body {' +
        '    font-family: "Sarabun", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;' +
        '    background: #ffffff !important;' +
        '    color: #1e293b !important;' +
        '    margin: 0;' +
        '    padding: 10px;' +
        '    display: flex;' +
        '    justify-content: center;' +
        '    align-items: flex-start;' +
        '    -webkit-print-color-adjust: exact !important;' +
        '    print-color-adjust: exact !important;' +
        '  }' +
        '  @page {' +
        '    size: A4 portrait;' +
        '    margin: 8mm 12mm;' +
        '  }' +
        '  .print-wrapper {' +
        '    width: 100%;' +
        '    max-width: 460px;' +
        '    margin: 0 auto;' +
        '    page-break-inside: avoid !important;' +
        '    break-inside: avoid !important;' +
        '    page-break-after: avoid !important;' +
        '    break-after: avoid !important;' +
        '  }' +
        '  @media print {' +
        '    body { padding: 0; margin: 0; }' +
        '    .print-wrapper { box-shadow: none !important; }' +
        '    button, .no-print { display: none !important; }' +
        '  }' +
        '</style>' +
        '</head>' +
        '<body>' +
        '<div class="print-wrapper">' +
        clone.outerHTML +
        '</div>' +
        '</body>' +
        '</html>'
      );
      doc.close();

      // Allow Tailwind and fonts to render before printing
      setTimeout(() => {
        try {
          iframe.contentWindow.focus();
          iframe.contentWindow.print();
        } catch(err) {
          console.warn("Iframe print error:", err);
          window.print();
        }
      }, 350);
    }

    async function cancelAppointment(appointmentId) {
      if (!appointmentId) return;
      const targetId = String(appointmentId).trim();
      const idx = appointments.findIndex(a => a && String(a.id).trim() === targetId);

      let apt = null;
      if (idx !== -1) {
        apt = appointments[idx];
        const confirmMsg = `คุณต้องการยกเลิกคิวนัดหมายของคุณ "${apt.patientName}" (รอบ ${formatTimeLabel(apt.timeSlot)} วันที่ ${formatThaiDateShort(apt.bookDate)}) หรือไม่?\n\nเมื่อยกเลิกแล้ว ข้อมูลจะถูกลบออกจากระบบและคืนโควตาว่างทันที`;
        if (!confirm(confirmMsg)) {
          return;
        }
        appointments.splice(idx, 1);
      } else {
        if (!confirm("คุณต้องการยกเลิกคิวนัดหมายนี้ออกจากระบบหรือไม่?")) {
          return;
        }
      }

      // 1. Mark as deleted tombstone immediately
      markAppointmentDeleted(targetId);

      // 2. Persist locally
      persistAppointments();

      // 3. Immediately refresh UI in all views
      renderDeskQueue(true);
      renderStatsAndShare(true);
      if (typeof renderPatientsDirectory === "function") renderPatientsDirectory();
      if (typeof renderDeskCalendar === "function") if (typeof renderDeskCalendar === "function") renderDeskCalendar();

      const patientName = apt ? apt.patientName : "คนไข้";
      showToast(`🗑️ ยกเลิกนัดหมายคุณ ${patientName} สำเร็จ คืนคิวว่างให้ระบบแล้ว`, "success");

      // 4. Send Notification & Audit Log
      if (apt) {
        addNotification({
          type: "CANCEL_BOOKING",
          title: `❌ ยกเลิกนัดหมาย: คุณ ${apt.patientName}`,
          message: `คิวนัดหมายของคุณ ${apt.patientName} (รอบ ${formatTimeLabel(apt.timeSlot)} วันที่ ${formatThaiDateShort(apt.bookDate)}) ถูกยกเลิกแล้ว`,
          patientName: apt.patientName,
          patientPhone: apt.phone || "",
          patientUserId: apt.userId || apt.patientUserId || "",
          appointmentId: targetId,
          targetAssistantId: apt.assistantId,
          targetAssistantNick: apt.assistantNick,
          targetRole: "staff"
        });

        await logActivity("CANCEL_QUEUE", `ยกเลิกคิวนัดหมาย: ${apt.patientName} (${formatTimeLabel(apt.timeSlot)} วันที่ ${apt.bookDate})`, {
          appointmentId: targetId,
          patientName: apt.patientName,
          bookDate: apt.bookDate,
          timeSlot: apt.timeSlot,
          assistantNick: apt.assistantNick
        });
      }

      // 5. Delete from Supabase Cloud
      if (supabaseClient) {
        try {
          const { error } = await supabaseClient.from("appointments").delete().eq("id", targetId);
          if (error) {
            console.error("Supabase delete error:", error);
          }
        } catch(e) {
          console.error("Supabase delete exception:", e);
        }
      }
    }

    function filterByRoomQuota(roomKey) {
      const statusSelect = document.getElementById("desk-filter-status");
      if (!statusSelect) return;

      const currentVal = statusSelect.value;
      if (currentVal === roomKey) {
        statusSelect.value = "all";
        showToast("แสดงคิวทุกสถานะ / ทุกห้อง", "info");
      } else {
        statusSelect.value = roomKey;
        showToast(`🔍 กรองแสดงเฉพาะคิวใน: ${roomKey}`, "success");
      }
      renderDeskQueue();
    }

    function updateRoomQuotaDisplay(startDate, endDate) {
      const container = document.getElementById("room-quota-badges");
      const labelEl = document.getElementById("room-quota-date-label");
      if (!container) return;
      container.innerHTML = "";

      let rangeLabel = "วันนี้";
      if (startDate && endDate) {
        rangeLabel = (startDate === endDate) ? formatThaiDateShort(startDate) : `${formatThaiDateShort(startDate)} - ${formatThaiDateShort(endDate)}`;
      } else if (startDate) {
        rangeLabel = `ตั้งแต่ ${formatThaiDateShort(startDate)}`;
      } else if (endDate) {
        rangeLabel = `ถึง ${formatThaiDateShort(endDate)}`;
      } else {
        rangeLabel = "ทุกวัน";
      }

      if (labelEl) {
        labelEl.textContent = `สถิติการครองเตียงห้องหัตถการ (${rangeLabel}):`;
      }

      const roomOccupiedCounts = { "ห้อง 1": 0, "ห้อง 2": 0, "ห้อง 3": 0, "ห้อง 4": 0, "ห้อง 5": 0 };

      appointments.filter(a => {
        if (startDate && a.bookDate < startDate) return false;
        if (endDate && a.bookDate > endDate) return false;
        return true;
      }).forEach(a => {
        const cleanSt = (a.status || "").replace("🔵 ", "").replace("🟣 ", "").trim();
        const matched = cleanSt.match(/^(?:รอ)?(ห้อง\s*[1-5])/);
        if (matched) {
          const rmKey = matched[1].replace(/\s+/g, " ");
          if (roomOccupiedCounts[rmKey] !== undefined) {
            roomOccupiedCounts[rmKey]++;
          }
        }
      });

      const currentStatusFilter = document.getElementById("desk-filter-status")?.value || "all";

      Object.keys(ROOM_CAPACITIES).forEach(room => {
        const totalCount = roomOccupiedCounts[room] || 0;
        const max = ROOM_CAPACITIES[room] || (room === "ห้อง 3" || room === "ห้อง 4" ? 6 : 5);
        const isFull = totalCount >= max;
        const isActive = (currentStatusFilter === room);

        const badge = document.createElement("button");
        badge.type = "button";
        
        let activeClass = "";
        if (isActive) {
          activeClass = "bg-gradient-to-r from-emerald-600 to-teal-700 text-white border-emerald-500 ring-2 ring-emerald-400 ring-offset-1 font-black shadow-md scale-105";
        } else if (isFull) {
          activeClass = "bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800 hover:bg-rose-200 dark:hover:bg-rose-900 cursor-pointer shadow-2xs";
        } else {
          activeClass = "bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800 hover:bg-purple-200 dark:hover:bg-purple-900 cursor-pointer shadow-2xs";
        }

        badge.className = `px-3 py-1 rounded-xl text-xs font-bold border transition transform active:scale-95 flex items-center gap-1.5 cursor-pointer ${activeClass}`;
        badge.innerHTML = `
          ${isActive ? '<span class="text-xs">🔍</span>' : ''}
          <span>${room}: <strong>${totalCount}/${max}</strong> เตียง${isFull ? ' (เต็ม)' : ''}</span>
        `;
        badge.title = isActive ? `คลิกเพื่อยกเลิกการกรอง (แสดงทุกห้อง)` : `คลิกเพื่อแสดงเฉพาะคิวที่อยู่ใน ${room}`;
        badge.onclick = () => filterByRoomQuota(room);
        container.appendChild(badge);
      });
    }

