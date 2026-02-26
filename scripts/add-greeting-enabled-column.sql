-- Add greeting_enabled column to chatbot_configs table
-- This enables/disables the greeting bubble that appears above the chat launcher

ALTER TABLE chatbot_configs 
ADD COLUMN IF NOT EXISTS greeting_enabled BOOLEAN DEFAULT true;

-- Update existing rows to have the default value
UPDATE chatbot_configs SET greeting_enabled = true WHERE greeting_enabled IS NULL;
