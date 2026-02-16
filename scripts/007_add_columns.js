const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function run() {
  console.log('Supabase URL:', SUPABASE_URL ? 'SET' : 'MISSING');
  console.log('Supabase Key:', SUPABASE_KEY ? 'SET (' + SUPABASE_KEY.substring(0,10) + '...)' : 'MISSING');

  // Check chatbot_configs columns
  const res = await fetch(`${SUPABASE_URL}/rest/v1/chatbot_configs?select=*&limit=1`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
    },
  });
  const data = await res.json();
  if (Array.isArray(data) && data.length > 0) {
    const cols = Object.keys(data[0]);
    console.log('chatbot_configs columns:', cols.join(', '));
    console.log('Has icon_style:', cols.includes('icon_style'));
  } else {
    console.log('chatbot_configs result:', JSON.stringify(data).substring(0, 200));
  }

  // Check chat_sessions columns
  const res2 = await fetch(`${SUPABASE_URL}/rest/v1/chat_sessions?select=*&limit=1`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
    },
  });
  const data2 = await res2.json();
  if (Array.isArray(data2) && data2.length > 0) {
    const cols2 = Object.keys(data2[0]);
    console.log('chat_sessions columns:', cols2.join(', '));
    console.log('Has admin_is_typing:', cols2.includes('admin_is_typing'));
  } else {
    console.log('chat_sessions result:', JSON.stringify(data2).substring(0, 200));
  }
}

run().catch(console.error);
