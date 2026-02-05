import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

function extractToken(cookieValue: string): string | null {
  try {
    const parsed = JSON.parse(cookieValue)
    if (Array.isArray(parsed) && parsed[0]) return parsed[0]
    if (typeof parsed === 'string') return parsed
    if (parsed?.access_token) return parsed.access_token
    return null
  } catch {
    // Cookie might be a raw token string
    return cookieValue || null
  }
}

export async function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }

  let token: string | null = null

  try {
    const cookieStore = await cookies()
    const allCookies = cookieStore.getAll()
    const authCookie = allCookies.find(
      (c) => c.name.startsWith('sb-') && c.name.endsWith('-auth-token')
    )
    if (authCookie) {
      token = extractToken(authCookie.value)
    }
  } catch {
    // Cookies not available (e.g. during static generation)
  }

  const client = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
  })

  return client
}
