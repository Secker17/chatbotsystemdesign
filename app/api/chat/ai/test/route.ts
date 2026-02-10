import { generateText } from 'ai'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 30

// Model mapping: user-facing model IDs to Vercel AI Gateway model strings
const MODEL_MAP: Record<string, string> = {
  'llama-3.3-70b-versatile': 'groq/llama-3.3-70b-versatile',
  'llama-3.1-8b-instant': 'groq/llama-3.1-8b-instant',
  'llama3-70b-8192': 'groq/llama3-70b-8192',
  'llama3-8b-8192': 'groq/llama3-8b-8192',
  'mixtral-8x7b-32768': 'groq/mixtral-8x7b-32768',
  'gemma2-9b-it': 'groq/gemma2-9b-it',
  'gpt-4o-mini': 'openai/gpt-4o-mini',
  'gpt-4o': 'openai/gpt-4o',
  'claude-3-5-haiku-latest': 'anthropic/claude-3-5-haiku-latest',
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
