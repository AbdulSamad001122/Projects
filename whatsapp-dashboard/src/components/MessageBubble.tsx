import { cn, formatTime } from '@/lib/utils'

type MessageSender = 'client' | 'customer' | 'ai'

interface MessageBubbleProps {
  sender: MessageSender
  messageText: string
  timestamp: Date
  className?: string
}

export function MessageBubble({ sender, messageText, timestamp, className }: MessageBubbleProps) {
  const isOutgoing = sender === 'client'
  const isAI = sender === 'ai'
  
  return (
    <div className={cn(
      'flex w-full mb-4',
      isOutgoing ? 'justify-end' : 'justify-start',
      className
    )}>
      <div className={cn(
        'max-w-[70%] rounded-lg px-4 py-2 shadow-sm',
        {
          // Client messages (outgoing) - blue
          'bg-blue-500 text-white': sender === 'client',
          // Customer messages (incoming) - gray
          'bg-gray-100 text-gray-900 border': sender === 'customer',
          // AI messages - green
          'bg-green-500 text-white': sender === 'ai'
        }
      )}>
        {isAI && (
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 bg-white rounded-full opacity-75"></div>
            <span className="text-xs font-medium opacity-90">AI Assistant</span>
          </div>
        )}
        
        <div className="break-words whitespace-pre-wrap">
          {messageText}
        </div>
        
        <div className={cn(
          'text-xs mt-1 opacity-70',
          isOutgoing || isAI ? 'text-right' : 'text-left'
        )}>
          {formatTime(timestamp)}
        </div>
      </div>
    </div>
  )
}