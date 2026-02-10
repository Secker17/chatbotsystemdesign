-- Add missing columns needed for AI chatbot and chat persistence

-- Add AI-related columns to chatbot_configs
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'chatbot_configs' AND column_name = 'ai_enabled') THEN
    ALTER TABLE public.chatbot_configs ADD COLUMN ai_enabled BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'chatbot_configs' AND column_name = 'ai_system_prompt') THEN
    ALTER TABLE public.chatbot_configs ADD COLUMN ai_system_prompt TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'chatbot_configs' AND column_name = 'ai_knowledge_base') THEN
    ALTER TABLE public.chatbot_configs ADD COLUMN ai_knowledge_base TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'chatbot_configs' AND column_name = 'ai_model') THEN
    ALTER TABLE public.chatbot_configs ADD COLUMN ai_model TEXT DEFAULT 'gpt-4o-mini';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'chatbot_configs' AND column_name = 'ai_temperature') THEN
    ALTER TABLE public.chatbot_configs ADD COLUMN ai_temperature NUMERIC DEFAULT 0.7;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'chatbot_configs' AND column_name = 'ai_max_tokens') THEN
    ALTER TABLE public.chatbot_configs ADD COLUMN ai_max_tokens INTEGER DEFAULT 500;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'chatbot_configs' AND column_name = 'ai_auto_greet') THEN
    ALTER TABLE public.chatbot_configs ADD COLUMN ai_auto_greet BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'chatbot_configs' AND column_name = 'ai_greeting_message') THEN
    ALTER TABLE public.chatbot_configs ADD COLUMN ai_greeting_message TEXT DEFAULT 'Hi! I''m an AI assistant. How can I help you today?';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'chatbot_configs' AND column_name = 'ai_handoff_keywords') THEN
    ALTER TABLE public.chatbot_configs ADD COLUMN ai_handoff_keywords TEXT[] DEFAULT ARRAY['human', 'agent', 'person', 'real person', 'speak to someone'];
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'chatbot_configs' AND column_name = 'launcher_text') THEN
    ALTER TABLE public.chatbot_configs ADD COLUMN launcher_text TEXT DEFAULT 'Talk to us';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'chatbot_configs' AND column_name = 'launcher_text_enabled') THEN
    ALTER TABLE public.chatbot_configs ADD COLUMN launcher_text_enabled BOOLEAN DEFAULT true;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'chatbot_configs' AND column_name = 'business_hours_enabled') THEN
    ALTER TABLE public.chatbot_configs ADD COLUMN business_hours_enabled BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'chatbot_configs' AND column_name = 'business_hours') THEN
    ALTER TABLE public.chatbot_configs ADD COLUMN business_hours JSONB;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'chatbot_configs' AND column_name = 'business_hours_timezone') THEN
    ALTER TABLE public.chatbot_configs ADD COLUMN business_hours_timezone TEXT DEFAULT 'UTC';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'chatbot_configs' AND column_name = 'outside_hours_message') THEN
    ALTER TABLE public.chatbot_configs ADD COLUMN outside_hours_message TEXT DEFAULT 'We are currently offline. Leave a message and we''ll get back to you!';
  END IF;

  -- Add missing columns to chat_sessions
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'chat_sessions' AND column_name = 'is_bot_active') THEN
    ALTER TABLE public.chat_sessions ADD COLUMN is_bot_active BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'chat_sessions' AND column_name = 'bot_messages_count') THEN
    ALTER TABLE public.chat_sessions ADD COLUMN bot_messages_count INTEGER DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'chat_sessions' AND column_name = 'handoff_requested_at') THEN
    ALTER TABLE public.chat_sessions ADD COLUMN handoff_requested_at TIMESTAMP WITH TIME ZONE;
  END IF;

  -- Add missing columns to chat_messages
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'chat_messages' AND column_name = 'is_ai_generated') THEN
    ALTER TABLE public.chat_messages ADD COLUMN is_ai_generated BOOLEAN DEFAULT false;
  END IF;

  -- Allow 'waiting_for_human' status on chat_sessions
  -- Drop and recreate the constraint to include the new status
  BEGIN
    ALTER TABLE public.chat_sessions DROP CONSTRAINT IF EXISTS chat_sessions_status_check;
    ALTER TABLE public.chat_sessions ADD CONSTRAINT chat_sessions_status_check
      CHECK (status IN ('active', 'closed', 'archived', 'waiting_for_human'));
  EXCEPTION WHEN OTHERS THEN
    -- Constraint might not exist or already be correct
    NULL;
  END;
END $$;

-- Ensure public policies exist for widget access
DROP POLICY IF EXISTS "chatbot_configs_public_read" ON public.chatbot_configs;
CREATE POLICY "chatbot_configs_public_read" ON public.chatbot_configs
  FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "chat_sessions_public_read" ON public.chat_sessions;
CREATE POLICY "chat_sessions_public_read" ON public.chat_sessions
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "chat_sessions_public_insert" ON public.chat_sessions;
CREATE POLICY "chat_sessions_public_insert" ON public.chat_sessions
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "chat_sessions_public_update" ON public.chat_sessions;
CREATE POLICY "chat_sessions_public_update" ON public.chat_sessions
  FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "chat_messages_public_read" ON public.chat_messages;
CREATE POLICY "chat_messages_public_read" ON public.chat_messages
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "chat_messages_public_insert" ON public.chat_messages;
CREATE POLICY "chat_messages_public_insert" ON public.chat_messages
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "analytics_events_public_insert" ON public.analytics_events;
CREATE POLICY "analytics_events_public_insert" ON public.analytics_events
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "admin_profiles_public_read" ON public.admin_profiles;
CREATE POLICY "admin_profiles_public_read" ON public.admin_profiles
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "admin_profiles_public_update" ON public.admin_profiles;
CREATE POLICY "admin_profiles_public_update" ON public.admin_profiles
  FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "canned_responses_public_read" ON public.canned_responses;
CREATE POLICY "canned_responses_public_read" ON public.canned_responses
  FOR SELECT
  USING (true);
