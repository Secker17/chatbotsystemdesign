import { generateText } from 'ai'
import { xai } from '@ai-sdk/xai'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 30

// Map old Groq model names to Grok models for backwards compatibility
const modelMap: Record<string, string> = {
  'llama-3.3-70b-versatile': 'grok-4-mini',
  'llama-3.1-70b-versatile': 'grok-4-mini',
  'llama-3.1-8b-instant': 'grok-3-mini-fast',
  'llama3-70b-8192': 'grok-3-fast',
  'llama3-8b-8192': 'grok-3-mini-fast',
  'mixtral-8x7b-32768': 'grok-3-fast',
  'gemma2-9b-it': 'grok-3-mini-fast',
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

    const apiKey = process.env.XAI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'XAI_API_KEY is not configured. Please add it in your environment variables.' },
        { status: 500 }
      )
    }

    const rawModel = model || 'grok-4-mini'
    const resolvedModel = modelMap[rawModel] || rawModel

    const fullPrompt = `${system_prompt || 'You are a helpful assistant.'}${
      knowledge_base ? `\n\nKnowledge Base:\n${knowledge_base}` : ''
    }\n\nCurrent date/time: ${new Date().toISOString()}`

    const { text } = await generateText({
      model: xai(resolvedModel, { apiKey }),
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
