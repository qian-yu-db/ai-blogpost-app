import { describe, it, expect, beforeEach } from 'vitest'
import { useDraftStore } from '../draftStore'

describe('draftStore', () => {
  beforeEach(() => {
    useDraftStore.setState({
      outline: '',
      draft: '',
      suggestions: [],
      stats: null,
      isGenerating: false,
    })
  })

  it('sets outline', () => {
    useDraftStore.getState().setOutline('# Outline')
    expect(useDraftStore.getState().outline).toBe('# Outline')
  })

  it('appends to outline', () => {
    useDraftStore.getState().setOutline('# Title')
    useDraftStore.getState().appendOutline('\n## Section 1')
    expect(useDraftStore.getState().outline).toBe('# Title\n## Section 1')
  })

  it('sets draft', () => {
    useDraftStore.getState().setDraft('# Blog Post')
    expect(useDraftStore.getState().draft).toBe('# Blog Post')
  })

  it('appends to draft', () => {
    useDraftStore.getState().setDraft('Hello')
    useDraftStore.getState().appendDraft(' World')
    expect(useDraftStore.getState().draft).toBe('Hello World')
  })

  it('sets suggestions', () => {
    const suggestions = [
      {
        type: 'grammar' as const,
        severity: 'warning' as const,
        message: 'Fix typo',
        line_start: 5,
        line_end: 5,
        original: 'teh',
        replacement: 'the',
      },
    ]
    useDraftStore.getState().setSuggestions(suggestions)
    expect(useDraftStore.getState().suggestions).toHaveLength(1)
    expect(useDraftStore.getState().suggestions[0].message).toBe('Fix typo')
  })

  it('removes suggestion by index', () => {
    useDraftStore.getState().setSuggestions([
      { type: 'grammar', severity: 'info', message: 'A', line_start: null, line_end: null, original: null, replacement: null },
      { type: 'style', severity: 'warning', message: 'B', line_start: null, line_end: null, original: null, replacement: null },
      { type: 'technical', severity: 'error', message: 'C', line_start: null, line_end: null, original: null, replacement: null },
    ])
    useDraftStore.getState().removeSuggestion(1) // remove 'B'
    const remaining = useDraftStore.getState().suggestions
    expect(remaining).toHaveLength(2)
    expect(remaining[0].message).toBe('A')
    expect(remaining[1].message).toBe('C')
  })

  it('sets stats', () => {
    useDraftStore.getState().setStats({ word_count: 100, character_count: 500, read_time_minutes: 0.5 })
    expect(useDraftStore.getState().stats?.word_count).toBe(100)
  })

  it('clears stats', () => {
    useDraftStore.getState().setStats({ word_count: 100, character_count: 500, read_time_minutes: 0.5 })
    useDraftStore.getState().setStats(null)
    expect(useDraftStore.getState().stats).toBeNull()
  })

  it('sets generating state', () => {
    useDraftStore.getState().setIsGenerating(true)
    expect(useDraftStore.getState().isGenerating).toBe(true)
  })

  it('resets all state', () => {
    useDraftStore.getState().setDraft('content')
    useDraftStore.getState().setOutline('outline')
    useDraftStore.getState().setIsGenerating(true)

    useDraftStore.getState().reset()

    const state = useDraftStore.getState()
    expect(state.draft).toBe('')
    expect(state.outline).toBe('')
    expect(state.suggestions).toHaveLength(0)
    expect(state.stats).toBeNull()
    expect(state.isGenerating).toBe(false)
  })
})
