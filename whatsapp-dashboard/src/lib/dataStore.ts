// In-memory data store for messages and contacts
// In production, this should be replaced with a proper database

interface StoredMessage {
  id: string
  contactId: string
  sender: 'client' | 'customer' | 'ai'
  messageText: string
  timestamp: string
  type: 'text' | 'image' | 'document' | 'audio' | 'video'
  status?: 'sent' | 'delivered' | 'read'
}

interface StoredContact {
  id: string
  name: string
  phoneNumber: string
  profilePicture?: string
  lastSeen?: string
}

class DataStore {
  private messages: StoredMessage[] = []
  private contacts: StoredContact[] = []

  // Initialize with some mock data
  constructor() {
    this.initializeMockData()
  }

  private initializeMockData() {
    // Add mock contacts
    this.contacts = [
      {
        id: 'contact_1',
        name: 'John Doe',
        phoneNumber: '+1234567890',
        lastSeen: new Date(Date.now() - 1800000).toISOString()
      },
      {
        id: 'contact_2',
        name: 'Jane Smith',
        phoneNumber: '+0987654321',
        lastSeen: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: 'contact_923303676122',
        name: 'Abdul Aal',
        phoneNumber: '923303676122',
        lastSeen: new Date(Date.now() - 300000).toISOString()
      }
    ]

    // Add mock messages
    this.messages = [
      {
        id: 'msg_1',
        contactId: 'contact_1',
        sender: 'customer',
        messageText: 'Hello! I have a question about your services.',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        type: 'text',
        status: 'read'
      },
      {
        id: 'msg_2',
        contactId: 'contact_1',
        sender: 'client',
        messageText: 'Hi! I\'d be happy to help. What would you like to know?',
        timestamp: new Date(Date.now() - 3500000).toISOString(),
        type: 'text',
        status: 'read'
      },
      {
        id: 'msg_3',
        contactId: 'contact_923303676122',
        sender: 'customer',
        messageText: 'Haha, that\'s a fun question! 😊',
        timestamp: new Date(Date.now() - 1200000).toISOString(),
        type: 'text',
        status: 'read'
      },
      {
        id: 'msg_4',
        contactId: 'contact_923303676122',
        sender: 'ai',
        messageText: 'I\'m an AI WhatsApp Sales Assistant for **HotBot**, designed to make businesses super efficient and boost their sales! 🔥\n\nBasically, **HotBot is your AI WhatsApp agent** that replies instantly, handles all your customer queries 24/7, and helps you grow your business effortlessly.\n\nWant to see how "hot" we can make your business? We offer a **4-day free trial** so you can experience HotBot risk-free! ✅\n\nWhat kind of business do you run? I can show you exactly how HotBot can help your industry!',
        timestamp: new Date(Date.now() - 1140000).toISOString(),
        type: 'text',
        status: 'delivered'
      }
    ]
  }

  // Contact methods
  getContacts(): StoredContact[] {
    return [...this.contacts]
  }

  addContact(contact: StoredContact): void {
    const existingIndex = this.contacts.findIndex(c => c.phoneNumber === contact.phoneNumber)
    if (existingIndex !== -1) {
      this.contacts[existingIndex] = { ...this.contacts[existingIndex], ...contact }
    } else {
      this.contacts.push(contact)
    }
  }

  getContactByPhone(phoneNumber: string): StoredContact | undefined {
    return this.contacts.find(c => c.phoneNumber === phoneNumber)
  }

  // Message methods
  getMessages(contactId?: string): StoredMessage[] {
    if (contactId) {
      return this.messages.filter(m => m.contactId === contactId)
    }
    return [...this.messages]
  }

  addMessage(message: StoredMessage): void {
    // Avoid duplicates
    if (!this.messages.find(m => m.id === message.id)) {
      this.messages.push(message)
      console.log('Message added to store:', message)
    }
  }

  updateMessageStatus(messageId: string, status: 'sent' | 'delivered' | 'read'): void {
    const messageIndex = this.messages.findIndex(m => m.id === messageId)
    if (messageIndex !== -1) {
      this.messages[messageIndex].status = status
    }
  }

  // Get latest message for a contact
  getLatestMessage(contactId: string): StoredMessage | undefined {
    const contactMessages = this.messages
      .filter(m => m.contactId === contactId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    return contactMessages[0]
  }

  // Get unread count for a contact
  getUnreadCount(contactId: string): number {
    return this.messages.filter(m => 
      m.contactId === contactId && 
      m.sender === 'customer' && 
      m.status !== 'read'
    ).length
  }
}

// Export singleton instance
export const dataStore = new DataStore()
export type { StoredMessage, StoredContact }