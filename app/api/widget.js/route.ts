import { NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

// Force dynamic rendering to avoid static analysis caching the file contents
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Read the widget script fresh on each request.
// Using Buffer to avoid webpack's string serialization warning.
function getWidgetBuffer(): Buffer {
  const filePath = join(process.cwd(), 'lib', 'widget-script.txt')
  return readFileSync(filePath) // returns Buffer (no encoding)
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
} as const

export async function OPTIONS() {
  return new NextResponse(null, { headers: CORS_HEADERS })
}

export async function GET() {
  const buf = getWidgetBuffer()

  return new NextResponse(buf, {
    headers: {
      ...CORS_HEADERS,
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  })
}
