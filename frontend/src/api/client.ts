import type { SessionState, StatsResponse, UploadedFile } from '@/types'
import { streamSSE } from './stream'

const API_BASE = '/api'

// Session API

export async function startSession(topicHint?: string): Promise<SessionState> {
  const response = await fetch(`${API_BASE}/session/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic_hint: topicHint || '' }),
  })

  if (!response.ok) {
    throw new Error('Failed to start session')
  }

  const data = await response.json()
  // Map backend SessionResponse to frontend SessionState
  return {
    id: data.session_id,
    phase: data.workflow_phase,
    planningContext: data.planning_context,
    hasOutline: false,
    hasDraft: !!data.draft_content,
    hasReview: !!data.review_feedback,
  }
}

export function sendMessage(sessionId: string, message: string) {
  return streamSSE(`${API_BASE}/session/${sessionId}/message`, { message })
}

export async function getSession(sessionId: string): Promise<SessionState> {
  const response = await fetch(`${API_BASE}/session/${sessionId}`)

  if (!response.ok) {
    throw new Error('Failed to get session')
  }

  const data = await response.json()
  return {
    id: data.session_id,
    phase: data.workflow_phase,
    planningContext: data.planning_context,
    hasOutline: false,
    hasDraft: !!data.draft_content,
    hasReview: !!data.review_feedback,
  }
}

export async function transitionPhase(
  sessionId: string,
  phase: string
): Promise<SessionState> {
  const response = await fetch(`${API_BASE}/session/${sessionId}/transition`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ target_phase: phase }),
  })

  if (!response.ok) {
    throw new Error('Failed to transition phase')
  }

  const data = await response.json()
  return {
    id: data.session_id,
    phase: data.workflow_phase,
    planningContext: data.planning_context,
    hasOutline: false,
    hasDraft: !!data.draft_content,
    hasReview: !!data.review_feedback,
  }
}

export async function deleteSession(sessionId: string): Promise<void> {
  const response = await fetch(`${API_BASE}/session/${sessionId}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    throw new Error('Failed to delete session')
  }
}

// File Upload API

export async function uploadFile(file: File): Promise<UploadedFile> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(`${API_BASE}/files/upload`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    throw new Error('Failed to upload file')
  }

  return response.json()
}

// Stats API

export async function getStats(content: string): Promise<StatsResponse> {
  const response = await fetch(`${API_BASE}/draft/stats`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  })

  if (!response.ok) {
    throw new Error('Failed to get stats')
  }

  return response.json()
}

// Draft Update API

export async function updateDraft(sessionId: string, content: string): Promise<void> {
  const response = await fetch(`${API_BASE}/session/${sessionId}/update-draft`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  })
  if (!response.ok) {
    throw new Error('Failed to update draft')
  }
}

// Export API

export async function exportMarkdown(content: string, title: string): Promise<Blob> {
  const response = await fetch(`${API_BASE}/export/markdown`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, title }),
  })

  if (!response.ok) {
    throw new Error('Failed to export markdown')
  }

  return response.blob()
}

export async function exportPdf(content: string, title: string): Promise<Blob> {
  const response = await fetch(`${API_BASE}/export/pdf`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, title }),
  })

  if (!response.ok) {
    throw new Error('Failed to export PDF')
  }

  return response.blob()
}
