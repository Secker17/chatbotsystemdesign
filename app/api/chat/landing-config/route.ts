import { createPublicClient } from '@/lib/supabase/public'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = createPublicClient()

    // Find the chatbot config flagged as the landing widget
    let data: Record<string, unknown> | null = null

    // Try without greeting_enabled first (column may not exist)
    const { data: fullData, error: fullError } = await supabase
      .from('chatbot_configs')
      .select(
        'id, widget_title, welcome_message, primary_color, position, avatar_url, show_branding, placeholder_text, ai_enabled, is_landing_widget, landing_widget_enabled, quick_replies, greeting_message, greeting_subtext'
      )
      .eq('is_landing_widget', true)
      .limit(1)
      .single()

    if (!fullError && fullData) {
      // Derive greeting_enabled from greeting_message being set
      data = { ...fullData, greeting_enabled: Boolean(fullData.greeting_message) }
    } else {
      // Fallback: columns may not exist yet, try without them
      const { data: fallbackData } = await supabase
        .from('chatbot_configs')
        .select('id, widget_title, welcome_message, primary_color, position, avatar_url, show_branding, placeholder_text, ai_enabled')
        .limit(1)
        .single()

      if (fallbackData) {
        data = {
          ...fallbackData,
          is_landing_widget: true,
          landing_widget_enabled: true,
          quick_replies: [],
          greeting_message: 'Hi there!',
          greeting_subtext: 'How can I help you today?',
        }
      }
    }

    if (!data) {
      return NextResponse.json({
        enabled: false,
        chatbot_id: null,
        config: null,
      })
    }

    return NextResponse.json(
      {
        enabled: data.landing_widget_enabled ?? true,
        chatbot_id: data.id,
        config: {
          widget_title: data.widget_title ?? 'Chat with us',
          welcome_message: data.welcome_message ?? 'Hello! How can I help you today?',
          primary_color: data.primary_color ?? '#F5B800',
          position: data.position ?? 'bottom-right',
          avatar_url: data.avatar_url,
          show_branding: data.show_branding ?? true,
          placeholder_text: data.placeholder_text ?? 'Type your message...',
          ai_enabled: data.ai_enabled ?? false,
          quick_replies: data.quick_replies ?? [],
          greeting_message: data.greeting_message ?? 'Hi there!',
          greeting_subtext: data.greeting_subtext ?? 'How can I help you today?',
          greeting_enabled: Boolean(data.greeting_message),
        },
      },
      {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    )
  } catch (error) {
    console.error('Landing config API error:', error)
    return NextResponse.json({ enabled: false, chatbot_id: null, config: null })
  }
}
