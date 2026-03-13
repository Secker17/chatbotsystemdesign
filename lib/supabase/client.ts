import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    // Return a mock client when Supabase is not configured
    console.warn('Supabase environment variables not found. Using mock client.')
    return createMockClient()
  }

  return createBrowserClient(
    supabaseUrl,
    supabaseAnonKey,
  )
}

// Mock client for development without Supabase
function createMockClient() {
  return {
    auth: {
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      signInWithPassword: () => Promise.resolve({ data: { user: null, session: null }, error: new Error('Supabase not configured') }),
      signUp: () => Promise.resolve({ data: { user: null, session: null }, error: new Error('Supabase not configured') }),
      signOut: () => Promise.resolve({ error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
          then: () => Promise.resolve({ data: [], error: null })
        }),
        then: () => Promise.resolve({ data: [], error: null })
      }),
      insert: () => ({
        select: () => ({
          single: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') })
        })
      }),
      update: () => ({
        eq: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') })
      }),
      delete: () => ({
        eq: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') })
      })
    }),
    rpc: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') })
  }
}
