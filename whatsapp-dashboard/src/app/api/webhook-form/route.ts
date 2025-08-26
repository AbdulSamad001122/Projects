import { NextRequest, NextResponse } from 'next/server'
import { dataStore } from '@/lib/dataStore'

// Alternative endpoint that accepts form data instead of JSON
// This bypasses n8n JSON parsing issues
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || ''
    let phoneNumber: string
    let message: string
    let contactName: string
    let contactId: string
    let userMessage: string
    let sender: string

    // Handle both JSON and form data
    if (contentType.includes('application/json')) {
      const jsonData = await request.json()
      
      // Support new format
      contactId = jsonData.contactId
      phoneNumber = jsonData.phoneNumber || (contactId ? contactId.replace('contact_', '') : '')
      message = jsonData.messageText || jsonData.message
      contactName = jsonData.contactName
      userMessage = jsonData.userMessage
      sender = jsonData.sender || 'ai'
      
      if (!contactId && !phoneNumber) {
        return NextResponse.json(
          { error: 'contactId or phoneNumber is required' },
          { status: 400 }
        )
      }
      
      if (!message) {
        return NextResponse.json(
          { error: 'messageText or message is required' },
          { status: 400 }
        )
      }
    } else {
      // Handle form data (legacy format)
      const formData = await request.formData()
      phoneNumber = formData.get('phoneNumber') as string
      message = formData.get('message') as string
      contactName = formData.get('contactName') as string
      sender = 'customer'

      if (!phoneNumber || !message) {
        return NextResponse.json(
          { error: 'phoneNumber and message are required' },
          { status: 400 }
        )
      }
    }

    // Create or update contact
    const finalContactId = contactId || `contact_${phoneNumber.replace(/[^0-9]/g, '')}`
    let contact = dataStore.getContactByPhone(phoneNumber) || dataStore.getContact(finalContactId)
    
    if (!contact) {
      contact = {
        id: finalContactId,
        name: contactName || phoneNumber,
        phoneNumber: phoneNumber,
        lastSeen: new Date().toISOString()
      }
      dataStore.addContact(contact)
      console.log('Created new contact via webhook-form:', contact)
    } else {
      // Update last seen
      contact.lastSeen = new Date().toISOString()
      if (contactName) {
        contact.name = contactName
      }
      dataStore.addContact(contact)
      console.log('Updated contact via webhook-form:', contact)
    }

    const storedMessages = []

    // If this is an AI response with a user message, store the user message first
    if (sender === 'ai' && userMessage) {
      const userMsg = {
        id: `msg_${Date.now()}_user`,
        contactId: contact.id,
        sender: 'customer' as const,
        messageText: userMessage,
        timestamp: new Date(Date.now() - 1000).toISOString(), // 1 second earlier
        type: 'text' as const,
        status: 'delivered' as const
      }
      dataStore.addMessage(userMsg)
      storedMessages.push(userMsg)
      console.log('Stored user message via webhook-form:', userMsg)
    }

    // Add the main message (AI response or customer message)
    const newMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      contactId: contact.id,
      sender: sender as 'customer' | 'ai',
      messageText: message,
      timestamp: new Date().toISOString(),
      type: 'text' as const,
      status: 'delivered' as const
    }

    dataStore.addMessage(newMessage)
    storedMessages.push(newMessage)
    console.log('Added message via webhook-form:', newMessage)

    return NextResponse.json({ 
      success: true, 
      message: 'Message(s) added successfully',
      contact,
      messages: storedMessages,
      count: storedMessages.length
    })

  } catch (error) {
    console.error('Error processing form data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint for testing
export async function GET() {
  return NextResponse.json({
    message: 'Form data webhook endpoint is working',
    usage: {
      method: 'POST',
      contentType: 'application/x-www-form-urlencoded',
      fields: {
        phoneNumber: 'required - sender phone number',
        message: 'required - message content',
        contactName: 'optional - sender name'
      }
    }
  })
}