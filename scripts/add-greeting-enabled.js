import pg from 'pg';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;

if (!connectionString) {
  console.error('POSTGRES_URL / DATABASE_URL is not set');
  process.exit(1);
}

const client = new pg.Client({ connectionString });

async function run() {
  await client.connect();
  console.log('Connected to database');

  try {
    await client.query(
      `ALTER TABLE public.chatbot_configs ADD COLUMN IF NOT EXISTS greeting_enabled BOOLEAN DEFAULT true`
    );
    console.log('OK: Added greeting_enabled column');
  } catch (err) {
    console.error('Error:', err.message);
  }

  await client.end();
  console.log('Migration complete');
}

run().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
