import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  let user = null
  try {
    const { data, error } = await supabase.auth.getUser()
    if (error) {
      if (
        error.status === 400 ||
        error.name === 'AuthSessionMissingError' ||
        (error as { code?: string }).code === 'refresh_token_not_found'
      ) {
        // Clear all Supabase auth cookies so browser stops repeating the invalid refresh token
        request.cookies.getAll().forEach((cookie) => {
          if (cookie.name.startsWith('sb-') || cookie.name.includes('auth-token')) {
            supabaseResponse.cookies.delete(cookie.name)
          }
        })
      }
    } else {
      user = data.user
    }
  } catch (err: unknown) {
    const errObj = err as { code?: string; status?: number }
    if (errObj?.code === 'refresh_token_not_found' || errObj?.status === 400) {
      request.cookies.getAll().forEach((cookie) => {
        if (cookie.name.startsWith('sb-') || cookie.name.includes('auth-token')) {
          supabaseResponse.cookies.delete(cookie.name)
        }
      })
    }
  }

  if (
    !user &&
    (request.nextUrl.pathname.includes('/dashboard') || request.nextUrl.pathname.endsWith('/dashboard'))
  ) {
    const url = request.nextUrl.clone()
    const localeMatch = request.nextUrl.pathname.match(/^\/(ru|en)/)
    const localePrefix = localeMatch ? `/${localeMatch[1]}` : ''
    url.pathname = `${localePrefix}/login`
    const redirectRes = NextResponse.redirect(url)
    // Propagate cookie changes (like deleted auth cookies) to redirect response
    supabaseResponse.cookies.getAll().forEach((c) => redirectRes.cookies.set(c))
    return redirectRes
  }

  return supabaseResponse
}
