import { NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

// Read the widget script fresh on each request.
// We avoid module-level caching to prevent webpack's PackFileCacheStrategy
// from serializing the large buffer into its persistent cache, which triggers
// the "Serializing big strings" warning in development.
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
