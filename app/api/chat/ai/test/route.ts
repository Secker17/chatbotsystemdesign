import { generateText } from 'ai'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 30

// Model mapping: user-facing model IDs to Vercel AI Gateway model strings
const MODEL_MAP: Record<string, string> = {
  'gpt-4o-mini': 'openai/gpt-4o-mini',
  'gpt-4o': 'openai/gpt-4o',
  'gpt-4.1-mini': 'openai/gpt-4.1-mini',
  'gpt-4.1-nano': 'openai/gpt-4.1-nano',
  'claude-3-5-haiku-latest': 'anthropic/claude-3-5-haiku-latest',
  'llama-3.3-70b-versatile': 'fireworks/accounts/fireworks/models/llama-v3p3-70b-instruct',
  'llama-3.1-8b-instant': 'fireworks/accounts/fireworks/models/llama-v3p1-8b-instruct',
  'mixtral-8x7b-32768': 'fireworks/accounts/fireworks/models/mixtral-8x7b-instruct',
  'gemma2-9b-it': 'fireworks/accounts/fireworks/models/gemma2-9b-it',
}

function resolveModel(modelId: string | null): string {
  if (!modelId) return 'openai/gpt-4o-mini'
  return MODEL_MAP[modelId] || modelId
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { message, system_prompt, knowledge_base, model, temperature, max_tokens } = await request.json()

    if (!message) {
      return NextResponse.json({ error: 'Missing message' }, { status: 400 })
    }

    const resolvedModel = resolveModel(model)

    const fullPrompt = `${system_prompt || 'You are a helpful assistant.'}${
      knowledge_base ? `\n\nKnowledge Base:\n${knowledge_base}` : ''
    }\n\nCurrent date/time: ${new Date().toISOString()}`

    const { text } = await generateText({
      model: resolvedModel,
      system: fullPrompt,
      messages: [{ role: 'user', content: message }],
      maxOutputTokens: max_tokens || 500,
      temperature: temperature ?? 0.7,
    })

    return NextResponse.json({ reply: text })
  } catch (error) {
    console.error('AI test error:', error instanceof Error ? error.message : error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate response. Please check your configuration.' },
      { status: 500 }
    )
  }
}
