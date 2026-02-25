import { NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

// Read the widget script from disk once at module load (outside the request handler)
// so it is not re-read on every request but also not inlined as a huge string literal
// in the webpack bundle (which caused the 133kiB serialization warning).
let _cachedScript: string | null = null

function getWidgetScript(): string {
  if (!_cachedScript) {
    const filePath = join(process.cwd(), 'lib', 'widget-script.txt')
    _cachedScript = readFileSync(filePath, 'utf-8')
  }
  return _cachedScript
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

export async function GET() {
  const widgetScript = getWidgetScript()

  return new NextResponse(widgetScript, {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
