import { createClient } from "@supabase/supabase-js";

// Hardcode the correct URL since env vars may be cached with the wrong project ref
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("dzdxmhzmyfxiqbnwhzst")
  ? process.env.NEXT_PUBLIC_SUPABASE_URL
  : "https://dzdxmhzmyfxiqbnwhzst.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
  );
  process.exit(1);
}

console.log("Supabase URL:", supabaseUrl);
console.log(
  "Service key present:",
  supabaseServiceKey ? "Yes (" + supabaseServiceKey.length + " chars)" : "No"
);

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Step 1: Create the exec_sql helper function via a simple insert approach
// We'll use Supabase's built-in pg_net or direct SQL approach

async function executeSql(sql, stepName) {
  console.log(`\nRunning: ${stepName}...`);

  // Use the Supabase SQL endpoint (available on all projects)
  // This is the pg-meta endpoint
  const projectRef = supabaseUrl.replace("https://", "").split(".")[0];

  // Try the direct SQL execution via the pg-meta API
  const response = await fetch(
    `https://${projectRef}.supabase.co/rest/v1/rpc/exec_sql`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseServiceKey,
        Authorization: `Bearer ${supabaseServiceKey}`,
        Prefer: "return=minimal",
      },
      body: JSON.stringify({ query: sql }),
    }
  );

  if (response.ok) {
    console.log(`  SUCCESS`);
    return true;
  }

  // If exec_sql doesn't exist, try the query endpoint
  const response2 = await fetch(
    `https://${projectRef}.supabase.co/pg/query`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Supabase-Key": supabaseServiceKey,
        Authorization: `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({ query: sql }),
    }
  );

  if (response2.ok) {
    console.log(`  SUCCESS via pg/query`);
    return true;
  }

  const errText = await response2.text();
  console.log(`  pg/query status: ${response2.status}`);
  console.log(`  pg/query response: ${errText.substring(0, 500)}`);

  // Final fallback: try the management API SQL endpoint
  const response3 = await fetch(
    `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({ query: sql }),
    }
  );

  if (response3.ok) {
    console.log(`  SUCCESS via management API`);
    return true;
  }

  const errText3 = await response3.text();
  console.log(`  Management API status: ${response3.status}`);
  console.log(`  Management API response: ${errText3.substring(0, 500)}`);
  return false;
}

// Instead of running raw SQL, let's verify tables exist using the supabase client
// and then create an API-based migration approach
async function verifyAndSetup() {
  console.log("\n=== Verifying existing tables ===");

  // Check admin_profiles
  const { data: profiles, error: profErr } = await supabase
    .from("admin_profiles")
    .select("id")
    .limit(1);
  console.log(
    "admin_profiles:",
    profErr ? `ERROR - ${profErr.message}` : "EXISTS"
  );

  // Check chatbot_configs
  const { data: configs, error: confErr } = await supabase
    .from("chatbot_configs")
    .select("id")
    .limit(1);
  console.log(
    "chatbot_configs:",
    confErr ? `ERROR - ${confErr.message}` : "EXISTS"
  );

  // Check chat_sessions
  const { data: sessions, error: sessErr } = await supabase
    .from("chat_sessions")
    .select("id")
    .limit(1);
  console.log(
    "chat_sessions:",
    sessErr ? `ERROR - ${sessErr.message}` : "EXISTS"
  );

  // Check chat_messages
  const { data: messages, error: msgErr } = await supabase
    .from("chat_messages")
    .select("id")
    .limit(1);
  console.log(
    "chat_messages:",
    msgErr ? `ERROR - ${msgErr.message}` : "EXISTS"
  );

  // Check canned_responses
  const { data: canned, error: canErr } = await supabase
    .from("canned_responses")
    .select("id")
    .limit(1);
  console.log(
    "canned_responses:",
    canErr ? `ERROR - ${canErr.message}` : "EXISTS"
  );

  // Check analytics_events
  const { data: analytics, error: anaErr } = await supabase
    .from("analytics_events")
    .select("id")
    .limit(1);
  console.log(
    "analytics_events:",
    anaErr ? `ERROR - ${anaErr.message}` : "EXISTS"
  );

  console.log("\n=== Attempting SQL migration ===");

  // Try each migration step
  const step1 = `
ALTER TABLE public.admin_profiles
  ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'starter',
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS plan_period_start TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS plan_period_end TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS conversations_this_month INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS conversations_reset_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS timezone TEXT;
`;

  const step2 = `
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='chatbot_configs' AND column_name='widget_title') THEN ALTER TABLE public.chatbot_configs ADD COLUMN widget_title TEXT DEFAULT 'Chat with us'; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='chatbot_configs' AND column_name='avatar_url') THEN ALTER TABLE public.chatbot_configs ADD COLUMN avatar_url TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='chatbot_configs' AND column_name='launcher_text') THEN ALTER TABLE public.chatbot_configs ADD COLUMN launcher_text TEXT DEFAULT 'Talk to us'; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='chatbot_configs' AND column_name='launcher_text_enabled') THEN ALTER TABLE public.chatbot_configs ADD COLUMN launcher_text_enabled BOOLEAN DEFAULT true; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='chatbot_configs' AND column_name='business_hours_enabled') THEN ALTER TABLE public.chatbot_configs ADD COLUMN business_hours_enabled BOOLEAN DEFAULT false; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='chatbot_configs' AND column_name='business_hours') THEN ALTER TABLE public.chatbot_configs ADD COLUMN business_hours JSONB; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='chatbot_configs' AND column_name='business_hours_timezone') THEN ALTER TABLE public.chatbot_configs ADD COLUMN business_hours_timezone TEXT DEFAULT 'UTC'; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='chatbot_configs' AND column_name='outside_hours_message') THEN ALTER TABLE public.chatbot_configs ADD COLUMN outside_hours_message TEXT DEFAULT 'We are currently offline.'; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='chatbot_configs' AND column_name='ai_enabled') THEN ALTER TABLE public.chatbot_configs ADD COLUMN ai_enabled BOOLEAN DEFAULT false; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='chatbot_configs' AND column_name='ai_system_prompt') THEN ALTER TABLE public.chatbot_configs ADD COLUMN ai_system_prompt TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='chatbot_configs' AND column_name='ai_knowledge_base') THEN ALTER TABLE public.chatbot_configs ADD COLUMN ai_knowledge_base TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='chatbot_configs' AND column_name='ai_model') THEN ALTER TABLE public.chatbot_configs ADD COLUMN ai_model TEXT DEFAULT 'gpt-4o-mini'; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='chatbot_configs' AND column_name='ai_temperature') THEN ALTER TABLE public.chatbot_configs ADD COLUMN ai_temperature NUMERIC DEFAULT 0.7; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='chatbot_configs' AND column_name='ai_max_tokens') THEN ALTER TABLE public.chatbot_configs ADD COLUMN ai_max_tokens INTEGER DEFAULT 500; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='chatbot_configs' AND column_name='ai_auto_greet') THEN ALTER TABLE public.chatbot_configs ADD COLUMN ai_auto_greet BOOLEAN DEFAULT false; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='chatbot_configs' AND column_name='ai_greeting_message') THEN ALTER TABLE public.chatbot_configs ADD COLUMN ai_greeting_message TEXT DEFAULT 'Hi! How can I help you today?'; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='chatbot_configs' AND column_name='ai_handoff_keywords') THEN ALTER TABLE public.chatbot_configs ADD COLUMN ai_handoff_keywords TEXT[] DEFAULT ARRAY['human','agent','person']; END IF;
END $$;
`;

  const step3 = `
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='chat_sessions' AND column_name='admin_id') THEN ALTER TABLE public.chat_sessions ADD COLUMN admin_id UUID REFERENCES auth.users(id); END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='chat_sessions' AND column_name='updated_at') THEN ALTER TABLE public.chat_sessions ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(); END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='chat_sessions' AND column_name='metadata') THEN ALTER TABLE public.chat_sessions ADD COLUMN metadata JSONB DEFAULT '{}'; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='chat_sessions' AND column_name='is_bot_active') THEN ALTER TABLE public.chat_sessions ADD COLUMN is_bot_active BOOLEAN DEFAULT false; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='chat_sessions' AND column_name='bot_messages_count') THEN ALTER TABLE public.chat_sessions ADD COLUMN bot_messages_count INTEGER DEFAULT 0; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='chat_sessions' AND column_name='handoff_requested_at') THEN ALTER TABLE public.chat_sessions ADD COLUMN handoff_requested_at TIMESTAMP WITH TIME ZONE; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='chat_sessions' AND column_name='ended_at') THEN ALTER TABLE public.chat_sessions ADD COLUMN ended_at TIMESTAMP WITH TIME ZONE; END IF;
END $$;
`;

  const step4 = `
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='chat_messages' AND column_name='admin_id') THEN ALTER TABLE public.chat_messages ADD COLUMN admin_id UUID REFERENCES auth.users(id); END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='chat_messages' AND column_name='is_ai_generated') THEN ALTER TABLE public.chat_messages ADD COLUMN is_ai_generated BOOLEAN DEFAULT false; END IF;
END $$;
`;

  const step5 = `
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='analytics_events' AND column_name='admin_id') THEN ALTER TABLE public.analytics_events ADD COLUMN admin_id UUID REFERENCES auth.users(id); END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='analytics_events' AND column_name='session_id') THEN ALTER TABLE public.analytics_events ADD COLUMN session_id UUID REFERENCES public.chat_sessions(id) ON DELETE SET NULL; END IF;
END $$;
`;

  const step6 = `
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='canned_responses' AND column_name='admin_id') THEN ALTER TABLE public.canned_responses ADD COLUMN admin_id UUID REFERENCES auth.users(id); END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='canned_responses' AND column_name='category') THEN ALTER TABLE public.canned_responses ADD COLUMN category TEXT; END IF;
END $$;
`;

  const step7 = `
CREATE INDEX IF NOT EXISTS idx_chatbot_configs_admin_id ON public.chatbot_configs(admin_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_configs_api_key ON public.chatbot_configs(api_key);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_chatbot_id ON public.chat_sessions(chatbot_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_status ON public.chat_sessions(status);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON public.chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_chatbot_id ON public.analytics_events(chatbot_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON public.analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_canned_responses_chatbot_id ON public.canned_responses(chatbot_id);
`;

  const steps = [
    { name: "Step 1: admin_profiles columns", sql: step1 },
    { name: "Step 2: chatbot_configs columns", sql: step2 },
    { name: "Step 3: chat_sessions columns", sql: step3 },
    { name: "Step 4: chat_messages columns", sql: step4 },
    { name: "Step 5: analytics_events columns", sql: step5 },
    { name: "Step 6: canned_responses columns", sql: step6 },
    { name: "Step 7: indexes", sql: step7 },
  ];

  for (const step of steps) {
    await executeSql(step.sql, step.name);
  }

  console.log("\n=== Migration attempt complete ===");
  console.log(
    "\nIMPORTANT: If the SQL steps above failed, you need to run the SQL"
  );
  console.log(
    "directly in your Supabase Dashboard > SQL Editor. The full migration"
  );
  console.log("SQL is in scripts/005_complete_schema_sync.sql");
}

verifyAndSetup().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
