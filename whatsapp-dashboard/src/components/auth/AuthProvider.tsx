'use client'

import { ClerkProvider } from '@clerk/nextjs'
import { ReactNode } from 'react'

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  
  // Check if we have valid Clerk keys (not placeholder values)
  const hasValidClerkKeys = publishableKey && 
    publishableKey !== 'your-clerk-publishable-key' &&
    publishableKey !== 'pk_test_placeholder_key_replace_with_your_actual_clerk_publishable_key' &&
    publishableKey.startsWith('pk_')

  if (!hasValidClerkKeys) {
    // Return children without Clerk provider for development
    return <>{children}</>
  }

  return (
    <ClerkProvider>
      {children}
    </ClerkProvider>
  )
}