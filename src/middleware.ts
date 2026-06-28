import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const isClock = request.nextUrl.pathname.startsWith('/auth/clock')
  const isKitchen = request.nextUrl.pathname.startsWith('/kitchen')

  // 0. Always allow the clock page and kitchen pages (no auth needed)
  if (isClock || isKitchen) return response

  const { data: { user } } = await supabase.auth.getUser()

  const isDashboard = request.nextUrl.pathname.startsWith('/dashboard')
  const isAdmin = request.nextUrl.pathname.startsWith('/admin')
  const isAuth = request.nextUrl.pathname.startsWith('/auth')
  const isDiagnostic = request.nextUrl.pathname === '/auth/diagnostic'

  // 1. Always allow the diagnostic page
  if (isDiagnostic) return response

  // 1. Skip auto-redirect from auth to dashboard to prevent loops. 
  // Redirection is handled in the login page and specific layouts based on roles.

  // 2. If user is NOT authenticated and tries to access protected pages, send them to login
  if (!user && (isDashboard || isAdmin)) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
