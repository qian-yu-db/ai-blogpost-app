// Workflow
export type WorkflowPhase = 'planning' | 'drafting' | 'reviewing' | 'exporting'

// SSE Events from agent
export type AgentSSEEvent =
  | { type: 'text'; content: string }
  | { type: 'tool_use'; tool: string; input: Record<string, unknown> }
  | { type: 'tool_result'; tool: string; result: string }
  | { type: 'phase_change'; phase: WorkflowPhase; topic?: string }
  | { type: 'outline'; content: string }
  | { type: 'draft_chunk'; content: string }
  | { type: 'review'; suggestions: Suggestion[] }
  | { type: 'draft_updated'; content: string }
  | { type: 'done' }

// Chat
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  toolActivity?: ToolActivity[]
}

export interface ToolActivity {
  tool: string
  input: Record<string, unknown>
  result?: string
  status: 'running' | 'complete' | 'error'
}

// Suggestion (with severity)
export interface Suggestion {
  type: 'grammar' | 'style' | 'technical'
  severity: 'info' | 'warning' | 'error'
  message: string
  line_start: number | null
  line_end: number | null
  original: string | null
  replacement: string | null
}

// Session state
export interface SessionState {
  id: string
  phase: WorkflowPhase
  planningContext: PlanningContext
  hasOutline: boolean
  hasDraft: boolean
  hasReview: boolean
}

// Keep existing types that are still needed
export interface PlanningContext {
  topic: string
  abstract: string
  personas: string[]
  technical_level: string
  target_length: string
  style: string
  key_points: string[]
  reference_urls: string[]
  code_content: string
}

export interface StatsResponse {
  word_count: number
  character_count: number
  read_time_minutes: number
}

export interface UploadedFile {
  id: string
  filename: string
  content: string
}
