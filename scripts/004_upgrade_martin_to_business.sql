-- Upgrade martin@secker.no to Business plan with everything unlocked
UPDATE admin_profiles
SET
  plan = 'business',
  subscription_status = 'active',
  plan_period_start = NOW(),
  plan_period_end = NOW() + INTERVAL '100 years',
  conversations_this_month = 0
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'martin@secker.no'
);
