import { createPublicClient } from '@/lib/supabase/public'
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

export async function POST(request: NextRequest) {
  try {
    const { session_id, content, sender_type } = await request.json()

    if (!session_id || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = createPublicClient()
    const supabase = getPublicSupabaseClient()

    // Get session details
    const { data: session, error: sessionError } = await supabase
      .from('chat_sessions')
      .select('admin_id, chatbot_id')
      .eq('id', session_id)
      .single()

    if (sessionError || !session) {
      console.error('[v0] Session not found:', sessionError)
      console.error('Session fetch error:', sessionError)
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Insert message
    const { data: message, error: messageError } = await supabase
      .from('chat_messages')
      .insert({
        session_id,
        admin_id: session.admin_id,
        content,
        sender_type: sender_type || 'visitor',
      })
      .select('id, created_at')
      .single()

    if (messageError) {
      console.error('[v0] Message creation error:', messageError)
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
    }

    // Update session's updated_at (non-blocking)
    supabase
      .from('chat_sessions')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', session_id)
      .then(() => {}).catch(() => {})

    // Log analytics event (non-blocking)
    supabase.from('analytics_events').insert({
      admin_id: session.admin_id,
      chatbot_id: session.chatbot_id,
      session_id,
      event_type: 'message_sent',
      event_data: { sender_type, message_length: content.length },
    }).then(() => {}).catch(() => {})

    return NextResponse.json({ 
      message_id: message.id, 
      created_at: message.created_at 
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  } catch (error) {
    console.error('[v0] Message API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
