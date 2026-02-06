import { NextResponse } from 'next/server'
import { generateText } from 'ai'
import { createPublicClient } from '@/lib/supabase/public'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function GET() {
  const checks: Record<string, unknown> = {}

  // Check environment variables
  checks.env = {
    AI_GATEWAY_API_KEY: !!process.env.AI_GATEWAY_API_KEY,
    AI_GATEWAY_API_KEY_length: process.env.AI_GATEWAY_API_KEY?.length || 0,
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  }

  // Check Supabase connection
  try {
    const supabase = createPublicClient()
    const { data, error } = await supabase
      .from('chatbot_configs')
      .select('id, ai_enabled, ai_model')
      .limit(1)
    checks.supabase = { connected: !error, data, error: error?.message }
  } catch (e) {
    checks.supabase = { connected: false, error: e instanceof Error ? e.message : String(e) }
  }

  // Check AI SDK generateText
  try {
    const { text } = await generateText({
      model: 'openai/gpt-4o-mini',
      prompt: 'Say "hello" and nothing else.',
      maxOutputTokens: 10,
    })
    checks.ai = { working: true, response: text }
  } catch (e) {
    checks.ai = {
      working: false,
      error: e instanceof Error ? e.message : String(e),
      errorName: e instanceof Error ? e.name : undefined,
      stack: e instanceof Error ? e.stack?.split('\n').slice(0, 3).join('\n') : undefined,
    }
  }

  return NextResponse.json(checks, { headers: corsHeaders })
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders })
}
