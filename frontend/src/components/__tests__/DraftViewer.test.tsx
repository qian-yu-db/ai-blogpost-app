import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { useDraftStore } from '@/stores/draftStore'

// Mock CodeMirror (heavy dep, not needed for logic tests)
vi.mock('@uiw/react-codemirror', () => ({
  default: ({ value }: { value: string }) => <pre data-testid="codemirror">{value}</pre>,
}))

// Mock codemirror extensions
vi.mock('@codemirror/lang-markdown', () => ({
  markdown: () => [],
}))
vi.mock('@codemirror/view', () => ({
  EditorView: { theme: () => ({}) },
}))

// Mock ThemeContext
vi.mock('@/contexts/ThemeContext', () => ({
  useTheme: () => ({ theme: 'light' }),
}))

// Mock lucide-react
vi.mock('lucide-react', () => ({
  Code: () => <div data-testid="code-icon" />,
  Eye: () => <div data-testid="eye-icon" />,
  FileText: () => <div data-testid="filetext-icon" />,
  Download: () => <div data-testid="download-icon" />,
}))

// Mock api/client exports used by DraftViewer
vi.mock('@/api/client', () => ({
  exportMarkdown: vi.fn(),
  exportPdf: vi.fn(),
}))

// Mock lib/export
vi.mock('@/lib/export', () => ({
  downloadBlob: vi.fn(),
  extractTitle: vi.fn(() => 'blog-post'),
}))

// Mock MarkdownRenderer
vi.mock('@/components/shared/MarkdownRenderer', () => ({
  MarkdownRenderer: ({ content }: { content: string }) => <div data-testid="markdown-preview">{content}</div>,
}))

const { DraftViewer } = await import('@/components/artifacts/DraftViewer')

describe('DraftViewer', () => {
  beforeEach(() => {
    useDraftStore.setState({
      outline: '',
      draft: '',
      suggestions: [],
      stats: null,
      isGenerating: false,
    })
  })

  it('shows empty state when no draft', () => {
    render(<DraftViewer />)
    expect(screen.getByText('No draft generated yet')).toBeInTheDocument()
  })

  it('renders draft content in preview mode by default', () => {
    useDraftStore.setState({ draft: '# My Blog Post\n\nSome content' })
    render(<DraftViewer />)
    const preview = screen.getByTestId('markdown-preview')
    expect(preview).toBeInTheDocument()
    expect(preview.textContent).toContain('My Blog Post')
    expect(preview.textContent).toContain('Some content')
  })

  it('shows Draft header when content exists', () => {
    useDraftStore.setState({ draft: 'content' })
    render(<DraftViewer />)
    expect(screen.getByText('Draft')).toBeInTheDocument()
  })
})
