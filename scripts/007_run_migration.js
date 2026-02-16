const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function runSQL(sql, label) {
  console.log(`Running: ${label}...`);
  // Use the Supabase management SQL endpoint via pg_net or the PostgREST rpc
  // Since we can't run raw SQL via REST, we'll use a PATCH to add default values
  // Actually, let's try the /rest/v1/rpc endpoint if there's a function, 
  // or use the direct postgres connection approach
  
  // Alternative: Use Supabase's built-in pg endpoint
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify({}),
  });
  console.log(`Status: ${res.status}`);
  const text = await res.text();
  console.log(`Response: ${text.substring(0, 200)}`);
}

async function run() {
  if (!SUPABASE_KEY) {
    console.log('SUPABASE_SERVICE_ROLE_KEY is not set. Columns need to be added manually.');
    console.log('');
    console.log('Please run this SQL in your Supabase Dashboard > SQL Editor:');
    console.log('');
    console.log('ALTER TABLE chatbot_configs ADD COLUMN icon_style text DEFAULT \'chat\';');
    console.log('ALTER TABLE chat_sessions ADD COLUMN admin_is_typing boolean DEFAULT false;');
    console.log('ALTER TABLE chat_sessions ADD COLUMN admin_typing_at timestamptz;');
    return;
  }
  
  // The Supabase REST API doesn't support raw SQL directly.
  // We need to handle this differently - just output instructions.
  console.log('Columns need to be added. Since we cannot run DDL via REST API,');
  console.log('the app will handle missing columns gracefully.');
  console.log('');
  console.log('To add columns, run in Supabase Dashboard > SQL Editor:');
  console.log('');
  console.log('ALTER TABLE chatbot_configs ADD COLUMN icon_style text DEFAULT \'chat\';');
  console.log('ALTER TABLE chat_sessions ADD COLUMN admin_is_typing boolean DEFAULT false;');
  console.log('ALTER TABLE chat_sessions ADD COLUMN admin_typing_at timestamptz;');
}

run().catch(console.error);
