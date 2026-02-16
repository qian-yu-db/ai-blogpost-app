import { useEffect, useRef, useCallback } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ChatMessage } from './ChatMessage'
import { MessageInput } from './MessageInput'
import { useChatStore } from '@/stores/chatStore'
import { useSessionStore } from '@/stores/sessionStore'
import { useDraftStore } from '@/stores/draftStore'
import { useNavigationStore } from '@/stores/navigationStore'
import { useSessionListStore, loadSession, WELCOME_MESSAGE, validateBackendSession } from '@/stores/sessionListStore'
import { startSession, sendMessage } from '@/api/client'
import type { ChatMessage as ChatMessageType } from '@/types'

// Module-level flag survives React 18 StrictMode remounts
let _initStarted = false

export function ChatPanel() {
  const messages = useChatStore((s) => s.messages)
  const isStreaming = useChatStore((s) => s.isStreaming)
  const addMessage = useChatStore((s) => s.addMessage)
  const updateLastAssistantMessage = useChatStore((s) => s.updateLastAssistantMessage)
  const addToolActivity = useChatStore((s) => s.addToolActivity)
  const updateToolActivity = useChatStore((s) => s.updateToolActivity)
  const setIsStreaming = useChatStore((s) => s.setIsStreaming)
  const setError = useChatStore((s) => s.setError)

  const sessionId = useSessionStore((s) => s.sessionId)
  const setSessionId = useSessionStore((s) => s.setSessionId)
  const setPhase = useSessionStore((s) => s.setPhase)
  const updatePlanningContext = useSessionStore((s) => s.updatePlanningContext)

  const appendOutline = useDraftStore((s) => s.appendOutline)
  const appendDraft = useDraftStore((s) => s.appendDraft)
  const setDraft = useDraftStore((s) => s.setDraft)
  const setSuggestions = useDraftStore((s) => s.setSuggestions)

  const setReviewSummary = useDraftStore((s) => s.setReviewSummary)
  const setActiveArtifact = useNavigationStore((s) => s.setActiveArtifact)

  const scrollRef = useRef<HTMLDivElement>(null)
  const draftResetNeeded = useRef(false)

  useEffect(() => {
    if (_initStarted) return
    _initStarted = true
    initSession()
  }, [])

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const initSession = async () => {
    // Check if there's a persisted session to restore
    const { slots, activeIndex } = useSessionListStore.getState()
    if (slots.length > 0) {
      const activeSlot = slots[activeIndex]
      if (activeSlot && loadSession(activeSlot.sessionId)) {
        // Validate backend session exists — await so sessionId is correct before user can send
        const result = await validateBackendSession(activeSlot.sessionId)
        if (!result.valid && result.newSessionId) {
          useSessionStore.getState().setSessionId(result.newSessionId)
          const store = useSessionListStore.getState()
          store.updateSlot(store.activeIndex, { sessionId: result.newSessionId })
        }
        return // Restored from localStorage
      }
    }

    // No persisted session — create a new one
    const session = await startSession()
    setSessionId(session.id)
    if (session.planningContext) {
      updatePlanningContext(session.planningContext)
    }

    // Register in session list
    useSessionListStore.getState().addSlot({
      sessionId: session.id,
      label: 'Untitled Post',
      phase: 'planning',
      updatedAt: new Date().toISOString(),
    })

    addMessage(WELCOME_MESSAGE())
  }

  const handleSend = useCallback(async (message: string) => {
    if (!sessionId) return

    const userMsg: ChatMessageType = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    }
    addMessage(userMsg)

    const assistantId = `assistant-${Date.now()}`
    const assistantMsg: ChatMessageType = {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      toolActivity: [],
    }
    addMessage(assistantMsg)
    setIsStreaming(true)
    draftResetNeeded.current = true

    let fullText = ''

    try {
      for await (const event of sendMessage(sessionId, message)) {
        switch (event.type) {
          case 'text':
            fullText += event.content
            updateLastAssistantMessage(fullText)
            break

          case 'tool_use':
            addToolActivity(assistantId, {
              tool: event.tool,
              input: event.input,
              status: 'running',
            })
            break

          case 'tool_result':
            updateToolActivity(assistantId, event.tool, {
              result: event.result,
              status: 'complete',
            })
            break

          case 'phase_change':
            setPhase(event.phase)
            if (event.phase === 'drafting') {
              draftResetNeeded.current = true
            }
            if (event.topic) {
              const { slots, activeIndex, updateSlot } = useSessionListStore.getState()
              if (slots[activeIndex]) {
                updateSlot(activeIndex, { label: event.topic })
              }
            }
            break

          case 'outline':
            appendOutline(event.content)
            setActiveArtifact('outline')
            break

          case 'draft_chunk':
            if (draftResetNeeded.current) {
              setDraft('')
              draftResetNeeded.current = false
            }
            appendDraft(event.content)
            setActiveArtifact('draft')
            break

          case 'review':
            if (Array.isArray(event.suggestions)) {
              setSuggestions(event.suggestions)
              setActiveArtifact('review')
            }
            break

          case 'draft_updated':
            setDraft(event.content)
            setActiveArtifact('draft')
            break

          case 'done': {
            // Capture the review summary when in reviewing phase
            const currentPhase = useSessionStore.getState().phase
            if ((currentPhase === 'reviewing' || currentPhase === 'exporting') && fullText) {
              setReviewSummary(fullText)
            }
            break
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Stream failed')
    } finally {
      setIsStreaming(false)
    }
  }, [sessionId, addMessage, updateLastAssistantMessage, addToolActivity, updateToolActivity, setIsStreaming, setError, setPhase, appendOutline, appendDraft, setDraft, setSuggestions, setReviewSummary, setActiveArtifact])

  const queuedMessage = useChatStore((s) => s.queuedMessage)
  const setQueuedMessage = useChatStore((s) => s.setQueuedMessage)

  useEffect(() => {
    if (queuedMessage && !isStreaming) {
      handleSend(queuedMessage)
      setQueuedMessage(null)
    }
  }, [queuedMessage, isStreaming, handleSend, setQueuedMessage])

  return (
    <div className="flex h-full flex-col">
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4 pb-4">
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}
          {isStreaming && messages[messages.length - 1]?.content === '' && (
            <div className="flex items-center gap-1.5 pl-11">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="h-2 w-2 rounded-full bg-primary/60"
                  style={{
                    animation: 'bounce-dot 1.4s infinite ease-in-out both',
                    animationDelay: `${i * 0.16}s`,
                  }}
                />
              ))}
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>
      <MessageInput onSend={handleSend} />
    </div>
  )
}
