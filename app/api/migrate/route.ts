import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Temporary migration endpoint - DELETE after running
// Visit /api/migrate to execute the database migration
export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json(
      { error: 'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' },
      { status: 500 }
    )
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const results: { step: string; status: string; error?: string }[] = []

  // Helper to run SQL via rpc - we first need to create the exec_sql function
  // Since we can't run arbitrary SQL through the REST API without an RPC function,
  // we'll use the supabase-js client to verify tables and add data

  // Step 1: Verify all tables exist by querying them
  const tables = [
    'admin_profiles',
    'chatbot_configs',
    'chat_sessions',
    'chat_messages',
    'canned_responses',
    'analytics_events',
  ]

  for (const table of tables) {
    const { error } = await supabase.from(table).select('id').limit(1)
    results.push({
      step: `Verify table: ${table}`,
      status: error ? 'MISSING' : 'EXISTS',
      error: error?.message,
    })
  }

  // Step 2: Check if columns exist by attempting queries that use them
  // Try to query with the columns we need
  const columnChecks = [
    {
      table: 'admin_profiles',
      columns: ['plan', 'stripe_customer_id', 'email_notifications', 'timezone'],
    },
    {
      table: 'chatbot_configs',
      columns: [
        'widget_title',
        'avatar_url',
        'ai_enabled',
        'ai_system_prompt',
        'ai_model',
        'launcher_text',
        'business_hours_enabled',
      ],
    },
    {
      table: 'chat_sessions',
      columns: ['admin_id', 'updated_at', 'is_bot_active', 'metadata'],
    },
    {
      table: 'chat_messages',
      columns: ['admin_id', 'is_ai_generated'],
    },
    {
      table: 'canned_responses',
      columns: ['admin_id', 'category'],
    },
    {
      table: 'analytics_events',
      columns: ['admin_id'],
    },
  ]

  for (const check of columnChecks) {
    const selectStr = check.columns.join(',')
    const { error } = await supabase.from(check.table).select(selectStr).limit(1)
    results.push({
      step: `Check columns on ${check.table}: ${selectStr}`,
      status: error ? 'MISSING_COLUMNS' : 'OK',
      error: error?.message,
    })
  }

  // Provide the full SQL that needs to be run in the Supabase SQL Editor
  const migrationSql = getMigrationSql()

  return NextResponse.json({
    message:
      'Database verification complete. If any columns are MISSING, run the SQL below in your Supabase Dashboard > SQL Editor.',
    supabaseUrl,
    results,
    migrationSql,
    instructions: [
      '1. Go to https://supabase.com/dashboard/project/dzdxmhzmyfxiqbnwhzst/sql/new',
      '2. Paste the migrationSql content into the SQL Editor',
      '3. Click "Run" to execute the migration',
      '4. Visit /api/migrate again to verify all columns exist',
    ],
  })
}

function getMigrationSql(): string {
  return `
-- =====================================================================
-- STEP 1: Base tables (skip if already created via 001_create_chatbot_schema.sql)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.admin_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  company_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.chatbot_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'My Chatbot',
  welcome_message TEXT DEFAULT 'Hello! How can I help you today?',
  placeholder_text TEXT DEFAULT 'Type your message...',
  primary_color TEXT DEFAULT '#0066FF',
  secondary_color TEXT DEFAULT '#F0F4FF',
  text_color TEXT DEFAULT '#1A1A2E',
  position TEXT DEFAULT 'bottom-right' CHECK (position IN ('bottom-right', 'bottom-left')),
  widget_size TEXT DEFAULT 'medium' CHECK (widget_size IN ('small', 'medium', 'large')),
  show_branding BOOLEAN DEFAULT true,
  auto_open_delay INTEGER DEFAULT 0,
  offline_message TEXT DEFAULT 'We are currently offline. Please leave a message.',
  is_active BOOLEAN DEFAULT true,
  api_key TEXT UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  allowed_domains TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chatbot_id UUID NOT NULL REFERENCES public.chatbot_configs(id) ON DELETE CASCADE,
  visitor_id TEXT NOT NULL,
  visitor_name TEXT,
  visitor_email TEXT,
  visitor_metadata JSONB DEFAULT '{}',
  status TEXT DEFAULT 'active',
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('visitor', 'admin', 'bot')),
  sender_id TEXT,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.canned_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chatbot_id UUID NOT NULL REFERENCES public.chatbot_configs(id) ON DELETE CASCADE,
  shortcut TEXT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chatbot_id UUID NOT NULL REFERENCES public.chatbot_configs(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================================
-- STEP 2: Add missing columns
-- =====================================================================
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

DO $$
BEGIN
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

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='chat_sessions' AND column_name='admin_id') THEN ALTER TABLE public.chat_sessions ADD COLUMN admin_id UUID REFERENCES auth.users(id); END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='chat_sessions' AND column_name='updated_at') THEN ALTER TABLE public.chat_sessions ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(); END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='chat_sessions' AND column_name='metadata') THEN ALTER TABLE public.chat_sessions ADD COLUMN metadata JSONB DEFAULT '{}'; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='chat_sessions' AND column_name='is_bot_active') THEN ALTER TABLE public.chat_sessions ADD COLUMN is_bot_active BOOLEAN DEFAULT false; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='chat_sessions' AND column_name='bot_messages_count') THEN ALTER TABLE public.chat_sessions ADD COLUMN bot_messages_count INTEGER DEFAULT 0; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='chat_sessions' AND column_name='handoff_requested_at') THEN ALTER TABLE public.chat_sessions ADD COLUMN handoff_requested_at TIMESTAMP WITH TIME ZONE; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='chat_sessions' AND column_name='ended_at') THEN ALTER TABLE public.chat_sessions ADD COLUMN ended_at TIMESTAMP WITH TIME ZONE; END IF;
  BEGIN
    ALTER TABLE public.chat_sessions DROP CONSTRAINT IF EXISTS chat_sessions_status_check;
    ALTER TABLE public.chat_sessions ADD CONSTRAINT chat_sessions_status_check CHECK (status IN ('active', 'closed', 'archived', 'waiting_for_human'));
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='chat_messages' AND column_name='admin_id') THEN ALTER TABLE public.chat_messages ADD COLUMN admin_id UUID REFERENCES auth.users(id); END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='chat_messages' AND column_name='is_ai_generated') THEN ALTER TABLE public.chat_messages ADD COLUMN is_ai_generated BOOLEAN DEFAULT false; END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='analytics_events' AND column_name='admin_id') THEN ALTER TABLE public.analytics_events ADD COLUMN admin_id UUID REFERENCES auth.users(id); END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='analytics_events' AND column_name='session_id') THEN ALTER TABLE public.analytics_events ADD COLUMN session_id UUID REFERENCES public.chat_sessions(id) ON DELETE SET NULL; END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='canned_responses' AND column_name='admin_id') THEN ALTER TABLE public.canned_responses ADD COLUMN admin_id UUID REFERENCES auth.users(id); END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='canned_responses' AND column_name='category') THEN ALTER TABLE public.canned_responses ADD COLUMN category TEXT; END IF;
  ALTER TABLE public.canned_responses ALTER COLUMN shortcut DROP NOT NULL;
END $$;

UPDATE public.canned_responses cr SET admin_id = cc.admin_id FROM public.chatbot_configs cc WHERE cr.chatbot_id = cc.id AND cr.admin_id IS NULL;

-- =====================================================================
-- STEP 3: RLS Policies
-- =====================================================================
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chatbot_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.canned_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_profiles_select_own" ON public.admin_profiles;
CREATE POLICY "admin_profiles_select_own" ON public.admin_profiles FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "admin_profiles_insert_own" ON public.admin_profiles;
CREATE POLICY "admin_profiles_insert_own" ON public.admin_profiles FOR INSERT WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "admin_profiles_update_own" ON public.admin_profiles;
CREATE POLICY "admin_profiles_update_own" ON public.admin_profiles FOR UPDATE USING (auth.uid() = id);
DROP POLICY IF EXISTS "admin_profiles_public_read" ON public.admin_profiles;
CREATE POLICY "admin_profiles_public_read" ON public.admin_profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "admin_profiles_public_update" ON public.admin_profiles;
CREATE POLICY "admin_profiles_public_update" ON public.admin_profiles FOR UPDATE USING (true);

DROP POLICY IF EXISTS "chatbot_configs_select_own" ON public.chatbot_configs;
CREATE POLICY "chatbot_configs_select_own" ON public.chatbot_configs FOR SELECT USING (auth.uid() = admin_id);
DROP POLICY IF EXISTS "chatbot_configs_insert_own" ON public.chatbot_configs;
CREATE POLICY "chatbot_configs_insert_own" ON public.chatbot_configs FOR INSERT WITH CHECK (auth.uid() = admin_id);
DROP POLICY IF EXISTS "chatbot_configs_update_own" ON public.chatbot_configs;
CREATE POLICY "chatbot_configs_update_own" ON public.chatbot_configs FOR UPDATE USING (auth.uid() = admin_id);
DROP POLICY IF EXISTS "chatbot_configs_delete_own" ON public.chatbot_configs;
CREATE POLICY "chatbot_configs_delete_own" ON public.chatbot_configs FOR DELETE USING (auth.uid() = admin_id);
DROP POLICY IF EXISTS "chatbot_configs_public_read" ON public.chatbot_configs;
CREATE POLICY "chatbot_configs_public_read" ON public.chatbot_configs FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "chat_sessions_select" ON public.chat_sessions;
CREATE POLICY "chat_sessions_select" ON public.chat_sessions FOR SELECT USING (chatbot_id IN (SELECT id FROM public.chatbot_configs WHERE admin_id = auth.uid()));
DROP POLICY IF EXISTS "chat_sessions_insert" ON public.chat_sessions;
DROP POLICY IF EXISTS "chat_sessions_public_read" ON public.chat_sessions;
CREATE POLICY "chat_sessions_public_read" ON public.chat_sessions FOR SELECT USING (true);
DROP POLICY IF EXISTS "chat_sessions_public_insert" ON public.chat_sessions;
CREATE POLICY "chat_sessions_public_insert" ON public.chat_sessions FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "chat_sessions_public_update" ON public.chat_sessions;
CREATE POLICY "chat_sessions_public_update" ON public.chat_sessions FOR UPDATE USING (true);
DROP POLICY IF EXISTS "chat_sessions_update" ON public.chat_sessions;
DROP POLICY IF EXISTS "chat_sessions_public_delete" ON public.chat_sessions;
CREATE POLICY "chat_sessions_public_delete" ON public.chat_sessions FOR DELETE USING (true);

DROP POLICY IF EXISTS "chat_messages_select" ON public.chat_messages;
CREATE POLICY "chat_messages_select" ON public.chat_messages FOR SELECT USING (session_id IN (SELECT cs.id FROM public.chat_sessions cs JOIN public.chatbot_configs cc ON cs.chatbot_id = cc.id WHERE cc.admin_id = auth.uid()));
DROP POLICY IF EXISTS "chat_messages_insert" ON public.chat_messages;
DROP POLICY IF EXISTS "chat_messages_update" ON public.chat_messages;
DROP POLICY IF EXISTS "chat_messages_public_read" ON public.chat_messages;
CREATE POLICY "chat_messages_public_read" ON public.chat_messages FOR SELECT USING (true);
DROP POLICY IF EXISTS "chat_messages_public_insert" ON public.chat_messages;
CREATE POLICY "chat_messages_public_insert" ON public.chat_messages FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "chat_messages_public_delete" ON public.chat_messages;
CREATE POLICY "chat_messages_public_delete" ON public.chat_messages FOR DELETE USING (true);

DROP POLICY IF EXISTS "canned_responses_select" ON public.canned_responses;
CREATE POLICY "canned_responses_select" ON public.canned_responses FOR SELECT USING (admin_id = auth.uid() OR chatbot_id IN (SELECT id FROM public.chatbot_configs WHERE admin_id = auth.uid()));
DROP POLICY IF EXISTS "canned_responses_insert" ON public.canned_responses;
CREATE POLICY "canned_responses_insert" ON public.canned_responses FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "canned_responses_update" ON public.canned_responses;
CREATE POLICY "canned_responses_update" ON public.canned_responses FOR UPDATE USING (true);
DROP POLICY IF EXISTS "canned_responses_delete" ON public.canned_responses;
CREATE POLICY "canned_responses_delete" ON public.canned_responses FOR DELETE USING (true);
DROP POLICY IF EXISTS "canned_responses_public_read" ON public.canned_responses;
CREATE POLICY "canned_responses_public_read" ON public.canned_responses FOR SELECT USING (true);

DROP POLICY IF EXISTS "analytics_events_select" ON public.analytics_events;
CREATE POLICY "analytics_events_select" ON public.analytics_events FOR SELECT USING (chatbot_id IN (SELECT id FROM public.chatbot_configs WHERE admin_id = auth.uid()));
DROP POLICY IF EXISTS "analytics_events_insert" ON public.analytics_events;
DROP POLICY IF EXISTS "analytics_events_public_insert" ON public.analytics_events;
CREATE POLICY "analytics_events_public_insert" ON public.analytics_events FOR INSERT WITH CHECK (true);

-- =====================================================================
-- STEP 4: Indexes
-- =====================================================================
CREATE INDEX IF NOT EXISTS idx_chatbot_configs_admin_id ON public.chatbot_configs(admin_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_configs_api_key ON public.chatbot_configs(api_key);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_chatbot_id ON public.chat_sessions(chatbot_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_visitor_id ON public.chat_sessions(visitor_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_admin_id ON public.chat_sessions(admin_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_status ON public.chat_sessions(status);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_updated_at ON public.chat_sessions(updated_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON public.chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_admin_id ON public.chat_messages(admin_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_chatbot_id ON public.analytics_events(chatbot_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON public.analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_admin_id ON public.analytics_events(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_profiles_stripe_customer_id ON public.admin_profiles(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_admin_profiles_stripe_subscription_id ON public.admin_profiles(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_canned_responses_admin_id ON public.canned_responses(admin_id);
CREATE INDEX IF NOT EXISTS idx_canned_responses_chatbot_id ON public.canned_responses(chatbot_id);

-- =====================================================================
-- STEP 5: Triggers
-- =====================================================================
CREATE OR REPLACE FUNCTION public.handle_new_admin()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.admin_profiles (id, full_name, company_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'full_name', NULL), COALESCE(NEW.raw_user_meta_data ->> 'company_name', NULL))
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.chatbot_configs (admin_id, name) VALUES (NEW.id, 'My First Chatbot');
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_admin();

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS update_admin_profiles_updated_at ON public.admin_profiles;
CREATE TRIGGER update_admin_profiles_updated_at BEFORE UPDATE ON public.admin_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
DROP TRIGGER IF EXISTS update_chatbot_configs_updated_at ON public.chatbot_configs;
CREATE TRIGGER update_chatbot_configs_updated_at BEFORE UPDATE ON public.chatbot_configs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- =====================================================================
-- STEP 6: Realtime
-- =====================================================================
DO $$ BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_sessions; EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;
`
}
