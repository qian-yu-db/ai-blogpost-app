import { create } from 'zustand'
import type { Suggestion, StatsResponse } from '@/types'

interface DraftStore {
  outline: string
  draft: string
  suggestions: Suggestion[]
  stats: StatsResponse | null
  isGenerating: boolean

  setOutline: (outline: string) => void
  appendOutline: (chunk: string) => void
  setDraft: (draft: string) => void
  appendDraft: (chunk: string) => void
  setSuggestions: (suggestions: Suggestion[]) => void
  removeSuggestion: (index: number) => void
  setStats: (stats: StatsResponse | null) => void
  setIsGenerating: (generating: boolean) => void
  reset: () => void
}

export const useDraftStore = create<DraftStore>((set) => ({
  outline: '',
  draft: '',
  suggestions: [],
  stats: null,
  isGenerating: false,

  setOutline: (outline) => set({ outline }),
  appendOutline: (chunk) => set((state) => ({ outline: state.outline + chunk })),
  setDraft: (draft) => set({ draft }),
  appendDraft: (chunk) => set((state) => ({ draft: state.draft + chunk })),
  setSuggestions: (suggestions) => set({ suggestions }),
  removeSuggestion: (index) =>
    set((state) => ({
      suggestions: state.suggestions.filter((_, i) => i !== index),
    })),
  setStats: (stats) => set({ stats }),
  setIsGenerating: (generating) => set({ isGenerating: generating }),
  reset: () =>
    set({
      outline: '',
      draft: '',
      suggestions: [],
      stats: null,
      isGenerating: false,
    }),
}))
