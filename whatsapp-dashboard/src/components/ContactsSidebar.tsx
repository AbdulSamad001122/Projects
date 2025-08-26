'use client'

import { useState, useEffect } from 'react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn, formatTime, formatDate } from '@/lib/utils'

type MessageSender = 'client' | 'customer' | 'ai'

interface Contact {
  id: string
  phoneNumber: string
  name: string | null
  latestMessage: {
    id: string
    messageText: string
    timestamp: Date
    sender: MessageSender
  } | null
  messageCount: number
}

interface ContactsSidebarProps {
  userId: string
  selectedContactId?: string
  onContactSelect: (contactId: string) => void
  className?: string
}

export function ContactsSidebar({ 
  userId, 
  selectedContactId, 
  onContactSelect, 
  className 
}: ContactsSidebarProps) {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchContacts()
  }, [userId])

  const fetchContacts = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/contacts?userId=${userId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch contacts')
      }
      
      const data = await response.json()
      setContacts(data.contacts.map((contact: any) => ({
        ...contact,
        latestMessage: contact.latestMessage ? {
          ...contact.latestMessage,
          timestamp: new Date(contact.latestMessage.timestamp)
        } : null
      })))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch contacts')
    } finally {
      setLoading(false)
    }
  }

  const getContactDisplayName = (contact: Contact) => {
    return contact.name || contact.phoneNumber
  }

  const getContactInitials = (contact: Contact) => {
    const name = getContactDisplayName(contact)
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const getSenderIcon = (sender: MessageSender) => {
    switch (sender) {
      case 'client':
        return '✓'
      case 'ai':
        return '🤖'
      default:
        return ''
    }
  }

  if (loading) {
    return (
      <div className={cn('w-80 bg-white border-r border-gray-200', className)}>
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Contacts</h2>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading contacts...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn('w-80 bg-white border-r border-gray-200', className)}>
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Contacts</h2>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-red-500">Error: {error}</div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('w-80 bg-white border-r border-gray-200 flex flex-col', className)}>
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Contacts</h2>
        <p className="text-sm text-gray-500">{contacts.length} conversations</p>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="divide-y divide-gray-100">
          {contacts.map((contact) => (
            <div
              key={contact.id}
              onClick={() => onContactSelect(contact.id)}
              className={cn(
                'p-4 hover:bg-gray-50 cursor-pointer transition-colors',
                selectedContactId === contact.id && 'bg-blue-50 border-r-2 border-blue-500'
              )}
            >
              <div className="flex items-start space-x-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-gray-200 text-gray-700 font-medium">
                    {getContactInitials(contact)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {getContactDisplayName(contact)}
                    </h3>
                    {contact.latestMessage && (
                      <span className="text-xs text-gray-500">
                        {formatTime(contact.latestMessage.timestamp)}
                      </span>
                    )}
                  </div>
                  
                  {contact.name && contact.name !== contact.phoneNumber && (
                    <p className="text-xs text-gray-500 truncate">
                      {contact.phoneNumber}
                    </p>
                  )}
                  
                  {contact.latestMessage ? (
                    <div className="flex items-center space-x-1 mt-1">
                      <span className="text-xs text-gray-400">
                        {getSenderIcon(contact.latestMessage.sender)}
                      </span>
                      <p className="text-sm text-gray-600 truncate">
                        {contact.latestMessage.messageText}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 italic mt-1">
                      No messages yet
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-400">
                      {contact.messageCount} message{contact.messageCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {contacts.length === 0 && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="text-gray-400 text-4xl mb-2">💬</div>
              <p className="text-gray-500">No contacts yet</p>
              <p className="text-sm text-gray-400 mt-1">
                Contacts will appear here when messages are received
              </p>
            </div>
          </div>
        )}
      </ScrollArea>
    </div>
  )
}