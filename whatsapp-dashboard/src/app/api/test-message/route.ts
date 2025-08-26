import { NextRequest, NextResponse } from 'next/server'
import { dataStore } from '@/lib/dataStore'

// Test endpoint to simulate receiving messages from n8n or other external sources
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phoneNumber, message, contactName } = body

    if (!phoneNumber || !message) {
      return NextResponse.json(
        { error: 'phoneNumber and message are required' },
        { status: 400 }
      )
    }

    // Create or update contact
    let contact = dataStore.getContactByPhone(phoneNumber)
    if (!contact) {
      contact = {
        id: `contact_${phoneNumber.replace(/[^0-9]/g, '')}`,
        name: contactName || phoneNumber,
        phoneNumber: phoneNumber,
        lastSeen: new Date().toISOString()
      }
      dataStore.addContact(contact)
      console.log('Created new contact:', contact)
    } else {
      // Update last seen
      contact.lastSeen = new Date().toISOString()
      if (contactName) {
        contact.name = contactName
      }
      dataStore.addContact(contact)
      console.log('Updated contact:', contact)
    }

    // Add the message
    const newMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      contactId: contact.id,
      sender: 'customer' as const,
      messageText: message,
      timestamp: new Date().toISOString(),
      type: 'text' as const,
      status: 'delivered' as const
    }

    dataStore.addMessage(newMessage)
    console.log('Added test message:', newMessage)

    return NextResponse.json({ 
      success: true, 
      message: 'Message added successfully',
      contact,
      addedMessage: newMessage
    })

  } catch (error) {
    console.error('Error adding test message:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint to check current data
export async function GET() {
  try {
    const contacts = dataStore.getContacts()
    const allMessages = dataStore.getMessages()
    
    return NextResponse.json({
      contacts,
      messages: allMessages,
      totalContacts: contacts.length,
      totalMessages: allMessages.length
    })
  } catch (error) {
    console.error('Error fetching test data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}