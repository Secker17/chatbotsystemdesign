import { generateText } from 'ai'
import { createPublicClient } from '@/lib/supabase/public'
import { NextRequest, NextResponse } from 'next/server'
import { getPlanLimits, type PlanId } from '@/lib/products'

export const maxDuration = 60

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

// Model mapping: user-facing model IDs to Vercel AI Gateway model strings
// Maps both current and legacy model IDs to valid gateway strings
const MODEL_MAP: Record<string, string> = {
  // xAI Grok models (primary)
  'xai/grok-3-mini': 'xai/grok-3-mini',
  'xai/grok-3': 'xai/grok-3',
  'xai/grok-2': 'xai/grok-2',
  // Short names for xAI
  'grok-3-mini': 'xai/grok-3-mini',
  'grok-3': 'xai/grok-3',
  'grok-2': 'xai/grok-2',
  // OpenAI models via AI Gateway
  'gpt-4o-mini': 'openai/gpt-4o-mini',
  'gpt-4o': 'openai/gpt-4o',
  'gpt-4.1-mini': 'openai/gpt-4.1-mini',
  'gpt-4.1-nano': 'openai/gpt-4.1-nano',
  // Anthropic models via AI Gateway
  'claude-3-5-haiku-latest': 'anthropic/claude-3-5-haiku-latest',
  // Legacy mappings
  'grok-beta': 'xai/grok-3-mini',
  'grok-2-1212': 'xai/grok-2',
  'grok-2-image': 'xai/grok-2',
  // Fireworks models via AI Gateway
  'llama-3.3-70b-versatile': 'fireworks/llama-v3p3-70b-instruct',
  'llama-3.1-8b-instant': 'fireworks/llama-v3p1-8b-instruct',
  'mixtral-8x7b-32768': 'fireworks/mixtral-8x7b-instruct',
  'gemma2-9b-it': 'fireworks/gemma2-9b-it',
}

// Default model and fallback chain
const DEFAULT_MODEL = 'xai/grok-3-mini'
const FALLBACK_MODELS = [
  'xai/grok-3-mini',
  'xai/grok-2',
  'openai/gpt-4o-mini',
]

function resolveModel(modelId: string | null): string {
  if (!modelId) return DEFAULT_MODEL
  // If it already has a provider prefix (contains /), check if it's in the map or use as-is
  if (modelId.includes('/')) return MODEL_MAP[modelId] || modelId
  return MODEL_MAP[modelId] || `xai/${modelId}`
}

export async function POST(request: NextRequest) {
  console.log('[v0] AI route - POST request received')
  try {
    const { session_id, content } = await request.json()
    console.log('[v0] AI route - session_id:', session_id, 'content length:', content?.length)

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

    // Get chatbot AI config
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

    console.log('[v0] AI route - Config loaded:', {
      ai_enabled: config?.ai_enabled,
      ai_model: config?.ai_model,
      ai_max_tokens: config?.ai_max_tokens,
      ai_temperature: config?.ai_temperature,
    })

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

    // Fetch canned responses separately
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

    // Generate AI response using Vercel AI Gateway with model fallback
    const preferredModel = resolveModel(config.ai_model)

    console.log('[v0] AI route - Config model:', config.ai_model, '-> Resolved:', preferredModel)

    // Build model list: preferred model first, then fallbacks
    const modelsToTry = [
      preferredModel,
      ...FALLBACK_MODELS.filter((m) => m !== preferredModel),
    ]

    console.log('[v0] AI route - Models to try:', modelsToTry)
    console.log('[v0] AI route - Message count:', conversationMessages.length)

    let text = ''
    let usage: { totalTokens?: number } | undefined
    let usedModel = preferredModel
    let lastError: Error | null = null

    for (const modelId of modelsToTry) {
      try {
        console.log(`[v0] AI route - Trying model: "${modelId}"`)
        const result = await generateText({
          model: modelId,
          system: systemPrompt,
          messages: conversationMessages,
          maxOutputTokens: config.ai_max_tokens || 500,
          temperature: config.ai_temperature ?? 0.7,
        })
        text = result.text
        usage = result.usage
        usedModel = modelId
        lastError = null
        console.log(`[v0] AI route - Success with model: "${modelId}", tokens: ${usage?.totalTokens}`)
        break
      } catch (modelError) {
        lastError = modelError instanceof Error ? modelError : new Error(String(modelError))
        console.error(`[v0] AI route - Model "${modelId}" failed:`, lastError.message)
        if (lastError.stack) {
          console.error(`[v0] AI route - Stack:`, lastError.stack.split('\n').slice(0, 3).join('\n'))
        }
        // Continue to try next model
      }
    }

    // If all models failed, throw the last error
    if (lastError) {
      console.error('[v0] AI route - ALL models failed. Last error:', lastError.message)
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

    console.error('[v0] AI Chat API error:', {
      message: errorMessage,
      stack: errorStack?.split('\n').slice(0, 5).join('\n'),
      name: error instanceof Error ? error.name : 'Unknown',
      fullError: JSON.stringify(error, Object.getOwnPropertyNames(error instanceof Error ? error : {})),
    })
    
    const errorLower = errorMessage.toLowerCase()
    const isConfigError =
      errorLower.includes('api key') ||
      errorLower.includes('api_key') ||
      errorLower.includes('gateway') ||
      errorLower.includes('unauthorized') ||
      errorLower.includes('401') ||
      errorLower.includes('not found') ||
      errorLower.includes('404') ||
      errorLower.includes('model')

    const isRateLimit =
      errorLower.includes('rate') ||
      errorLower.includes('429') ||
      errorLower.includes('quota')

    let userFacingError: string
    if (isConfigError) {
      userFacingError = 'AI service encountered a configuration issue. Please try again shortly.'
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
