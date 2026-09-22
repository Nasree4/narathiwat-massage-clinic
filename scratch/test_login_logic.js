const fs = require('fs');
const vm = require('vm');

console.log("=== RUNNING UNIT TESTS FOR LOGIN LOGIC (v5.1.9) ===");

const indexHtml = fs.readFileSync('index.html', 'utf8');

// Match the main app script
const scriptMatches = indexHtml.match(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/gi);
if (!scriptMatches || scriptMatches.length < 2) throw new Error("Main script not found in index.html");

const scriptCode = scriptMatches[1].replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '');

let toastMsg = "";
let navigationTab = "";

const createMockEl = () => ({
  value: "",
  checked: true,
  classList: { add: () => {}, remove: () => {}, contains: () => false, toggle: () => {} },
  textContent: "",
  innerHTML: "",
  focus: () => {},
  appendChild: () => {},
  setAttribute: () => {},
  getAttribute: () => null,
  addEventListener: () => {}
});

const sandbox = {
  localStorage: {
    _data: {},
    getItem(k) { return this._data[k] || null; },
    setItem(k, v) { this._data[k] = String(v); },
    removeItem(k) { delete this._data[k]; }
  },
  sessionStorage: {
    _data: {},
    getItem(k) { return this._data[k] || null; },
    setItem(k, v) { this._data[k] = String(v); },
    removeItem(k) { delete this._data[k]; }
  },
  console: console,
  document: {
    getElementById(id) {
      return createMockEl();
    },
    createElement(tag) {
      return createMockEl();
    },
    querySelectorAll: () => [],
    addEventListener: () => {},
    removeEventListener: () => {},
    body: createMockEl(),
    documentElement: { scrollTop: 0, scrollLeft: 0 }
  },
  window: {
    addEventListener: () => {},
    removeEventListener: () => {},
    scrollY: 0,
    scrollX: 0,
    matchMedia: () => ({ matches: false, addEventListener: () => {} })
  },
  navigator: { onLine: true, userAgent: "NodeTest" },
  Date: Date,
  Math: Math,
  Array: Array,
  Set: Set,
  Map: Map,
  JSON: JSON,
  setTimeout: () => {},
  setInterval: () => {},
  showToast: (msg, type) => { toastMsg = msg; },
  logActivity: async () => {},
  closeAuthModal: () => {},
  updateAuthUI: () => {},
  renderLoginView: () => {},
  navigateDefaultTabForUser: (u) => { navigationTab = u.role; },
  getRoleBadgeLabel: (r) => r,
  lucide: { createIcons: () => {} }
};

vm.createContext(sandbox);

// Execute the code
vm.runInContext(scriptCode, sandbox);

// Run tests
async function runTests() {
  // Test 1: Admin Quick Login
  sandbox.document.getElementById = (id) => {
    const el = createMockEl();
    if (id === 'login-identifier') el.value = 'admin';
    if (id === 'login-password') el.value = 'admin';
    if (id === 'login-remember') el.checked = true;
    return el;
  };
  await vm.runInContext('handleLoginSubmit(null, "modal")', sandbox);
  const user1 = vm.runInContext('currentUser', sandbox);
  if (!user1 || user1.role !== 'admin') {
    throw new Error("Login with 'admin'/'admin' failed! currentUser: " + JSON.stringify(user1));
  }
  console.log("✓ Test 1 Passed: Login with 'admin'/'admin' logged in as Admin:", user1.name);

  // Test 2: Staff Quick Login
  sandbox.document.getElementById = (id) => {
    const el = createMockEl();
    if (id === 'login-identifier') el.value = 'staff';
    if (id === 'login-password') el.value = 'staff';
    if (id === 'login-remember') el.checked = true;
    return el;
  };
  await vm.runInContext('handleLoginSubmit(null, "modal")', sandbox);
  const user2 = vm.runInContext('currentUser', sandbox);
  if (!user2 || user2.role !== 'staff') {
    throw new Error("Login with 'staff'/'staff' failed! currentUser: " + JSON.stringify(user2));
  }
  console.log("✓ Test 2 Passed: Login with 'staff'/'staff' logged in as Staff:", user2.name);

  // Test 3: User Quick Login
  sandbox.document.getElementById = (id) => {
    const el = createMockEl();
    if (id === 'login-identifier') el.value = 'user';
    if (id === 'login-password') el.value = 'user';
    if (id === 'login-remember') el.checked = true;
    return el;
  };
  await vm.runInContext('handleLoginSubmit(null, "modal")', sandbox);
  const user3 = vm.runInContext('currentUser', sandbox);
  if (!user3 || user3.role !== 'user') {
    throw new Error("Login with 'user'/'user' failed! currentUser: " + JSON.stringify(user3));
  }
  console.log("✓ Test 3 Passed: Login with 'user'/'user' logged in as User:", user3.name);

  // Test 4: Assistant Nickname ('นัสรีน', '1234')
  sandbox.document.getElementById = (id) => {
    const el = createMockEl();
    if (id === 'login-identifier') el.value = 'นัสรีน';
    if (id === 'login-password') el.value = '1234';
    if (id === 'login-remember') el.checked = true;
    return el;
  };
  await vm.runInContext('handleLoginSubmit(null, "modal")', sandbox);
  const user4 = vm.runInContext('currentUser', sandbox);
  if (!user4 || user4.role !== 'staff' || !user4.name.includes('นัสรีน')) {
    throw new Error("Login with assistant nickname failed! currentUser: " + JSON.stringify(user4));
  }
  console.log("✓ Test 4 Passed: Login with assistant nickname 'นัสรีน' logged in successfully:", user4.name);

  // Test 5: Admin with Phone '0800000001' and password 'admin1234'
  sandbox.document.getElementById = (id) => {
    const el = createMockEl();
    if (id === 'login-identifier') el.value = '0800000001';
    if (id === 'login-password') el.value = 'admin1234';
    if (id === 'login-remember') el.checked = true;
    return el;
  };
  await vm.runInContext('handleLoginSubmit(null, "modal")', sandbox);
  const user5 = vm.runInContext('currentUser', sandbox);
  if (!user5 || user5.role !== 'admin') {
    throw new Error("Login with phone '0800000001' failed!");
  }
  console.log("✓ Test 5 Passed: Login with phone '0800000001' / 'admin1234' logged in as Admin:", user5.name);

  // Test 6: Quick login helper function (fillQuickLogin)
  await vm.runInContext('fillQuickLogin("admin", "modal")', sandbox);
  const user6 = vm.runInContext('currentUser', sandbox);
  if (!user6 || user6.role !== 'admin') {
    throw new Error("fillQuickLogin('admin') failed!");
  }
  console.log("✓ Test 6 Passed: fillQuickLogin('admin') works seamlessly:", user6.name);

  console.log("\n=================================================");
  console.log("ALL LOGIN TESTS COMPLETED SUCCESSFULLY (100% PASS)");
  console.log("=================================================");
}

runTests().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
