import { describe, it, expect, beforeEach } from 'vitest'
import { useChatStore } from '../chatStore'
import type { ChatMessage } from '@/types'

const makeMsg = (overrides: Partial<ChatMessage> = {}): ChatMessage => ({
  id: 'msg-1',
  role: 'user',
  content: 'Hello',
  timestamp: '2024-01-01T00:00:00Z',
  ...overrides,
})

describe('chatStore', () => {
  beforeEach(() => {
    useChatStore.setState({
      messages: [],
      isStreaming: false,
      error: null,
    })
  })

  it('adds a message', () => {
    useChatStore.getState().addMessage(makeMsg())
    expect(useChatStore.getState().messages).toHaveLength(1)
    expect(useChatStore.getState().messages[0].content).toBe('Hello')
  })

  it('updates last assistant message', () => {
    useChatStore.getState().addMessage(makeMsg({ id: 'u1', role: 'user' }))
    useChatStore.getState().addMessage(makeMsg({ id: 'a1', role: 'assistant', content: '' }))

    useChatStore.getState().updateLastAssistantMessage('Updated content')
    const msgs = useChatStore.getState().messages
    expect(msgs[1].content).toBe('Updated content')
    expect(msgs[0].content).toBe('Hello') // user msg unchanged
  })

  it('adds tool activity to a message', () => {
    useChatStore.getState().addMessage(makeMsg({ id: 'a1', role: 'assistant', toolActivity: [] }))

    useChatStore.getState().addToolActivity('a1', {
      tool: 'fetch_url',
      input: { url: 'https://example.com' },
      status: 'running',
    })

    const msg = useChatStore.getState().messages[0]
    expect(msg.toolActivity).toHaveLength(1)
    expect(msg.toolActivity![0].tool).toBe('fetch_url')
    expect(msg.toolActivity![0].status).toBe('running')
  })

  it('updates tool activity status', () => {
    useChatStore.getState().addMessage(
      makeMsg({
        id: 'a1',
        role: 'assistant',
        toolActivity: [{ tool: 'fetch_url', input: {}, status: 'running' }],
      })
    )

    useChatStore.getState().updateToolActivity('a1', 'fetch_url', {
      result: 'content',
      status: 'complete',
    })

    const ta = useChatStore.getState().messages[0].toolActivity![0]
    expect(ta.status).toBe('complete')
    expect(ta.result).toBe('content')
  })

  it('sets streaming state', () => {
    useChatStore.getState().setIsStreaming(true)
    expect(useChatStore.getState().isStreaming).toBe(true)
  })

  it('sets and clears error', () => {
    useChatStore.getState().setError('Something broke')
    expect(useChatStore.getState().error).toBe('Something broke')
    useChatStore.getState().setError(null)
    expect(useChatStore.getState().error).toBeNull()
  })

  it('clears all messages', () => {
    useChatStore.getState().addMessage(makeMsg())
    useChatStore.getState().setError('err')
    useChatStore.getState().clearMessages()
    expect(useChatStore.getState().messages).toHaveLength(0)
    expect(useChatStore.getState().error).toBeNull()
  })
})
