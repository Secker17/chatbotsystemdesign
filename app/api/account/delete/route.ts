import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function DELETE() {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const userId = user.id

    // Delete all user data from the database first
    // The cascade deletes should handle most relations, but let's be explicit
    
    // Delete chatbot configs (this should cascade to chat_sessions and messages)
    const { error: configError } = await supabase
      .from('chatbot_configs')
      .delete()
      .eq('admin_id', userId)
    
    if (configError) {
      console.error('Error deleting chatbot configs:', configError)
    }

    // Delete admin profile
    const { error: profileError } = await supabase
      .from('admin_profiles')
      .delete()
      .eq('id', userId)
    
    if (profileError) {
      console.error('Error deleting admin profile:', profileError)
    }

    // Delete team memberships where user is a member
    const { error: teamMemberError } = await supabase
      .from('team_members')
      .delete()
      .eq('user_id', userId)
    
    if (teamMemberError) {
      console.error('Error deleting team memberships:', teamMemberError)
    }

    // Delete team memberships where user is the owner (workspace owner)
    const { error: teamOwnerError } = await supabase
      .from('team_members')
      .delete()
      .eq('workspace_id', userId)
    
    if (teamOwnerError) {
      console.error('Error deleting team owner memberships:', teamOwnerError)
    }

    // Now delete the user from Supabase Auth using admin client
    const supabaseAdmin = createAdminClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(userId)
    
    if (deleteAuthError) {
      console.error('Error deleting auth user:', deleteAuthError)
      return NextResponse.json(
        { error: 'Failed to delete user account' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete account error:', error)
    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 }
    )
  }
}
