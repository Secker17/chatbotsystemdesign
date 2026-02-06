import { NextResponse, type NextRequest } from 'next/server'

// Simple cookie-based auth check middleware
// No external dependencies - only uses next/server
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip API routes entirely - they handle their own auth
  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // Skip static assets
  if (pathname.startsWith('/_next/')) {
    return NextResponse.next()
  }

  // Protect admin routes
  if (pathname.startsWith('/admin')) {
    const hasCustomAuth = request.cookies.has('sb-auth-token')
    const hasSupabaseAuth = request.cookies.getAll().some(
      (c) => c.name.startsWith('sb-') && c.name.endsWith('-auth-token')
    )

    if (!hasCustomAuth && !hasSupabaseAuth) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
