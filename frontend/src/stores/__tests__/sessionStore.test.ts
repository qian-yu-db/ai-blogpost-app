import { describe, it, expect, beforeEach } from 'vitest'
import { useSessionStore } from '../sessionStore'

describe('sessionStore', () => {
  beforeEach(() => {
    useSessionStore.setState({
      sessionId: null,
      phase: 'planning',
      planningContext: {
        topic: '',
        abstract: '',
        personas: [],
        technical_level: 'intermediate',
        target_length: '5',
        style: 'tutorial',
        key_points: [],
        reference_urls: [],
        code_content: '',
      },
      isConnected: false,
    })
  })

  it('sets session id', () => {
    useSessionStore.getState().setSessionId('abc-123')
    expect(useSessionStore.getState().sessionId).toBe('abc-123')
  })

  it('sets phase', () => {
    useSessionStore.getState().setPhase('drafting')
    expect(useSessionStore.getState().phase).toBe('drafting')
  })

  it('updates planning context partially', () => {
    useSessionStore.getState().updatePlanningContext({ topic: 'Delta Lake' })
    const ctx = useSessionStore.getState().planningContext
    expect(ctx.topic).toBe('Delta Lake')
    expect(ctx.technical_level).toBe('intermediate') // other fields unchanged
  })

  it('replaces planning context fully', () => {
    const newCtx = {
      topic: 'MLflow',
      abstract: 'Tracking models',
      personas: ['ML Engineer'],
      technical_level: 'advanced',
      target_length: '10',
      style: 'deep-dive',
      key_points: ['Tracking', 'Registry'],
      reference_urls: ['https://mlflow.org'],
      code_content: 'import mlflow',
    }
    useSessionStore.getState().setPlanningContext(newCtx)
    expect(useSessionStore.getState().planningContext).toEqual(newCtx)
  })

  it('sets connection status', () => {
    useSessionStore.getState().setIsConnected(true)
    expect(useSessionStore.getState().isConnected).toBe(true)
  })

  it('resets all state', () => {
    useSessionStore.getState().setSessionId('abc')
    useSessionStore.getState().setPhase('drafting')
    useSessionStore.getState().setIsConnected(true)

    useSessionStore.getState().reset()

    const state = useSessionStore.getState()
    expect(state.sessionId).toBeNull()
    expect(state.phase).toBe('planning')
    expect(state.isConnected).toBe(false)
    expect(state.planningContext.topic).toBe('')
  })
})
