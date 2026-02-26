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

// Create or get existing chatbot config for a workspace
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { workspaceId } = await request.json()
    const targetWorkspaceId = workspaceId || user.id

    // Validate user has access to this workspace
    if (targetWorkspaceId !== user.id) {
      const db = getServiceClient()
      const { data: membership } = await db
        .from('team_members')
        .select('id, role')
        .eq('admin_id', targetWorkspaceId)
        .eq('user_id', user.id)
        .single()

      // Only owner/admin can create chatbot configs
      if (!membership || !['owner', 'admin'].includes(membership.role)) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    }

    const db = getServiceClient()

    // Check if config already exists
    const { data: existingConfig } = await db
      .from('chatbot_configs')
      .select('*')
      .eq('admin_id', targetWorkspaceId)
      .limit(1)
      .single()

    if (existingConfig) {
      return NextResponse.json({ config: existingConfig, created: false })
    }

    // Create new default config - only include columns that exist in the base schema
    // Additional columns (greeting_*, quick_replies, is_landing_widget, etc.) will use 
    // their default values from migrations if those migrations have been run
    const defaultConfig = {
      admin_id: targetWorkspaceId,
      name: 'My Chatbot',
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
      ai_system_prompt: 'You are a helpful customer support assistant. Be friendly, professional, and concise.',
      ai_knowledge_base: '',
      ai_model: 'grok-3-mini',
      ai_temperature: 0.7,
      ai_max_tokens: 500,
      ai_auto_greet: false,
      ai_greeting_message: 'Hi! I\'m an AI assistant. How can I help you today?',
      ai_handoff_keywords: ['human', 'agent', 'person', 'speak to someone'],
    }

    const { data: newConfig, error } = await db
      .from('chatbot_configs')
      .insert(defaultConfig)
      .select()
      .single()

    if (error) {
      console.error('Failed to create chatbot config:', error)
      return NextResponse.json({ error: 'Failed to create chatbot configuration' }, { status: 500 })
    }

    return NextResponse.json({ config: newConfig, created: true })
  } catch (err) {
    console.error('Chatbot setup API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
