import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('workspaceId') || user.id

    // Validate user has access to this workspace
    if (workspaceId !== user.id) {
      const db = getServiceClient()
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

    // Use service client to bypass RLS
    const db = getServiceClient()
    const { data, error } = await db
      .from('chatbot_configs')
      .select('id')
      .eq('admin_id', workspaceId)
      .limit(1)
      .single()

    if (error) {
      console.error('Chatbot ID fetch error:', error)
      return NextResponse.json({ chatbotId: null })
    }

    return NextResponse.json({ chatbotId: data?.id || null })
  } catch (err) {
    console.error('Chatbot ID API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
