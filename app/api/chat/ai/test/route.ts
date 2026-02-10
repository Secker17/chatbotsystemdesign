import { generateText } from 'ai'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 30

// Model mapping: user-facing model IDs to Vercel AI Gateway model strings
// Using xAI models instead of OpenAI
const MODEL_MAP: Record<string, string> = {
  'grok-beta': 'xai/grok-beta',
  'grok-2-1212': 'xai/grok-2-1212',
  'grok-2-image': 'xai/grok-2-image',
  'gpt-4o-mini': 'xai/grok-beta', // Fallback mapping
  'gpt-4o': 'xai/grok-2-1212', // Fallback mapping
}

function resolveModel(modelId: string | null): string {
  if (!modelId) return 'xai/grok-beta'
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
