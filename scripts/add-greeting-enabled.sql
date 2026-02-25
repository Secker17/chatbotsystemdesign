-- Add greeting_enabled column to chatbot_configs
ALTER TABLE public.chatbot_configs
  ADD COLUMN IF NOT EXISTS greeting_enabled BOOLEAN DEFAULT true;
