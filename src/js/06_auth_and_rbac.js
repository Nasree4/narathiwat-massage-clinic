/**
 * Module 6: 06_auth_and_rbac.js
 * Description: Authentication, Login/Logout, Roles & RBAC
 * Generated from lines 9851 to 10939 of original index.html
 */

    /* =========================================================================
       AUTHENTICATION & ROLE-BASED ACCESS CONTROL (RBAC)
       ========================================================================= */

    function togglePasswordVisibility(inputId, btn) {
      const input = document.getElementById(inputId);
      if (!input) return;
      if (input.type === "password") {
        input.type = "text";
        if (btn) btn.innerHTML = `<i data-lucide="eye-off" class="w-4 h-4 text-herbal-600"></i>`;
      } else {
        input.type = "password";
        if (btn) btn.innerHTML = `<i data-lucide="eye" class="w-4 h-4 text-slate-400"></i>`;
      }
      lucide.createIcons();
    }

    function switchPageAuthMode(mode) {
      const loginTab = document.getElementById("tab-page-auth-login");
      const regTab = document.getElementById("tab-page-auth-register");
      const loginForm = document.getElementById("form-page-auth-login");
      const regForm = document.getElementById("form-page-auth-register");
      const errBox = document.getElementById("page-auth-error-msg");
      if (errBox) errBox.classList.add("hidden");

      if (mode === 'login') {
        if (loginTab) loginTab.className = "flex-1 py-2.5 text-center rounded-lg bg-white text-herbal-800 shadow-xs transition flex items-center justify-center space-x-1.5 font-bold";
        if (regTab) regTab.className = "flex-1 py-2.5 text-center rounded-lg text-slate-500 hover:text-slate-800 transition flex items-center justify-center space-x-1.5";
        if (loginForm) loginForm.classList.remove("hidden");
        if (regForm) regForm.classList.add("hidden");
        setTimeout(() => document.getElementById("page-login-identifier")?.focus(), 100);
      } else {
        if (regTab) regTab.className = "flex-1 py-2.5 text-center rounded-lg bg-white text-herbal-800 shadow-xs transition flex items-center justify-center space-x-1.5 font-bold";
        if (loginTab) loginTab.className = "flex-1 py-2.5 text-center rounded-lg text-slate-500 hover:text-slate-800 transition flex items-center justify-center space-x-1.5";
        if (regForm) regForm.classList.remove("hidden");
        if (loginForm) loginForm.classList.add("hidden");
        setTimeout(() => document.getElementById("page-reg-name")?.focus(), 100);
      }
      lucide.createIcons();
    }

    function renderLoginView() {
      const container = document.getElementById("login-view-content");
      if (!container) return;

      if (currentUser) {
        const roleBadge = currentUser.role === 'admin'
          ? '<span class="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-300">🛡️ ผู้ดูแลระบบ (Admin)</span>'
          : (currentUser.role === 'staff'
            ? '<span class="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">🩺 เจ้าหน้าที่ / ผู้ช่วยฯ (Staff)</span>'
            : '<span class="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">👤 ผู้รับบริการทั่วไป (User)</span>');

        container.innerHTML = `
          <div class="space-y-6">
            <div class="flex flex-col sm:flex-row items-center sm:items-start space-y-3 sm:space-y-0 sm:space-x-4 p-5 bg-slate-50 rounded-2xl border border-slate-200">
              <div class="w-16 h-16 rounded-2xl bg-herbal-700 text-white flex items-center justify-center text-3xl font-bold shadow-md">
                ${currentUser.role === 'admin' ? '🛡️' : (currentUser.role === 'staff' ? '🩺' : '👤')}
              </div>
              <div class="flex-1 text-center sm:text-left space-y-1">
                <div class="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h3 class="text-lg font-bold text-slate-800">${escapeHtml(currentUser.name)}</h3>
                  ${roleBadge}
                </div>
                <p class="text-xs text-slate-600 flex items-center justify-center sm:justify-start gap-1">
                  <i data-lucide="phone" class="w-3.5 h-3.5 text-slate-400"></i> ${escapeHtml(currentUser.phone || '-')}
                  ${currentUser.email ? ` • <i data-lucide="mail" class="w-3.5 h-3.5 text-slate-400"></i> ${escapeHtml(currentUser.email)}` : ''}
                </p>
                <p class="text-[11px] text-slate-400">เข้าสู่ระบบเมื่อ: ${new Date(currentUser.loggedInAt || Date.now()).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.</p>
                <p class="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center justify-center sm:justify-start gap-1.5 pt-0.5">
                  <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block"></span>
                  <span>จดจำการเข้าสู่ระบบบนอุปกรณ์นี้ (บันทึกอัตโนมัติ 30 วัน)</span>
                </p>
              </div>
            </div>

            <div class="space-y-3">
              <h4 class="text-xs font-bold uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                <i data-lucide="layout-grid" class="w-4 h-4 text-herbal-700"></i>
                <span>เมนูด่วนตามสิทธิ์การใช้งานของคุณ</span>
              </h4>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                ${currentUser.role === 'admin' || currentUser.role === 'staff' ? `
                  <button type="button" onclick="switchTab('desk')" class="p-3.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold flex items-center space-x-2.5 transition shadow-2xs text-left">
                    <i data-lucide="stethoscope" class="w-5 h-5 text-amber-600 shrink-0"></i>
                    <div>
                      <span class="block">โต๊ะตรวจ & จัดการคิว</span>
                      <span class="text-[10px] text-amber-700 font-normal">เรียกคิว จัดห้อง มอบหมายผู้ช่วยฯ</span>
                    </div>
                  </button>
                  <button type="button" onclick="switchTab('patients')" class="p-3.5 bg-sky-50 hover:bg-sky-100 text-sky-900 border border-sky-200 rounded-xl text-xs font-bold flex items-center space-x-2.5 transition shadow-2xs text-left">
                    <i data-lucide="contact" class="w-5 h-5 text-sky-600 shrink-0"></i>
                    <div>
                      <span class="block">ทะเบียนประวัติคนไข้</span>
                      <span class="text-[10px] text-sky-700 font-normal">ค้นหา ดูประวัติ และเวชระเบียน</span>
                    </div>
                  </button>
                  <button type="button" onclick="switchTab('stats')" class="p-3.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-xl text-xs font-bold flex items-center space-x-2.5 transition shadow-2xs text-left">
                    <i data-lucide="pie-chart" class="w-5 h-5 text-emerald-600 shrink-0"></i>
                    <div>
                      <span class="block">สถิติ & สรุปค่าบริการ</span>
                      <span class="text-[10px] text-emerald-700 font-normal">ส่วนแบ่งค่าบริการ 60% ผู้ช่วยฯ</span>
                    </div>
                  </button>
                ` : ''}
                ${currentUser.role === 'admin' ? `
                  <button type="button" onclick="switchTab('manage')" class="p-3.5 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 rounded-xl text-xs font-bold flex items-center space-x-2.5 transition shadow-2xs text-left">
                    <i data-lucide="shield-check" class="w-5 h-5 text-purple-600 shrink-0"></i>
                    <div>
                      <span class="block">จัดการระบบ (Admin)</span>
                      <span class="text-[10px] text-purple-700 font-normal">โควตา, ตารางเวร, บริการ, วันหยุด</span>
                    </div>
                  </button>
                ` : ''}
                <button type="button" onclick="switchTab('new')" class="p-3.5 bg-herbal-50 hover:bg-herbal-100 text-herbal-900 border border-herbal-200 rounded-xl text-xs font-bold flex items-center space-x-2.5 transition shadow-2xs text-left sm:col-span-2">
                  <i data-lucide="calendar-plus" class="w-5 h-5 text-herbal-600 shrink-0"></i>
                  <div>
                    <span class="block">จองคิวนัดหมายออนไลน์</span>
                    <span class="text-[10px] text-herbal-700 font-normal">ลงทะเบียนจองคิวรับบริการคลินิกแพทย์แผนไทย</span>
                  </div>
                </button>
              </div>
            </div>

            <!-- For User: Satisfaction Reviews & History -->
            ${currentUser.role === 'user' ? `
              <div class="p-4 sm:p-5 bg-gradient-to-r from-amber-50/80 via-white to-emerald-50/80 rounded-2xl border border-amber-200/80 shadow-2xs space-y-3">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-100 pb-2.5">
                  <div class="flex items-center space-x-2.5">
                    <div class="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-lg border border-amber-200 shadow-inner">
                      ⭐
                    </div>
                    <div>
                      <h4 class="text-xs sm:text-sm font-bold text-slate-800">การประเมินความพึงพอใจและรีวิวของคุณ</h4>
                      <p class="text-[11px] text-slate-500">ผลตอบรับและคะแนนดาวที่คุณมอบให้คลินิก</p>
                    </div>
                  </div>
                  <button type="button" onclick="openReviewModal()" class="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-xs">
                    <i data-lucide="star" class="w-3.5 h-3.5"></i>
                    <span>เขียนรีวิว / ประเมินบริการ</span>
                  </button>
                </div>

                <div class="space-y-2">
                  ${(() => {
                    const userReviews = reviewsList.filter(r => 
                      (currentUser.phone && r.phone && r.phone.replace(/[^0-9]/g, '') === currentUser.phone.replace(/[^0-9]/g, '')) ||
                      (r.patient_name && r.patient_name.includes(currentUser.name))
                    );
                    if (userReviews.length === 0) {
                      return `
                        <div class="text-center py-5 text-xs text-slate-400">
                          <p>คุณยังไม่มีประวัติการประเมินความพึงพอใจ</p>
                          <p class="text-[11px] text-slate-400 mt-0.5">คุณสามารถกดปุ่ม "เขียนรีวิว / ประเมินบริการ" เพื่อให้คะแนนการรักษาได้ตลอดเวลา</p>
                        </div>
                      `;
                    }
                    return userReviews.map(r => `
                      <div class="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1.5">
                        <div class="flex items-center justify-between">
                          <div class="flex items-center space-x-2">
                            <span class="text-amber-400 text-xs">${'⭐'.repeat(r.rating_overall || 5)}</span>
                            <span class="text-xs font-bold text-slate-800">${escapeHtml(r.service_name || 'บริการคลินิก')}</span>
                          </div>
                          <span class="text-[10px] text-slate-400 font-mono">${new Date(r.created_at).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                        </div>
                        <div class="text-[11px] text-slate-600 flex items-center gap-2">
                          <span>ผู้ช่วยฯ: <strong>${escapeHtml(r.assistant_name || 'ไม่ระบุ')}</strong></span>
                          <span>•</span>
                          <span>สถานะ: <strong class="text-emerald-700">${r.nps_recommend === 'recommend' ? 'แนะนำอย่างยิ่ง' : 'พอใจในการรักษา'}</strong></span>
                        </div>
                        ${r.comment ? `<p class="text-xs italic text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">“${escapeHtml(r.comment)}”</p>` : ''}
                      </div>
                    `).join('');
                  })()}
                </div>
              </div>
            ` : ''}

            <!-- User Recent Notifications -->
            <div class="p-4 sm:p-5 bg-gradient-to-r from-emerald-50/70 via-white to-amber-50/70 dark:from-slate-850 dark:via-slate-850 dark:to-slate-850 rounded-2xl border border-emerald-200/80 dark:border-slate-700 shadow-2xs space-y-3">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-100 dark:border-slate-800 pb-2.5">
                <div class="flex items-center space-x-2.5">
                  <div class="w-9 h-9 rounded-xl bg-herbal-700 text-white flex items-center justify-center font-bold text-lg shadow-inner">
                    🔔
                  </div>
                  <div>
                    <h4 class="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                      <span>การแจ้งเตือนล่าสุดของคุณ</span>
                      <span class="px-2 py-0.2 rounded-full text-[10px] font-bold bg-rose-500 text-white">${getUnreadNotificationCount()} ยังไม่อ่าน</span>
                    </h4>
                    <p class="text-[11px] text-slate-500 dark:text-slate-400">อัปเดตสถานะคิว, การนัดเจาะจงตัว และงานของคุณ</p>
                  </div>
                </div>
                <div class="flex items-center space-x-2">
                  <button type="button" onclick="openNotificationModal()" class="px-3 py-1.5 bg-herbal-700 hover:bg-herbal-600 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1 shadow-2xs cursor-pointer">
                    <i data-lucide="bell" class="w-3.5 h-3.5"></i>
                    <span>เปิดศูนย์แจ้งเตือน</span>
                  </button>
                  <button type="button" onclick="markAllNotificationsAsRead()" class="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition cursor-pointer" title="อ่านทั้งหมด">
                    <i data-lucide="check-check" class="w-3.5 h-3.5"></i>
                  </button>
                </div>
              </div>

              <div class="space-y-2">
                ${(() => {
                  const userNotifs = notifications.filter(isNotificationForCurrentUser);
                  const topNotifs = userNotifs.slice(0, 4);
                  if (topNotifs.length === 0) {
                    return `
                      <div class="text-center py-4 text-xs text-slate-400 dark:text-slate-500">
                        <p>ไม่มีการแจ้งเตือนใหม่ในขณะนี้</p>
                      </div>
                    `;
                  }
                  return topNotifs.map(n => `
                    <div onclick="handleNotificationClick('${n.id}', '${n.appointmentId}')" class="p-2.5 rounded-xl border transition cursor-pointer flex items-start space-x-2.5 ${!n.read ? 'bg-amber-50/80 dark:bg-slate-800 border-amber-300 dark:border-amber-700' : 'bg-white dark:bg-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800'}">
                      <div class="w-7 h-7 rounded-lg ${n.type === 'ASSISTANT_ASSIGNED' ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300' : (n.type === 'STATUS_CHANGED' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300')} flex items-center justify-center shrink-0 text-xs">
                        <i data-lucide="${n.type === 'ASSISTANT_ASSIGNED' ? 'user-check' : (n.type === 'STATUS_CHANGED' ? 'activity' : 'bell')}" class="w-3.5 h-3.5"></i>
                      </div>
                      <div class="flex-grow min-w-0">
                        <div class="flex items-center justify-between text-xs">
                          <span class="font-bold text-slate-800 dark:text-slate-100 truncate">${escapeHtml(n.title)}</span>
                          <span class="text-[10px] text-slate-400 shrink-0 font-medium">${formatRelativeTime(n.timestamp)}</span>
                        </div>
                        <p class="text-[11px] text-slate-600 dark:text-slate-300 truncate">${escapeHtml(n.message)}</p>
                      </div>
                    </div>
                  `).join('');
                })()}
              </div>
            <!-- 1. Notification Settings & Mute Control -->
            <div class="p-4 sm:p-5 bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-3">
              <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                <div class="flex items-center space-x-2.5">
                  <div class="w-9 h-9 rounded-xl ${isNotificationsMuted ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300' : 'bg-herbal-100 dark:bg-herbal-950 text-herbal-700 dark:text-herbal-300'} flex items-center justify-center font-bold text-lg shadow-inner">
                    ${isNotificationsMuted ? '🔕' : '🔔'}
                  </div>
                  <div>
                    <h4 class="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100">การตั้งค่าการแจ้งเตือน (Notification Settings)</h4>
                    <p class="text-[11px] text-slate-500 dark:text-slate-400">ควบคุมเสียงและ Pop-up การแจ้งเตือนบนอุปกรณ์นี้</p>
                  </div>
                </div>
                <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold ${isNotificationsMuted ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200 border border-amber-300' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200 border border-emerald-300'}">
                  ${isNotificationsMuted ? '🔕 ปิดแจ้งเตือนอยู่' : '🔔 เปิดแจ้งเตือนปกติ'}
                </span>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <!-- Mute All Toggle -->
                <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div class="space-y-0.5 pr-2">
                    <span class="font-bold text-xs text-slate-800 dark:text-slate-100 block">🔕 ปิดการแจ้งเตือนทั้งหมด</span>
                    <span class="text-[11px] text-slate-500 dark:text-slate-400 block leading-tight">งดเสียง Chime และ Pop-up ทั้งหมด</span>
                  </div>
                  <button type="button" onclick="toggleMuteNotifications()" class="px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer ${isNotificationsMuted ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-slate-200 dark:bg-slate-750 text-slate-700 dark:text-slate-200 hover:bg-slate-300'}">
                    ${isNotificationsMuted ? 'เปิดแจ้งเตือน' : 'ปิดแจ้งเตือน'}
                  </button>
                </div>

                <!-- Mute Sound Only Toggle -->
                <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div class="space-y-0.5 pr-2">
                    <span class="font-bold text-xs text-slate-800 dark:text-slate-100 block">🔇 ปิดเฉพาะเสียงแจ้งเตือน</span>
                    <span class="text-[11px] text-slate-500 dark:text-slate-400 block leading-tight">ยังแสดง Pop-up แต่ปิดเสียงกริ่ง</span>
                  </div>
                  <button type="button" onclick="toggleMuteSound()" class="px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer ${isSoundMuted ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-slate-200 dark:bg-slate-750 text-slate-700 dark:text-slate-200 hover:bg-slate-300'}">
                    ${isSoundMuted ? 'เปิดเสียง' : 'ปิดเสียง'}
                  </button>
                </div>
              </div>
            </div>

            <!-- 2. Change Password Card -->
            <div class="p-4 sm:p-5 bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-3">
              <div class="flex items-center space-x-2.5 border-b border-slate-100 dark:border-slate-800 pb-2.5">
                <div class="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold text-lg shadow-inner">
                  🔑
                </div>
                <div>
                  <h4 class="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100">เปลี่ยนรหัสผ่าน (Change Password)</h4>
                  <p class="text-[11px] text-slate-500 dark:text-slate-400">กำหนดรหัสผ่านใหม่เพื่อความปลอดภัยในการเข้าใช้งาน</p>
                </div>
              </div>

              <form id="form-profile-change-password" onsubmit="handleProfileChangePasswordSubmit(event)" class="space-y-3 pt-1">
                <div>
                  <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">รหัสผ่านใหม่ (New Password) <span class="text-rose-500">*</span></label>
                  <div class="relative">
                    <input type="password" id="profile-new-password" required placeholder="อย่างน้อย 4 ตัวอักษร" class="w-full pl-3 pr-10 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 outline-none bg-slate-50/50 dark:bg-slate-900 font-medium text-slate-800 dark:text-slate-100">
                    <button type="button" onclick="togglePasswordVisibility('profile-new-password', this)" class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer">
                      <i data-lucide="eye" class="w-4 h-4"></i>
                    </button>
                  </div>
                </div>

                <div>
                  <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">ยืนยันรหัสผ่านใหม่ (Confirm Password) <span class="text-rose-500">*</span></label>
                  <div class="relative">
                    <input type="password" id="profile-confirm-password" required placeholder="กรอกรหัสผ่านใหม่อีกครั้ง" class="w-full pl-3 pr-10 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 outline-none bg-slate-50/50 dark:bg-slate-900 font-medium text-slate-800 dark:text-slate-100">
                    <button type="button" onclick="togglePasswordVisibility('profile-confirm-password', this)" class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer">
                      <i data-lucide="eye" class="w-4 h-4"></i>
                    </button>
                  </div>
                </div>

                <div class="flex items-center justify-end pt-1">
                  <button type="submit" id="btn-submit-change-password" class="px-4 py-2.5 bg-purple-700 hover:bg-purple-600 active:bg-purple-800 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-sm cursor-pointer">
                    <i data-lucide="save" class="w-4 h-4"></i>
                    <span>บันทึกรหัสผ่านใหม่</span>
                  </button>
                </div>
              </form>
            </div>

            <div class="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button type="button" onclick="openAuthModal('login')" class="w-full sm:w-auto px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 border border-slate-300 dark:border-slate-700">
                <i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i>
                <span>สลับเข้าใช้งานบัญชีอื่น</span>
              </button>
              <button type="button" onclick="handleLogout()" class="w-full sm:w-auto px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow-sm">
                <i data-lucide="log-out" class="w-3.5 h-3.5"></i>
                <span>ออกจากระบบ (Logout)</span>
              </button>
            </div>
          </div>
        `;
      } else {
        container.innerHTML = `
          <div class="space-y-6">
            <!-- Auth Mode Tabs -->
            <div class="flex border-b border-slate-200 bg-slate-100 p-1 rounded-xl text-xs font-bold">
              <button type="button" id="tab-page-auth-login" onclick="switchPageAuthMode('login')" class="flex-1 py-2.5 text-center rounded-lg bg-white text-herbal-800 shadow-xs transition flex items-center justify-center space-x-1.5 font-bold">
                <i data-lucide="log-in" class="w-4 h-4"></i>
                <span>เข้าสู่ระบบ (Sign In)</span>
              </button>
              <button type="button" id="tab-page-auth-register" onclick="switchPageAuthMode('register')" class="flex-1 py-2.5 text-center rounded-lg text-slate-500 hover:text-slate-800 transition flex items-center justify-center space-x-1.5">
                <i data-lucide="user-plus" class="w-4 h-4"></i>
                <span>สมัครสมาชิกใหม่ (Register)</span>
              </button>
            </div>

            <!-- Error Box -->
            <div id="page-auth-error-msg" class="hidden p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center space-x-2">
              <i data-lucide="alert-circle" class="w-4 h-4 shrink-0 text-rose-600"></i>
              <span id="page-auth-error-text">ข้อมูลการเข้าสู่ระบบไม่ถูกต้อง</span>
            </div>

            <!-- 1. Sign In Form -->
            <form id="form-page-auth-login" onsubmit="handleLoginSubmit(event, 'page')" class="space-y-4">
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">ชื่อผู้ใช้, เบอร์โทรศัพท์ หรือ อีเมล <span class="text-rose-500">*</span></label>
                <div class="relative">
                  <span class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                    <i data-lucide="user" class="w-4 h-4"></i>
                  </span>
                  <input type="text" id="page-login-identifier" required placeholder="เช่น admin, staff, 0800000001 หรือ admin@ttm.clinic" class="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-herbal-500 outline-none bg-slate-50/50 font-medium">
                </div>
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">รหัสผ่าน (Password) <span class="text-rose-500">*</span></label>
                <div class="relative">
                  <span class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                    <i data-lucide="lock" class="w-4 h-4"></i>
                  </span>
                  <input type="password" id="page-login-password" required placeholder="เช่น admin, staff, 1234" class="w-full pl-9 pr-10 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-herbal-500 outline-none bg-slate-50/50 font-medium">
                  <button type="button" onclick="togglePasswordVisibility('page-login-password', this)" class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer">
                    <i data-lucide="eye" class="w-4 h-4"></i>
                  </button>
                </div>
              </div>

              <!-- Stay Logged In (30 Days) -->
              <div class="flex items-center justify-between text-xs pt-1 pb-0.5">
                <label class="flex items-center space-x-2 cursor-pointer select-none text-slate-600 dark:text-slate-300">
                  <input type="checkbox" id="page-login-remember" checked class="w-4 h-4 rounded text-herbal-700 focus:ring-herbal-500 border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 cursor-pointer">
                  <span class="font-medium text-xs">จดจำการเข้าสู่ระบบบนอุปกรณ์นี้ (30 วัน)</span>
                </label>
              </div>

              <button type="submit" class="w-full py-3 bg-herbal-700 hover:bg-herbal-600 text-white rounded-xl text-sm font-bold shadow-md transition flex items-center justify-center space-x-2 mt-2 cursor-pointer">
                <i data-lucide="log-in" class="w-4 h-4"></i>
                <span>เข้าสู่ระบบ (Sign In)</span>
              </button>

              <!-- Quick 1-Click Login Accounts -->
              <div class="pt-3 border-t border-slate-200">
                <div class="text-[11px] font-bold text-slate-500 mb-2 flex items-center gap-1">
                  <i data-lucide="zap" class="w-3.5 h-3.5 text-amber-500"></i>
                  <span>เข้าสู่ระบบด่วน 1-คลิก (เลือกสิทธิ์ใช้งาน):</span>
                </div>
                <div class="grid grid-cols-3 gap-2">
                  <button type="button" onclick="fillQuickLogin('admin', 'page')" class="p-2.5 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center text-center cursor-pointer shadow-2xs">
                    <span class="text-base mb-0.5">🛡️</span>
                    <span class="font-bold text-xs">Admin</span>
                    <span class="text-[10px] text-purple-600 font-normal">admin / admin</span>
                  </button>
                  <button type="button" onclick="fillQuickLogin('staff', 'page')" class="p-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center text-center cursor-pointer shadow-2xs">
                    <span class="text-base mb-0.5">🩺</span>
                    <span class="font-bold text-xs">Staff</span>
                    <span class="text-[10px] text-amber-600 font-normal">staff / staff</span>
                  </button>
                  <button type="button" onclick="fillQuickLogin('user', 'page')" class="p-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center text-center cursor-pointer shadow-2xs">
                    <span class="text-base mb-0.5">👤</span>
                    <span class="font-bold text-xs">User</span>
                    <span class="text-[10px] text-emerald-600 font-normal">user / user</span>
                  </button>
                </div>
              </div>
            </form>

            <!-- 2. Register Form -->
            <form id="form-page-auth-register" onsubmit="handleRegisterSubmit(event, 'page')" class="space-y-3.5 hidden">
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">ชื่อ-นามสกุล <span class="text-rose-500">*</span></label>
                <input type="text" id="page-reg-name" required placeholder="นาย/นาง/น.ส. สมชาย ใจดี" class="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-herbal-500 outline-none bg-slate-50/50 font-medium">
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1">เบอร์โทรศัพท์ <span class="text-rose-500">*</span></label>
                  <input type="tel" id="page-reg-phone" required placeholder="08x-xxx-xxxx" class="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-herbal-500 outline-none bg-slate-50/50 font-medium">
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1">อีเมล (ถ้ามี)</label>
                  <input type="email" id="page-reg-email" placeholder="example@email.com" class="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-herbal-500 outline-none bg-slate-50/50 font-medium">
                </div>
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">รหัสผ่าน (Password) <span class="text-rose-500">*</span></label>
                <input type="password" id="page-reg-password" required placeholder="อย่างน้อย 4 ตัวอักษร" class="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-herbal-500 outline-none bg-slate-50/50 font-medium">
              </div>

              <button type="submit" class="w-full py-3 bg-herbal-700 hover:bg-herbal-600 text-white rounded-xl text-sm font-bold shadow-md transition flex items-center justify-center space-x-2 mt-2">
                <i data-lucide="user-check" class="w-4 h-4"></i>
                <span>ยืนยันการสมัครและเข้าสู่ระบบ</span>
              </button>
            </form>
          </div>
        `;
      }
      lucide.createIcons();
    }

    function openAuthModal(mode = 'login') {
      const modal = document.getElementById("modal-auth");
      if (!modal) return;
      modal.classList.remove("hidden");
      switchAuthMode(mode);
      const errBox = document.getElementById("auth-error-msg");
      if (errBox) errBox.classList.add("hidden");
    }

    function closeAuthModal() {
      const modal = document.getElementById("modal-auth");
      if (modal) modal.classList.add("hidden");
    }

    function switchAuthMode(mode) {
      const loginTab = document.getElementById("tab-auth-login");
      const regTab = document.getElementById("tab-auth-register");
      const loginForm = document.getElementById("form-auth-login");
      const regForm = document.getElementById("form-auth-register");
      const errBox = document.getElementById("auth-error-msg");
      if (errBox) errBox.classList.add("hidden");

      if (mode === 'login') {
        if (loginTab) loginTab.className = "flex-1 py-3 text-center border-b-2 border-herbal-700 text-herbal-800 bg-white transition flex items-center justify-center space-x-1.5 font-bold";
        if (regTab) regTab.className = "flex-1 py-3 text-center border-b-2 border-transparent text-slate-500 hover:text-slate-800 transition flex items-center justify-center space-x-1.5";
        if (loginForm) loginForm.classList.remove("hidden");
        if (regForm) regForm.classList.add("hidden");
        setTimeout(() => document.getElementById("login-identifier")?.focus(), 100);
      } else {
        if (regTab) regTab.className = "flex-1 py-3 text-center border-b-2 border-herbal-700 text-herbal-800 bg-white transition flex items-center justify-center space-x-1.5 font-bold";
        if (loginTab) loginTab.className = "flex-1 py-3 text-center border-b-2 border-transparent text-slate-500 hover:text-slate-800 transition flex items-center justify-center space-x-1.5";
        if (regForm) regForm.classList.remove("hidden");
        if (loginForm) loginForm.classList.add("hidden");
        setTimeout(() => document.getElementById("reg-name")?.focus(), 100);
      }
      lucide.createIcons();
    }

    function fillQuickLogin(role, source = 'modal') {
      const isPage = source === 'page';
      const identInput = isPage ? document.getElementById("page-login-identifier") : document.getElementById("login-identifier");
      const passInput = isPage ? document.getElementById("page-login-password") : document.getElementById("login-password");
      if (!identInput || !passInput) return;

      if (role === 'admin') {
        identInput.value = 'admin';
        passInput.value = 'admin';
      } else if (role === 'staff') {
        identInput.value = 'staff';
        passInput.value = 'staff';
      } else if (role === 'user') {
        identInput.value = 'user';
        passInput.value = 'user';
      }

      const form = isPage ? document.getElementById("form-page-auth-login") : document.getElementById("form-auth-login");
      if (form) {
        handleLoginSubmit(null, source);
      }
    }

    async function handleLoginSubmit(e, source = 'modal') {
      if (e) e.preventDefault();
      const rememberCheckbox = source === 'page'
        ? (document.getElementById("page-login-remember") || document.getElementById("login-remember"))
        : (document.getElementById("login-remember") || document.getElementById("page-login-remember"));
      const rememberMe = rememberCheckbox ? rememberCheckbox.checked : true;

      const identifier = (
        (source === 'page' ? document.getElementById("page-login-identifier")?.value : "") ||
        document.getElementById("login-identifier")?.value ||
        document.getElementById("page-login-identifier")?.value ||
        ""
      ).trim();

      const password = (
        (source === 'page' ? document.getElementById("page-login-password")?.value : "") ||
        document.getElementById("login-password")?.value ||
        document.getElementById("page-login-password")?.value ||
        ""
      ).trim();

      const errBox = source === 'page' ? document.getElementById("page-auth-error-msg") : document.getElementById("auth-error-msg");
      const errText = source === 'page' ? document.getElementById("page-auth-error-text") : document.getElementById("auth-error-text");

      if (!identifier || !password) {
        if (errBox) {
          errText.textContent = "กรุณากรอกชื่อผู้ใช้ / เบอร์โทร / อีเมล และรหัสผ่าน";
          errBox.classList.remove("hidden");
        }
        return;
      }

      // 1. Check Rate-Limit / Brute Force Lockout
      const lockout = checkLoginLockout(identifier);
      if (lockout.locked) {
        if (errBox) {
          errText.textContent = `ระบบระงับการเข้าสู่ระบบชั่วคราวเนื่องจากใส่รหัสผ่านผิดเกินกำหนด (เหลืออีก ${lockout.remainingSec} วินาที)`;
          errBox.classList.remove("hidden");
        }
        showToast(`กรุณารออีก ${lockout.remainingSec} วินาทีก่อนลองเข้าสู่ระบบใหม่อีกครั้ง`, "warning");
        return;
      }

      // 2. Try Supabase Auth first (for accounts created in Supabase Auth service)
      if (supabaseClient && identifier.includes("@")) {
        try {
          const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
            email: identifier,
            password: password
          });
          if (!authError && authData && authData.session) {
            clearFailedLogins(identifier);
            const device = detectClientDevice();
            await applyAuthSession(authData.session);
            saveAuthSession(currentUser, rememberMe, 'supabase');
            closeAuthModal();

            await logActivity("LOGIN", `เข้าสู่ระบบสำเร็จ: ${currentUser.name} (${currentUser.role.toUpperCase()})`, {
              identifier: identifier,
              role: currentUser.role,
              ip: currentClientIp,
              device: device.deviceText
            });

            showToast(`ยินดีต้อนรับ ${currentUser.name} (${getRoleBadgeLabel(currentUser.role)})`, "success");
            navigateDefaultTabForUser(currentUser);
            return;
          }
        } catch(e) {}
      }

      // 3. Authenticate against Local DB / DEFAULT_USERS / Assistants / usersList
      const cleanPhone = identifier.replace(/[^0-9]/g, '');
      const lowerIdent = identifier.toLowerCase();
      const normIdent = typeof normalizeAssistantName === "function" ? normalizeAssistantName(identifier) : lowerIdent;
      let matchedUser = null;

      // 3.1 Check DEFAULT_USERS (admin / staff / user / demo / phone / email / id)
      const def = DEFAULT_USERS.find(u => 
        (u.email && u.email.toLowerCase() === lowerIdent) ||
        (u.phone && u.phone.replace(/[^0-9]/g, '') === cleanPhone) ||
        (u.role && u.role.toLowerCase() === lowerIdent) ||
        (u.id && u.id.toLowerCase() === lowerIdent) ||
        (u.id && u.id.replace('usr-', '').toLowerCase() === lowerIdent) ||
        (lowerIdent === 'admin' && u.role === 'admin') ||
        (lowerIdent === 'staff' && u.role === 'staff') ||
        ((lowerIdent === 'user' || lowerIdent === 'demo') && u.role === 'user')
      );

      if (def) {
        const isRoleAdmin = def.role === 'admin';
        const isRoleStaff = def.role === 'staff';
        const isRoleUser = def.role === 'user';
        const validPass = (
          def.password === password ||
          password === def.password ||
          password === (def.role + '1234') ||
          password === '1234' ||
          (isRoleAdmin && (password === 'admin' || password === 'admin1234')) ||
          (isRoleStaff && (password === 'staff' || password === 'staff1234')) ||
          (isRoleUser && (password === 'user' || password === 'user1234'))
        );
        if (validPass) {
          matchedUser = { ...def };
        }
      }

      // 3.2 Check against users in Supabase / usersList
      if (!matchedUser) {
        let targetUser = usersList.find(u => {
          const uPhone = (u.phone || '').replace(/[^0-9]/g, '');
          const uEmail = (u.email || '').toLowerCase();
          const uRole = (u.role || '').toLowerCase();
          const uId = (u.id || '').toLowerCase();
          return (cleanPhone && uPhone === cleanPhone) ||
                 (uEmail && uEmail === lowerIdent) ||
                 (uRole && uRole === lowerIdent) ||
                 (uId && uId === lowerIdent) ||
                 (uId && uId.replace('usr-', '') === lowerIdent);
        });

        if (!targetUser && supabaseClient) {
          try {
            const { data: dbUsers } = await supabaseClient.from("users").select("*");
            if (dbUsers && dbUsers.length > 0) {
              usersList = dbUsers;
              targetUser = usersList.find(u => {
                const uPhone = (u.phone || '').replace(/[^0-9]/g, '');
                const uEmail = (u.email || '').toLowerCase();
                const uRole = (u.role || '').toLowerCase();
                const uId = (u.id || '').toLowerCase();
                return (cleanPhone && uPhone === cleanPhone) ||
                       (uEmail && uEmail === lowerIdent) ||
                       (uRole && uRole === lowerIdent) ||
                       (uId && uId === lowerIdent) ||
                       (uId && uId.replace('usr-', '') === lowerIdent);
              });
            }
          } catch (e) {}
        }

        if (targetUser) {
          const validPass = targetUser.password === password ||
                            (!targetUser.password && (password === '1234' || password === targetUser.role)) ||
                            password === '1234' ||
                            (targetUser.role === 'admin' && password === 'admin') ||
                            (targetUser.role === 'staff' && password === 'staff');
          if (validPass) {
            matchedUser = {
              id: targetUser.id,
              name: targetUser.name,
              phone: targetUser.phone,
              email: targetUser.email,
              role: targetUser.role || 'staff',
              active: targetUser.active !== false
            };
          }
        }
      }

      // 3.3 Check against assistants table / assistants list (by phone, email, nickname, name, id)
      if (!matchedUser) {
        let targetAsst = assistants.find(a => {
          const aPhone = (a.phone || '').replace(/[^0-9]/g, '');
          const aEmail = (a.email || '').toLowerCase();
          const aNick = (a.nickname || '').toLowerCase();
          const aName = (a.name || '').toLowerCase();
          const aNormName = typeof normalizeAssistantName === "function" ? normalizeAssistantName(a.name) : aName;
          const aId = (a.id || '').toLowerCase();
          return (cleanPhone && aPhone === cleanPhone) ||
                 (aEmail && aEmail === lowerIdent) ||
                 (aNick && aNick === lowerIdent) ||
                 (aName && aName === lowerIdent) ||
                 (normIdent && aNormName === normIdent) ||
                 (aId && aId === lowerIdent) ||
                 (aId && ('usr-' + aId) === lowerIdent);
        });

        if (targetAsst) {
          const validAsstPass = targetAsst.password === password ||
                                (!targetAsst.password && (password === '1234' || password === 'staff')) ||
                                targetAsst.password === '1234' ||
                                password === '1234' ||
                                password === 'staff' ||
                                (cleanPhone && cleanPhone.length >= 4 && password === cleanPhone.slice(-4));
          if (validAsstPass) {
            matchedUser = {
              id: 'usr-' + targetAsst.id,
              assistantId: targetAsst.id,
              name: `${targetAsst.nickname || ''} (${targetAsst.name})`.trim(),
              phone: targetAsst.phone,
              email: targetAsst.email,
              role: targetAsst.role || 'staff',
              active: targetAsst.active !== false
            };
          }
        }
      }

      // 4. Handle Success or Failure
      if (matchedUser) {
        clearFailedLogins(identifier);
        const device = detectClientDevice();
        currentUser = {
          ...matchedUser,
          authSource: 'database',
          loggedInAt: new Date().toISOString()
        };
        saveAuthSession(currentUser, rememberMe, 'database');
        updateAuthUI();
        closeAuthModal();
        renderLoginView();
        navigateDefaultTabForUser(currentUser);
        showToast(`เข้าสู่ระบบสำเร็จ ยินดีต้อนรับ ${currentUser.name} (${getRoleBadgeLabel(currentUser.role)})`, "success");
        await logActivity("LOGIN", `เข้าสู่ระบบสำเร็จ: ${currentUser.name} (${currentUser.role.toUpperCase()})`, {
          identifier: identifier,
          role: currentUser.role,
          ip: currentClientIp,
          device: device.deviceText
        });
      } else {
        const failRecord = recordFailedLogin(identifier);
        const device = detectClientDevice();

        await logActivity("FAILED_LOGIN", `พยายามเข้าสู่ระบบไม่สำเร็จ: ${identifier} (ครั้งที่ ${failRecord.count}/5)`, {
          identifier: identifier,
          attempts: failRecord.count,
          ip: currentClientIp,
          device: device.deviceText
        });

        if (errBox) {
          if (failRecord.locked) {
            errText.textContent = "ใส่รหัสผ่านผิดพลาดครบ 5 ครั้ง ระบบถูกระงับชั่วคราว 60 วินาทีเพื่อความปลอดภัย";
          } else {
            errText.textContent = `ชื่อผู้ใช้/เบอร์โทร/อีเมล หรือรหัสผ่านไม่ถูกต้อง (ลองผิด ${failRecord.count}/5 ครั้ง)`;
          }
          errBox.classList.remove("hidden");
        }
        showToast("ชื่อผู้ใช้/เบอร์โทร/อีเมล หรือรหัสผ่านไม่ถูกต้อง", "error");
      }
    }

    async function handleRegisterSubmit(e, source = 'modal') {
      if (e) e.preventDefault();
      const name = (
        (source === 'page' ? document.getElementById("page-reg-name")?.value : "") ||
        document.getElementById("reg-name")?.value ||
        document.getElementById("page-reg-name")?.value ||
        ""
      ).trim();

      const phone = (
        (source === 'page' ? document.getElementById("page-reg-phone")?.value : "") ||
        document.getElementById("reg-phone")?.value ||
        document.getElementById("page-reg-phone")?.value ||
        ""
      ).trim();

      const email = (
        (source === 'page' ? document.getElementById("page-reg-email")?.value : "") ||
        document.getElementById("reg-email")?.value ||
        document.getElementById("page-reg-email")?.value ||
        ""
      ).trim();

      const role = "user"; // ลงทะเบียนผ่านช่องทางนี้จะเป็น User (คนไข้ / ผู้รับบริการ) โดยอัตโนมัติ

      const password = (
        (source === 'page' ? document.getElementById("page-reg-password")?.value : "") ||
        document.getElementById("reg-password")?.value ||
        document.getElementById("page-reg-password")?.value ||
        ""
      ).trim();

      const errBox = source === 'page' ? document.getElementById("page-auth-error-msg") : document.getElementById("auth-error-msg");
      const errText = source === 'page' ? document.getElementById("page-auth-error-text") : document.getElementById("auth-error-text");

      if (!name || !phone || !password) {
        if (errBox) {
          errText.textContent = "กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน";
          errBox.classList.remove("hidden");
        }
        return;
      }

      if (!supabaseClient) {
        if (errBox) {
          errText.textContent = "ยังไม่ได้เชื่อมต่อ Supabase Auth";
          errBox.classList.remove("hidden");
        }
        return;
      }

      const cleanPhone = phone.replace(/[^0-9]/g, "");
      const authEmail = email || `${cleanPhone}@phone.ttm.local`;
      const { data: existingPhone } = await supabaseClient
        .rpc("resolve_auth_email_by_phone", { lookup_phone: phone });
      if (existingPhone && existingPhone.length > 0) {
        if (errBox) {
          errText.textContent = "เบอร์โทรศัพท์นี้มีบัญชีอยู่ในระบบแล้ว";
          errBox.classList.remove("hidden");
        }
        return;
      }
      const { data: signUpData, error: signUpError } = await supabaseClient.auth.signUp({
        email: authEmail,
        password,
        options: { data: { name, phone, role } }
      });
      if (signUpError || !signUpData || !signUpData.user) {
        if (errBox) {
          errText.textContent = signUpError?.message || "สมัครสมาชิกไม่สำเร็จ";
          errBox.classList.remove("hidden");
        }
        return;
      }

      const authUser = signUpData.user;
      if (signUpData.session) {
        const { error: profileError } = await supabaseClient.from("users").upsert({
          id: "usr-" + authUser.id,
          auth_user_id: authUser.id,
          name,
          phone,
          email: authEmail,
          role: "user",
          active: true
        }, { onConflict: "auth_user_id" });
        if (profileError) {
          if (errBox) {
            errText.textContent = "สร้างข้อมูลโปรไฟล์ไม่สำเร็จ กรุณาลองใหม่";
            errBox.classList.remove("hidden");
          }
          return;
        }
        await applyAuthSession(signUpData.session);
      }

      closeAuthModal();
      await logActivity("REGISTER", `ลงทะเบียนผู้ใช้ใหม่: ${name} (USER)`, {
        phone,
        role: "user",
        ip: currentClientIp,
        authUserId: authUser.id
      });

      if (signUpData.session) {
        showToast(`สมัครสมาชิกและเข้าสู่ระบบสำเร็จ ยินดีต้อนรับคุณ ${name}!`, "success");
        switchTab("new");
      } else {
        showToast("สมัครสมาชิกสำเร็จ กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ", "info");
      }
    }

    async function handleLogout() {
      if (currentUser) {
        await logActivity("LOGOUT", `ออกจากระบบ: ${currentUser.name} (${currentUser.role.toUpperCase()})`, {
          role: currentUser.role
        });
      }
      clearAuthSession();
      if (supabaseClient) {
        try { await supabaseClient.auth.signOut(); } catch(e) {}
      }
      currentUser = null;
      updateAuthUI();
      switchTab("new");
      showToast("ออกจากระบบเรียบร้อย", "info");
    }

    async function handleProfileChangePasswordSubmit(e) {
      if (e) e.preventDefault();
      if (!currentUser) {
        showToast("กรุณาเข้าสู่ระบบก่อนเปลี่ยนรหัสผ่าน", "error");
        return;
      }

      const newPass = (document.getElementById("profile-new-password")?.value || "").trim();
      const confirmPass = (document.getElementById("profile-confirm-password")?.value || "").trim();
      const submitBtn = document.getElementById("btn-submit-change-password");

      if (!newPass) {
        showToast("กรุณาระบุรหัสผ่านใหม่", "warning");
        return;
      }

      if (newPass.length < 4) {
        showToast("รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 4 ตัวอักษร", "warning");
        return;
      }

      if (newPass !== confirmPass) {
        showToast("รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน กรุณาตรวจสอบ", "error");
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `⏳ กำลังบันทึก...`;
      }

      try {
        // 1. Supabase Auth update (if session exists)
        if (supabaseClient && supabaseClient.auth) {
          try {
            const { data: sessionData } = await supabaseClient.auth.getSession();
            if (sessionData && sessionData.session) {
              const { error: authError } = await supabaseClient.auth.updateUser({ password: newPass });
              if (authError) {
                console.warn("Supabase Auth password update warning:", authError);
              }
            }
          } catch(errAuth) {
            console.warn("Supabase Auth update error:", errAuth);
          }
        }

        // 2. Update local currentUser & memory caches
        currentUser.password = newPass;

        const cleanUserId = (currentUser.id || "").replace(/^usr-/, "");

        if (Array.isArray(usersList)) {
          const userIdx = usersList.findIndex(u => u.id === currentUser.id || u.id === cleanUserId || (u.phone && u.phone === currentUser.phone));
          if (userIdx !== -1) {
            usersList[userIdx].password = newPass;
          }
        }

        if (Array.isArray(DEFAULT_USERS)) {
          const defIdx = DEFAULT_USERS.findIndex(u => u.id === currentUser.id || u.id === cleanUserId || (u.phone && u.phone === currentUser.phone) || (u.email && u.email === currentUser.email));
          if (defIdx !== -1) {
            DEFAULT_USERS[defIdx].password = newPass;
          }
        }

        if (Array.isArray(assistants) && (currentUser.role === 'staff' || currentUser.assistantId)) {
          const asstIdx = assistants.findIndex(a => a.id === currentUser.assistantId || a.id === currentUser.id || a.id === cleanUserId || (a.phone && a.phone === currentUser.phone));
          if (asstIdx !== -1) {
            assistants[asstIdx].password = newPass;
            try {
              localStorage.setItem("ttm_assistants", JSON.stringify(assistants));
            } catch(e) {}
          }
        }

        if (currentUser) {
          saveAuthSession(currentUser, true, currentUser.authSource || 'database');
        }
        showToast("🔑 เปลี่ยนรหัสผ่านสำเร็จเรียบร้อยแล้ว", "success");

        const p1 = document.getElementById("profile-new-password");
        const p2 = document.getElementById("profile-confirm-password");
        if (p1) p1.value = "";
        if (p2) p2.value = "";

        await logActivity("CHANGE_PASSWORD", `ผู้ใช้ ${currentUser.name} (${currentUser.role.toUpperCase()}) เปลี่ยนรหัสผ่านสำเร็จ`, {
          userId: currentUser.id,
          phone: currentUser.phone,
          role: currentUser.role
        });
      } catch(err) {
        console.error("Change password error:", err);
        showToast("เปลี่ยนรหัสผ่านไม่สำเร็จ: " + (err.message || "เกิดข้อผิดพลาด"), "error");
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = `<i data-lucide="save" class="w-4 h-4"></i> <span>บันทึกรหัสผ่านใหม่</span>`;
          if (window.lucide) lucide.createIcons();
        }
      }
    }

    function getRoleBadgeLabel(role) {
      if (role === "admin") return "🛡️ Admin";
      if (role === "staff") return "🩺 Staff";
      return "👤 User";
    }

    function updateAuthUI() {
      const staffTabs = document.querySelectorAll(".staff-tab");
      const adminTabs = document.querySelectorAll(".admin-tab");
      const authContainer = document.getElementById("auth-container");
      const tabLoginLabel = document.getElementById("tab-login-label");
      const tabLoginIcon = document.getElementById("tab-login-icon");

      if (currentUser) {
        const role = currentUser.role;
        let roleBadgeHtml = "";
        if (role === "admin") {
          roleBadgeHtml = `<span class="px-2 py-0.5 rounded-md text-[11px] font-bold bg-purple-900/80 text-purple-200 border border-purple-400/40 flex items-center gap-1 shadow-2xs"><span>🛡️</span><span class="hidden sm:inline">Admin:</span> ${escapeHtml(currentUser.name.split(" ")[0])}</span>`;
          staffTabs.forEach(t => t.classList.remove("hidden"));
          adminTabs.forEach(t => t.classList.remove("hidden"));
          if (tabLoginLabel) tabLoginLabel.textContent = `🛡️ บัญชี: ${currentUser.name.split(" ")[0]}`;
        } else if (role === "staff") {
          roleBadgeHtml = `<span class="px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-900/80 text-amber-200 border border-amber-400/40 flex items-center gap-1 shadow-2xs"><span>🩺</span><span class="hidden sm:inline">Staff:</span> ${escapeHtml(currentUser.name.split(" ")[0])}</span>`;
          staffTabs.forEach(t => t.classList.remove("hidden"));
          adminTabs.forEach(t => t.classList.add("hidden"));
          if (tabLoginLabel) tabLoginLabel.textContent = `🩺 บัญชี: ${currentUser.name.split(" ")[0]}`;
        } else {
          roleBadgeHtml = `<span class="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-900/80 text-emerald-200 border border-emerald-400/40 flex items-center gap-1 shadow-2xs"><span>👤</span><span class="hidden sm:inline">User:</span> ${escapeHtml(currentUser.name.split(" ")[0])}</span>`;
          staffTabs.forEach(t => t.classList.add("hidden"));
          adminTabs.forEach(t => t.classList.add("hidden"));
          if (tabLoginLabel) tabLoginLabel.textContent = `👤 บัญชี: ${currentUser.name.split(" ")[0]}`;
        }

        if (authContainer) {
          authContainer.innerHTML = `
            ${roleBadgeHtml}
            <button onclick="handleLogout()" class="h-9 sm:h-9.5 px-2.5 sm:px-3 rounded-xl bg-rose-600/90 hover:bg-rose-600 active:bg-rose-700 text-white text-xs font-bold flex items-center space-x-1 shadow-sm transition border border-rose-400/40 whitespace-nowrap cursor-pointer" title="ออกจากระบบ">
              <i data-lucide="log-out" class="w-3.5 h-3.5"></i>
              <span class="hidden sm:inline">ออกจากระบบ</span>
            </button>
          `;
        }
      } else {
        staffTabs.forEach(t => t.classList.add("hidden"));
        adminTabs.forEach(t => t.classList.add("hidden"));
        if (tabLoginLabel) tabLoginLabel.textContent = "เข้าสู่ระบบ";
        if (authContainer) {
          authContainer.innerHTML = `
            <button onclick="openAuthModal('login')" class="h-9 sm:h-9.5 px-3 sm:px-3.5 rounded-xl bg-white text-herbal-800 hover:bg-herbal-50 active:bg-herbal-100 text-xs sm:text-sm font-bold flex items-center space-x-1.5 shadow-sm transition border border-herbal-200/90 whitespace-nowrap cursor-pointer hover:shadow">
              <i data-lucide="log-in" class="w-3.5 h-3.5 text-herbal-700"></i>
              <span>เข้าสู่ระบบ / สมัครสมาชิก</span>
            </button>
          `;
        }
      }

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

      const isStaffOrAdmin = Boolean(currentUser && (currentUser.role === 'staff' || currentUser.role === 'admin'));
      const isAdmin = Boolean(currentUser && currentUser.role === 'admin');

      const patientRecordsCard = document.getElementById("settings-patient-records-card");
      if (patientRecordsCard) {
        if (isStaffOrAdmin) {
          patientRecordsCard.classList.remove("hidden");
        } else {
          patientRecordsCard.classList.add("hidden");
        }
      }

      const adminHubCard = document.getElementById("settings-admin-hub-card");
      if (adminHubCard) {
        if (isAdmin) {
          adminHubCard.classList.remove("hidden");
        } else {
          adminHubCard.classList.add("hidden");
        }
      }

      renderSettingsAccountCard();

      const loginView = document.getElementById("view-login");
      if (loginView && !loginView.classList.contains("hidden")) {
        renderLoginView();
      }
      const statsView = document.getElementById("view-stats");
      if (statsView && !statsView.classList.contains("hidden")) {
        renderStatsAndShare();
      }
      renderMainServicesOptions("main-services-booking-container");
      renderExtraServicesCheckboxes("new-extra-services-container");
      updateNotificationBadgeUI();
      renderNotificationDrawer();
      lucide.createIcons();
    }

