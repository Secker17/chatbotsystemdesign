import pg from 'pg';
const { Client } = pg;

const client = new Client({ connectionString: process.env.POSTGRES_URL });
await client.connect();

const queries = [
  `ALTER TABLE public.chatbot_configs ADD COLUMN IF NOT EXISTS icon_style TEXT DEFAULT 'chat'`,
  `ALTER TABLE public.chat_sessions ADD COLUMN IF NOT EXISTS admin_is_typing BOOLEAN DEFAULT false`,
  `ALTER TABLE public.chat_sessions ADD COLUMN IF NOT EXISTS admin_typing_at TIMESTAMPTZ`,
];

for (const q of queries) {
  try {
    await client.query(q);
    console.log('OK:', q.slice(0, 60));
  } catch (err) {
    if (err.code === '42701') {
      console.log('Column already exists, skipping:', q.slice(0, 60));
    } else {
      console.error('Error:', err.message);
    }
  }
}

await client.end();
console.log('Migration complete');
