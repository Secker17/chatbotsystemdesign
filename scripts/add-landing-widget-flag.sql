-- Add is_landing_widget column to chatbot_configs
-- This flags which chatbot config powers the public landing page widget

ALTER TABLE public.chatbot_configs
  ADD COLUMN IF NOT EXISTS is_landing_widget BOOLEAN DEFAULT false;

-- Also add landing_widget_enabled to control on/off from admin
ALTER TABLE public.chatbot_configs
  ADD COLUMN IF NOT EXISTS landing_widget_enabled BOOLEAN DEFAULT true;

-- Add quick_replies column for configurable quick reply suggestions
ALTER TABLE public.chatbot_configs
  ADD COLUMN IF NOT EXISTS quick_replies TEXT[] DEFAULT ARRAY['What features do you offer?', 'Tell me about pricing', 'How does the AI work?', 'Can I see a demo?'];

-- Add greeting_message and greeting_subtext for the popup greeting bubble
ALTER TABLE public.chatbot_configs
  ADD COLUMN IF NOT EXISTS greeting_message TEXT DEFAULT 'Hi there!';

ALTER TABLE public.chatbot_configs
  ADD COLUMN IF NOT EXISTS greeting_subtext TEXT DEFAULT 'How can I help you today?';

-- Flag Vintra's chatbot config as the landing widget
-- Find the admin user with vintrastudio@gmail.com and mark their chatbot
UPDATE public.chatbot_configs
SET is_landing_widget = true,
    landing_widget_enabled = true
WHERE admin_id = (
  SELECT id FROM auth.users WHERE email = 'vintrastudio@gmail.com' LIMIT 1
);
