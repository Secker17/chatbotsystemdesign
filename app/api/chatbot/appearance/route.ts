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
  avatar_url: 'icon:glass-orb',
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
    
    // Build update object with only defined values
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }
    
    // Core appearance fields - these should always exist
    if (config.widget_title !== undefined) updateData.widget_title = config.widget_title
    if (config.welcome_message !== undefined) updateData.welcome_message = config.welcome_message
    if (config.primary_color !== undefined) updateData.primary_color = config.primary_color
    if (config.position !== undefined) updateData.position = config.position
    if (config.avatar_url !== undefined) updateData.avatar_url = config.avatar_url
    if (config.show_branding !== undefined) updateData.show_branding = config.show_branding
    if (config.offline_message !== undefined) updateData.offline_message = config.offline_message
    if (config.placeholder_text !== undefined) updateData.placeholder_text = config.placeholder_text
    if (config.launcher_text !== undefined) updateData.launcher_text = config.launcher_text
    if (config.launcher_text_enabled !== undefined) updateData.launcher_text_enabled = config.launcher_text_enabled
    if (config.business_hours_enabled !== undefined) updateData.business_hours_enabled = config.business_hours_enabled
    if (config.business_hours !== undefined) updateData.business_hours = config.business_hours
    if (config.business_hours_timezone !== undefined) updateData.business_hours_timezone = config.business_hours_timezone
    if (config.outside_hours_message !== undefined) updateData.outside_hours_message = config.outside_hours_message
    
    // Optional fields that may not exist in all database schemas
    // Note: greeting_enabled column removed - always enabled by default
    if (config.greeting_message !== undefined) updateData.greeting_message = config.greeting_message
    if (config.greeting_subtext !== undefined) updateData.greeting_subtext = config.greeting_subtext
    if (config.quick_replies !== undefined) updateData.quick_replies = config.quick_replies

    console.log('[v0] Updating chatbot config:', config.id, 'with data:', updateData)
    
    const { data: updatedData, error } = await db
      .from('chatbot_configs')
      .update(updateData)
      .eq('id', config.id)
      .select()
      .single()

    if (error) {
      console.error('[v0] Appearance config save error:', error)
      return NextResponse.json({ error: 'Failed to save: ' + error.message }, { status: 500 })
    }

    console.log('[v0] Successfully updated config:', updatedData?.id, 'primary_color:', updatedData?.primary_color, 'avatar_url:', updatedData?.avatar_url)

    return NextResponse.json({ success: true, config: updatedData })
  } catch (err) {
    console.error('Appearance config POST error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
