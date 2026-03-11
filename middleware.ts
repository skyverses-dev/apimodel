import createMiddleware from 'next-intl/middleware'
import { NextResponse, type NextRequest } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'

const locales = ['vi', 'en']
const defaultLocale = 'vi'
const COOKIE_NAME = '2brain_token'

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',
})

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip API routes, webhooks, and static files
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/webhook') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next()
  }

  // Handle i18n routing
  const intlResponse = intlMiddleware(request)
  const response = intlResponse || NextResponse.next()

  // Get JWT from cookie
  const token = request.cookies.get(COOKIE_NAME)?.value
  const user = token ? await verifyToken(token) : null

  const localeSegment = locales.find(l => pathname.startsWith(`/${l}/`) || pathname === `/${l}`)
  const pathWithoutLocale = localeSegment
    ? pathname.slice(localeSegment.length + 1) || '/'
    : pathname

  // Protect dashboard and admin routes
  if (pathWithoutLocale.startsWith('/dashboard') || pathWithoutLocale.startsWith('/admin')) {
    if (!user) {
      const loginUrl = new URL(`/${localeSegment || defaultLocale}/auth/login`, request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // Redirect logged-in users away from auth pages
  if (pathWithoutLocale.startsWith('/auth/') && user) {
    return NextResponse.redirect(new URL(`/${localeSegment || defaultLocale}/dashboard`, request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
