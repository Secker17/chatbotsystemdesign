import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

// Force dynamic to avoid build-time processing
export const dynamic = 'force-dynamic'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
} as const

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const chatbotId = searchParams.get('chatbotId')
    const userId = searchParams.get('userId')
    
    if (!chatbotId) {
      return NextResponse.json(
        { error: 'Missing chatbotId parameter' },
        { status: 400, headers: CORS_HEADERS }
      )
    }

    // Return the simplified widget script
    const fs = await import('fs/promises')
    const path = await import('path')
    
    try {
      const scriptPath = path.join(process.cwd(), 'public', 'widget-script.txt')
      const widgetScript = await fs.readFile(scriptPath, 'utf-8')
      
      return new Response(widgetScript, {
        headers: {
          'Content-Type': 'application/javascript',
          ...CORS_HEADERS
        }
      })
    } catch (fileError) {
      console.error('Failed to read widget script:', fileError)
      return NextResponse.json(
        { error: 'Widget script not found' },
        { status: 500, headers: CORS_HEADERS }
      )
    }

  } catch (error) {
    console.error('Widget GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: CORS_HEADERS }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { chatbotId, userId, message, sessionId } = body
    
    if (!chatbotId || !message) {
      return NextResponse.json(
        { error: 'Missing chatbotId or message' },
        { status: 400, headers: CORS_HEADERS }
      )
    }

    const supabase = createClient()
    
    // Get chatbot configuration
    const { data: chatbot, error: chatbotError } = await supabase
      .from('chatbots')
      .select('*')
      .eq('id', chatbotId)
      .single()

    if (chatbotError || !chatbot) {
      return NextResponse.json(
        { error: 'Chatbot not found' },
        { status: 404, headers: CORS_HEADERS }
      )
    }

    // Create or update chat session
    let currentSessionId = sessionId
    if (!currentSessionId && userId) {
      const { data: existingSession } = await supabase
        .from('chat_sessions')
        .select('id')
        .eq('chatbot_id', chatbotId)
        .eq('user_id', userId)
        .is('ended_at', null)
        .single()

      if (existingSession) {
        currentSessionId = existingSession.id
      } else {
        const { data: newSession } = await supabase
          .from('chat_sessions')
          .insert({
            chatbot_id: chatbotId,
            user_id: userId,
            started_at: new Date().toISOString()
          })
          .select('id')
          .single()

        currentSessionId = newSession?.id
      }
    }

    // Store user message
    if (currentSessionId) {
      await supabase
        .from('chat_messages')
        .insert({
          session_id: currentSessionId,
          sender: 'user',
          content: message,
          timestamp: new Date().toISOString()
        })
    }

    // Generate bot response (simplified for now)
    let botResponse = chatbot.welcome_message || 'Thank you for your message!'
    
    if (message.toLowerCase().includes('help')) {
      botResponse = 'I\'m here to help! What do you need assistance with?'
    } else if (message.toLowerCase().includes('hello')) {
      botResponse = 'Hello! How can I assist you today?'
    }

    // Store bot message
    if (currentSessionId) {
      await supabase
        .from('chat_messages')
        .insert({
          session_id: currentSessionId,
          sender: 'bot',
          content: botResponse,
          timestamp: new Date().toISOString()
        })
    }

    return NextResponse.json({
      response: botResponse,
      sessionId: currentSessionId
    }, { headers: CORS_HEADERS })

  } catch (error) {
    console.error('Widget POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: CORS_HEADERS }
    )
  }
}

export async function OPTIONS() {
  return new Response(null, { headers: CORS_HEADERS })
}
