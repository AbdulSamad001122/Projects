'use client'

import { useState, useEffect, useRef } from 'react'
import { MessageBubble } from '@/components/MessageBubble'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { cn, formatDate } from '@/lib/utils'
import { Send, Phone, Video, MoreVertical } from 'lucide-react'

type MessageSender = 'client' | 'customer' | 'ai'

interface Message {
  id: string
  messageText: string
  timestamp: Date
  sender: MessageSender
}

interface Contact {
  id: string
  phoneNumber: string
  name: string | null
}

interface ChatWindowProps {
  contactId: string | null
  userId: string
  className?: string
}

export function ChatWindow({ contactId, userId, className }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [contact, setContact] = useState<Contact | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (contactId) {
      fetchConversation()
    } else {
      setMessages([])
      setContact(null)
    }
  }, [contactId, userId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const fetchConversation = async () => {
    if (!contactId) return
    
    try {
      setLoading(true)
      setError(null)
      
      // Fetch messages from the new API endpoint
      const messagesResponse = await fetch(`/api/messages?contactId=${contactId}`)
      
      if (!messagesResponse.ok) {
        throw new Error('Failed to fetch messages')
      }
      
      const messagesData = await messagesResponse.json()
      
      // Fetch contact info from contacts API
      const contactsResponse = await fetch(`/api/contacts?userId=${userId}`)
      
      if (!contactsResponse.ok) {
        throw new Error('Failed to fetch contacts')
      }
      
      const contactsData = await contactsResponse.json()
      const currentContact = contactsData.contacts.find((c: any) => c.id === contactId)
      
      setContact(currentContact || { id: contactId, name: null, phoneNumber: 'Unknown' })
      setMessages(messagesData.messages.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      })))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch conversation')
    } finally {
      setLoading(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const getContactDisplayName = () => {
    if (!contact) return ''
    return contact.name || contact.phoneNumber
  }

  const getContactInitials = () => {
    const name = getContactDisplayName()
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !contactId || !contact) return

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contactId,
          phoneNumber: contact.phoneNumber,
          sender: 'client',
          messageText: newMessage.trim()
        })
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      const data = await response.json()
      setMessages(prev => [...prev, {
        ...data.message,
        timestamp: new Date(data.message.timestamp)
      }])
      setNewMessage('')
    } catch (err) {
      console.error('Error sending message:', err)
    }
  }

  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { [key: string]: Message[] } = {}
    
    messages.forEach(message => {
      const dateKey = formatDate(message.timestamp)
      if (!groups[dateKey]) {
        groups[dateKey] = []
      }
      groups[dateKey].push(message)
    })
    
    return groups
  }

  if (!contactId) {
    return (
      <div className={cn('flex-1 flex items-center justify-center bg-gray-50', className)}>
        <div className="text-center">
          <div className="text-gray-400 text-6xl mb-4">💬</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Select a conversation
          </h3>
          <p className="text-gray-500">
            Choose a contact from the sidebar to start viewing messages
          </p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className={cn('flex-1 flex items-center justify-center', className)}>
        <div className="text-gray-500">Loading conversation...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn('flex-1 flex items-center justify-center', className)}>
        <div className="text-red-500">Error: {error}</div>
      </div>
    )
  }

  const messageGroups = groupMessagesByDate(messages)

  return (
    <div className={cn('flex-1 flex flex-col bg-white', className)}>
      {/* Chat Header */}
      {contact && (
        <div className="p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-gray-200 text-gray-700 font-medium">
                  {getContactInitials()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {getContactDisplayName()}
                </h2>
                {contact.name && contact.name !== contact.phoneNumber && (
                  <p className="text-sm text-gray-500">{contact.phoneNumber}</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="icon">
                <Phone className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <Video className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {Object.entries(messageGroups).map(([date, dateMessages]) => (
            <div key={date}>
              {/* Date Separator */}
              <div className="flex items-center justify-center my-4">
                <div className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full">
                  {date}
                </div>
              </div>
              
              {/* Messages for this date */}
              {dateMessages.map((message) => (
                <MessageBubble
                  key={message.id}
                  sender={message.sender}
                  messageText={message.messageText}
                  timestamp={message.timestamp}
                />
              ))}
            </div>
          ))}
          
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="text-gray-400 text-4xl mb-2">💬</div>
                <p className="text-gray-500">No messages yet</p>
                <p className="text-sm text-gray-400 mt-1">
                  Start a conversation by sending a message
                </p>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <Button 
            type="submit" 
            size="icon" 
            className="rounded-full"
            disabled={!newMessage.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}