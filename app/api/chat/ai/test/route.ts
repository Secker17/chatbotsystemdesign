import { generateText } from 'ai'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 30

// Model mapping: user-facing model IDs to Vercel AI Gateway model strings
const MODEL_MAP: Record<string, string> = {
  // xAI Grok models (primary)
  'xai/grok-3-mini': 'xai/grok-3-mini',
  'xai/grok-3': 'xai/grok-3',
  'xai/grok-2': 'xai/grok-2',
  'grok-3-mini': 'xai/grok-3-mini',
  'grok-3': 'xai/grok-3',
  'grok-2': 'xai/grok-2',
  // OpenAI models via AI Gateway
  'gpt-4o-mini': 'openai/gpt-4o-mini',
  'gpt-4o': 'openai/gpt-4o',
  'gpt-4.1-mini': 'openai/gpt-4.1-mini',
  'gpt-4.1-nano': 'openai/gpt-4.1-nano',
  // Anthropic
  'claude-3-5-haiku-latest': 'anthropic/claude-3-5-haiku-latest',
  // Legacy mappings
  'grok-beta': 'xai/grok-3-mini',
  'grok-2-1212': 'xai/grok-2',
  'grok-2-image': 'xai/grok-2',
  // Fireworks
  'llama-3.3-70b-versatile': 'fireworks/llama-v3p3-70b-instruct',
  'llama-3.1-8b-instant': 'fireworks/llama-v3p1-8b-instruct',
  'mixtral-8x7b-32768': 'fireworks/mixtral-8x7b-instruct',
  'gemma2-9b-it': 'fireworks/gemma2-9b-it',
}

function resolveModel(modelId: string | null): string {
  if (!modelId) return 'xai/grok-3-mini'
  if (modelId.includes('/')) return MODEL_MAP[modelId] || modelId
  return MODEL_MAP[modelId] || `xai/${modelId}`
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
