const supabaseUrl = "https://tqxmdvawxskpqteofqiq.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxeG1kdmF3eHNrcHF0ZW9mcWlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg5NDcwNzIsImV4cCI6MjEwNDUyMzA3Mn0.5g2nItoWExFdgiTGWCUcFP43X2hmFLJCpK6HSKsEWys";

async function query() {
  console.log("1. Fetching public.assistants from Supabase REST...");
  const asstsRes = await fetch(`${supabaseUrl}/rest/v1/assistants?select=*&order=created_at.asc`, {
    headers: {
      "apikey": supabaseKey,
      "Authorization": `Bearer ${supabaseKey}`
    }
  });
  const assts = await asstsRes.json();
  console.log(`Found ${Array.isArray(assts) ? assts.length : 0} assistants:`);
  if (Array.isArray(assts)) {
    assts.forEach((a, idx) => {
      console.log(`${idx + 1}. ID: ${a.id} | Nick: "${a.nickname}" | Name: "${a.name}" | Phone: "${a.phone}"`);
    });
  } else {
    console.log("Response:", assts);
  }

  console.log("\n2. Fetching slot_configs from Supabase REST...");
  const confRes = await fetch(`${supabaseUrl}/rest/v1/slot_configs?select=*`, {
    headers: {
      "apikey": supabaseKey,
      "Authorization": `Bearer ${supabaseKey}`
    }
  });
  const configs = await confRes.json();
  console.log(`Found ${Array.isArray(configs) ? configs.length : 0} configs:`);
  if (Array.isArray(configs)) {
    configs.forEach(c => {
      console.log(`- Scope: ${c.scope} | Key: ${c.config_key} | ID: ${c.id}`);
      if (c.id === "config_assistants_master") {
        console.log(`  Master assistants (${c.slots_json ? c.slots_json.length : 0}):`);
        (c.slots_json || []).forEach((a, idx) => {
          console.log(`    ${idx + 1}. [${a.id}] "${a.nickname}" (${a.name})`);
        });
      }
    });
  }
}

query().catch(err => console.error(err));
