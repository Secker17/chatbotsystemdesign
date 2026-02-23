import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json(
      { error: 'Missing env vars' },
      { status: 500 }
    )
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const results: { step: string; status: string; error?: string }[] = []

  // Step 1: Check if columns already exist
  const { data: testRow, error: testError } = await supabase
    .from('chatbot_configs')
    .select('is_landing_widget, landing_widget_enabled, quick_replies, greeting_message, greeting_subtext')
    .limit(1)

  if (!testError) {
    results.push({ step: 'Columns already exist', status: 'OK' })
  } else {
    // Columns don't exist yet - provide the SQL to run
    results.push({
      step: 'Columns missing - need migration',
      status: 'NEEDS_MIGRATION',
      error: testError.message,
    })

    return NextResponse.json({
      message: 'New columns are missing. Please run this SQL in your Supabase Dashboard > SQL Editor:',
      results,
      migrationSql: `
ALTER TABLE public.chatbot_configs ADD COLUMN IF NOT EXISTS is_landing_widget BOOLEAN DEFAULT false;
ALTER TABLE public.chatbot_configs ADD COLUMN IF NOT EXISTS landing_widget_enabled BOOLEAN DEFAULT true;
ALTER TABLE public.chatbot_configs ADD COLUMN IF NOT EXISTS quick_replies TEXT[];
ALTER TABLE public.chatbot_configs ADD COLUMN IF NOT EXISTS greeting_message TEXT DEFAULT 'Hi there!';
ALTER TABLE public.chatbot_configs ADD COLUMN IF NOT EXISTS greeting_subtext TEXT DEFAULT 'How can I help you today?';
      `.trim(),
    })
  }

  // Step 2: Find Vintra user and flag their config
  const { data: authData } = await supabase.auth.admin.listUsers()
  const vintraUser = authData?.users?.find(
    (u) => u.email === 'vintrastudio@gmail.com'
  )

  if (vintraUser) {
    // First, clear any existing landing widget flags
    const { error: clearError } = await supabase
      .from('chatbot_configs')
      .update({ is_landing_widget: false })
      .eq('is_landing_widget', true)

    if (clearError) {
      results.push({ step: 'Clear old flags', status: 'ERROR', error: clearError.message })
    }

    // Find Vintra's chatbot config
    const { data: vintraConfig, error: configError } = await supabase
      .from('chatbot_configs')
      .select('id')
      .eq('admin_id', vintraUser.id)
      .limit(1)
      .single()

    if (vintraConfig) {
      const { error: updateError } = await supabase
        .from('chatbot_configs')
        .update({
          is_landing_widget: true,
          landing_widget_enabled: true,
          quick_replies: [
            'What features do you offer?',
            'Tell me about pricing',
            'How does the AI work?',
            'Can I see a demo?',
          ],
          greeting_message: 'Hi there!',
          greeting_subtext: 'How can I help you today?',
        })
        .eq('id', vintraConfig.id)

      results.push({
        step: `Flag Vintra config ${vintraConfig.id} as landing widget`,
        status: updateError ? 'ERROR' : 'OK',
        error: updateError?.message,
      })
    } else {
      results.push({
        step: 'Find Vintra config',
        status: 'NOT_FOUND',
        error: configError?.message || 'No chatbot config found for vintrastudio@gmail.com',
      })
    }
  } else {
    results.push({
      step: 'Find Vintra user',
      status: 'NOT_FOUND',
      error: 'vintrastudio@gmail.com not found in auth.users',
    })
  }

  return NextResponse.json({
    message: 'Landing widget migration complete',
    results,
  })
}
