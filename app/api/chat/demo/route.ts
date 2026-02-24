import { NextRequest, NextResponse } from 'next/server'
import { generateText } from 'ai'
import { createXai } from '@ai-sdk/xai'

export const maxDuration = 30

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

// Create xAI provider instance
const xai = createXai({ apiKey: process.env.XAI_API_KEY })

// In-memory conversation history per "session" (keyed by a simple hash of recent messages)
const conversationCache = new Map<string, { role: 'user' | 'assistant'; content: string }[]>()

// Clean up old conversations every 5 minutes
setInterval(() => {
  conversationCache.clear()
}, 5 * 60 * 1000)

const DEMO_SYSTEM_PROMPT = `You are the VintraStudio demo assistant on the landing page. VintraStudio is a live chat platform that helps businesses build, customize, and deploy intelligent chatbots.

Key info about VintraStudio:
- Real-time chat with typing indicators, message reactions, and smooth animations
- AI-powered responses using advanced language models
- Glass Orb animated avatars with particle physics and multiple themes
- Full brand customization (colors, avatars, welcome messages, positioning)
- Analytics dashboard for tracking conversations and metrics
- One-line script integration for any website
- Plans: Starter (Free, 1 chatbot, 100 conversations/month), Pro ($29/mo, 5 chatbots, 2000 conversations, AI responses, analytics), Business ($99/mo, unlimited chatbots, 10000 conversations, API access, priority support)
- Features: quick reply suggestions, canned responses, human handoff, business hours, multi-language support

Rules:
- Be friendly, helpful, and concise
- Keep responses under 2 paragraphs
- You can respond in multiple languages - match the visitor's language
- If asked about things outside VintraStudio, briefly answer and relate back to the platform
- Encourage visitors to sign up or try the demo
- Current date: ${new Date().toISOString()}`

export async function POST(request: NextRequest) {
  try {
    const { message, chatbotId, conversationId } = await request.json()

    if (!message) {
      return NextResponse.json(
        { error: 'Missing message' },
        { status: 400, headers: corsHeaders }
      )
    }

    // Try AI response first
    try {
      // Get or create conversation history
      const cacheKey = conversationId || chatbotId || 'default'
      const history = conversationCache.get(cacheKey) || []
      
      // Add user message to history
      history.push({ role: 'user', content: message })
      
      // Keep only last 10 messages for context
      const recentHistory = history.slice(-10)

      const { text } = await generateText({
        model: xai('grok-3-mini'),
        system: DEMO_SYSTEM_PROMPT,
        messages: recentHistory,
        maxOutputTokens: 300,
        temperature: 0.7,
      })

      // Store assistant reply in history
      history.push({ role: 'assistant', content: text })
      conversationCache.set(cacheKey, history.slice(-20)) // Keep last 20

      return NextResponse.json({
        response: text,
        timestamp: new Date().toISOString(),
        ai: true,
      }, { headers: corsHeaders })
    } catch (aiError) {
      console.error('Demo AI error, falling back to static:', aiError instanceof Error ? aiError.message : aiError)
      // Fall through to static responses
    }

    // Fallback: static responses if AI is unavailable
    const lower = message.toLowerCase().trim()
    let response: string

    const matchesAny = (words: string[]) => words.some(w => lower.includes(w))

    if (matchesAny(['hello', 'hi', 'hey', 'hei', 'hallo'])) {
      response = 'Hello! Welcome to VintraStudio. How can I help you today? Ask me about features, pricing, or integration!'
    } else if (matchesAny(['pricing', 'cost', 'price', 'plan'])) {
      response = 'We offer three plans:\n\n- **Starter** (Free) - 1 chatbot, 100 conversations/month\n- **Pro** ($29/mo) - 5 chatbots, 2,000 conversations, AI responses, analytics\n- **Business** ($99/mo) - Unlimited chatbots, 10,000 conversations, API access\n\nAll plans include our Glass Orb Avatar technology.'
    } else if (matchesAny(['feature', 'what can', 'capability'])) {
      response = 'VintraStudio includes real-time chat with typing indicators, AI-powered responses, Glass Orb animated avatars, full brand customization, analytics dashboard, quick reply suggestions, and one-line script integration. Want to know more about any specific feature?'
    } else if (matchesAny(['integrate', 'install', 'setup', 'embed', 'widget'])) {
      response = 'Integration is simple - just add one script tag to your HTML:\n\n```html\n<script src="YOUR_DOMAIN/api/widget.js" data-chatbot-id="YOUR_ID" async></script>\n```\n\nIt works with any website and loads asynchronously.'
    } else if (matchesAny(['thank', 'thanks', 'appreciate'])) {
      response = "You're welcome! Let me know if there's anything else I can help with."
    } else {
      response = "Thanks for your message! I can help you with questions about VintraStudio's features, pricing, integration, or the Glass Orb avatar system. What would you like to know?"
    }

    return NextResponse.json({
      response,
      timestamp: new Date().toISOString(),
      ai: false,
    }, { headers: corsHeaders })
  } catch (error) {
    console.error('Chat demo API error:', error)
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500, headers: corsHeaders }
    )
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders })
}
