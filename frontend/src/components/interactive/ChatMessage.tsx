import { cn } from '@/lib/utils'
import type { ChatMessage as ChatMessageType } from '@/types'
import { MarkdownRenderer } from '@/components/shared/MarkdownRenderer'
import { ToolActivityCard } from './ToolActivityCard'
import { User, Bot } from 'lucide-react'

interface ChatMessageProps {
  message: ChatMessageType
}

function formatTime(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user'

  return (
    <div className={cn('flex gap-3 animate-slide-up-fade', isUser ? 'flex-row-reverse' : 'flex-row')}>
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
          isUser ? 'bg-primary text-primary-foreground' : 'gradient-primary text-white'
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>

      <div className={cn('flex max-w-[80%] flex-col gap-1', isUser && 'items-end')}>
        <div
          className={cn(
            'rounded-lg px-4 py-2.5',
            isUser
              ? 'bg-primary text-primary-foreground'
              : 'bg-card border border-border shadow-sm text-foreground'
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap text-sm">{message.content}</p>
          ) : (
            <MarkdownRenderer
              content={message.content}
              className="prose prose-sm dark:prose-invert max-w-none"
            />
          )}
        </div>

        <span className="text-[10px] text-muted-foreground px-1">
          {formatTime(message.timestamp)}
        </span>

        {message.toolActivity && message.toolActivity.length > 0 && (
          <div className="flex w-full flex-col gap-1.5">
            {message.toolActivity.map((activity, i) => (
              <ToolActivityCard key={`${activity.tool}-${i}`} activity={activity} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
