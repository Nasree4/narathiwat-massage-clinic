const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log("🧪 Running Assistant Booking Conflict Engine & Duplicate Prevention Test Suite...");

// Read combined index.html or bundled scripts
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

// Extract script tag content
const scriptMatch = html.match(/<script\b[^>]*>([\s\S]*?)<\/script>/gi);
const jsCode = scriptMatch.map(s => s.replace(/<\/?script\b[^>]*>/gi, '')).join('\n');

// Set up mock browser environment
const domMock = {
  document: {
    getElementById: (id) => ({
      value: "",
      textContent: "",
      innerHTML: "",
      classList: {
        add: () => {},
        remove: () => {},
        contains: () => false,
        toggle: () => {}
      },
      querySelectorAll: () => [],
      querySelector: () => null,
      appendChild: () => {},
      focus: () => {}
    }),
    querySelectorAll: () => [],
    querySelector: () => null,
    createElement: (tag) => ({
      tagName: tag,
      value: "",
      textContent: "",
      innerHTML: "",
      classList: {
        add: () => {},
        remove: () => {},
        contains: () => false,
        toggle: () => {}
      },
      appendChild: () => {},
      setAttribute: () => {},
      style: {}
    }),
    addEventListener: () => {}
  },
  window: {
    addEventListener: () => {},
    localStorage: {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {}
    }
  },
  localStorage: {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {}
  },
  sessionStorage: {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {}
  },
  location: {
    href: "http://localhost:3000",
    search: "",
    hash: ""
  },
  navigator: {
    userAgent: "node",
    onLine: true
  },
  tailwind: { config: {} },
  lucide: { createIcons: () => {} },
  console: console,
  setTimeout: (fn) => fn(),
  clearTimeout: () => {},
  setInterval: () => {},
  clearInterval: () => {},
  Date: Date,
  Math: Math,
  JSON: JSON,
  Array: Array,
  Object: Object,
  String: String,
  Number: Number,
  Boolean: Boolean
};

const context = vm.createContext(domMock);
vm.runInContext(jsCode, context);

// Test Cases
let passed = 0;
let total = 0;

function assert(condition, name) {
  total++;
  if (condition) {
    console.log(`  ✅ [PASS] ${name}`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] ${name}`);
    process.exitCode = 1;
  }
}

// 1. Setup mock assistants and appointments inside the VM context
context.vmRun = (code) => vm.runInContext(code, context);

context.vmRun(`
  assistants = [
    { id: "asst-1", name: "น.ส. นัสรีน ดือราแม", nickname: "นัสรีน", gender: "หญิง", active: true, shiftType: "official" },
    { id: "asst-2", name: "น.ส. มีนี สาและ", nickname: "มีนี", gender: "หญิง", active: true, shiftType: "ot" },
    { id: "asst-3", name: "นาย เลาะห์ มามุ", nickname: "เลาะห์", gender: "ชาย", active: true, shiftType: "full" },
    { id: "asst-4", name: "น.ส. ลาเวร พักผ่อน", nickname: "ลาเวร", gender: "หญิง", active: true, shiftType: "off" }
  ];

  appointments = [
    {
      id: "APT-001",
      patientName: "สมชาย รักษาดี",
      bookDate: "2026-09-25",
      timeSlot: "08:00",
      slotsOccupied: ["08:00"],
      assistantId: "asst-1",
      assistantNick: "นัสรีน",
      status: "🟢 รอดำเนินการ"
    },
    {
      id: "APT-002",
      patientName: "สมศรี มั่งมี",
      bookDate: "2026-09-25",
      timeSlot: "10:00",
      slotsOccupied: ["10:00", "11:00"],
      assistantId: "asst-3",
      assistantNick: "เลาะห์",
      status: "🟢 รอดำเนินการ"
    }
  ];
`);

// Test 1: Direct duplicate collision detection
const res1 = context.checkAssistantBookingConflict({
  assistantId: "asst-1",
  bookDate: "2026-09-25",
  timeSlot: "08:00"
});
assert(res1.hasConflict === true && res1.type === "collision", "Detects direct duplicate booking collision on same slot");

// Test 2: Free slot on same assistant
const res2 = context.checkAssistantBookingConflict({
  assistantId: "asst-1",
  bookDate: "2026-09-25",
  timeSlot: "09:00"
});
assert(res2.hasConflict === false, "Allows booking when assistant is free and on duty");

// Test 3: Multi-slot overlap collision (2-hour appointment overlap on 2nd slot 11:00)
const res3 = context.checkAssistantBookingConflict({
  assistantId: "asst-3",
  bookDate: "2026-09-25",
  timeSlot: "11:00"
});
assert(res3.hasConflict === true && res3.type === "collision", "Detects collision overlapping 2nd hour of 2-slot appointment");

// Test 4: Multi-slot requested overlapping existing appointment
const res4 = context.checkAssistantBookingConflict({
  assistantId: "asst-1",
  bookDate: "2026-09-25",
  timeSlot: "08:00",
  slotsOccupied: ["08:00", "09:00"]
});
assert(res4.hasConflict === true && res4.type === "collision", "Detects multi-slot request overlapping booked slot");

// Test 5: Self-exclusion when rescheduling existing appointment
const res5 = context.checkAssistantBookingConflict({
  assistantId: "asst-1",
  bookDate: "2026-09-25",
  timeSlot: "08:00",
  excludeAppointmentId: "APT-001"
});
assert(res5.hasConflict === false, "Allows self-matching when excludeAppointmentId is provided (rescheduling same slot)");

// Test 6: Active assistants are available across slots when on duty and not on leave or busy
const res6 = context.checkAssistantBookingConflict({
  assistantId: "asst-2",
  bookDate: "2026-09-25",
  timeSlot: "17:00"
});
assert(res6.hasConflict === false, "Allows active non-leave assistant on duty to be booked");

// Test 7: Leave / off-duty assistant blocking
context.vmRun(`
  assistantLeaves = [
    {
      id: "leave-test-1",
      assistantId: "asst-1",
      leaveType: "vacation",
      startDate: "2026-09-26",
      endDate: "2026-09-27",
      dates: ["2026-09-26", "2026-09-27"]
    }
  ];
`);
const res7a = context.checkAssistantBookingConflict({
  assistantId: "asst-4",
  bookDate: "2026-09-25",
  timeSlot: "09:00"
});
const res7b = context.checkAssistantBookingConflict({
  assistantId: "asst-1",
  bookDate: "2026-09-26",
  timeSlot: "09:00"
});
assert(res7a.hasConflict === true && (res7a.type === "leave" || res7a.type === "off_shift") &&
       res7b.hasConflict === true && res7b.type === "leave", "Blocks appointment when assistant is on leave or off-duty");

// Test 8: Inactive assistant
context.vmRun(`assistants.push({ id: "asst-inactive", name: "อดีตหมอ", nickname: "อดีตหมอ", active: false, shiftType: "full" });`);
const res8 = context.checkAssistantBookingConflict({
  assistantId: "asst-inactive",
  bookDate: "2026-09-25",
  timeSlot: "09:00"
});
assert(res8.hasConflict === true && res8.type === "inactive", "Blocks booking for inactive assistant");

// Test 9 & 10: Roster Matrix specific duty slots synchronization
context.vmRun(`
  assistantDutyRosters = {
    "2026-09-28": {
      "asst-3": {
        shiftType: "custom",
        slots: ["15:00", "16:00", "17:00", "18:00", "19:00"]
      }
    }
  };
`);

const res9 = context.checkAssistantBookingConflict({
  assistantId: "asst-3",
  bookDate: "2026-09-28",
  timeSlot: "08:00"
});
assert(res9.hasConflict === true && res9.type === "off_shift", "Blocks booking when assistant is not checked on duty for specific slot in Roster Matrix");

const res10 = context.checkAssistantBookingConflict({
  assistantId: "asst-3",
  bookDate: "2026-09-28",
  timeSlot: "15:00"
});
assert(res10.hasConflict === false, "Allows booking when assistant is checked on duty for specific slot in Roster Matrix");

console.log(`\n🏁 Test Results: ${passed} / ${total} passed (${passed === total ? '100% SUCCESS' : 'FAILURES DETECTED'})`);


