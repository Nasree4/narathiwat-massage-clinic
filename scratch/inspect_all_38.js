const supabaseUrl = "https://tqxmdvawxskpqteofqiq.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxeG1kdmF3eHNrcHF0ZW9mcWlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg5NDcwNzIsImV4cCI6MjEwNDUyMzA3Mn0.5g2nItoWExFdgiTGWCUcFP43X2hmFLJCpK6HSKsEWys";

async function run() {
  const asstsRes = await fetch(`${supabaseUrl}/rest/v1/assistants?select=*&order=created_at.asc`, {
    headers: {
      "apikey": supabaseKey,
      "Authorization": `Bearer ${supabaseKey}`
    }
  });
  const assts = await asstsRes.json();
  console.log(`Total count in database: ${assts.length}`);
  assts.forEach((a, i) => {
    console.log(`${i+1}. ID: ${a.id} | Nickname: "${a.nickname}" | Fullname: "${a.name}" | Phone: "${a.phone}"`);
  });
}
run();
