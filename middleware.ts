import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { isPrivateWebsiteUrl, PRIVATE_RESPONSE_HEADERS } from '@/lib/site-privacy.mjs'

export async function middleware(request: NextRequest) {
  const privateRequest = isPrivateWebsiteUrl(request.url)
  let response: NextResponse
  try {
    response = await updateSession(request, privateRequest ? { fetchTimeoutMs: 8000 } : undefined)
  } catch (error) {
    if (!privateRequest) throw error
    // Each private page/data reader verifies identity independently. A failed
    // session refresh must not bypass those checks or expose a cacheable error.
    response = NextResponse.next()
  }
  if (privateRequest) {
    for (const [name, value] of Object.entries(PRIVATE_RESPONSE_HEADERS)) response.headers.set(name, value)
  }
  return response
}

export const config = {
  matcher: [
    '/internal/:path*',
    '/api/internal/:path*',
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

