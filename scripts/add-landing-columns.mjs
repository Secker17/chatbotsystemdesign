import pg from 'pg';

const connectionString = process.env.POSTGRES_URL;

if (!connectionString) {
  console.error('POSTGRES_URL is not set');
  process.exit(1);
}

const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });

async function run() {
  await client.connect();
  console.log('Connected to database');

  const statements = [
    `ALTER TABLE public.chatbot_configs ADD COLUMN IF NOT EXISTS is_landing_widget BOOLEAN DEFAULT false`,
    `ALTER TABLE public.chatbot_configs ADD COLUMN IF NOT EXISTS landing_widget_enabled BOOLEAN DEFAULT true`,
    `ALTER TABLE public.chatbot_configs ADD COLUMN IF NOT EXISTS quick_replies TEXT[]`,
    `ALTER TABLE public.chatbot_configs ADD COLUMN IF NOT EXISTS greeting_message TEXT DEFAULT 'Hi there!'`,
    `ALTER TABLE public.chatbot_configs ADD COLUMN IF NOT EXISTS greeting_subtext TEXT DEFAULT 'How can I help you today?'`,
  ];

  for (const sql of statements) {
    try {
      await client.query(sql);
      console.log('OK:', sql.slice(0, 80));
    } catch (err) {
      console.error('Error:', err.message, '| SQL:', sql.slice(0, 80));
    }
  }

  // Now flag vintrastudio's chatbot as the landing widget
  const { rows: users } = await client.query(
    `SELECT id FROM auth.users WHERE email = 'vintrastudio@gmail.com' LIMIT 1`
  );

  if (users.length > 0) {
    const userId = users[0].id;
    console.log('Found vintrastudio user:', userId);

    // Clear any existing landing widget flags
    await client.query(`UPDATE public.chatbot_configs SET is_landing_widget = false WHERE is_landing_widget = true`);

    // Get their first chatbot config
    const { rows: configs } = await client.query(
      `SELECT id FROM public.chatbot_configs WHERE admin_id = $1 ORDER BY created_at ASC LIMIT 1`,
      [userId]
    );

    if (configs.length > 0) {
      const configId = configs[0].id;
      await client.query(
        `UPDATE public.chatbot_configs SET is_landing_widget = true, landing_widget_enabled = true, quick_replies = $1, greeting_message = 'Hi there!', greeting_subtext = 'How can I help you today?' WHERE id = $2`,
        [['What features do you offer?', 'Tell me about pricing', 'How does the AI work?', 'Can I see a demo?'], configId]
      );
      console.log('Flagged config', configId, 'as landing widget');
    } else {
      console.log('No chatbot config found for vintrastudio');
    }

    // Ensure a second chatbot config exists for the demo page
    const { rows: allConfigs } = await client.query(
      `SELECT id, is_landing_widget FROM public.chatbot_configs WHERE admin_id = $1`,
      [userId]
    );

    const hasNonLanding = allConfigs.some(c => !c.is_landing_widget);
    if (!hasNonLanding) {
      await client.query(
        `INSERT INTO public.chatbot_configs (admin_id, widget_title, welcome_message, primary_color, position, show_branding, offline_message, placeholder_text, launcher_text, launcher_text_enabled, is_landing_widget, landing_widget_enabled, quick_replies, greeting_message, greeting_subtext) VALUES ($1, 'Chat Demo Bot', 'Welcome to the demo! Try out our chat features here.', '#6366f1', 'bottom-right', true, 'We are currently offline. Leave a message!', 'Type your message...', 'Chat with us', true, false, false, $2, 'Welcome!', 'Try out our chat features here.')`,
        [userId, ['Show me a demo', 'What can you do?', 'Tell me about your features']]
      );
      console.log('Created second chatbot config (Chat Demo Bot)');
    } else {
      console.log('Second chatbot config already exists');
    }
  } else {
    console.log('vintrastudio@gmail.com not found in auth.users');
  }

  await client.end();
  console.log('Migration complete');
}

run().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
