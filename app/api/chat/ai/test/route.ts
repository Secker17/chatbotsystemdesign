import { generateText } from 'ai'
import { xai } from '@ai-sdk/xai'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 30

// Resolve user-facing model IDs to xAI model names
const MODEL_MAP: Record<string, string> = {
  'grok-3-mini': 'grok-3-mini',
  'grok-3': 'grok-3',
  'grok-2': 'grok-2',
  'xai/grok-3-mini': 'grok-3-mini',
  'xai/grok-3': 'grok-3',
  'xai/grok-2': 'grok-2',
  'grok-beta': 'grok-3-mini',
  'grok-2-1212': 'grok-2',
  'grok-2-image': 'grok-2',
  'gpt-4o-mini': 'grok-3-mini',
  'gpt-4o': 'grok-3',
  'gpt-4.1-mini': 'grok-3-mini',
  'gpt-4.1-nano': 'grok-3-mini',
  'claude-3-5-haiku-latest': 'grok-3-mini',
  'llama-3.3-70b-versatile': 'grok-3',
  'llama-3.1-8b-instant': 'grok-3-mini',
  'mixtral-8x7b-32768': 'grok-3-mini',
  'gemma2-9b-it': 'grok-3-mini',
}

function resolveModel(modelId: string | null): string {
  if (!modelId) return 'grok-3-mini'
  const cleaned = modelId.replace(/^xai\//, '')
  return MODEL_MAP[modelId] || MODEL_MAP[cleaned] || cleaned
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
      model: xai(resolvedModel),
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
