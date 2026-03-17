-- Add xai_api_key to admin_profiles so admins can store their Grok/xAI API key in the UI
ALTER TABLE public.admin_profiles
ADD COLUMN IF NOT EXISTS xai_api_key TEXT;
