-- 009: Team members and invitations

CREATE TABLE IF NOT EXISTS public.team_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  status TEXT NOT NULL DEFAULT 'pending',
  token TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days')
);

CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(admin_id, user_id)
);

ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "team_invitations_select" ON public.team_invitations FOR SELECT USING (true);
CREATE POLICY "team_invitations_insert" ON public.team_invitations FOR INSERT WITH CHECK (auth.uid() = admin_id);
CREATE POLICY "team_invitations_update" ON public.team_invitations FOR UPDATE USING (auth.uid() = admin_id);
CREATE POLICY "team_invitations_delete" ON public.team_invitations FOR DELETE USING (auth.uid() = admin_id);

CREATE POLICY "team_members_select" ON public.team_members FOR SELECT USING (auth.uid() = admin_id OR auth.uid() = user_id);
CREATE POLICY "team_members_insert" ON public.team_members FOR INSERT WITH CHECK (auth.uid() = admin_id);
CREATE POLICY "team_members_update" ON public.team_members FOR UPDATE USING (auth.uid() = admin_id);
CREATE POLICY "team_members_delete" ON public.team_members FOR DELETE USING (auth.uid() = admin_id);

CREATE INDEX IF NOT EXISTS idx_team_invitations_admin_id ON public.team_invitations(admin_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_email ON public.team_invitations(email);
CREATE INDEX IF NOT EXISTS idx_team_invitations_token ON public.team_invitations(token);
CREATE INDEX IF NOT EXISTS idx_team_members_admin_id ON public.team_members(admin_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON public.team_members(user_id);
