import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { useChatStore } from '@/stores/chatStore'
import type { ChatMessage } from '@/types'

// jsdom doesn't implement scrollIntoView
Element.prototype.scrollIntoView = vi.fn()

// Mock the API client so the component doesn't make real requests on mount
vi.mock('@/api/client', () => ({
  startSession: vi.fn().mockResolvedValue({ id: 'test-session', planningContext: null }),
  sendMessage: vi.fn(),
  uploadFile: vi.fn(),
}))

// Mock lucide-react — include all icons used by ChatPanel, ChatMessage, ToolActivityCard, MessageInput
vi.mock('lucide-react', () => ({
  Loader2: () => <div data-testid="loader" />,
  Send: () => <div data-testid="send-icon" />,
  Bot: () => <div data-testid="bot-icon" />,
  User: () => <div data-testid="user-icon" />,
  Link: () => <div data-testid="link-icon" />,
  Paperclip: () => <div data-testid="paperclip-icon" />,
  Wrench: () => <div data-testid="wrench-icon" />,
  Check: () => <div data-testid="check-icon" />,
  ChevronDown: () => <div data-testid="chevron-icon" />,
}))

// Mock MarkdownRenderer to avoid ThemeContext dependency
vi.mock('@/components/shared/MarkdownRenderer', () => ({
  MarkdownRenderer: ({ content }: { content: string }) => <div data-testid="markdown">{content}</div>,
}))

// Import lazily after mocks are set up
const { ChatPanel } = await import('@/components/interactive/ChatPanel')

describe('ChatPanel', () => {
  beforeEach(() => {
    useChatStore.setState({
      messages: [],
      isStreaming: false,
      error: null,
    })
  })

  it('renders without crashing', () => {
    render(<ChatPanel />)
    // The component should render the message input area (textarea)
    expect(document.querySelector('textarea')).toBeTruthy()
  })

  it('renders messages from store', () => {
    const messages: ChatMessage[] = [
      { id: 'u1', role: 'user', content: 'What about Delta Lake?', timestamp: '2024-01-01T00:00:00Z' },
      { id: 'a1', role: 'assistant', content: 'Delta Lake is great!', timestamp: '2024-01-01T00:00:01Z' },
    ]
    useChatStore.setState({ messages })

    render(<ChatPanel />)
    expect(screen.getByText('What about Delta Lake?')).toBeInTheDocument()
    expect(screen.getByText('Delta Lake is great!')).toBeInTheDocument()
  })

  it('shows loading indicator when streaming with empty content', () => {
    const messages: ChatMessage[] = [
      { id: 'a1', role: 'assistant', content: '', timestamp: '2024-01-01T00:00:00Z' },
    ]
    useChatStore.setState({ messages, isStreaming: true })

    render(<ChatPanel />)
    // Bouncing dots indicator — 3 spans inside a container
    const dots = document.querySelectorAll('.rounded-full.bg-primary\\/60')
    expect(dots.length).toBe(3)
  })
})
