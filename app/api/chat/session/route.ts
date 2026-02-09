import { createPublicClient } from '@/lib/supabase/public'
import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { getPlanLimits, type PlanId } from '@/lib/products'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function POST(request: NextRequest) {
  try {
    const { chatbot_id, visitor_name, visitor_email } = await request.json()

    if (!chatbot_id) {
      return NextResponse.json({ error: 'Missing chatbot_id' }, { status: 400, headers: corsHeaders })
    }

    const supabase = createPublicClient()

    // Get the admin_id and AI config from the chatbot config
    const { data: config, error: configError } = await supabase
      .from('chatbot_configs')
      .select('admin_id, ai_enabled, ai_auto_greet, ai_greeting_message')
      .eq('id', chatbot_id)
      .single()

    if (configError || !config) {
      console.error('Config fetch error:', configError)
      return NextResponse.json({ error: 'Chatbot not found' }, { status: 404, headers: corsHeaders })
    }

    // Check plan conversation limits
    const { data: adminProfile } = await supabase
      .from('admin_profiles')
      .select('plan, conversations_this_month, conversations_reset_at')
      .eq('id', config.admin_id)
      .single()

    const adminPlan = (adminProfile?.plan as PlanId) || 'starter'
    const planLimits = getPlanLimits(adminPlan)
    const conversationsThisMonth = adminProfile?.conversations_this_month || 0

    // Check if we need to reset the monthly counter
    const resetAt = adminProfile?.conversations_reset_at
    const now = new Date()
    let actualConversations = conversationsThisMonth
    if (resetAt) {
      const resetDate = new Date(resetAt)
      const monthsSinceReset = (now.getFullYear() - resetDate.getFullYear()) * 12 + (now.getMonth() - resetDate.getMonth())
      if (monthsSinceReset >= 1) {
        // Reset counter
        actualConversations = 0
        await supabase
          .from('admin_profiles')
          .update({
            conversations_this_month: 0,
            conversations_reset_at: now.toISOString(),
          })
          .eq('id', config.admin_id)
      }
    }

    if (actualConversations >= planLimits.maxConversationsPerMonth) {
      return NextResponse.json(
        { error: 'Monthly conversation limit reached. The site owner needs to upgrade their plan.' },
        { status: 429, headers: corsHeaders }
      )
    }

    // Increment conversation counter
    await supabase
      .from('admin_profiles')
      .update({
        conversations_this_month: actualConversations + 1,
        conversations_reset_at: adminProfile?.conversations_reset_at || now.toISOString(),
      })
      .eq('id', config.admin_id)

    // Generate a unique visitor ID for this session
    const visitor_id = `visitor_${randomUUID()}`

    // Only enable AI bot if the plan supports it
    const isBotActive = (config.ai_enabled && planLimits.aiEnabled) || false

    // Create new chat session with all required fields
    const { data: session, error: sessionError } = await supabase
      .from('chat_sessions')
      .insert({
        chatbot_id,
        admin_id: config.admin_id,
        visitor_id,
        visitor_name: visitor_name || 'Visitor',
        visitor_email: visitor_email || null,
        status: 'active',
        is_bot_active: isBotActive,
        bot_messages_count: 0,
        started_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_message_at: new Date().toISOString(),
        metadata: {
          user_agent: request.headers.get('user-agent'),
          referrer: request.headers.get('referer'),
        },
      })
      .select('id')
      .single()

    if (sessionError) {
      console.error('Session creation error:', sessionError)
      return NextResponse.json(
        { error: 'Failed to create session', details: sessionError.message },
        { status: 500, headers: corsHeaders }
      )
    }

    // Log analytics event (non-blocking)
    supabase.from('analytics_events').insert({
      admin_id: config.admin_id,
      chatbot_id,
      session_id: session.id,
      event_type: 'session_started',
      event_data: { visitor_name, visitor_email },
    }).then(() => {}).catch(() => {})

    // If AI is enabled and has a greeting, send it as the first bot message
    if (isBotActive && config.ai_auto_greet && config.ai_greeting_message) {
      await supabase.from('chat_messages').insert({
        session_id: session.id,
        admin_id: config.admin_id,
        content: config.ai_greeting_message,
        sender_type: 'bot',
        sender_id: 'ai-bot',
        is_read: false,
        is_ai_generated: true,
        metadata: { type: 'greeting' },
      })
    }

    return NextResponse.json({ 
      session_id: session.id,
      ai_enabled: isBotActive,
      ai_greeting: isBotActive && config.ai_auto_greet ? config.ai_greeting_message : null,
    }, { headers: corsHeaders })
  } catch (error) {
    console.error('Session API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: corsHeaders })
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders })
}
