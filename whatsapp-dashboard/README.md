# WhatsApp Dashboard

A modern WhatsApp-like dashboard built with Next.js, TypeScript, Tailwind CSS, and Postgres. This dashboard integrates with n8n workflows to receive and display WhatsApp messages in real-time.

## Features

- 📱 **WhatsApp-like Interface**: Clean, modern UI similar to WhatsApp Web
- 🔄 **n8n Integration**: Seamless integration with n8n workflows for message handling
- 💬 **Real-time Messaging**: View conversations with different message types (client, customer, AI)
- 👥 **Contact Management**: Automatic contact creation and management
- 🎨 **Modern UI**: Built with shadcn/ui components and Tailwind CSS
- 🗄️ **Database**: PostgreSQL with Prisma ORM for robust data management

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui, Radix UI
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Icons**: Lucide React

## Database Schema

### Users
- `id`: Unique identifier
- `email`: User email (unique)
- `name`: User display name
- `createdAt`, `updatedAt`: Timestamps

### Contacts
- `id`: Unique identifier
- `phoneNumber`: Contact phone number
- `name`: Contact display name
- `userId`: Foreign key to Users
- `createdAt`, `updatedAt`: Timestamps

### Messages
- `id`: Unique identifier
- `contactId`: Foreign key to Contacts
- `sender`: Enum ("client" | "customer" | "ai")
- `messageText`: Message content
- `timestamp`: Message timestamp
- `userId`: Foreign key to Users

## API Endpoints

### POST /api/messages
Create a new message (called by n8n).

**Request Body:**
```json
{
  "contactId": "string" | null,
  "phoneNumber": "string" | null,
  "sender": "client" | "customer" | "ai",
  "messageText": "string",
  "userId": "string",
  "contactName": "string" | null
}
```

### GET /api/messages/[contactId]
Fetch conversation history for a specific contact.

**Query Parameters:**
- `userId`: Required user ID
- `limit`: Number of messages to fetch (default: 100)
- `offset`: Pagination offset (default: 0)

### GET /api/contacts
Fetch all contacts for a user with latest message previews.

**Query Parameters:**
- `userId`: Required user ID

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate
```

### 2. Database Setup

1. **Set up PostgreSQL database** (local, Supabase, or NeonDB)

2. **Update environment variables** in `.env`:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/whatsapp_dashboard?schema=public"
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
```

3. **Run database migrations**:
```bash
npx prisma db push
```

### 3. Development

```bash
# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

### 4. n8n Integration

Configure your n8n workflow to send HTTP POST requests to your dashboard:

**Endpoint**: `http://localhost:3000/api/messages`

**Example n8n HTTP Request Node:**
```json
{
  "method": "POST",
  "url": "http://localhost:3000/api/messages",
  "headers": {
    "Content-Type": "application/json"
  },
  "body": {
    "phoneNumber": "{{$json.from}}",
    "sender": "customer",
    "messageText": "{{$json.body}}",
    "userId": "demo-user-123",
    "contactName": "{{$json.pushname}}"
  }
}
```

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── contacts/
│   │   │   └── route.ts
│   │   └── messages/
│   │       ├── [contactId]/
│   │       │   └── route.ts
│   │       └── route.ts
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/
│   │   ├── avatar.tsx
│   │   ├── button.tsx
│   │   └── scroll-area.tsx
│   ├── ChatWindow.tsx
│   ├── ContactsSidebar.tsx
│   └── MessageBubble.tsx
└── lib/
    ├── prisma.ts
    └── utils.ts
```

## Usage

1. **Start the development server**
2. **Configure your n8n workflow** to send messages to the API
3. **View conversations** in the dashboard as messages are received
4. **Send replies** using the message input (optional feature)

## Message Types

- **Client Messages**: Blue bubbles (messages sent by your team)
- **Customer Messages**: Gray bubbles (messages from WhatsApp contacts)
- **AI Messages**: Green bubbles with AI indicator (automated responses)

## Production Deployment

1. **Set up production database** (Supabase, NeonDB, etc.)
2. **Update environment variables** for production
3. **Deploy to Vercel, Netlify, or your preferred platform**
4. **Update n8n webhook URLs** to point to production API

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - feel free to use this project for your own purposes.
