'use client'

import { useState } from 'react'
import { DevAuthWrapper } from '@/components/auth/DevAuthWrapper'
import { ContactsSidebar } from '@/components/ContactsSidebar'
import { ChatWindow } from '@/components/ChatWindow'

export default function Dashboard() {
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null)

  return (
    <DevAuthWrapper>
      {(user) => (
        <div className="flex h-[calc(100vh-73px)]">
          <ContactsSidebar 
            userId={user.id}
            selectedContactId={selectedContactId}
            onContactSelect={setSelectedContactId}
          />
          <ChatWindow 
            contactId={selectedContactId}
            userId={user.id}
          />
        </div>
      )}
    </DevAuthWrapper>
  )
}
