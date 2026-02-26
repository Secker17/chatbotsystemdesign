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
      .select('id, ai_enabled, ai_system_prompt, ai_knowledge_base, ai_model, ai_temperature, ai_max_tokens, ai_auto_greet, ai_greeting_message, ai_handoff_keywords')
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
        avatar_url: 'icon:glass-orb',
        show_branding: true,
        placeholder_text: 'Type your message...',
        offline_message: 'We are currently offline.',
        ai_enabled: false,
        ai_system_prompt: 'You are a helpful customer support assistant.',
        ai_model: 'grok-3-mini',
        ai_temperature: 0.7,
        ai_max_tokens: 500,
        greeting_message: 'Hi there!',
        greeting_subtext: 'How can I help you today?',
      }

      const { data: newConfig, error: createError } = await db
        .from('chatbot_configs')
        .insert(defaultConfig)
        .select('id, ai_enabled, ai_system_prompt, ai_knowledge_base, ai_model, ai_temperature, ai_max_tokens, ai_auto_greet, ai_greeting_message, ai_handoff_keywords')
        .single()

      if (createError) {
        console.error('Failed to create chatbot config:', createError)
        return NextResponse.json({ config: null, error: 'Failed to create config' })
      }

      return NextResponse.json({ config: newConfig, created: true })
    }

    return NextResponse.json({ config: data })
  } catch (err) {
    console.error('AI config API error:', err)
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
        ai_enabled: config.ai_enabled,
        ai_system_prompt: config.ai_system_prompt,
        ai_knowledge_base: config.ai_knowledge_base,
        ai_model: config.ai_model,
        ai_temperature: config.ai_temperature,
        ai_max_tokens: config.ai_max_tokens,
        ai_auto_greet: config.ai_auto_greet,
        ai_greeting_message: config.ai_greeting_message,
        ai_handoff_keywords: config.ai_handoff_keywords,
        updated_at: new Date().toISOString(),
      })
      .eq('id', config.id)

    if (error) {
      console.error('AI config save error:', error)
      return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('AI config POST error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
