import { generateText } from 'ai'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 30

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

    const fullPrompt = `${system_prompt || 'You are a helpful assistant.'}${
      knowledge_base ? `\n\nKnowledge Base:\n${knowledge_base}` : ''
    }\n\nCurrent date/time: ${new Date().toISOString()}`

    const { text } = await generateText({
      model: model || 'openai/gpt-4o-mini',
      system: fullPrompt,
      messages: [{ role: 'user', content: message }],
      maxOutputTokens: max_tokens || 500,
      temperature: temperature || 0.7,
    })

    return NextResponse.json({ reply: text })
  } catch (error) {
    console.error('AI test error:', error)
    return NextResponse.json(
      { error: 'Failed to generate response. Please check your configuration.' },
      { status: 500 }
    )
  }
}
