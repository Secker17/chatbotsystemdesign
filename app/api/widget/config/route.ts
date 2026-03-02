import { createPublicClient } from '@/lib/supabase/public'
import { NextRequest, NextResponse } from 'next/server'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const chatbotId = searchParams.get('chatbotId')
    
    if (!chatbotId) {
      return NextResponse.json(
        { error: 'Chatbot ID is required' },
        { status: 400, headers: CORS_HEADERS }
      )
    }

    const supabase = createPublicClient()
    
    // Get chatbot configuration - only select existing columns
    const { data: chatbot, error } = await supabase
      .from('chatbot_configs')
      .select(`
        id,
        widget_title,
        welcome_message,
        primary_color,
        position,
        avatar_url,
        avatar_glyph,
        show_branding,
        offline_message,
        placeholder_text,
        launcher_text,
        launcher_text_enabled,
        business_hours_enabled,
        business_hours,
        business_hours_timezone,
        outside_hours_message,
        greeting_message,
        greeting_subtext,
        quick_replies,
        ai_enabled
      `)
      .eq('id', chatbotId)
      .single()

    if (error || !chatbot) {
      console.error('[v0] Widget config error for chatbot:', chatbotId, error?.message)
      return NextResponse.json(
        { error: 'Chatbot not found' },
        { status: 404, headers: CORS_HEADERS }
      )
    }

    // Return configuration - derive greeting_enabled from greeting_message
    return NextResponse.json({
      config: {
        id: chatbot.id,
        widget_title: chatbot.widget_title || 'Chat Support',
        welcome_message: chatbot.welcome_message || 'How can we help you?',
        primary_color: chatbot.primary_color || '#3b82f6',
        position: chatbot.position || 'bottom-right',
        avatar_url: chatbot.avatar_url || 'icon:glass-orb',
        avatar_glyph: chatbot.avatar_glyph || 'A',
        show_branding: chatbot.show_branding ?? true,
        offline_message: chatbot.offline_message || 'We are offline. Leave a message.',
        placeholder_text: chatbot.placeholder_text || 'Type your message...',
        launcher_text: chatbot.launcher_text || null,
        launcher_text_enabled: chatbot.launcher_text_enabled ?? false,
        business_hours_enabled: chatbot.business_hours_enabled ?? false,
        business_hours: chatbot.business_hours || null,
        business_hours_timezone: chatbot.business_hours_timezone || 'UTC',
        outside_hours_message: chatbot.outside_hours_message || null,
        greeting_message: chatbot.greeting_message || null,
        greeting_subtext: chatbot.greeting_subtext || '',
        greeting_enabled: Boolean(chatbot.greeting_message),
        quick_replies: chatbot.quick_replies || [],
        ai_enabled: chatbot.ai_enabled ?? false,
      }
    }, { headers: CORS_HEADERS })

  } catch (error) {
    console.error('[v0] Widget config error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: CORS_HEADERS }
    )
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: CORS_HEADERS,
  })
}
