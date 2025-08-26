import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isProtectedRoute = createRouteMatcher([
  '/'
  // API routes are accessible without authentication for now
  // '/api/messages(.*)',
  // '/api/contacts(.*)'
])

export default clerkMiddleware(async (auth, req) => {
  // Only protect routes when we have valid Clerk keys
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  const hasValidClerkKeys = publishableKey && 
    publishableKey !== 'your-clerk-publishable-key' &&
    publishableKey !== 'pk_test_placeholder_key_replace_with_your_actual_clerk_publishable_key' &&
    publishableKey.startsWith('pk_')

  if (isProtectedRoute(req) && hasValidClerkKeys) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}