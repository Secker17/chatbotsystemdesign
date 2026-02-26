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
    let { data, error } = await db
      .from('chatbot_configs')
      .select('id')
      .eq('admin_id', workspaceId)
      .limit(1)
      .single()

    // If no config exists, create one automatically
    if (error || !data) {
      const defaultConfig = {
        admin_id: workspaceId,
        widget_title: 'Chat with us',
        welcome_message: 'Hello! How can I help you today?',
        primary_color: '#3b82f6',
        position: 'bottom-right',
        avatar_url: 'icon:chat',
        show_branding: true,
        placeholder_text: 'Type your message...',
        offline_message: 'We are currently offline. Please leave a message.',
        launcher_text: 'Chat with us',
        launcher_text_enabled: false,
        business_hours_enabled: false,
        ai_enabled: false,
        ai_system_prompt: 'You are a helpful customer support assistant.',
        ai_model: 'grok-3-mini',
        ai_temperature: 0.7,
        ai_max_tokens: 500,
        greeting_enabled: true,
        greeting_message: 'Hi there!',
        greeting_subtext: 'How can I help you today?',
      }

      const { data: newConfig, error: createError } = await db
        .from('chatbot_configs')
        .insert(defaultConfig)
        .select('id')
        .single()

      if (createError) {
        console.error('Failed to create chatbot config:', createError)
        return NextResponse.json({ chatbotId: null, error: 'Failed to create config' })
      }

      return NextResponse.json({ chatbotId: newConfig?.id || null, created: true })
    }

    return NextResponse.json({ chatbotId: data?.id || null })
  } catch (err) {
    console.error('Chatbot ID API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
