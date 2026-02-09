import { create } from 'zustand'
import type { ChatMessage, ToolActivity } from '@/types'

interface ChatStore {
  messages: ChatMessage[]
  isStreaming: boolean
  error: string | null

  addMessage: (message: ChatMessage) => void
  updateLastAssistantMessage: (content: string) => void
  addToolActivity: (messageId: string, activity: ToolActivity) => void
  updateToolActivity: (messageId: string, tool: string, update: Partial<ToolActivity>) => void
  setIsStreaming: (streaming: boolean) => void
  setError: (error: string | null) => void
  clearMessages: () => void
  queuedMessage: string | null
  setQueuedMessage: (msg: string | null) => void
}

export const useChatStore = create<ChatStore>((set) => ({
  messages: [],
  isStreaming: false,
  error: null,

  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),

  updateLastAssistantMessage: (content) =>
    set((state) => {
      const messages = [...state.messages]
      for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].role === 'assistant') {
          messages[i] = { ...messages[i], content }
          break
        }
      }
      return { messages }
    }),

  addToolActivity: (messageId, activity) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === messageId
          ? { ...msg, toolActivity: [...(msg.toolActivity || []), activity] }
          : msg
      ),
    })),

  updateToolActivity: (messageId, tool, update) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === messageId
          ? {
              ...msg,
              toolActivity: (msg.toolActivity || []).map((ta) =>
                ta.tool === tool && ta.status === 'running' ? { ...ta, ...update } : ta
              ),
            }
          : msg
      ),
    })),

  setIsStreaming: (streaming) => set({ isStreaming: streaming }),
  setError: (error) => set({ error }),
  clearMessages: () => set({ messages: [], error: null }),
  queuedMessage: null,
  setQueuedMessage: (msg) => set({ queuedMessage: msg }),
}))
