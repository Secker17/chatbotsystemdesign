import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getUserPlan } from '@/lib/plan'
import { sendInviteEmail } from '@/lib/resend'
import crypto from 'crypto'

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createServiceClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

// GET /api/team — list members + pending invitations
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = getServiceClient()

  const [membersRes, invitationsRes] = await Promise.all([
    db.from('team_members')
      .select('id, user_id, role, joined_at')
      .eq('admin_id', user.id)
      .order('joined_at', { ascending: true }),
    db.from('team_invitations')
      .select('id, email, role, status, created_at, expires_at')
      .eq('admin_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false }),
  ])

  const members = membersRes.data || []
  const memberDetails = await Promise.all(
    members.map(async (m) => {
      const { data: profile } = await db
        .from('admin_profiles')
        .select('company_name')
        .eq('id', m.user_id)
        .single()
      return {
        ...m,
        email: null as string | null,
        company_name: profile?.company_name || null,
      }
    })
  )

  const plan = await getUserPlan(user.id)

  return NextResponse.json({
    members: memberDetails,
    invitations: invitationsRes.data || [],
    limits: {
      maxTeamMembers: plan.limits.maxTeamMembers,
      currentCount: members.length,
      pendingCount: (invitationsRes.data || []).length,
    },
    planId: plan.planId,
  })
}

// POST /api/team — invite a new team member
export async function POST(request: Request) {
  try {
    // Auth check with user session
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Use service role client for DB operations (bypasses RLS)
    const db = getServiceClient()

    const body = await request.json()
    const { email, role = 'member' } = body

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()

    if (normalizedEmail === user.email?.toLowerCase()) {
      return NextResponse.json({ error: 'You cannot invite yourself' }, { status: 400 })
    }

    // Check plan limits
    const plan = await getUserPlan(user.id)

    const [membersRes, pendingRes] = await Promise.all([
      db.from('team_members').select('id').eq('admin_id', user.id),
      db.from('team_invitations').select('id').eq('admin_id', user.id).eq('status', 'pending'),
    ])

    const currentCount = (membersRes.data || []).length
    const pendingCount = (pendingRes.data || []).length

    if (currentCount + pendingCount >= plan.limits.maxTeamMembers) {
      return NextResponse.json(
        { error: `Your ${plan.planId} plan allows up to ${plan.limits.maxTeamMembers} team members. Upgrade to invite more.` },
        { status: 403 }
      )
    }

    // Check if already invited
    const { data: existingInvite } = await db
      .from('team_invitations')
      .select('id')
      .eq('admin_id', user.id)
      .eq('email', normalizedEmail)
      .eq('status', 'pending')
      .single()

    if (existingInvite) {
      return NextResponse.json({ error: 'This email has already been invited' }, { status: 409 })
    }

    // Generate token and create invitation
    const token = crypto.randomBytes(32).toString('hex')

    const { data: invitation, error } = await db
      .from('team_invitations')
      .insert({
        admin_id: user.id,
        email: normalizedEmail,
        role: role === 'admin' ? 'admin' : 'member',
        token,
        status: 'pending',
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to create invitation:', error)
      return NextResponse.json(
        { error: 'Failed to create invitation', details: error.message },
        { status: 500 }
      )
    }

    // Build invite link and send email
    const host =
      request.headers.get('x-forwarded-host') ||
      request.headers.get('host') ||
      'localhost:3000'
    const protocol = host.startsWith('localhost') ? 'http' : 'https'
    const inviteLink = `${protocol}://${host}/invite/${token}`

    let emailSent = false
    let emailError: string | undefined
    try {
      console.log('[v0] Calling sendInviteEmail with:', {
        to: normalizedEmail,
        inviteLink,
        inviterEmail: user.email || 'A team admin',
        role: role === 'admin' ? 'Admin' : 'Member',
      })
      const emailResult = await sendInviteEmail({
        to: normalizedEmail,
        inviteLink,
        inviterEmail: user.email || 'A team admin',
        role: role === 'admin' ? 'Admin' : 'Member',
      })
      console.log('[v0] sendInviteEmail result:', emailResult)
      emailSent = emailResult.success
      if (!emailResult.success) {
        emailError = emailResult.error
        console.error('[v0] Email send failed:', emailResult.error)
      }
    } catch (err) {
      emailError = err instanceof Error ? err.message : 'Unknown error'
      console.error('[v0] Email send threw:', err)
    }

    return NextResponse.json({
      invitation,
      emailSent,
      emailError,
      inviteLink,
    })
  } catch (err) {
    console.error('Team POST unhandled error:', err)
    return NextResponse.json(
      { error: 'Internal server error', details: err instanceof Error ? err.message : 'Unknown' },
      { status: 500 }
    )
  }
}

// DELETE /api/team — revoke invitation or remove member
export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = getServiceClient()

  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') // 'invitation' or 'member'
  const id = searchParams.get('id')

  if (!type || !id) {
    return NextResponse.json({ error: 'Missing type or id parameter' }, { status: 400 })
  }

  if (type === 'invitation') {
    const { error } = await db
      .from('team_invitations')
      .delete()
      .eq('id', id)
      .eq('admin_id', user.id)

    if (error) {
      return NextResponse.json({ error: 'Failed to revoke invitation' }, { status: 500 })
    }
  } else if (type === 'member') {
    const { error } = await db
      .from('team_members')
      .delete()
      .eq('id', id)
      .eq('admin_id', user.id)

    if (error) {
      return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 })
    }
  } else {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
