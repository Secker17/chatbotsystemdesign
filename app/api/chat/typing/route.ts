import { NextRequest, NextResponse } from 'next/server'

// In-memory typing state (ephemeral - resets on deploy, which is fine for typing indicators)
const typingState: Map<string, { is_typing: boolean; updated_at: number }> = new Map()

// Clean up stale entries every 30 seconds
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of typingState.entries()) {
    // Remove entries older than 10 seconds
    if (now - value.updated_at > 10000) {
      typingState.delete(key)
    }
  }
}, 30000)

// GET: Check if admin is typing for a given session
export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get('session_id')

  if (!sessionId) {
    return NextResponse.json({ error: 'Missing session_id' }, { status: 400 })
  }

  const state = typingState.get(sessionId)
  const isTyping = state ? (state.is_typing && (Date.now() - state.updated_at < 5000)) : false

  return NextResponse.json({ is_typing: isTyping }, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

// POST: Admin sets typing state for a session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { session_id, is_typing } = body

    if (!session_id) {
      return NextResponse.json({ error: 'Missing session_id' }, { status: 400 })
    }

    typingState.set(session_id, {
      is_typing: !!is_typing,
      updated_at: Date.now(),
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
