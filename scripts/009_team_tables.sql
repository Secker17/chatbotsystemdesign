-- 009: Team members and invitations
-- Adds team collaboration support with invitation workflow

-- =============================================================================
-- 1. CREATE TABLES
-- =============================================================================

-- Team invitations table
CREATE TABLE IF NOT EXISTS public.team_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'admin')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  token TEXT UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days')
);

-- Team members table
CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'admin')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(admin_id, user_id)
);

-- =============================================================================
-- 2. ENABLE RLS
-- =============================================================================
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 3. RLS POLICIES
-- =============================================================================

-- Team invitations: workspace owner can manage, invited user can view their own
DROP POLICY IF EXISTS "team_invitations_select_owner" ON public.team_invitations;
CREATE POLICY "team_invitations_select_owner" ON public.team_invitations
  FOR SELECT USING (auth.uid() = admin_id);

DROP POLICY IF EXISTS "team_invitations_insert_owner" ON public.team_invitations;
CREATE POLICY "team_invitations_insert_owner" ON public.team_invitations
  FOR INSERT WITH CHECK (auth.uid() = admin_id);

DROP POLICY IF EXISTS "team_invitations_update_owner" ON public.team_invitations;
CREATE POLICY "team_invitations_update_owner" ON public.team_invitations
  FOR UPDATE USING (auth.uid() = admin_id);

DROP POLICY IF EXISTS "team_invitations_delete_owner" ON public.team_invitations;
CREATE POLICY "team_invitations_delete_owner" ON public.team_invitations
  FOR DELETE USING (auth.uid() = admin_id);

-- Allow public select for token-based accept flow (service role handles accept)
DROP POLICY IF EXISTS "team_invitations_select_by_token" ON public.team_invitations;
CREATE POLICY "team_invitations_select_by_token" ON public.team_invitations
  FOR SELECT USING (true);

-- Team members: workspace owner + the member themselves can view
DROP POLICY IF EXISTS "team_members_select_owner" ON public.team_members;
CREATE POLICY "team_members_select_owner" ON public.team_members
  FOR SELECT USING (auth.uid() = admin_id OR auth.uid() = user_id);

DROP POLICY IF EXISTS "team_members_insert_owner" ON public.team_members;
CREATE POLICY "team_members_insert_owner" ON public.team_members
  FOR INSERT WITH CHECK (auth.uid() = admin_id);

DROP POLICY IF EXISTS "team_members_update_owner" ON public.team_members;
CREATE POLICY "team_members_update_owner" ON public.team_members
  FOR UPDATE USING (auth.uid() = admin_id);

DROP POLICY IF EXISTS "team_members_delete_owner" ON public.team_members;
CREATE POLICY "team_members_delete_owner" ON public.team_members
  FOR DELETE USING (auth.uid() = admin_id);

-- =============================================================================
-- 4. INDEXES
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_team_invitations_admin_id ON public.team_invitations(admin_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_email ON public.team_invitations(email);
CREATE INDEX IF NOT EXISTS idx_team_invitations_token ON public.team_invitations(token);
CREATE INDEX IF NOT EXISTS idx_team_invitations_status ON public.team_invitations(status);
CREATE INDEX IF NOT EXISTS idx_team_members_admin_id ON public.team_members(admin_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON public.team_members(user_id);
