import { generateText } from 'ai'
import { createGroq } from '@ai-sdk/groq'
import { createPublicClient } from '@/lib/supabase/public'
import { NextRequest, NextResponse } from 'next/server'
import { getPlanLimits, type PlanId } from '@/lib/products'

export const maxDuration = 60

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

// Supported Groq models in order of preference for fallback
const GROQ_MODELS = [
  'llama-3.3-70b-versatile',
  'llama-3.1-70b-versatile',
  'llama-3.1-8b-instant',
  'mixtral-8x7b-32768',
]

function createGroqClient() {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    throw new Error('GROQ_API_KEY environment variable is not set')
  }
  return createGroq({ apiKey })
}

export async function POST(request: NextRequest) {
  try {
    const { session_id, content } = await request.json()

    if (!session_id || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400, headers: corsHeaders }
      )
    }

    const supabase = createPublicClient()

    // Get session details including bot_messages_count
    const { data: session, error: sessionError } = await supabase
      .from('chat_sessions')
      .select('admin_id, chatbot_id, is_bot_active, visitor_name, metadata, bot_messages_count')
      .eq('id', session_id)
      .single()

    if (sessionError || !session) {
      console.error('AI route - Session fetch error:', sessionError?.message)
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404, headers: corsHeaders }
      )
    }

    // Check if bot is active for this session
    if (!session.is_bot_active) {
      return NextResponse.json(
        { error: 'Bot is not active for this session', bot_active: false },
        { status: 200, headers: corsHeaders }
      )
    }

    // Get chatbot AI config - fetch canned_responses separately to avoid join issues
    const { data: config, error: configError } = await supabase
      .from('chatbot_configs')
      .select(
        'ai_enabled, ai_system_prompt, ai_knowledge_base, ai_model, ai_temperature, ai_max_tokens, ai_greeting_message, ai_handoff_keywords'
      )
      .eq('id', session.chatbot_id)
      .single()

    if (configError) {
      console.error('AI route - Config fetch error:', configError.message)
      return NextResponse.json(
        { error: 'Failed to load chatbot config', bot_active: false },
        { status: 200, headers: corsHeaders }
      )
    }

    if (!config || !config.ai_enabled) {
      return NextResponse.json(
        { error: 'AI is not enabled', bot_active: false },
        { status: 200, headers: corsHeaders }
      )
    }

    // Check if the admin's plan allows AI usage
    const { data: adminProfile } = await supabase
      .from('admin_profiles')
      .select('plan')
      .eq('id', session.admin_id)
      .single()

    const adminPlan = (adminProfile?.plan as PlanId) || 'starter'
    const planLimits = getPlanLimits(adminPlan)

    if (!planLimits.aiEnabled) {
      return NextResponse.json(
        {
          reply: 'AI assistant is not available on your current plan. The admin needs to upgrade to Pro or Business to enable AI responses.',
          handoff: false,
          bot_active: false,
        },
        { headers: corsHeaders }
      )
    }

    // Fetch canned responses separately (avoids potential FK join issues)
    const { data: cannedResponses } = await supabase
      .from('canned_responses')
      .select('title, content, shortcut')
      .eq('chatbot_id', session.chatbot_id)

    // Fetch conversation history for context (last 20 messages)
    const { data: history } = await supabase
      .from('chat_messages')
      .select('content, sender_type, created_at')
      .eq('session_id', session_id)
      .order('created_at', { ascending: true })
      .limit(20)

    // Check for handoff keywords in the visitor's message
    const handoffKeywords = config.ai_handoff_keywords || [
      'human',
      'agent',
      'person',
      'real person',
      'speak to someone',
      'talk to someone',
      'menneske',
      'snakke med noen',
      'ekte person',
    ]
    const messageLower = content.toLowerCase()
    const handoffRequested = handoffKeywords.some((keyword: string) =>
      messageLower.includes(keyword.toLowerCase())
    )

    if (handoffRequested) {
      // Mark session for handoff
      await supabase
        .from('chat_sessions')
        .update({
          is_bot_active: false,
          handoff_requested_at: new Date().toISOString(),
          status: 'waiting_for_human',
          updated_at: new Date().toISOString(),
        })
        .eq('id', session_id)

      // Insert handoff message
      const handoffMessage =
        'I understand you would like to speak with a human agent. I am transferring you now. A team member will be with you shortly!'
      await supabase.from('chat_messages').insert({
        session_id,
        admin_id: session.admin_id,
        content: handoffMessage,
        sender_type: 'bot',
        sender_id: 'ai-bot',
        is_read: false,
        is_ai_generated: true,
        metadata: { type: 'handoff' },
      })

      // Log analytics
      supabase.from('analytics_events').insert({
        admin_id: session.admin_id,
        chatbot_id: session.chatbot_id,
        session_id,
        event_type: 'handoff_requested',
        event_data: { trigger_message: content },
      }).then(() => {}).catch(() => {})

      return NextResponse.json(
        {
          reply: handoffMessage,
          handoff: true,
          bot_active: false,
        },
        { headers: corsHeaders }
      )
    }

    // Build conversation messages for the AI
    const conversationMessages = (history || []).map(
      (msg: { content: string; sender_type: string }) => ({
        role: msg.sender_type === 'visitor' ? ('user' as const) : ('assistant' as const),
        content: msg.content,
      })
    )

    // Add the current message
    conversationMessages.push({ role: 'user' as const, content })

    // Build comprehensive system prompt
    const cannedResponsesContext =
      cannedResponses && cannedResponses.length > 0
        ? `\n\nYou have access to these pre-written responses that you can use or adapt:\n${cannedResponses
            .map(
              (r: { title: string; content: string }) =>
                `- "${r.title}": ${r.content}`
            )
            .join('\n')}`
        : ''

    const knowledgeBase = config.ai_knowledge_base
      ? `\n\nKnowledge Base:\n${config.ai_knowledge_base}`
      : ''

    const systemPrompt = `${config.ai_system_prompt || 'You are a helpful customer support assistant. Be friendly, professional, and concise.'}

${knowledgeBase}
${cannedResponsesContext}

Important rules:
- You are chatting with a visitor named "${session.visitor_name || 'Visitor'}".
- Be helpful, concise, and professional.
- If you cannot answer a question, suggest the visitor ask to speak with a human agent.
- Do not make up information. If you don't know something, say so.
- Keep responses under 3 paragraphs unless the question requires a detailed explanation.
- Format your responses nicely. Use line breaks for readability.
- If the visitor seems frustrated or has a complex issue, proactively suggest speaking with a human.
- You can understand and respond in multiple languages. Match the language of the visitor.
- Current date/time: ${new Date().toISOString()}`

    // Generate AI response using Groq with model fallback
    const groq = createGroqClient()
    const preferredModel = config.ai_model || 'llama-3.3-70b-versatile'

    // Build model list: preferred model first, then fallbacks
    const modelsToTry = [
      preferredModel,
      ...GROQ_MODELS.filter((m) => m !== preferredModel),
    ]

    let text = ''
    let usage: { totalTokens?: number } | undefined
    let usedModel = preferredModel
    let lastError: Error | null = null

    for (const modelId of modelsToTry) {
      try {
        const result = await generateText({
          model: groq(modelId),
          system: systemPrompt,
          messages: conversationMessages,
          maxOutputTokens: config.ai_max_tokens || 500,
          temperature: config.ai_temperature ?? 0.7,
        })
        text = result.text
        usage = result.usage
        usedModel = modelId
        lastError = null
        break
      } catch (modelError) {
        lastError = modelError instanceof Error ? modelError : new Error(String(modelError))
        console.error(`AI route - Model "${modelId}" failed:`, lastError.message)
        // Continue to try next model
      }
    }

    // If all models failed, throw the last error
    if (lastError) {
      throw lastError
    }

    // Store the AI response in the database
    const { error: insertError } = await supabase.from('chat_messages').insert({
      session_id,
      admin_id: session.admin_id,
      content: text,
      sender_type: 'bot',
      sender_id: 'ai-bot',
      is_read: false,
      is_ai_generated: true,
      metadata: {
        model: usedModel,
        tokens_used: usage?.totalTokens || 0,
      },
    })

    if (insertError) {
      console.error('AI route - Failed to store AI message:', insertError.message)
      // Still return the reply even if storage fails
    }

    // Update session with proper bot_messages_count from the column
    const now = new Date().toISOString()
    supabase
      .from('chat_sessions')
      .update({
        updated_at: now,
        last_message_at: now,
        bot_messages_count: (session.bot_messages_count || 0) + 1,
      })
      .eq('id', session_id)
      .then(() => {})
      .catch(() => {})

    // Log analytics (non-blocking)
    supabase
      .from('analytics_events')
      .insert({
        admin_id: session.admin_id,
        chatbot_id: session.chatbot_id,
        session_id,
        event_type: 'ai_response',
        event_data: {
          tokens_used: usage?.totalTokens || 0,
          model: usedModel,
        },
      })
      .then(() => {})
      .catch(() => {})

    return NextResponse.json(
      {
        reply: text,
        handoff: false,
        bot_active: true,
      },
      { headers: corsHeaders }
    )
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined

    console.error('AI Chat API error:', {
      message: errorMessage,
      stack: errorStack?.split('\n').slice(0, 5).join('\n'),
      name: error instanceof Error ? error.name : 'Unknown',
    })
    
    const isConfigError =
      errorMessage.includes('API key') ||
      errorMessage.includes('GROQ_API_KEY') ||
      errorMessage.includes('gateway') ||
      errorMessage.includes('unauthorized') ||
      errorMessage.includes('401')

    const isRateLimit =
      errorMessage.includes('rate') ||
      errorMessage.includes('429') ||
      errorMessage.includes('quota')

    let userFacingError: string
    if (isConfigError) {
      userFacingError = 'AI service is not properly configured. Please contact support.'
    } else if (isRateLimit) {
      userFacingError = 'The AI service is currently busy. Please try again in a moment.'
    } else {
      userFacingError = 'Sorry, I\'m having trouble responding right now. Please try again or ask to speak with a human agent.'
    }

    return NextResponse.json(
      { 
        error: userFacingError,
        reply: userFacingError,
        bot_active: true,
        handoff: false,
      },
      { status: 500, headers: corsHeaders }
    )
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders })
}
