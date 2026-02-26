import { NextResponse } from 'next/server'

// Redirect to the static widget script in public folder
// This avoids webpack processing the large script file
export async function GET(request: Request) {
  const url = new URL(request.url)
  const origin = url.origin
  
  // Redirect to the static file served from public folder
  return NextResponse.redirect(`${origin}/widget-script.js`, {
    status: 307,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
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
