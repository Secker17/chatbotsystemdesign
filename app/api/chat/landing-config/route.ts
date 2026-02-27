import { createPublicClient } from '@/lib/supabase/public'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = createPublicClient()

    // Find the chatbot config flagged as the landing widget
    // Use SELECT * to get all available columns, but safely handle missing ones
    const { data: fullData, error } = await supabase
      .from('chatbot_configs')
      .select('*')
      .eq('is_landing_widget', true)
      .limit(1)
      .single()

    if (error || !fullData) {
      // Fallback if no landing widget configured
      return NextResponse.json({
        enabled: false,
        chatbot_id: null,
        config: null,
      }, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        },
      })
    }

    // Build safe response - derive greeting_enabled from greeting_message
    const config = {
      widget_title: fullData.widget_title ?? 'Chat with us',
      welcome_message: fullData.welcome_message ?? 'Hello! How can I help you today?',
      primary_color: fullData.primary_color ?? '#F5B800',
      position: fullData.position ?? 'bottom-right',
      avatar_url: fullData.avatar_url ?? null,
      show_branding: fullData.show_branding ?? true,
      placeholder_text: fullData.placeholder_text ?? 'Type your message...',
      ai_enabled: fullData.ai_enabled ?? false,
      quick_replies: fullData.quick_replies ?? [],
      greeting_message: fullData.greeting_message ?? 'Hi there!',
      greeting_subtext: fullData.greeting_subtext ?? 'How can I help you today?',
      // Derive greeting_enabled from greeting_message being set
      greeting_enabled: Boolean(fullData.greeting_message),
    }

    return NextResponse.json(
      {
        enabled: fullData.landing_widget_enabled ?? true,
        chatbot_id: fullData.id,
        config,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    )
  } catch (error) {
    console.error('[v0] Landing config API error:', error)
    return NextResponse.json(
      { enabled: false, chatbot_id: null, config: null },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        },
      }
    )
  }
}
