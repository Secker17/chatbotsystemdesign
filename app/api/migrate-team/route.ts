import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Migration endpoint — just verifies team tables exist
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

  // Check team_invitations
  const { error: invErr } = await supabase.from('team_invitations').select('id').limit(1)
  // Check team_members
  const { error: memErr } = await supabase.from('team_members').select('id').limit(1)

  const tablesReady = !invErr && !memErr

  return NextResponse.json({ tablesReady })
}
