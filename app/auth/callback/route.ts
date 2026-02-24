import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const nextParam = searchParams.get('next') ?? '/'
  const next = nextParam.startsWith('/') ? nextParam : '/'
  const extCallback = searchParams.get('ext_callback')
  const state = searchParams.get('state')

  if (code) {
    const supabase = createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const redirectUrl = new URL(next, origin)

      if (extCallback) {
        redirectUrl.searchParams.set('ext_callback', extCallback)
      }

      if (state) {
        redirectUrl.searchParams.set('state', state)
      }

      return NextResponse.redirect(redirectUrl)
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(new URL('/login?error=auth-callback-failed', origin))
}
