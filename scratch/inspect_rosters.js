const supabaseUrl = "https://tqxmdvawxskpqteofqiq.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxeG1kdmF3eHNrcHF0ZW9mcWlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg5NDcwNzIsImV4cCI6MjEwNDUyMzA3Mn0.5g2nItoWExFdgiTGWCUcFP43X2hmFLJCpK6HSKsEWys";

async function run() {
  const res = await fetch(`${supabaseUrl}/rest/v1/slot_configs?scope=eq.roster&select=*`, {
    headers: { "apikey": supabaseKey, "Authorization": `Bearer ${supabaseKey}` }
  });
  const data = await res.json();
  console.log(`Found ${data.length} roster entries:`);
  data.forEach(r => {
    console.log(`Date: ${r.config_key}`);
    console.log(JSON.stringify(r.slots_json, null, 2).slice(0, 500));
    console.log('---------------------------------');
  });
}
run();
