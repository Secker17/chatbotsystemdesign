import { createPublicClient } from '@/lib/supabase/public'
import { NextRequest, NextResponse } from 'next/server'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get('session_id')
  const afterId = request.nextUrl.searchParams.get('after_id')
  const afterCount = request.nextUrl.searchParams.get('after')

  if (!sessionId) {
    return NextResponse.json({ error: 'Missing session_id' }, { status: 400, headers: corsHeaders })
  }

  try {
    let supabase
    try {
      supabase = createPublicClient()
    } catch (envError) {
      console.error('Messages API - Supabase client creation failed:', envError)
      return NextResponse.json({ error: 'Service configuration error' }, { status: 500, headers: corsHeaders })
    }

    // Fetch all messages for this session
    const { data: allMessages, error } = await supabase
      .from('chat_messages')
      .select('id, content, sender_type, created_at, is_ai_generated')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
      .limit(200)

    if (error) {
      console.error('Messages fetch error:', error.message, error.code)
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500, headers: corsHeaders })
    }

    const messages = allMessages || []
    const total = messages.length

    // Count-based polling: return messages after index N
    if (afterCount) {
      const idx = parseInt(afterCount, 10)
      const newMessages = messages.slice(idx)
      return NextResponse.json({ messages: newMessages, total }, { headers: corsHeaders })
    }

    // ID-based polling: return messages after a specific message ID
    if (afterId) {
      const afterIdx = messages.findIndex(m => m.id === afterId)
      const newMessages = afterIdx >= 0 ? messages.slice(afterIdx + 1) : messages
      return NextResponse.json({ messages: newMessages, total }, { headers: corsHeaders })
    }

    // No filter - return all
    return NextResponse.json({ messages, total }, { headers: corsHeaders })
  } catch (error) {
    console.error('Messages API error:', error instanceof Error ? error.message : error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: corsHeaders })
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders })
}
