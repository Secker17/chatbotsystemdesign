CREATE TABLE IF NOT EXISTS team_invitations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  team_owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'member',
  token uuid DEFAULT gen_random_uuid() NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '7 days')
);

ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;
