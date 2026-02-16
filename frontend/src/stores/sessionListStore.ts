import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { WorkflowPhase, ChatMessage } from '@/types'
import { getSession, startSession } from '@/api/client'
import { useSessionStore } from './sessionStore'
import { useChatStore } from './chatStore'
import { useDraftStore } from './draftStore'
import { useNavigationStore } from './navigationStore'

/** Create a welcome message for new sessions. */
export function WELCOME_MESSAGE(): ChatMessage {
  return {
    id: `welcome-${Date.now()}`,
    role: 'assistant',
    content: "Hi! I'm here to help you plan and write your technical blog post. What topic would you like to write about?",
    timestamp: new Date().toISOString(),
  }
}

export type SessionSlot = {
  sessionId: string
  label: string
  phase: WorkflowPhase
  updatedAt: string
  wordCount?: number
  previewSnippet?: string
}

export const MAX_SLOTS = 10

export function formatRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

interface SessionListState {
  slots: SessionSlot[]
  activeIndex: number

  addSlot: (slot: SessionSlot) => void
  removeSlot: (index: number) => void
  setActiveIndex: (index: number) => void
  updateSlot: (index: number, update: Partial<SessionSlot>) => void
  clearOtherSlots: () => void
  clearOlderThan: (cutoffIso: string) => void
}

export const useSessionListStore = create<SessionListState>()(
  persist(
    (set) => ({
      slots: [],
      activeIndex: 0,

      addSlot: (slot) =>
        set((state) => {
          const newSlots = [...state.slots, slot]
          return {
            slots: newSlots,
            activeIndex: newSlots.length - 1,
          }
        }),

      removeSlot: (index) =>
        set((state) => {
          const newSlots = state.slots.filter((_, i) => i !== index)
          // Clean up localStorage for removed session
          const removed = state.slots[index]
          if (removed) {
            localStorage.removeItem(`blog-session-${removed.sessionId}`)
          }
          let newActive = state.activeIndex
          if (newActive >= newSlots.length) {
            newActive = Math.max(0, newSlots.length - 1)
          }
          return { slots: newSlots, activeIndex: newActive }
        }),

      setActiveIndex: (index) => set({ activeIndex: index }),

      updateSlot: (index, update) =>
        set((state) => ({
          slots: state.slots.map((slot, i) =>
            i === index ? { ...slot, ...update } : slot
          ),
        })),

      clearOtherSlots: () =>
        set((state) => {
          const active = state.slots[state.activeIndex]
          // Clean up localStorage for all removed sessions
          state.slots.forEach((slot, i) => {
            if (i !== state.activeIndex) {
              localStorage.removeItem(`blog-session-${slot.sessionId}`)
            }
          })
          return {
            slots: active ? [active] : [],
            activeIndex: 0,
          }
        }),

      clearOlderThan: (cutoffIso) =>
        set((state) => {
          const cutoff = new Date(cutoffIso).getTime()
          const kept: SessionSlot[] = []
          let newActiveIndex = 0
          state.slots.forEach((slot, i) => {
            if (new Date(slot.updatedAt).getTime() >= cutoff || i === state.activeIndex) {
              if (i === state.activeIndex) newActiveIndex = kept.length
              kept.push(slot)
            } else {
              localStorage.removeItem(`blog-session-${slot.sessionId}`)
            }
          })
          return { slots: kept, activeIndex: newActiveIndex }
        }),
    }),
    {
      name: 'blog-session-list',
    }
  )
)

/** Save current store state to localStorage for the given session. */
export function saveCurrentSession(sessionId: string) {
  const session = useSessionStore.getState()
  const chat = useChatStore.getState()
  const draft = useDraftStore.getState()
  const nav = useNavigationStore.getState()

  const snapshot = {
    session: {
      sessionId: session.sessionId,
      phase: session.phase,
      planningContext: session.planningContext,
      isConnected: session.isConnected,
    },
    chat: { messages: chat.messages },
    draft: {
      outline: draft.outline,
      draft: draft.draft,
      suggestions: draft.suggestions,
      reviewSummary: draft.reviewSummary,
      stats: draft.stats,
    },
    nav: { activeArtifact: nav.activeArtifact },
  }

  localStorage.setItem(`blog-session-${sessionId}`, JSON.stringify(snapshot))

  // Auto-generate label from topic or first user message
  let label = session.planningContext.topic
  if (!label) {
    const firstUserMsg = chat.messages.find((m) => m.role === 'user')
    if (firstUserMsg) {
      label = firstUserMsg.content.length > 40
        ? firstUserMsg.content.slice(0, 40) + '...'
        : firstUserMsg.content
    }
  }
  if (!label) label = 'Untitled Post'

  const wordCount = draft.stats?.word_count

  // Update the slot metadata
  const listStore = useSessionListStore.getState()
  const idx = listStore.slots.findIndex((s) => s.sessionId === sessionId)
  if (idx !== -1) {
    listStore.updateSlot(idx, {
      phase: session.phase,
      label,
      updatedAt: new Date().toISOString(),
      wordCount,
    })
  }
}

/** Load a session from localStorage into the stores. Returns false if no saved data. */
export function loadSession(sessionId: string): boolean {
  const raw = localStorage.getItem(`blog-session-${sessionId}`)
  if (!raw) return false

  const snapshot = JSON.parse(raw)

  useSessionStore.setState({
    sessionId: snapshot.session.sessionId,
    phase: snapshot.session.phase,
    planningContext: snapshot.session.planningContext,
    isConnected: snapshot.session.isConnected,
  })

  useChatStore.setState({
    messages: snapshot.chat.messages,
    isStreaming: false,
    error: null,
  })

  useDraftStore.setState({
    outline: snapshot.draft.outline,
    draft: snapshot.draft.draft,
    suggestions: snapshot.draft.suggestions,
    reviewSummary: snapshot.draft.reviewSummary || '',
    stats: snapshot.draft.stats,
    isGenerating: false,
  })

  useNavigationStore.setState({
    activeArtifact: snapshot.nav?.activeArtifact ?? null,
  })

  return true
}

/** Validate backend session exists; re-create if gone. Returns true if session is usable. */
export async function validateBackendSession(sessionId: string): Promise<{valid: boolean, newSessionId?: string}> {
  try {
    await getSession(sessionId)
    return { valid: true }
  } catch {
    // Backend session gone — re-create
    const newSession = await startSession()
    return { valid: false, newSessionId: newSession.id }
  }
}
