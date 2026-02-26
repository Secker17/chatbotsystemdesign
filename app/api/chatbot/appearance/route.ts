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

const DEFAULT_CONFIG = {
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
  business_hours: null,
  business_hours_timezone: 'UTC',
  outside_hours_message: 'We are currently outside business hours.',
  ai_enabled: false,
  ai_system_prompt: 'You are a helpful customer support assistant.',
  ai_model: 'grok-3-mini',
  ai_temperature: 0.7,
  ai_max_tokens: 500,
  greeting_enabled: true,
  greeting_message: 'Hi there!',
  greeting_subtext: 'How can I help you today?',
  quick_replies: [],
  is_landing_widget: false,
  landing_widget_enabled: false,
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
      .select('*')
      .eq('admin_id', workspaceId)

    // If no config exists, create one automatically
    if (error || !data || data.length === 0) {
      const newConfig = {
        admin_id: workspaceId,
        ...DEFAULT_CONFIG,
      }

      const { data: createdConfig, error: createError } = await db
        .from('chatbot_configs')
        .insert(newConfig)
        .select()
        .single()

      if (createError) {
        console.error('Failed to create chatbot config:', createError)
        return NextResponse.json({ configs: [], error: 'Failed to create config' })
      }

      return NextResponse.json({ configs: [createdConfig], created: true })
    }

    return NextResponse.json({ configs: data })
  } catch (err) {
    console.error('Appearance config API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { workspaceId, config } = body

    // Validate user has edit access to this workspace
    if (workspaceId !== user.id) {
      const db = getServiceClient()
      const { data: membership } = await db
        .from('team_members')
        .select('role')
        .eq('admin_id', workspaceId)
        .eq('user_id', user.id)
        .single()

      if (!membership || membership.role === 'member') {
        return NextResponse.json({ error: 'Access denied - need admin role' }, { status: 403 })
      }
    }

    // Use service client to bypass RLS
    const db = getServiceClient()
    const { error } = await db
      .from('chatbot_configs')
      .update({
        widget_title: config.widget_title,
        welcome_message: config.welcome_message,
        primary_color: config.primary_color,
        position: config.position,
        avatar_url: config.avatar_url,
        show_branding: config.show_branding,
        offline_message: config.offline_message,
        placeholder_text: config.placeholder_text,
        launcher_text: config.launcher_text,
        launcher_text_enabled: config.launcher_text_enabled,
        business_hours_enabled: config.business_hours_enabled,
        business_hours: config.business_hours,
        business_hours_timezone: config.business_hours_timezone,
        outside_hours_message: config.outside_hours_message,
        greeting_enabled: config.greeting_enabled,
        greeting_message: config.greeting_message,
        greeting_subtext: config.greeting_subtext,
        quick_replies: config.quick_replies,
        updated_at: new Date().toISOString(),
      })
      .eq('id', config.id)

    if (error) {
      console.error('Appearance config save error:', error)
      return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Appearance config POST error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
