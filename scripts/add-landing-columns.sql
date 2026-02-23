ALTER TABLE public.chatbot_configs ADD COLUMN IF NOT EXISTS is_landing_widget BOOLEAN DEFAULT false;
ALTER TABLE public.chatbot_configs ADD COLUMN IF NOT EXISTS landing_widget_enabled BOOLEAN DEFAULT true;
ALTER TABLE public.chatbot_configs ADD COLUMN IF NOT EXISTS quick_replies TEXT[];
ALTER TABLE public.chatbot_configs ADD COLUMN IF NOT EXISTS greeting_message TEXT DEFAULT 'Hi there!';
ALTER TABLE public.chatbot_configs ADD COLUMN IF NOT EXISTS greeting_subtext TEXT DEFAULT 'How can I help you today?';
