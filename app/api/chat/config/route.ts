
import { createPublicClient } from '@/lib/supabase/public'
import { NextRequest, NextResponse } from 'next/server'
import { getPlanLimits, type PlanId } from '@/lib/products'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function GET(request: NextRequest) {
  const chatbotId = request.nextUrl.searchParams.get('chatbot_id')

  if (!chatbotId) {
    return NextResponse.json({ error: 'Missing chatbot_id' }, { status: 400, headers: corsHeaders })
  }

  try {
    const supabase = createPublicClient()

    // Query only existing columns - NEVER use SELECT * (greeting_enabled doesn't exist)
    const { data: rawData, error } = await supabase
      .from('chatbot_configs')
      .select(`
        id,
        widget_title,
        welcome_message,
        primary_color,
        position,
        avatar_url,
        show_branding,
        placeholder_text,
        offline_message,
        ai_enabled,
        business_hours_enabled,
        business_hours,
        business_hours_timezone,
        outside_hours_message,
        greeting_message,
        greeting_subtext,
        launcher_text,
        launcher_text_enabled,
        quick_replies,
        admin_id
      `)
      .eq('id', chatbotId)
      .single()

    if (error || !rawData) {
      console.error('[v0] Config fetch error for chatbot_id:', chatbotId, 'error:', error?.message)
      return NextResponse.json({ error: 'Chatbot not found' }, { status: 404, headers: corsHeaders })
    }

    // Fetch admin plan to enforce plan-level restrictions
    const { data: adminProfile } = await supabase
      .from('admin_profiles')
      .select('plan')
      .eq('id', rawData.admin_id)
      .single()

    const adminPlan = (adminProfile?.plan as PlanId) || 'starter'
    const planLimits = getPlanLimits(adminPlan)

    // Build response - derive greeting_enabled from greeting_message
    const configResponse = {
      id: rawData.id,
      widget_title: rawData.widget_title || 'Chat Support',
      welcome_message: rawData.welcome_message || 'How can we help you?',
      primary_color: rawData.primary_color || '#3b82f6',
      position: (rawData.position || 'bottom-right') as 'bottom-right' | 'bottom-left',
      avatar_url: rawData.avatar_url || null,
      show_branding: planLimits.removeBranding ? rawData.show_branding : true,
      placeholder_text: rawData.placeholder_text || 'Type your message...',
      offline_message: rawData.offline_message || 'We are offline. Leave a message.',
      ai_enabled: planLimits.aiEnabled ? rawData.ai_enabled : false,
      greeting_message: rawData.greeting_message || null,
      greeting_subtext: rawData.greeting_subtext || '',
      greeting_enabled: Boolean(rawData.greeting_message),
      launcher_text: rawData.launcher_text || null,
      launcher_text_enabled: rawData.launcher_text_enabled ?? false,
      quick_replies: rawData.quick_replies || [],
      business_hours_enabled: rawData.business_hours_enabled ?? false,
      business_hours: rawData.business_hours || null,
      business_hours_timezone: rawData.business_hours_timezone || 'UTC',
      outside_hours_message: rawData.outside_hours_message || null,
    }

    return NextResponse.json(configResponse, {
      headers: {
        ...corsHeaders,
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  } catch (error) {
    console.error('[v0] Config API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: corsHeaders })
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders })
}
