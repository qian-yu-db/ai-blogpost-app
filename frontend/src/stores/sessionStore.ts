import { create } from 'zustand'
import type { PlanningContext, WorkflowPhase } from '@/types'

const DEFAULT_PLANNING_CONTEXT: PlanningContext = {
  topic: '',
  abstract: '',
  personas: [],
  technical_level: 'intermediate',
  target_length: '5',
  style: 'tutorial',
  key_points: [],
  reference_urls: [],
  code_content: '',
}

interface SessionStore {
  sessionId: string | null
  phase: WorkflowPhase
  planningContext: PlanningContext
  isConnected: boolean

  setSessionId: (id: string | null) => void
  setPhase: (phase: WorkflowPhase) => void
  updatePlanningContext: (update: Partial<PlanningContext>) => void
  setPlanningContext: (ctx: PlanningContext) => void
  setIsConnected: (connected: boolean) => void
  reset: () => void
}

export const useSessionStore = create<SessionStore>((set) => ({
  sessionId: null,
  phase: 'planning',
  planningContext: DEFAULT_PLANNING_CONTEXT,
  isConnected: false,

  setSessionId: (id) => set({ sessionId: id }),
  setPhase: (phase) => set({ phase }),
  updatePlanningContext: (update) =>
    set((state) => ({
      planningContext: { ...state.planningContext, ...update },
    })),
  setPlanningContext: (ctx) => set({ planningContext: ctx }),
  setIsConnected: (connected) => set({ isConnected: connected }),
  reset: () =>
    set({
      sessionId: null,
      phase: 'planning',
      planningContext: DEFAULT_PLANNING_CONTEXT,
      isConnected: false,
    }),
}))
