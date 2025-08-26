import { NextRequest, NextResponse } from 'next/server'
import { whatsappService } from '@/lib/whatsapp'

export async function GET(request: NextRequest) {
  try {
    // For demo purposes, we'll skip authentication
    // In production, you would verify the user's WhatsApp Business API access

    const { searchParams } = new URL(request.url)
    const contactId = searchParams.get('contactId')

    console.log('GET /api/messages - contactId:', contactId)

    if (!contactId) {
      return NextResponse.json(
        { error: 'contactId is required' },
        { status: 400 }
      )
    }

    // Import dataStore to fetch messages
    const { dataStore } = await import('@/lib/dataStore')
    
    // Fetch messages from dataStore (where all messages are stored)
    const messages = dataStore.getMessages(contactId)
    console.log('Messages found for contactId', contactId, ':', messages.length)
    console.log('All messages in store:', dataStore.getMessages().length)
    
    // Transform messages to match the expected format
    const transformedMessages = messages.map(message => ({
      id: message.id,
      contactId: message.contactId,
      sender: message.sender,
      messageText: message.messageText,
      timestamp: message.timestamp,
      type: message.type || 'text',
      status: message.status || 'delivered'
    }))

    console.log('Returning transformed messages:', transformedMessages.length)
    return NextResponse.json({ messages: transformedMessages })

  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // For demo purposes, we'll skip authentication
    // In production, you would verify the user's WhatsApp Business API access

    const body = await request.json()
    
    // Support both single message and batch message formats
    const isArray = Array.isArray(body)
    const messages = isArray ? body : [body]
    
    // Import dataStore for message storage
    const { dataStore } = await import('@/lib/dataStore')
    const storedMessages = []
    
    for (const messageData of messages) {
      const { contactId, phoneNumber, sender, messageText, userMessage } = messageData

      // If this is an AI response with a user message, store the user message first
      if (sender === 'ai' && userMessage) {
        const userMsg = {
          id: `msg_${Date.now()}_user`,
          contactId: contactId || `contact_${phoneNumber?.replace(/[^0-9]/g, '')}` || 'unknown',
          sender: 'customer' as const,
          messageText: userMessage,
          timestamp: new Date(Date.now() - 1000).toISOString(), // 1 second earlier
          type: 'text' as const,
          status: 'delivered' as const
        }
        dataStore.addMessage(userMsg)
        storedMessages.push(userMsg)
        console.log('Stored user message:', userMsg)
      }

      // Validate required fields
      if (!sender || !messageText) {
        return NextResponse.json(
          { error: 'Missing required fields: sender, messageText' },
          { status: 400 }
        )
      }

      // Validate sender
      if (!['client', 'customer', 'ai'].includes(sender)) {
        return NextResponse.json(
          { error: 'Invalid sender. Must be: client, customer, or ai' },
          { status: 400 }
        )
      }

      // Handle sending messages to customers via WhatsApp API
      if (sender === 'client' && phoneNumber) {
        try {
          const success = await whatsappService.sendMessage(phoneNumber, messageText)
          if (success) {
            // Store the sent message in dataStore
            const message = {
              id: `msg_${Date.now()}`,
              contactId: contactId || `contact_${phoneNumber.replace(/[^0-9]/g, '')}`,
              sender: sender as 'client',
              messageText,
              timestamp: new Date().toISOString(),
              type: 'text' as const,
              status: 'sent' as const
            }
            
            dataStore.addMessage(message)
            storedMessages.push(message)
            console.log('Stored sent message:', message)
          } else {
            return NextResponse.json(
              { error: 'Failed to send message via WhatsApp API' },
              { status: 500 }
            )
          }
        } catch (error) {
          console.error('WhatsApp API error:', error)
          return NextResponse.json(
            { error: 'Failed to send message via WhatsApp API' },
            { status: 500 }
          )
        }
      } else {
        // For other message types (customer messages, AI responses), store them
        const message = {
          id: `msg_${Date.now()}`,
          contactId: contactId || 'unknown',
          sender: sender as 'client' | 'customer' | 'ai',
          messageText,
          timestamp: new Date().toISOString(),
          type: 'text' as const,
          status: 'delivered' as const
        }

        dataStore.addMessage(message)
        storedMessages.push(message)
        console.log('Stored message:', message)
      }
    }

    // Return all stored messages
    return NextResponse.json({ 
      messages: storedMessages,
      count: storedMessages.length 
    })

  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}