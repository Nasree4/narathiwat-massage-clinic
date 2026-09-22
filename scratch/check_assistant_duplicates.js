const supabaseUrl = "https://tqxmdvawxskpqteofqiq.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxeG1kdmF3eHNrcHF0ZW9mcWlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg5NDcwNzIsImV4cCI6MjEwNDUyMzA3Mn0.5g2nItoWExFdgiTGWCUcFP43X2hmFLJCpK6HSKsEWys";

async function checkDuplicates() {
  const asstsRes = await fetch(`${supabaseUrl}/rest/v1/assistants?select=*&order=created_at.asc`, {
    headers: { "apikey": supabaseKey, "Authorization": `Bearer ${supabaseKey}` }
  });
  const assts = await asstsRes.json();
  
  const phoneMap = {};
  const nameMap = {};
  const nickMap = {};

  assts.forEach((a, i) => {
    const p = (a.phone || "").replace(/[^0-9]/g, '');
    const n = (a.name || "").trim();
    const k = (a.nickname || "").trim();

    if (p) {
      if (!phoneMap[p]) phoneMap[p] = [];
      phoneMap[p].push({ idx: i+1, id: a.id, name: n, nick: k });
    }
    if (n) {
      if (!nameMap[n]) nameMap[n] = [];
      nameMap[n].push({ idx: i+1, id: a.id, name: n, nick: k });
    }
    if (k) {
      if (!nickMap[k]) nickMap[k] = [];
      nickMap[k].push({ idx: i+1, id: a.id, name: n, nick: k });
    }
  });

  console.log("=== CHECKING DUPLICATE PHONES ===");
  Object.keys(phoneMap).forEach(p => {
    if (phoneMap[p].length > 1) {
      console.log(`Phone ${p} is used by ${phoneMap[p].length} entries:`, phoneMap[p]);
    }
  });

  console.log("\n=== CHECKING DUPLICATE FULLNAMES ===");
  Object.keys(nameMap).forEach(n => {
    if (nameMap[n].length > 1) {
      console.log(`Name "${n}" is used by ${nameMap[n].length} entries:`, nameMap[n]);
    }
  });

  console.log("\n=== CHECKING DUPLICATE NICKNAMES ===");
  Object.keys(nickMap).forEach(k => {
    if (nickMap[k].length > 1) {
      console.log(`Nickname "${k}" is used by ${nickMap[k].length} entries:`, nickMap[k]);
    }
  });

  console.log("\n=== ALL 38 UNIQUE ASSISTANT PROFILES ===");
  assts.forEach((a, i) => {
    console.log(`${i+1}. [${a.nickname}] ${a.name} (โทร: ${a.phone})`);
  });
}

checkDuplicates();
