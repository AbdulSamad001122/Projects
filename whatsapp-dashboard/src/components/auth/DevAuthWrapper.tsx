'use client'

import { useUser, UserButton } from '@clerk/nextjs'
import { ReactNode } from 'react'

interface DevAuthWrapperProps {
  children: (user: { id: string; firstName?: string | null }) => ReactNode
  fallback?: ReactNode
}

export function DevAuthWrapper({ children, fallback }: DevAuthWrapperProps) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  
  // Check if we have valid Clerk keys
  const hasValidClerkKeys = publishableKey && 
    publishableKey !== 'your-clerk-publishable-key' &&
    publishableKey !== 'pk_test_placeholder_key_replace_with_your_actual_clerk_publishable_key' &&
    publishableKey.startsWith('pk_')

  if (!hasValidClerkKeys) {
    // Return development version with mock user
    const mockUser = { id: 'dev-user-123', firstName: 'Developer' }
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-green-500 border-b px-6 py-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-white">WhatsApp Dashboard (Development Mode)</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-white">Welcome, {mockUser.firstName}!</span>
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
              {mockUser.firstName?.[0] || 'D'}
            </div>
          </div>
        </div>
        <div className="p-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Development Mode
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    To enable full authentication, please add your Clerk API keys to the .env file.
                    Get your keys from{' '}
                    <a href="https://dashboard.clerk.com" target="_blank" rel="noopener noreferrer" className="underline">
                      Clerk Dashboard
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
          {children(mockUser)}
        </div>
      </div>
    )
  }

  // Use actual Clerk authentication
  return <ClerkAuthWrapper>{children}</ClerkAuthWrapper>
}

function ClerkAuthWrapper({ children }: { children: (user: { id: string; firstName?: string | null }) => ReactNode }) {
  const { isLoaded, isSignedIn, user } = useUser()

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Welcome to WhatsApp Dashboard</h1>
          <p className="text-gray-600 mb-8">Please sign in to access your dashboard</p>
          <a
            href="/sign-in"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Sign In
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-green-500 border-b px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-semibold text-white">WhatsApp Dashboard</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-white">Welcome, {user.firstName}!</span>
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
      <div className="p-4">
        {children({ id: user.id, firstName: user.firstName })}
      </div>
    </div>
  )
}