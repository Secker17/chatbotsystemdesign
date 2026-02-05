import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Create a public Supabase client for widget APIs (no auth required)
function getPublicSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }
  
  return createClient(supabaseUrl, supabaseAnonKey)
}

export async function GET(request: NextRequest) {
  const chatbotId = request.nextUrl.searchParams.get('chatbot_id')

  if (!chatbotId) {
    return NextResponse.json({ error: 'Missing chatbot_id' }, { status: 400 })
  }

  try {
    const supabase = getPublicSupabaseClient()

    const { data, error } = await supabase
      .from('chatbot_configs')
      .select('widget_title, welcome_message, primary_color, position, avatar_url, show_branding, placeholder_text, offline_message')
      .eq('id', chatbotId)
      .single()

    if (error || !data) {
      console.error('Config fetch error:', error)
      return NextResponse.json({ error: 'Chatbot not found' }, { status: 404 })
    }

    return NextResponse.json(data, {
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
