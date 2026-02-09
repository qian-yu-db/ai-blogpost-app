import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { useDraftStore } from '@/stores/draftStore'
import type { Suggestion } from '@/types'

// Mock lucide-react
vi.mock('lucide-react', () => ({
  Check: () => <div data-testid="check-icon" />,
  X: () => <div data-testid="x-icon" />,
  Wrench: () => <div data-testid="wrench-icon" />,
  Download: () => <div data-testid="download-icon" />,
}))

const { ReviewViewer } = await import('@/components/artifacts/ReviewViewer')

const makeSuggestion = (overrides: Partial<Suggestion> = {}): Suggestion => ({
  type: 'grammar',
  severity: 'warning',
  message: 'Fix this typo',
  line_start: 5,
  line_end: 5,
  original: 'teh',
  replacement: 'the',
  ...overrides,
})

describe('ReviewViewer', () => {
  beforeEach(() => {
    useDraftStore.setState({
      outline: '',
      draft: 'Some draft with teh word in it.',
      suggestions: [],
      stats: null,
      isGenerating: false,
    })
  })

  it('shows empty state when no suggestions', () => {
    render(<ReviewViewer />)
    expect(screen.getByText('No review suggestions yet')).toBeInTheDocument()
  })

  it('renders suggestions', () => {
    useDraftStore.setState({
      suggestions: [
        makeSuggestion({ message: 'Fix typo here' }),
        makeSuggestion({ type: 'style', message: 'Improve readability' }),
      ],
    })

    render(<ReviewViewer />)
    expect(screen.getByText('Fix typo here')).toBeInTheDocument()
    expect(screen.getByText('Improve readability')).toBeInTheDocument()
    expect(screen.getByText('2 suggestions')).toBeInTheDocument()
  })

  it('shows line numbers', () => {
    useDraftStore.setState({
      suggestions: [makeSuggestion({ line_start: 10, line_end: 12 })],
    })

    render(<ReviewViewer />)
    expect(screen.getByText('Line 10–12')).toBeInTheDocument()
  })

  it('shows original and replacement text', () => {
    useDraftStore.setState({
      suggestions: [makeSuggestion({ original: 'teh', replacement: 'the' })],
    })

    render(<ReviewViewer />)
    expect(screen.getByText('teh')).toBeInTheDocument()
    expect(screen.getByText('the')).toBeInTheDocument()
  })

  it('dismisses a suggestion', () => {
    useDraftStore.setState({
      suggestions: [
        makeSuggestion({ message: 'First' }),
        makeSuggestion({ message: 'Second' }),
      ],
    })

    render(<ReviewViewer />)

    // Click the second dismiss button (X)
    const dismissButtons = screen.getAllByTestId('x-icon')
    // Each suggestion has a dismiss button; the first suggestion also has an apply button
    fireEvent.click(dismissButtons[0].closest('button')!)

    expect(useDraftStore.getState().suggestions).toHaveLength(1)
    expect(useDraftStore.getState().suggestions[0].message).toBe('Second')
  })

  it('applies a suggestion and updates the draft', () => {
    useDraftStore.setState({
      draft: 'Some draft with teh word in it.',
      suggestions: [makeSuggestion({ original: 'teh', replacement: 'the' })],
    })

    render(<ReviewViewer />)

    // Click the apply button (check icon)
    const applyButton = screen.getByTestId('check-icon').closest('button')!
    fireEvent.click(applyButton)

    // Draft should be updated
    expect(useDraftStore.getState().draft).toBe('Some draft with the word in it.')
    // Suggestion should be removed
    expect(useDraftStore.getState().suggestions).toHaveLength(0)
  })
})
