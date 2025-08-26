import { NextRequest, NextResponse } from 'next/server'
import { whatsappService } from '@/lib/whatsapp'

export async function GET(request: NextRequest) {
  try {
    // For demo purposes, we'll skip authentication
    // In production, you would verify the user's WhatsApp Business API access

    // Fetch contacts from WhatsApp API (now using dataStore)
    const contacts = await whatsappService.getContacts()
    const { dataStore } = await import('@/lib/dataStore')
    
    // Transform contacts to match the expected format with real message data
    const transformedContacts = contacts.map(contact => {
      const latestMessage = dataStore.getLatestMessage(contact.id)
      const unreadCount = dataStore.getUnreadCount(contact.id)
      const messageCount = dataStore.getMessages(contact.id).length
      
      return {
        id: contact.id,
        name: contact.name,
        phoneNumber: contact.phoneNumber,
        profilePicture: contact.profilePicture || null,
        lastSeen: contact.lastSeen,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        latestMessage: latestMessage ? {
          messageText: latestMessage.messageText,
          timestamp: latestMessage.timestamp,
          sender: latestMessage.sender
        } : {
          messageText: 'No messages yet',
          timestamp: contact.lastSeen || new Date().toISOString(),
          sender: 'customer'
        },
        messageCount,
        unreadCount
      }
    })

    return NextResponse.json({ contacts: transformedContacts })

  } catch (error) {
    console.error('Error fetching contacts:', error)
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
    const { phoneNumber, name } = body

    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'phoneNumber is required' },
        { status: 400 }
      )
    }

    // In a real implementation, you would store this contact information
    // For now, we'll just return a success response
    const contact = {
      id: `contact_${Date.now()}`,
      phoneNumber,
      name: name || phoneNumber,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    return NextResponse.json({ contact })

  } catch (error) {
    console.error('Error creating contact:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}