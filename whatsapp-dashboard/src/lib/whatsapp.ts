interface WhatsAppContact {
  id: string;
  name: string;
  phoneNumber: string;
  profilePicture?: string;
  lastSeen?: string;
}

interface WhatsAppMessage {
  id: string;
  contactId: string;
  sender: 'client' | 'customer';
  messageText: string;
  timestamp: string;
  type: 'text' | 'image' | 'document' | 'audio' | 'video';
  status?: 'sent' | 'delivered' | 'read';
}

class WhatsAppService {
  private apiUrl: string;
  private accessToken: string;
  private phoneNumberId: string;

  constructor() {
    this.apiUrl = 'https://graph.facebook.com/v18.0';
    this.accessToken = process.env.WHATSAPP_API || '';
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${this.apiUrl}/${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`WhatsApp API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getContacts(): Promise<WhatsAppContact[]> {
    try {
      // Import dataStore here to avoid circular dependencies
      const { dataStore } = await import('./dataStore')
      const contacts = dataStore.getContacts()
      
      return contacts.map(contact => ({
        id: contact.id,
        name: contact.name,
        phoneNumber: contact.phoneNumber,
        profilePicture: contact.profilePicture,
        lastSeen: contact.lastSeen
      }))
    } catch (error) {
      console.error('Error fetching contacts:', error)
      return []
    }
  }

  async getMessages(contactId: string): Promise<WhatsAppMessage[]> {
    try {
      // Import dataStore here to avoid circular dependencies
      const { dataStore } = await import('./dataStore')
      const messages = dataStore.getMessages(contactId)
      
      return messages.map(message => ({
        id: message.id,
        contactId: message.contactId,
        sender: message.sender,
        messageText: message.messageText,
        timestamp: message.timestamp,
        type: message.type,
        status: message.status
      }))
    } catch (error) {
      console.error('Error fetching messages:', error)
      return []
    }
  }

  async sendMessage(to: string, message: string): Promise<boolean> {
    try {
      const endpoint = `${this.phoneNumberId}/messages`;
      const payload = {
        messaging_product: 'whatsapp',
        to: to,
        type: 'text',
        text: {
          body: message,
        },
      };

      await this.makeRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  }

  async markAsRead(messageId: string): Promise<boolean> {
    try {
      const endpoint = `${this.phoneNumberId}/messages`;
      const payload = {
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: messageId,
      };

      await this.makeRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      return true;
    } catch (error) {
      console.error('Error marking message as read:', error);
      return false;
    }
  }
}

export const whatsappService = new WhatsAppService();
export type { WhatsAppContact, WhatsAppMessage };