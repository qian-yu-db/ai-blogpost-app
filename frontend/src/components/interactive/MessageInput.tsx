import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { uploadFile } from '@/api/client'
import { useChatStore } from '@/stores/chatStore'
import { Send, Paperclip, Loader2, Link } from 'lucide-react'

interface MessageInputProps {
  onSend: (message: string) => void
}

export function MessageInput({ onSend }: MessageInputProps) {
  const [value, setValue] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isStreaming = useChatStore((s) => s.isStreaming)

  const handleSend = () => {
    const trimmed = value.trim()
    if (!trimmed || isStreaming) return
    onSend(trimmed)
    setValue('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    const uploaded = await uploadFile(file)
    setValue((prev) =>
      prev ? `${prev}\n\n[Attached: ${uploaded.filename}]\n${uploaded.content}` : `[Attached: ${uploaded.filename}]\n${uploaded.content}`
    )
    setIsUploading(false)

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleAddDocsLink = () => {
    setValue((prev) =>
      prev ? `${prev}\n\nReference: https://docs.databricks.com/en/` : 'Reference: https://docs.databricks.com/en/'
    )
  }

  return (
    <div className="border-t bg-background p-4">
      <div className="flex gap-2 items-end">
        <div className="flex-1 relative">
          <Textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            disabled={isStreaming}
            className="min-h-[44px] max-h-[160px] resize-none pr-20"
            rows={1}
          />
          <div className="absolute bottom-1.5 right-1.5 flex gap-1">
            <Button
              size="icon-xs"
              variant="ghost"
              onClick={handleAddDocsLink}
              disabled={isStreaming}
              title="Add Databricks docs link"
            >
              <Link className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon-xs"
              variant="ghost"
              onClick={() => fileInputRef.current?.click()}
              disabled={isStreaming || isUploading}
              title="Attach file"
            >
              {isUploading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Paperclip className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        </div>
        <Button
          onClick={handleSend}
          disabled={!value.trim() || isStreaming}
          size="icon"
        >
          {isStreaming ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".md,.txt,.py,.js,.ts,.tsx,.json,.yaml,.yml,.csv"
        onChange={handleFileUpload}
      />
    </div>
  )
}
