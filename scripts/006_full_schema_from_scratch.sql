-- 006: Full schema creation from scratch
-- Creates all tables, columns, policies, indexes, and triggers
-- Safe to run on an empty database

-- =============================================================================
-- 1. CREATE TABLES
-- =============================================================================

-- Admin profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.admin_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  company_name TEXT,
  plan TEXT NOT NULL DEFAULT 'starter',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_status TEXT DEFAULT 'active',
  plan_period_start TIMESTAMPTZ,
  plan_period_end TIMESTAMPTZ,
  conversations_this_month INTEGER NOT NULL DEFAULT 0,
  conversations_reset_at TIMESTAMPTZ DEFAULT NOW(),
  email_notifications BOOLEAN DEFAULT true,
  timezone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chatbot configurations table
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
  widget_title TEXT DEFAULT 'Chat with us',
  avatar_url TEXT,
  launcher_text TEXT DEFAULT 'Talk to us',
  launcher_text_enabled BOOLEAN DEFAULT true,
  business_hours_enabled BOOLEAN DEFAULT false,
  business_hours JSONB,
  business_hours_timezone TEXT DEFAULT 'UTC',
  outside_hours_message TEXT DEFAULT 'We are currently offline. Leave a message and we''ll get back to you!',
  ai_enabled BOOLEAN DEFAULT false,
  ai_system_prompt TEXT,
  ai_knowledge_base TEXT,
  ai_model TEXT DEFAULT 'grok-3-mini',
  ai_temperature NUMERIC DEFAULT 0.7,
  ai_max_tokens INTEGER DEFAULT 500,
  ai_auto_greet BOOLEAN DEFAULT false,
  ai_greeting_message TEXT DEFAULT 'Hi! I''m an AI assistant. How can I help you today?',
  ai_handoff_keywords TEXT[] DEFAULT ARRAY['human', 'agent', 'person', 'real person', 'speak to someone'],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat sessions table
CREATE TABLE IF NOT EXISTS public.chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chatbot_id UUID NOT NULL REFERENCES public.chatbot_configs(id) ON DELETE CASCADE,
  admin_id UUID REFERENCES auth.users(id),
  visitor_id TEXT NOT NULL,
  visitor_name TEXT,
  visitor_email TEXT,
  visitor_metadata JSONB DEFAULT '{}',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'archived', 'waiting_for_human')),
  is_bot_active BOOLEAN DEFAULT false,
  bot_messages_count INTEGER DEFAULT 0,
  handoff_requested_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  admin_id UUID REFERENCES auth.users(id),
  sender_type TEXT NOT NULL CHECK (sender_type IN ('visitor', 'admin', 'bot')),
  sender_id TEXT,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT false,
  is_ai_generated BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Canned responses table
CREATE TABLE IF NOT EXISTS public.canned_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chatbot_id UUID NOT NULL REFERENCES public.chatbot_configs(id) ON DELETE CASCADE,
  admin_id UUID REFERENCES auth.users(id),
  shortcut TEXT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analytics events table
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chatbot_id UUID NOT NULL REFERENCES public.chatbot_configs(id) ON DELETE CASCADE,
  admin_id UUID REFERENCES auth.users(id),
  session_id UUID REFERENCES public.chat_sessions(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- 2. ENABLE RLS ON ALL TABLES
-- =============================================================================
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chatbot_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.canned_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 3. ROW LEVEL SECURITY POLICIES
-- =============================================================================

-- Admin profiles: own access + public read for service role/widget
DROP POLICY IF EXISTS "admin_profiles_select_own" ON public.admin_profiles;
CREATE POLICY "admin_profiles_select_own" ON public.admin_profiles FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "admin_profiles_insert_own" ON public.admin_profiles;
CREATE POLICY "admin_profiles_insert_own" ON public.admin_profiles FOR INSERT WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "admin_profiles_update_own" ON public.admin_profiles;
CREATE POLICY "admin_profiles_update_own" ON public.admin_profiles FOR UPDATE USING (auth.uid() = id);
DROP POLICY IF EXISTS "admin_profiles_delete_own" ON public.admin_profiles;
CREATE POLICY "admin_profiles_delete_own" ON public.admin_profiles FOR DELETE USING (auth.uid() = id);
DROP POLICY IF EXISTS "admin_profiles_public_read" ON public.admin_profiles;
CREATE POLICY "admin_profiles_public_read" ON public.admin_profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "admin_profiles_public_update" ON public.admin_profiles;
CREATE POLICY "admin_profiles_public_update" ON public.admin_profiles FOR UPDATE USING (true);

-- Chatbot configs: own + public read for widget
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

-- Chat sessions: admin read + public CRUD for widget
DROP POLICY IF EXISTS "chat_sessions_select" ON public.chat_sessions;
CREATE POLICY "chat_sessions_select" ON public.chat_sessions FOR SELECT
  USING (chatbot_id IN (SELECT id FROM public.chatbot_configs WHERE admin_id = auth.uid()));
DROP POLICY IF EXISTS "chat_sessions_insert" ON public.chat_sessions;
CREATE POLICY "chat_sessions_insert" ON public.chat_sessions FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "chat_sessions_update" ON public.chat_sessions;
CREATE POLICY "chat_sessions_update" ON public.chat_sessions FOR UPDATE
  USING (chatbot_id IN (SELECT id FROM public.chatbot_configs WHERE admin_id = auth.uid()));
DROP POLICY IF EXISTS "chat_sessions_public_read" ON public.chat_sessions;
CREATE POLICY "chat_sessions_public_read" ON public.chat_sessions FOR SELECT USING (true);
DROP POLICY IF EXISTS "chat_sessions_public_insert" ON public.chat_sessions;
CREATE POLICY "chat_sessions_public_insert" ON public.chat_sessions FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "chat_sessions_public_update" ON public.chat_sessions;
CREATE POLICY "chat_sessions_public_update" ON public.chat_sessions FOR UPDATE USING (true);
DROP POLICY IF EXISTS "chat_sessions_public_delete" ON public.chat_sessions;
CREATE POLICY "chat_sessions_public_delete" ON public.chat_sessions FOR DELETE USING (true);

-- Chat messages: admin read + public CRUD for widget
DROP POLICY IF EXISTS "chat_messages_select" ON public.chat_messages;
CREATE POLICY "chat_messages_select" ON public.chat_messages FOR SELECT
  USING (session_id IN (
    SELECT cs.id FROM public.chat_sessions cs
    JOIN public.chatbot_configs cc ON cs.chatbot_id = cc.id
    WHERE cc.admin_id = auth.uid()
  ));
DROP POLICY IF EXISTS "chat_messages_insert" ON public.chat_messages;
CREATE POLICY "chat_messages_insert" ON public.chat_messages FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "chat_messages_update" ON public.chat_messages;
CREATE POLICY "chat_messages_update" ON public.chat_messages FOR UPDATE
  USING (session_id IN (
    SELECT cs.id FROM public.chat_sessions cs
    JOIN public.chatbot_configs cc ON cs.chatbot_id = cc.id
    WHERE cc.admin_id = auth.uid()
  ));
DROP POLICY IF EXISTS "chat_messages_public_read" ON public.chat_messages;
CREATE POLICY "chat_messages_public_read" ON public.chat_messages FOR SELECT USING (true);
DROP POLICY IF EXISTS "chat_messages_public_insert" ON public.chat_messages;
CREATE POLICY "chat_messages_public_insert" ON public.chat_messages FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "chat_messages_public_delete" ON public.chat_messages;
CREATE POLICY "chat_messages_public_delete" ON public.chat_messages FOR DELETE USING (true);

-- Canned responses: admin CRUD + public read
DROP POLICY IF EXISTS "canned_responses_select" ON public.canned_responses;
CREATE POLICY "canned_responses_select" ON public.canned_responses FOR SELECT
  USING (admin_id = auth.uid() OR chatbot_id IN (SELECT id FROM public.chatbot_configs WHERE admin_id = auth.uid()));
DROP POLICY IF EXISTS "canned_responses_insert" ON public.canned_responses;
CREATE POLICY "canned_responses_insert" ON public.canned_responses FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "canned_responses_update" ON public.canned_responses;
CREATE POLICY "canned_responses_update" ON public.canned_responses FOR UPDATE USING (true);
DROP POLICY IF EXISTS "canned_responses_delete" ON public.canned_responses;
CREATE POLICY "canned_responses_delete" ON public.canned_responses FOR DELETE USING (true);
DROP POLICY IF EXISTS "canned_responses_public_read" ON public.canned_responses;
CREATE POLICY "canned_responses_public_read" ON public.canned_responses FOR SELECT USING (true);

-- Analytics events: admin read + public insert
DROP POLICY IF EXISTS "analytics_events_select" ON public.analytics_events;
CREATE POLICY "analytics_events_select" ON public.analytics_events FOR SELECT
  USING (chatbot_id IN (SELECT id FROM public.chatbot_configs WHERE admin_id = auth.uid()));
DROP POLICY IF EXISTS "analytics_events_public_insert" ON public.analytics_events;
CREATE POLICY "analytics_events_public_insert" ON public.analytics_events FOR INSERT WITH CHECK (true);

-- =============================================================================
-- 4. INDEXES
-- =============================================================================
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

-- =============================================================================
-- 5. TRIGGERS
-- =============================================================================

-- Auto-create admin profile + default chatbot on signup
CREATE OR REPLACE FUNCTION public.handle_new_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.admin_profiles (id, full_name, company_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NULL),
    COALESCE(NEW.raw_user_meta_data ->> 'company_name', NULL)
  )
  ON CONFLICT (id) DO NOTHING;

  -- Create a default chatbot config for new admin
  INSERT INTO public.chatbot_configs (admin_id, name)
  VALUES (NEW.id, 'My First Chatbot');

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_admin();

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_admin_profiles_updated_at ON public.admin_profiles;
CREATE TRIGGER update_admin_profiles_updated_at
  BEFORE UPDATE ON public.admin_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_chatbot_configs_updated_at ON public.chatbot_configs;
CREATE TRIGGER update_chatbot_configs_updated_at
  BEFORE UPDATE ON public.chatbot_configs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- =============================================================================
-- 6. ENABLE REALTIME for chat tables
-- =============================================================================
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_sessions;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
END $$;
