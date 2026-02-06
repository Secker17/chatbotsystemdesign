-- Add launcher text bubble columns to chatbot_configs
ALTER TABLE chatbot_configs
ADD COLUMN IF NOT EXISTS launcher_text text DEFAULT 'Talk to us',
ADD COLUMN IF NOT EXISTS launcher_text_enabled boolean DEFAULT false;
