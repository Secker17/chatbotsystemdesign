-- 007: Add icon_style to chatbot_configs and admin_is_typing to chat_sessions

-- Add launcher icon style (chat, headset, robot, message-circle, heart, sparkles)
ALTER TABLE public.chatbot_configs
ADD COLUMN IF NOT EXISTS icon_style TEXT DEFAULT 'chat';

-- Add admin typing indicator to sessions
ALTER TABLE public.chat_sessions
ADD COLUMN IF NOT EXISTS admin_is_typing BOOLEAN DEFAULT false;
ALTER TABLE public.chat_sessions
ADD COLUMN IF NOT EXISTS admin_typing_at TIMESTAMPTZ;
