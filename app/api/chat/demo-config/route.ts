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

  // Find Vintra's non-landing chatbot config (the demo page bot)
  const { data: authData } = await supabase.auth.admin.listUsers()
  const vintraUser = authData?.users?.find(
    (u) => u.email === 'vintrastudio@gmail.com'
  )

  if (!vintraUser) {
    return NextResponse.json({ enabled: false })
  }

  const { data: config } = await supabase
    .from('chatbot_configs')
    .select('*')
    .eq('admin_id', vintraUser.id)
    .eq('is_landing_widget', false)
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
