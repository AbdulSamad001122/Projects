import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/clients(.*)',
  '/items(.*)',
  '/company-setup(.*)',
  '/api/clients(.*)',
  '/api/items(.*)',
  '/api/invoices(.*)',
  '/api/company-profile(.*)'
])

export default clerkMiddleware(async (auth, req) => {
  // Apply security headers
  const response = NextResponse.next()
  
  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  
  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://clerk.com https://*.clerk.accounts.dev https://challenges.cloudflare.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: https://img.clerk.com",
    "font-src 'self' data:",
    "connect-src 'self' https://clerk.com https://*.clerk.accounts.dev https://clerk-telemetry.com https://*.clerk-telemetry.com",
    "frame-src 'self' https://clerk.com https://*.clerk.accounts.dev https://challenges.cloudflare.com",
    "worker-src 'self' blob:"
  ].join('; ')
  
  response.headers.set('Content-Security-Policy', csp)
  
  if (isProtectedRoute(req)) {
    await auth.protect()
  }
  
  return response
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};