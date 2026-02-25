import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/team/accept — accept an invitation via token
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'You must be logged in to accept an invitation' }, { status: 401 })

  const body = await request.json()
  const { token } = body

  if (!token || typeof token !== 'string') {
    return NextResponse.json({ error: 'Invalid invitation token' }, { status: 400 })
  }

  // Look up invitation by token
  const { data: invitation, error: lookupError } = await supabase
    .from('team_invitations')
    .select('*')
    .eq('token', token)
    .eq('status', 'pending')
    .single()

  if (lookupError || !invitation) {
    return NextResponse.json({ error: 'Invitation not found or has already been used' }, { status: 404 })
  }

  // Check if expired
  if (new Date(invitation.expires_at) < new Date()) {
    await supabase
      .from('team_invitations')
      .update({ status: 'expired' })
      .eq('id', invitation.id)

    return NextResponse.json({ error: 'This invitation has expired' }, { status: 410 })
  }

  // Check if user email matches the invitation email
  if (user.email?.toLowerCase() !== invitation.email.toLowerCase()) {
    return NextResponse.json(
      { error: `This invitation was sent to ${invitation.email}. Please log in with that email to accept.` },
      { status: 403 }
    )
  }

  // Check if already a member
  const { data: existingMember } = await supabase
    .from('team_members')
    .select('id')
    .eq('admin_id', invitation.admin_id)
    .eq('user_id', user.id)
    .single()

  if (existingMember) {
    // Mark invitation as accepted and return
    await supabase
      .from('team_invitations')
      .update({ status: 'accepted' })
      .eq('id', invitation.id)

    return NextResponse.json({ message: 'You are already a member of this team' })
  }

  // Add as team member
  const { error: insertError } = await supabase
    .from('team_members')
    .insert({
      admin_id: invitation.admin_id,
      user_id: user.id,
      role: invitation.role,
    })

  if (insertError) {
    console.error('Failed to add team member:', insertError)
    return NextResponse.json({ error: 'Failed to join team' }, { status: 500 })
  }

  // Mark invitation as accepted
  await supabase
    .from('team_invitations')
    .update({ status: 'accepted' })
    .eq('id', invitation.id)

  return NextResponse.json({ message: 'Successfully joined the team!' })
}
