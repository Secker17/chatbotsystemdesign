-- Add business hours columns to chatbot_configs
ALTER TABLE chatbot_configs
  ADD COLUMN IF NOT EXISTS business_hours_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS business_hours_timezone text DEFAULT 'Europe/Oslo',
  ADD COLUMN IF NOT EXISTS business_hours jsonb DEFAULT '{
    "monday": {"enabled": true, "open": "09:00", "close": "17:00"},
    "tuesday": {"enabled": true, "open": "09:00", "close": "17:00"},
    "wednesday": {"enabled": true, "open": "09:00", "close": "17:00"},
    "thursday": {"enabled": true, "open": "09:00", "close": "17:00"},
    "friday": {"enabled": true, "open": "09:00", "close": "17:00"},
    "saturday": {"enabled": false, "open": "10:00", "close": "16:00"},
    "sunday": {"enabled": false, "open": "10:00", "close": "16:00"}
  }'::jsonb,
  ADD COLUMN IF NOT EXISTS outside_hours_message text DEFAULT 'We are currently offline. Please leave a message and we will get back to you during business hours.';
