import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export interface WorkspaceInfo {
  id: string
  name: string
  isOwn: boolean
  role: 'owner' | 'admin' | 'member'
  ownerEmail: string | null
}

// GET /api/workspace — list all workspaces the user can access + the active one
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const db = getServiceClient()

    // 1) User's own workspace
    const { data: ownProfile } = await db
      .from('admin_profiles')
      .select('id, company_name')
      .eq('id', user.id)
      .single()

    const workspaces: WorkspaceInfo[] = [
      {
        id: user.id,
        name: ownProfile?.company_name || 'My Workspace',
        isOwn: true,
        role: 'owner',
        ownerEmail: user.email || null,
      },
    ]

    // 2) Workspaces the user has been invited to (via team_members)
    const { data: memberships } = await db
      .from('team_members')
      .select('admin_id, role')
      .eq('user_id', user.id)

    if (memberships && memberships.length > 0) {
      const adminIds = memberships.map((m) => m.admin_id)

      // Fetch profiles for each admin
      const { data: adminProfiles } = await db
        .from('admin_profiles')
        .select('id, company_name')
        .in('id', adminIds)

      // Fetch admin emails from auth.users via service client
      for (const membership of memberships) {
        const adminProfile = adminProfiles?.find((p) => p.id === membership.admin_id)
        const { data: adminUser } = await db.auth.admin.getUserById(membership.admin_id)

        workspaces.push({
          id: membership.admin_id,
          name: adminProfile?.company_name || adminUser?.user?.email || 'Team Workspace',
          isOwn: false,
          role: membership.role as 'admin' | 'member',
          ownerEmail: adminUser?.user?.email || null,
        })
      }
    }

    // 3) Get active workspace from cookie
    const cookieStore = await cookies()
    const activeWorkspaceId = cookieStore.get('active_workspace')?.value || user.id

    // Validate active workspace is one the user can access
    const validWorkspace = workspaces.find((w) => w.id === activeWorkspaceId)
    const resolvedWorkspaceId = validWorkspace ? activeWorkspaceId : user.id

    return NextResponse.json({
      workspaces,
      activeWorkspaceId: resolvedWorkspaceId,
      activeWorkspace: workspaces.find((w) => w.id === resolvedWorkspaceId),
    })
  } catch (err) {
    console.error('Workspace GET error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/workspace — switch active workspace
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { workspaceId } = await request.json()
    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId required' }, { status: 400 })
    }

    const db = getServiceClient()

    // Validate the user can access this workspace
    const isOwn = workspaceId === user.id
    if (!isOwn) {
      const { data: membership } = await db
        .from('team_members')
        .select('id')
        .eq('admin_id', workspaceId)
        .eq('user_id', user.id)
        .single()

      if (!membership) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    }

    // Set cookie
    const cookieStore = await cookies()
    cookieStore.set('active_workspace', workspaceId, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365, // 1 year
    })

    return NextResponse.json({ success: true, activeWorkspaceId: workspaceId })
  } catch (err) {
    console.error('Workspace POST error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
