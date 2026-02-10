import { NextResponse } from 'next/server'
import { generateText } from 'ai'
import { createPublicClient } from '@/lib/supabase/public'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

const MODELS_TO_TEST = [
  'openai/gpt-4o-mini',
  'openai/gpt-4.1-nano',
]

export async function GET() {
  const checks: Record<string, unknown> = {}

  // Check environment variables
  checks.env = {
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

    // Check if canned_responses table is accessible
    const { error: cannedError } = await supabase
      .from('canned_responses')
      .select('id')
      .limit(1)
    checks.canned_responses_table = { accessible: !cannedError, error: cannedError?.message }
  } catch (e) {
    checks.supabase = { connected: false, error: e instanceof Error ? e.message : String(e) }
  }

  // Check each AI model via Vercel AI Gateway
  const modelResults: Record<string, unknown> = {}

  for (const modelId of MODELS_TO_TEST) {
    try {
      const { text } = await generateText({
        model: modelId,
        prompt: 'Say "hello" and nothing else.',
        maxOutputTokens: 10,
      })
      modelResults[modelId] = { working: true, response: text }
    } catch (e) {
      modelResults[modelId] = {
        working: false,
        error: e instanceof Error ? e.message : String(e),
        errorName: e instanceof Error ? e.name : undefined,
      }
    }
  }

  checks.ai_models = modelResults

  return NextResponse.json(checks, { headers: corsHeaders })
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders })
}
