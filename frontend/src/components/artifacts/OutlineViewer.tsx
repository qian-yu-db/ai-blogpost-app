import { useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MarkdownRenderer } from '@/components/shared/MarkdownRenderer'
import { useDraftStore } from '@/stores/draftStore'
import { useChatStore } from '@/stores/chatStore'
import { useSessionStore } from '@/stores/sessionStore'
import { useNavigationStore } from '@/stores/navigationStore'
import { transitionPhase, sendMessage } from '@/api/client'
import { CheckCircle2, FileText, Loader2 } from 'lucide-react'
import type { ChatMessage } from '@/types'

export function OutlineViewer() {
  const outline = useDraftStore((s) => s.outline)
  const appendDraft = useDraftStore((s) => s.appendDraft)
  const setSuggestions = useDraftStore((s) => s.setSuggestions)
  const sessionId = useSessionStore((s) => s.sessionId)
  const phase = useSessionStore((s) => s.phase)
  const setPhase = useSessionStore((s) => s.setPhase)
  const addMessage = useChatStore((s) => s.addMessage)
  const updateLastAssistantMessage = useChatStore((s) => s.updateLastAssistantMessage)
  const addToolActivity = useChatStore((s) => s.addToolActivity)
  const updateToolActivity = useChatStore((s) => s.updateToolActivity)
  const setIsStreaming = useChatStore((s) => s.setIsStreaming)
  const isStreaming = useChatStore((s) => s.isStreaming)
  const setActiveArtifact = useNavigationStore((s) => s.setActiveArtifact)

  const handleApprove = useCallback(async () => {
    if (!sessionId || isStreaming) return

    // 1. Transition phase to drafting
    const session = await transitionPhase(sessionId, 'drafting')
    setPhase(session.phase)

    // 2. Add a user message to trigger draft generation
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: 'The outline looks good. Please write the full blog post draft based on this outline.',
      timestamp: new Date().toISOString(),
    }
    addMessage(userMsg)

    const assistantId = `assistant-${Date.now()}`
    addMessage({
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      toolActivity: [],
    })
    setIsStreaming(true)
    setActiveArtifact('draft')

    let fullText = ''
    try {
      for await (const event of sendMessage(sessionId, userMsg.content)) {
        switch (event.type) {
          case 'text':
            fullText += event.content
            updateLastAssistantMessage(fullText)
            break
          case 'draft_chunk':
            appendDraft(event.content)
            break
          case 'tool_use':
            addToolActivity(assistantId, { tool: event.tool, input: event.input, status: 'running' })
            break
          case 'tool_result':
            updateToolActivity(assistantId, event.tool, { result: event.result, status: 'complete' })
            break
          case 'phase_change':
            setPhase(event.phase)
            break
          case 'review':
            setSuggestions(event.suggestions)
            break
          case 'done':
            break
        }
      }
    } catch {
      // Error handled by streaming
    } finally {
      setIsStreaming(false)
    }
  }, [sessionId, isStreaming, setPhase, addMessage, updateLastAssistantMessage, addToolActivity, updateToolActivity, setIsStreaming, setActiveArtifact, appendDraft, setSuggestions])

  if (!outline) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-muted-foreground gap-3">
        <FileText className="h-10 w-10 text-muted-foreground/30" />
        <p className="text-sm">No outline generated yet</p>
        <p className="text-xs">Start chatting to create your blog post outline</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b bg-accent/50 px-4 py-3">
        <h3 className="font-semibold text-sm">Outline</h3>
        {phase === 'planning' && (
          <Button size="sm" onClick={handleApprove} disabled={isStreaming}>
            {isStreaming ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
            )}
            {isStreaming ? 'Generating Draft...' : 'Approve & Continue'}
          </Button>
        )}
      </div>
      <ScrollArea className="flex-1 p-4">
        <MarkdownRenderer content={outline} />
      </ScrollArea>
    </div>
  )
}
