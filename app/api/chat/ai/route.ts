import { generateText } from 'ai'
import { createGroq } from '@ai-sdk/groq'
import { createPublicClient } from '@/lib/supabase/public'
import { NextRequest, NextResponse } from 'next/server'

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
})

export const maxDuration = 60

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
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

    // Get session details
    const { data: session, error: sessionError } = await supabase
      .from('chat_sessions')
      .select('admin_id, chatbot_id, is_bot_active, visitor_name, metadata')
      .eq('id', session_id)
      .single()

    if (sessionError || !session) {
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
        'ai_enabled, ai_system_prompt, ai_knowledge_base, ai_model, ai_temperature, ai_max_tokens, ai_greeting_message, ai_handoff_keywords, canned_responses:canned_responses(title, content, shortcut)'
      )
      .eq('id', session.chatbot_id)
      .single()

    if (configError || !config || !config.ai_enabled) {
      return NextResponse.json(
        { error: 'AI is not enabled', bot_active: false },
        { status: 200, headers: corsHeaders }
      )
    }

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
      await supabase.from('analytics_events').insert({
        admin_id: session.admin_id,
        chatbot_id: session.chatbot_id,
        session_id,
        event_type: 'handoff_requested',
        event_data: { trigger_message: content },
      })

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
        role: msg.sender_type === 'visitor' ? 'user' : 'assistant',
        content: msg.content,
      })
    )

    // Add the current message
    conversationMessages.push({ role: 'user', content })

    // Build comprehensive system prompt
    const cannedResponsesContext =
      config.canned_responses && config.canned_responses.length > 0
        ? `\n\nYou have access to these pre-written responses that you can use or adapt:\n${config.canned_responses
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

    // Generate AI response using Groq (free, fast inference)
    const modelId = config.ai_model || 'llama-3.3-70b-versatile'
    
    const { text, usage } = await generateText({
      model: groq(modelId),
      system: systemPrompt,
      messages: conversationMessages,
      maxOutputTokens: config.ai_max_tokens || 500,
      temperature: config.ai_temperature || 0.7,
    })

    // Store the AI response in the database
    await supabase.from('chat_messages').insert({
      session_id,
      admin_id: session.admin_id,
      content: text,
      sender_type: 'bot',
      sender_id: 'ai-bot',
      is_read: false,
      is_ai_generated: true,
      metadata: {
        model: config.ai_model || 'llama-3.3-70b-versatile',
        tokens_used: usage?.totalTokens || 0,
      },
    })

    // Update session
    const now = new Date().toISOString()
    await supabase
      .from('chat_sessions')
      .update({
        updated_at: now,
        last_message_at: now,
        bot_messages_count: (session.metadata?.bot_messages_count || 0) + 1,
      })
      .eq('id', session_id)

    // Log analytics
    supabase
      .from('analytics_events')
      .insert({
        admin_id: session.admin_id,
        chatbot_id: session.chatbot_id,
        session_id,
        event_type: 'ai_response',
        event_data: {
          tokens_used: usage?.totalTokens || 0,
          model: config.ai_model || 'llama-3.3-70b-versatile',
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
    console.error('AI Chat API error:', error instanceof Error ? error.message : error)
    
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    const isConfigError = errorMessage.includes('API key') || errorMessage.includes('gateway') || errorMessage.includes('unauthorized') || errorMessage.includes('Missing')
    
    return NextResponse.json(
      { 
        error: isConfigError 
          ? 'AI service is not properly configured. Please check your API key settings.' 
          : 'Failed to generate a response. Please try again.',
        reply: 'Sorry, I\'m having trouble responding right now. Please try again or ask to speak with a human agent.',
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
