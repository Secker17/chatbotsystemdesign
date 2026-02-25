import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ enabled: false })
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // Find the landing widget config (any account that has is_landing_widget enabled)
  const { data: config } = await supabase
    .from('chatbot_configs')
    .select('*')
    .eq('is_landing_widget', true)
    .eq('landing_widget_enabled', true)
    .limit(1)
    .single()

  if (!config) {
    return NextResponse.json({ enabled: false })
  }

  return NextResponse.json({
    enabled: true,
    chatbotId: config.id,
    widgetTitle: config.widget_title,
    welcomeMessage: config.welcome_message,
    primaryColor: config.primary_color,
    position: config.position,
    showBranding: config.show_branding,
    placeholderText: config.placeholder_text,
    quickReplies: config.quick_replies,
    greetingMessage: config.greeting_message,
    greetingSubtext: config.greeting_subtext,
  })
}
