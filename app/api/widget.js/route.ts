import { NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

// Cache the widget script as a Buffer instead of a string.
// Webpack's PackFileCacheStrategy warns when serializing large strings (>100 KiB)
// but Buffers are serialized as binary and avoid the performance penalty.
let _cachedBuf: Buffer | null = null

function getWidgetBuffer(): Buffer {
  if (!_cachedBuf) {
    const filePath = join(process.cwd(), 'lib', 'widget-script.txt')
    _cachedBuf = readFileSync(filePath)           // returns Buffer (no encoding)
  }
  return _cachedBuf
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
