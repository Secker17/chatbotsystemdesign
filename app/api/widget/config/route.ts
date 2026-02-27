import { createClient } from '@/lib/supabase/client'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const chatbotId = searchParams.get('chatbotId')
    
    if (!chatbotId) {
      return NextResponse.json(
        { error: 'Chatbot ID is required' },
        { status: 400 }
      )
    }

    const supabase = createClient()
    
    // Get chatbot configuration from chatbot_configs table
    const { data: chatbot, error } = await supabase
      .from('chatbot_configs')
      .select('*')
      .eq('id', chatbotId)
      .single()

    if (error || !chatbot) {
      console.error('Widget config error:', error?.message)
      return NextResponse.json(
        { error: 'Chatbot not found' },
        { status: 404 }
      )
    }

    // Return configuration - derive greeting_enabled from greeting_message
    return NextResponse.json({
      config: {
        id: chatbot.id,
        widget_title: chatbot.widget_title,
        welcome_message: chatbot.welcome_message,
        primary_color: chatbot.primary_color,
        position: chatbot.position,
        avatar_url: chatbot.avatar_url,
        show_branding: chatbot.show_branding,
        offline_message: chatbot.offline_message,
        placeholder_text: chatbot.placeholder_text,
        launcher_text: chatbot.launcher_text,
        launcher_text_enabled: chatbot.launcher_text_enabled,
        business_hours_enabled: chatbot.business_hours_enabled,
        business_hours: chatbot.business_hours,
        business_hours_timezone: chatbot.business_hours_timezone,
        outside_hours_message: chatbot.outside_hours_message,
        greeting_message: chatbot.greeting_message,
        greeting_subtext: chatbot.greeting_subtext,
        greeting_enabled: Boolean(chatbot.greeting_message),
        quick_replies: chatbot.quick_replies,
        ai_enabled: chatbot.ai_enabled,
      }
    })

  } catch (error) {
    console.error('Widget config error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
