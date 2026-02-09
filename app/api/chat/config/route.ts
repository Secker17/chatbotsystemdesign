
import { createPublicClient } from '@/lib/supabase/public'
import { NextRequest, NextResponse } from 'next/server'
import { getPlanLimits, type PlanId } from '@/lib/products'

export async function GET(request: NextRequest) {
  const chatbotId = request.nextUrl.searchParams.get('chatbot_id')

  if (!chatbotId) {
    return NextResponse.json({ error: 'Missing chatbot_id' }, { status: 400 })
  }

  try {
    const supabase = createPublicClient()

    const { data, error } = await supabase
      .from('chatbot_configs')
      .select('admin_id, widget_title, welcome_message, primary_color, position, avatar_url, show_branding, placeholder_text, offline_message, ai_enabled, launcher_text, launcher_text_enabled, business_hours_enabled, business_hours, business_hours_timezone, outside_hours_message')
      .eq('id', chatbotId)
      .single()

    if (error || !data) {
      console.error('Config fetch error:', error)
      return NextResponse.json({ error: 'Chatbot not found' }, { status: 404 })
    }

    // Fetch admin plan to enforce plan-level restrictions
    const { data: adminProfile } = await supabase
      .from('admin_profiles')
      .select('plan')
      .eq('id', data.admin_id)
      .single()

    const adminPlan = (adminProfile?.plan as PlanId) || 'starter'
    const planLimits = getPlanLimits(adminPlan)

    // Enforce plan limits on the config response
    const configResponse = {
      widget_title: data.widget_title,
      welcome_message: data.welcome_message,
      primary_color: data.primary_color,
      position: data.position,
      avatar_url: data.avatar_url,
      // Force branding on if plan doesn't allow removal
      show_branding: planLimits.removeBranding ? data.show_branding : true,
      placeholder_text: data.placeholder_text,
      offline_message: data.offline_message,
      // Disable AI if plan doesn't support it
      ai_enabled: planLimits.aiEnabled ? data.ai_enabled : false,
      launcher_text: data.launcher_text,
      launcher_text_enabled: data.launcher_text_enabled,
      business_hours_enabled: data.business_hours_enabled,
      business_hours: data.business_hours,
      business_hours_timezone: data.business_hours_timezone,
      outside_hours_message: data.outside_hours_message,
    }

    return NextResponse.json(configResponse, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  } catch (error) {
    console.error('Config API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
