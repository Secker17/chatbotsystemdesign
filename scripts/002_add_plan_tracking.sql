-- Add plan and subscription tracking to admin_profiles
ALTER TABLE admin_profiles
  ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'starter',
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS plan_period_start TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS plan_period_end TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS conversations_this_month INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS conversations_reset_at TIMESTAMPTZ DEFAULT NOW();

-- Create an index for Stripe customer lookup
CREATE INDEX IF NOT EXISTS idx_admin_profiles_stripe_customer_id ON admin_profiles(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_admin_profiles_stripe_subscription_id ON admin_profiles(stripe_subscription_id);
