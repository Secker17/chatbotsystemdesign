import { NextResponse } from 'next/server'
import { createPublicClient } from '@/lib/supabase/public'

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
      console.error('[v0] Failed to read widget script:', fileError)
      return NextResponse.json(
        { error: 'Widget script not found' },
        { status: 500, headers: CORS_HEADERS }
      )
    }

  } catch (error) {
    console.error('[v0] Widget GET error:', error)
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
      console.error('[v0] Widget POST: Missing chatbotId or message')
      return NextResponse.json(
        { error: 'Missing chatbotId or message' },
        { status: 400, headers: CORS_HEADERS }
      )
    }

    const supabase = createPublicClient()
    
    // Get chatbot configuration from chatbot_configs table
    const { data: chatbot, error: chatbotError } = await supabase
      .from('chatbot_configs')
      .select('*')
      .eq('id', chatbotId)
      .single()

    if (chatbotError || !chatbot) {
      console.error('[v0] Widget POST: Chatbot not found:', chatbotId, chatbotError?.message)
      return NextResponse.json(
        { error: 'Chatbot not found' },
        { status: 404, headers: CORS_HEADERS }
      )
    }

    // For now, just return a simple response
    // In a real implementation, this would call AI service or store message
    const botResponse = chatbot.welcome_message || 'Thank you for your message! I received your message.'
    
    console.log('[v0] Widget POST: Message received from user:', message)

    return NextResponse.json({
      response: botResponse,
      sessionId: sessionId || 'session_' + Date.now()
    }, { headers: CORS_HEADERS })

  } catch (error) {
    console.error('[v0] Widget POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: CORS_HEADERS }
    )
  }
}

  } catch (error) {
    console.error('Widget POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: CORS_HEADERS }
    )
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: CORS_HEADERS,
  })
}
  return new Response(null, { headers: CORS_HEADERS })
}
