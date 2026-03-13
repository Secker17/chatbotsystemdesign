'use client'

import { useEffect, useState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Database, Code, AlertTriangle } from 'lucide-react'

export default function DevBanner() {
  const [isDevMode, setIsDevMode] = useState(false)
  const [supabaseConfigured, setSupabaseConfigured] = useState(true)

  useEffect(() => {
    // Check if we're in development and Supabase is not configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    setIsDevMode(process.env.NODE_ENV === 'development')
    setSupabaseConfigured(!!(supabaseUrl && supabaseKey))
  }, [])

  if (!isDevMode || supabaseConfigured) {
    return null
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 p-4">
      <Alert className="max-w-4xl mx-auto border-amber-200 bg-amber-50">
        <Database className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-amber-300 text-amber-700">
              <Code className="h-3 w-3 mr-1" />
              Development Mode
            </Badge>
            <span className="text-sm font-medium text-amber-800">
              Supabase ikke konfigurert - Database-funksjoner er deaktivert
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs text-amber-600">
            <AlertTriangle className="h-3 w-3" />
            <a 
              href="/docs/setup" 
              className="underline hover:text-amber-800"
            >
              Se oppsettsguide
            </a>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  )
}
