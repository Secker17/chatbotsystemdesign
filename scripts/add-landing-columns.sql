-- Add landing widget columns to chatbot_configs
ALTER TABLE public.chatbot_configs ADD COLUMN IF NOT EXISTS is_landing_widget BOOLEAN DEFAULT false;
ALTER TABLE public.chatbot_configs ADD COLUMN IF NOT EXISTS landing_widget_enabled BOOLEAN DEFAULT true;
ALTER TABLE public.chatbot_configs ADD COLUMN IF NOT EXISTS quick_replies TEXT[] DEFAULT ARRAY['What features do you offer?', 'Tell me about pricing', 'How does the AI work?', 'Can I see a demo?'];
ALTER TABLE public.chatbot_configs ADD COLUMN IF NOT EXISTS greeting_message TEXT DEFAULT 'Hi there!';
ALTER TABLE public.chatbot_configs ADD COLUMN IF NOT EXISTS greeting_subtext TEXT DEFAULT 'How can I help you today?';
