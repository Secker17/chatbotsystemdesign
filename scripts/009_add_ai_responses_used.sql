-- Track AI responses per admin for plan limits (Pro: 500/mo, Business: unlimited)
ALTER TABLE public.admin_profiles
ADD COLUMN IF NOT EXISTS ai_responses_used INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS ai_responses_reset_at TIMESTAMPTZ DEFAULT NOW();
