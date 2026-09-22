const fs = require('fs');
const vm = require('vm');

let html = fs.readFileSync('index.html', 'utf8');

// Backup original
fs.writeFileSync('index.html.bak', html);

console.log('Original index.html read successfully, length:', html.length);

// 1. Update Subtab button label in Manage Settings
// From: 👥 จัดตารางเวรผู้ช่วยฯ
// To: 💆‍♂️ ประวัติการนวด & ผู้ช่วยฯ
html = html.replace(
  `<button onclick="switchManageSubTab('shifts')" id="subtab-btn-shifts" class="manage-subtab-btn px-4 py-2 border-b-2 border-transparent text-slate-600 hover:text-slate-800 whitespace-nowrap">\n            👥 จัดตารางเวรผู้ช่วยฯ\n          </button>`,
  `<button onclick="switchManageSubTab('shifts')" id="subtab-btn-shifts" class="manage-subtab-btn px-4 py-2 border-b-2 border-transparent text-slate-600 hover:text-slate-800 whitespace-nowrap">\n            💆‍♂️ ประวัติการนวด & ผู้ช่วยฯ\n          </button>`
);

// 2. Update Header Banner in #subtab-shifts
const oldBannerRegex = /<h4 class="text-sm sm:text-base font-bold text-herbal-950 flex items-center gap-2">[\s\S]*?<span>กำหนดตารางเวรและจัดการผู้ช่วยแพทย์แผนไทย<\/span>[\s\S]*?<\/h4>[\s\S]*?<p class="text-xs text-herbal-800\/80">จัดเวรปฏิบัติงาน \(เข้าเวร\/ลาเวร\), แก้ไขข้อมูลติดต่อ, กำหนดสิทธิ์ระบบ และดูรายงานตารางเวรในหลากหลายมุมมอง<\/p>/;

const newBanner = `<h4 class="text-sm sm:text-base font-bold text-herbal-950 flex items-center gap-2">
                <i data-lucide="award" class="w-5 h-5 text-herbal-700"></i>
                <span>จัดการประวัติการนวดและรายชื่อผู้ช่วยแพทย์แผนไทย</span>
              </h4>
              <p class="text-xs text-herbal-800/80">แสดงรายชื่อผู้ช่วยแบบกระชับ สบายตา (คลิกที่ชื่อผู้ช่วยเพื่อเปิดดูประวัติการนวด สถิติเคส จัดตารางเวร และแก้ไขข้อมูล)</p>`;

html = html.replace(oldBannerRegex, newBanner);

// 3. Update Metric Badges in #subtab-shifts (change OT stat into today's massage cases stat)
html = html.replace(
  `<div class="text-[11px] text-purple-700 dark:text-purple-300 font-semibold">นอกเวลา/OT (17-19น.)</div>\n                <div class="text-base font-black text-purple-800 dark:text-purple-200" id="asst-stat-ot">0 <span class="text-[11px] font-normal text-purple-500">คน</span></div>`,
  `<div class="text-[11px] text-purple-700 dark:text-purple-300 font-semibold">เคสนวดวันนี้</div>\n                <div class="text-base font-black text-purple-800 dark:text-purple-200" id="asst-stat-ot">0 <span class="text-[11px] font-normal text-purple-500">เคส</span></div>`
);

// 4. Update Version Badge
html = html.replace(/v5\.2\.0/g, 'v5.2.1');
html = html.replace(/ttm-clinic-cache-v127/g, 'ttm-clinic-cache-v128');

// 5. Add Modal #modal-assistant-detail before #modal-edit-assistant
const modalHtml = `
  <!-- 3.0 Assistant Detail, Massage History & Management Modal -->
  <div id="modal-assistant-detail" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm hidden p-2 sm:p-4 overflow-y-auto">
    <div class="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 w-full max-w-2xl shadow-2xl border border-slate-200 dark:border-slate-800 my-auto text-slate-800 dark:text-slate-100 flex flex-col max-h-[92vh]">
      
      <!-- Modal Header: Assistant Profile Banner -->
      <div class="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4 shrink-0">
        <div class="flex items-center space-x-3.5 min-w-0">
          <div id="asst-detail-avatar-container">
            <!-- Populated via JS -->
          </div>
          <div class="min-w-0">
            <div class="flex items-center space-x-2 flex-wrap">
              <h3 id="asst-detail-fullname" class="font-bold text-slate-900 dark:text-white text-base sm:text-lg truncate">ชื่อผู้ช่วย</h3>
              <span id="asst-detail-nickname-badge" class="px-2 py-0.5 rounded-lg text-xs font-bold bg-herbal-100 text-herbal-800 dark:bg-emerald-950 dark:text-emerald-300">ชื่อเล่น</span>
              <span id="asst-detail-role-badge" class="px-2 py-0.5 rounded-lg text-[10.5px] font-bold border">Role</span>
            </div>
            <div class="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
              <span id="asst-detail-phone" class="font-mono flex items-center gap-1"><i data-lucide="phone" class="w-3 h-3"></i> 08x-xxx-xxxx</span>
              <span>•</span>
              <span id="asst-detail-gender">เพศหญิง</span>
              <span>•</span>
              <span id="asst-detail-duty-badge" class="font-semibold text-emerald-600">🟢 เข้าเวรวันนี้</span>
            </div>
          </div>
        </div>
        <button type="button" onclick="closeAssistantDetailModal()" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer">
          <i data-lucide="x" class="w-5 h-5"></i>
        </button>
      </div>

      <!-- Navigation Tabs inside Modal -->
      <div class="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pt-3 pb-1 overflow-x-auto no-scrollbar shrink-0 text-xs font-bold">
        <button type="button" id="tab-btn-asst-history" onclick="switchAssistantDetailTab('history')" class="asst-detail-tab-btn px-3.5 py-2 border-b-2 border-herbal-700 text-herbal-800 dark:text-emerald-400 whitespace-nowrap flex items-center space-x-1.5 cursor-pointer">
          <i data-lucide="history" class="w-4 h-4"></i>
          <span>ประวัติการนวด (<span id="asst-detail-cases-count">0</span>)</span>
        </button>
        <button type="button" id="tab-btn-asst-duty" onclick="switchAssistantDetailTab('duty')" class="asst-detail-tab-btn px-3.5 py-2 border-b-2 border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 whitespace-nowrap flex items-center space-x-1.5 cursor-pointer">
          <i data-lucide="calendar" class="w-4 h-4"></i>
          <span>จัดการตารางเวร & รอบเวลา</span>
        </button>
        <button type="button" id="tab-btn-asst-profile" onclick="switchAssistantDetailTab('profile')" class="asst-detail-tab-btn px-3.5 py-2 border-b-2 border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 whitespace-nowrap flex items-center space-x-1.5 cursor-pointer">
          <i data-lucide="user-cog" class="w-4 h-4"></i>
          <span>ข้อมูลส่วนตัว & สิทธิ์</span>
        </button>
      </div>

      <!-- Modal Body (Scrollable Content) -->
      <div class="flex-1 overflow-y-auto py-3 space-y-4 pr-1">
        
        <!-- Section 1: Massage History Tab -->
        <div id="asst-tab-history" class="asst-detail-tab-content space-y-3.5">
          <!-- Summary Metrics Cards -->
          <div class="grid grid-cols-3 gap-2.5">
            <div class="bg-herbal-50/70 dark:bg-emerald-950/40 p-3 rounded-2xl border border-herbal-200/80 dark:border-emerald-800/60 text-center">
              <div class="text-[11px] text-herbal-700 dark:text-emerald-300 font-semibold">วันนี้</div>
              <div class="text-base sm:text-lg font-black text-herbal-900 dark:text-emerald-100" id="asst-stat-history-today">0 <span class="text-xs font-normal">เคส</span></div>
            </div>
            <div class="bg-blue-50/70 dark:bg-blue-950/40 p-3 rounded-2xl border border-blue-200/80 dark:border-blue-800/60 text-center">
              <div class="text-[11px] text-blue-700 dark:text-blue-300 font-semibold">เดือนนี้</div>
              <div class="text-base sm:text-lg font-black text-blue-900 dark:text-blue-100" id="asst-stat-history-month">0 <span class="text-xs font-normal">เคส</span></div>
            </div>
            <div class="bg-purple-50/70 dark:bg-purple-950/40 p-3 rounded-2xl border border-purple-200/80 dark:border-purple-800/60 text-center">
              <div class="text-[11px] text-purple-700 dark:text-purple-300 font-semibold">ทั้งหมด</div>
              <div class="text-base sm:text-lg font-black text-purple-900 dark:text-purple-100" id="asst-stat-history-all">0 <span class="text-xs font-normal">เคส</span></div>
            </div>
          </div>

          <!-- History Filter Pills -->
          <div class="flex items-center justify-between gap-2 flex-wrap pt-1">
            <span class="text-xs font-bold text-slate-700 dark:text-slate-300">รายการประวัติการให้บริการ:</span>
            <div class="inline-flex rounded-xl p-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold">
              <button type="button" id="history-filter-btn-all" onclick="filterAssistantHistory('all')" class="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-2xs cursor-pointer">ทั้งหมด</button>
              <button type="button" id="history-filter-btn-today" onclick="filterAssistantHistory('today')" class="px-2.5 py-1 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 cursor-pointer">วันนี้</button>
              <button type="button" id="history-filter-btn-month" onclick="filterAssistantHistory('month')" class="px-2.5 py-1 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 cursor-pointer">เดือนนี้</button>
            </div>
          </div>

          <!-- History Table / Items -->
          <div id="asst-history-items-container" class="space-y-2">
            <!-- Populated via JS -->
          </div>
        </div>

        <!-- Section 2: Duty & Slots Tab -->
        <div id="asst-tab-duty" class="asst-detail-tab-content hidden space-y-4">
          <div class="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
            <h5 class="font-bold text-xs sm:text-sm text-slate-800 dark:text-white flex items-center gap-1.5">
              <i data-lucide="clock" class="w-4 h-4 text-herbal-700"></i>
              <span>ช่วงเวลาเวรปฏิบัติงาน (วันที่: <span id="asst-duty-current-date"></span>)</span>
            </h5>
            
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">เลือกรูปแบบเวร:</label>
                <select id="modal-asst-shift-type" onchange="onModalAssistantShiftChange(this.value)" class="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-herbal-500">
                  <option value="full">⭐ เข้าเวรทั้งวัน (08:00 - 19:00 น.)</option>
                  <option value="official">☀️ ในเวลาราชการ (08:00 - 16:00 น.)</option>
                  <option value="ot">🌙 นอกเวลาราชการ / OT (17:00 - 19:00 น.)</option>
                  <option value="custom">⚙️ กำหนดรอบเวลาเฉพาะ (Custom)</option>
                  <option value="off">⚪ ลาเวร / พัก (ไม่เข้าเวร)</option>
                </select>
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">เวลาเช็คชื่อเข้างาน (Check-in):</label>
                <input type="time" id="modal-asst-checkin-time" class="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-herbal-500">
              </div>
            </div>

            <!-- Slots Picker Grid -->
            <div id="modal-asst-slots-section" class="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-slate-700 dark:text-slate-300">รอบเวลาที่เปิดรับคิวนวด:</span>
                <div class="space-x-1.5 text-[11px]">
                  <button type="button" onclick="setAllModalAsstSlots(true)" class="text-herbal-700 dark:text-emerald-400 font-bold hover:underline cursor-pointer">เลือกทั้งหมด</button>
                  <span class="text-slate-300">|</span>
                  <button type="button" onclick="setAllModalAsstSlots(false)" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">ล้างทั้งหมด</button>
                </div>
              </div>
              <div id="modal-asst-slots-grid" class="grid grid-cols-3 sm:grid-cols-4 gap-2">
                <!-- Checkbox Pills Populated via JS -->
              </div>
            </div>

            <div class="pt-3 flex justify-end">
              <button type="button" onclick="saveAssistantShiftFromModal()" class="px-4 py-2 bg-herbal-700 hover:bg-herbal-600 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center space-x-1.5 cursor-pointer">
                <i data-lucide="save" class="w-3.5 h-3.5"></i>
                <span>บันทึกการจัดตารางเวร</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Section 3: Profile & Settings Tab -->
        <div id="asst-tab-profile" class="asst-detail-tab-content hidden space-y-3.5">
          <form onsubmit="handleAssistantProfileSubmitFromModal(event)" class="space-y-3.5 text-xs">
            <input type="hidden" id="modal-profile-asst-id">

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">ชื่อ-สกุล จริง <span class="text-rose-500">*</span></label>
                <input type="text" id="modal-profile-fullname" required class="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl outline-none bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-herbal-500">
              </div>
              <div>
                <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">ชื่อเล่น (แสดงบนคิว) <span class="text-rose-500">*</span></label>
                <input type="text" id="modal-profile-nickname" required class="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl outline-none bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-herbal-500">
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">เพศ</label>
                <select id="modal-profile-gender" class="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl outline-none bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-herbal-500">
                  <option value="female">👩 ผู้หญิง</option>
                  <option value="male">👨 ผู้ชาย</option>
                </select>
              </div>
              <div>
                <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">สิทธิ์การใช้งาน (Role)</label>
                <select id="modal-profile-role" class="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl outline-none bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-herbal-500 font-medium">
                  <option value="staff">🩺 Staff (เจ้าหน้าที่ / ผู้ช่วยฯ)</option>
                  <option value="admin">🛡️ Admin (ผู้ดูแลระบบ)</option>
                  <option value="user">👤 User (ผู้รับบริการ)</option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">เบอร์โทรศัพท์ (ใช้ล็อกอิน)</label>
                <input type="tel" id="modal-profile-phone" placeholder="08x-xxx-xxxx" class="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl outline-none bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-herbal-500">
              </div>
              <div>
                <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Email (ใช้ล็อกอิน)</label>
                <input type="email" id="modal-profile-email" placeholder="staff@ttm.clinic" class="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl outline-none bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-herbal-500">
              </div>
            </div>

            <div class="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
              <button type="button" onclick="deleteAssistantFromDetailModal()" class="px-3 py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl font-bold transition flex items-center space-x-1.5 cursor-pointer">
                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                <span>ลบผู้ช่วยท่านนี้</span>
              </button>
              <button type="submit" class="px-4 py-2 bg-herbal-700 hover:bg-herbal-600 text-white font-bold rounded-xl shadow-sm transition flex items-center space-x-1.5 cursor-pointer">
                <i data-lucide="check" class="w-3.5 h-3.5"></i>
                <span>บันทึกการแก้ไขข้อมูล</span>
              </button>
            </div>
          </form>
        </div>

      </div>

      <!-- Modal Footer -->
      <div class="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end shrink-0">
        <button type="button" onclick="closeAssistantDetailModal()" class="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition cursor-pointer">
          ปิดหน้าต่าง
        </button>
      </div>

    </div>
  </div>
`;

if (!html.includes('id="modal-assistant-detail"')) {
  html = html.replace('<!-- 3.1 Edit Assistant Modal -->', modalHtml + '\n  <!-- 3.1 Edit Assistant Modal -->');
}

fs.writeFileSync('index.html', html);
console.log('Step 1 complete: Modal HTML injected into index.html');
