-- Manual upgrade script for vintrastudio@gmail.com to Business plan
-- Run this in your Supabase SQL Editor

-- First, let's check if your user exists
SELECT id, email, raw_user_meta_data FROM auth.users WHERE email = 'vintrastudio@gmail.com';

-- If the user exists, upgrade them to Business plan
UPDATE admin_profiles
SET 
  plan = 'business',
  subscription_status = 'active',
  plan_period_start = NOW(),
  plan_period_end = NOW() + INTERVAL '100 years',
  conversations_this_month = 0,
  conversations_reset_at = NOW()
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'vintrastudio@gmail.com'
);

-- Verify the update
SELECT 
  ap.id,
  au.email,
  ap.plan,
  ap.subscription_status,
  ap.plan_period_start,
  ap.plan_period_end,
  ap.conversations_this_month
FROM admin_profiles ap
JOIN auth.users au ON ap.id = au.id
WHERE au.email = 'vintrastudio@gmail.com';
