const supabaseUrl = "https://tqxmdvawxskpqteofqiq.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxeG1kdmF3eHNrcHF0ZW9mcWlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg5NDcwNzIsImV4cCI6MjEwNDUyMzA3Mn0.5g2nItoWExFdgiTGWCUcFP43X2hmFLJCpK6HSKsEWys";

async function checkDatabase() {
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log("\n1. Querying public.assistants table...");
  const { data: assts, error: asstErr } = await supabase.from('assistants').select('*').order('created_at', { ascending: true });
  if (asstErr) {
    console.error("Assistants table error:", asstErr);
  } else {
    console.log(`Found ${assts.length} assistants in public.assistants table:`);
    assts.forEach((a, idx) => {
      console.log(`${idx + 1}. [${a.id}] "${a.nickname}" (${a.name}) - Phone: ${a.phone} - Role: ${a.role}`);
    });
  }

  console.log("\n2. Querying slot_configs (config_assistants_master)...");
  const { data: configs, error: confErr } = await supabase.from('slot_configs').select('*').eq('id', 'config_assistants_master');
  if (confErr) {
    console.error("slot_configs error:", confErr);
  } else if (configs && configs.length > 0) {
    const list = configs[0].slots_json;
    console.log(`Found master list in slot_configs with ${list ? list.length : 0} items:`);
    if (Array.isArray(list)) {
      list.forEach((a, idx) => {
        console.log(`${idx + 1}. [${a.id}] "${a.nickname}" (${a.name}) - Shift: ${a.shiftType}`);
      });
    }
  } else {
    console.log("No config_assistants_master found in slot_configs");
  }

  console.log("\n3. Querying slot_configs for roster...");
  const { data: rosters } = await supabase.from('slot_configs').select('*').eq('scope', 'roster');
  if (rosters && rosters.length > 0) {
    console.log(`Found ${rosters.length} roster days:`);
    rosters.forEach(r => {
      console.log(`Date ${r.config_key}:`, Object.keys(r.slots_json || {}));
    });
  }
}

checkDatabase().catch(err => console.error(err));
