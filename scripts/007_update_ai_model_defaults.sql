-- Update the default ai_model to grok-3-mini (valid xAI model)
-- and update any rows still using deprecated model names

-- Update default
ALTER TABLE public.chatbot_configs ALTER COLUMN ai_model SET DEFAULT 'grok-3-mini';

-- Update rows with deprecated model names to grok-3-mini
UPDATE public.chatbot_configs 
SET ai_model = 'grok-3-mini' 
WHERE ai_model IN ('grok-beta', 'grok-2-1212', 'grok-2-image');

-- Update rows with non-xAI defaults if the admin hasn't explicitly chosen a model
-- (keep any explicitly chosen models like gpt-4o-mini, etc.)
