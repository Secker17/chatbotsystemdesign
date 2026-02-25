import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Migration endpoint for team tables
// Visit /api/migrate-team to check status
// Run the SQL in Supabase SQL Editor if tables don't exist
export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json(
      { error: 'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' },
      { status: 500 }
    )
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const results: { step: string; status: string; error?: string }[] = []

  // Check team_invitations
  const { error: invErr } = await supabase.from('team_invitations').select('id').limit(1)
  results.push({
    step: 'Verify table: team_invitations',
    status: invErr ? 'MISSING' : 'EXISTS',
    error: invErr?.message,
  })

  // Check team_members
  const { error: memErr } = await supabase.from('team_members').select('id').limit(1)
  results.push({
    step: 'Verify table: team_members',
    status: memErr ? 'MISSING' : 'EXISTS',
    error: memErr?.message,
  })

  const allExist = results.every(r => r.status === 'EXISTS')

  const migrationSql = `
-- =====================================================
-- Team Tables Migration
-- Run this in Supabase Dashboard > SQL Editor
-- =====================================================

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

-- RLS for team_invitations
CREATE POLICY "team_invitations_select" ON public.team_invitations FOR SELECT USING (true);
CREATE POLICY "team_invitations_insert" ON public.team_invitations FOR INSERT WITH CHECK (auth.uid() = admin_id);
CREATE POLICY "team_invitations_update" ON public.team_invitations FOR UPDATE USING (auth.uid() = admin_id);
CREATE POLICY "team_invitations_delete" ON public.team_invitations FOR DELETE USING (auth.uid() = admin_id);

-- RLS for team_members
CREATE POLICY "team_members_select" ON public.team_members FOR SELECT USING (auth.uid() = admin_id OR auth.uid() = user_id);
CREATE POLICY "team_members_insert" ON public.team_members FOR INSERT WITH CHECK (auth.uid() = admin_id);
CREATE POLICY "team_members_update" ON public.team_members FOR UPDATE USING (auth.uid() = admin_id);
CREATE POLICY "team_members_delete" ON public.team_members FOR DELETE USING (auth.uid() = admin_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_team_invitations_admin_id ON public.team_invitations(admin_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_email ON public.team_invitations(email);
CREATE INDEX IF NOT EXISTS idx_team_invitations_token ON public.team_invitations(token);
CREATE INDEX IF NOT EXISTS idx_team_members_admin_id ON public.team_members(admin_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON public.team_members(user_id);
`

  return NextResponse.json({
    message: allExist
      ? 'Team tables are ready!'
      : 'Team tables need to be created. Run the SQL below in your Supabase Dashboard > SQL Editor.',
    tablesReady: allExist,
    results,
    ...(allExist ? {} : {
      migrationSql,
      instructions: [
        '1. Go to your Supabase Dashboard > SQL Editor',
        '2. Paste the migrationSql content into the SQL Editor',
        '3. Click "Run" to execute the migration',
        '4. Visit /api/migrate-team again to verify tables exist',
      ],
    }),
  })
}
