import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { approvedIdeCallback, safeLocalPath } from '@/lib/site-privacy.mjs'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const nextParam = searchParams.get('next') ?? '/'
  const next = safeLocalPath(nextParam)
  const extCallback = searchParams.get('ext_callback')
  const state = searchParams.get('state')
  const ideCallback = approvedIdeCallback(extCallback, state)

  if (extCallback && !ideCallback) {
    return NextResponse.redirect(new URL('/login?error=unsupported-ide-callback', origin))
  }

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const redirectUrl = new URL(next, origin)

      if (ideCallback) {
        redirectUrl.searchParams.set('ext_callback', ideCallback.toString())
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
