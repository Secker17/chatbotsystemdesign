import { NextResponse } from 'next/server'
import { generateText } from 'ai'
import { createGroq } from '@ai-sdk/groq'
import { createPublicClient } from '@/lib/supabase/public'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

const MODELS_TO_TEST = [
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
]

export async function GET() {
  const checks: Record<string, unknown> = {}

  // Check environment variables
  checks.env = {
    GROQ_API_KEY: !!process.env.GROQ_API_KEY,
    GROQ_API_KEY_prefix: process.env.GROQ_API_KEY?.substring(0, 8) || 'NOT_SET',
    GROQ_API_KEY_length: process.env.GROQ_API_KEY?.length || 0,
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

  // Check each Groq model
  if (!process.env.GROQ_API_KEY) {
    checks.ai = { working: false, error: 'GROQ_API_KEY is not set' }
  } else {
    const groq = createGroq({ apiKey: process.env.GROQ_API_KEY })
    const modelResults: Record<string, unknown> = {}

    for (const modelId of MODELS_TO_TEST) {
      try {
        const { text } = await generateText({
          model: groq(modelId),
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
  }

  return NextResponse.json(checks, { headers: corsHeaders })
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders })
}
