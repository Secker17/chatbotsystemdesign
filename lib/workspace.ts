import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

/**
 * Server-side helper: returns the active workspace admin_id.
 * Falls back to the authenticated user's own ID if no workspace is selected
 * or if the workspace cookie points to an invalid workspace.
 */
export async function getActiveWorkspaceId(): Promise<string> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const cookieStore = await cookies()
  const workspaceCookie = cookieStore.get('active_workspace')?.value

  if (!workspaceCookie || workspaceCookie === user.id) {
    return user.id
  }

  // Validate the user has access to this workspace
  const db = getServiceClient()
  const { data: membership } = await db
    .from('team_members')
    .select('id')
    .eq('admin_id', workspaceCookie)
    .eq('user_id', user.id)
    .single()

  if (membership) {
    return workspaceCookie
  }

  // Invalid workspace — fall back to own
  return user.id
}
