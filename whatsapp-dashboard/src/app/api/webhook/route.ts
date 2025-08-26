import { NextRequest, NextResponse } from 'next/server'
import { dataStore } from '@/lib/dataStore'

export async function GET(request: NextRequest) {
  // WhatsApp webhook verification
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  // Verify the webhook (use your own verify token)
  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'your_verify_token'

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('Webhook verified successfully!')
    return new NextResponse(challenge, { status: 200 })
  } else {
    console.log('Webhook verification failed')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Received webhook:', JSON.stringify(body, null, 2))

    // Process WhatsApp webhook data
    if (body.object === 'whatsapp_business_account') {
      body.entry?.forEach((entry: any) => {
        entry.changes?.forEach((change: any) => {
          if (change.field === 'messages') {
            const value = change.value
            
            // Process incoming messages
            if (value.messages) {
              value.messages.forEach((message: any) => {
                const contactPhone = message.from
                const messageText = message.text?.body || message.type || 'Media message'
                const messageId = message.id
                const timestamp = new Date(parseInt(message.timestamp) * 1000).toISOString()

                // Add or update contact
                let contact = dataStore.getContactByPhone(contactPhone)
                if (!contact) {
                  contact = {
                    id: `contact_${contactPhone.replace(/[^0-9]/g, '')}`,
                    name: value.contacts?.[0]?.profile?.name || contactPhone,
                    phoneNumber: contactPhone,
                    lastSeen: timestamp
                  }
                  dataStore.addContact(contact)
                } else {
                  contact.lastSeen = timestamp
                  dataStore.addContact(contact) // Update existing contact
                }

                // Add message
                const newMessage = {
                  id: messageId,
                  contactId: contact.id,
                  sender: 'customer' as const,
                  messageText,
                  timestamp,
                  type: (message.type || 'text') as 'text' | 'image' | 'document' | 'audio' | 'video',
                  status: 'delivered' as const
                }
                
                dataStore.addMessage(newMessage)
                console.log('Added new message:', newMessage)
              })
            }

            // Process message status updates
            if (value.statuses) {
              value.statuses.forEach((status: any) => {
                dataStore.updateMessageStatus(status.id, status.status)
                console.log('Updated message status:', status)
              })
            }
          }
        })
      })
    }

    return NextResponse.json({ status: 'success' }, { status: 200 })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Data is now managed through the dataStore singleton
// Access via: import { dataStore } from '@/lib/dataStore'