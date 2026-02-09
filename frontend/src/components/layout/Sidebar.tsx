import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { useSessionStore } from '@/stores/sessionStore'
import { useDraftStore } from '@/stores/draftStore'
import { useNavigationStore, type ArtifactView } from '@/stores/navigationStore'
import { useChatStore } from '@/stores/chatStore'
import {
  useSessionListStore,
  saveCurrentSession,
  loadSession,
  WELCOME_MESSAGE,
  validateBackendSession,
} from '@/stores/sessionListStore'
import { useTheme } from '@/contexts/ThemeContext'
import { startSession, deleteSession } from '@/api/client'
import {
  CheckCircle2,
  Circle,
  FileText,
  PenTool,
  Search,
  Download,
  Moon,
  Sun,
  Plus,
  PanelLeftClose,
  PanelLeftOpen,
  FileText as OutlineIcon,
  BookOpen,
  ClipboardCheck,
  X,
} from 'lucide-react'
import type { WorkflowPhase } from '@/types'

const WORKFLOW_STEPS: { phase: WorkflowPhase; label: string; icon: typeof FileText }[] = [
  { phase: 'planning', label: 'Planning', icon: FileText },
  { phase: 'drafting', label: 'Drafting', icon: PenTool },
  { phase: 'reviewing', label: 'Review', icon: Search },
  { phase: 'exporting', label: 'Export', icon: Download },
]

const PHASE_ORDER: WorkflowPhase[] = ['planning', 'drafting', 'reviewing', 'exporting']

const ARTIFACT_ITEMS: { key: Exclude<ArtifactView, null>; label: string; icon: typeof FileText }[] = [
  { key: 'outline', label: 'Outline', icon: OutlineIcon },
  { key: 'draft', label: 'Draft', icon: BookOpen },
  { key: 'review', label: 'Review', icon: ClipboardCheck },
  { key: 'export', label: 'Export', icon: Download },
]

export function Sidebar() {
  const phase = useSessionStore((s) => s.phase)
  const planningContext = useSessionStore((s) => s.planningContext)
  const sessionId = useSessionStore((s) => s.sessionId)
  const reset = useSessionStore((s) => s.reset)

  const outline = useDraftStore((s) => s.outline)
  const draft = useDraftStore((s) => s.draft)
  const suggestions = useDraftStore((s) => s.suggestions)
  const stats = useDraftStore((s) => s.stats)
  const resetDraft = useDraftStore((s) => s.reset)

  const sidebarCollapsed = useNavigationStore((s) => s.sidebarCollapsed)
  const toggleSidebar = useNavigationStore((s) => s.toggleSidebar)
  const activeArtifact = useNavigationStore((s) => s.activeArtifact)
  const setActiveArtifact = useNavigationStore((s) => s.setActiveArtifact)

  const clearMessages = useChatStore((s) => s.clearMessages)

  const slots = useSessionListStore((s) => s.slots)
  const activeIndex = useSessionListStore((s) => s.activeIndex)
  const addSlot = useSessionListStore((s) => s.addSlot)
  const removeSlot = useSessionListStore((s) => s.removeSlot)
  const setActiveIndex = useSessionListStore((s) => s.setActiveIndex)

  const updateSlot = useSessionListStore((s) => s.updateSlot)

  const { theme, toggleTheme } = useTheme()

  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editLabel, setEditLabel] = useState('')

  const handleRename = (index: number) => {
    const trimmed = editLabel.trim()
    if (trimmed) {
      updateSlot(index, { label: trimmed })
    }
    setEditingIndex(null)
  }

  const currentPhaseIndex = PHASE_ORDER.indexOf(phase)

  const artifactAvailable = (key: Exclude<ArtifactView, null>): boolean => {
    switch (key) {
      case 'outline': return !!outline
      case 'draft': return !!draft
      case 'review': return suggestions.length > 0
      case 'export': return !!draft
    }
  }

  const handleNewSession = async () => {
    // Save current session if it exists
    if (sessionId) {
      saveCurrentSession(sessionId)
    }

    // If we're at max slots, replace the oldest inactive one
    if (slots.length >= 3) {
      const oldestInactive = slots.findIndex((_, i) => i !== activeIndex)
      if (oldestInactive !== -1) {
        const old = slots[oldestInactive]
        await deleteSession(old.sessionId).catch(() => {})
        removeSlot(oldestInactive)
      }
    }

    // Create a new backend session
    const newSession = await startSession()

    // Reset all stores
    reset()
    resetDraft()
    clearMessages()
    setActiveArtifact(null)

    // Set up the new session in the session store
    useSessionStore.getState().setSessionId(newSession.id)
    if (newSession.planningContext) {
      useSessionStore.getState().updatePlanningContext(newSession.planningContext)
    }

    // Add welcome message
    useChatStore.getState().addMessage(WELCOME_MESSAGE())

    // Add the new slot
    addSlot({
      sessionId: newSession.id,
      label: 'Untitled Post',
      phase: 'planning',
      updatedAt: new Date().toISOString(),
    })
  }

  const handleSwitchSession = async (index: number) => {
    if (index === activeIndex) return
    const target = slots[index]
    if (!target) return

    // Save current session
    if (sessionId) {
      saveCurrentSession(sessionId)
    }

    // Load target session
    loadSession(target.sessionId)
    setActiveIndex(index)

    // Validate backend session
    const result = await validateBackendSession(target.sessionId)
    if (!result.valid && result.newSessionId) {
      // Backend session was lost — update sessionId, keep frontend state
      useSessionStore.getState().setSessionId(result.newSessionId)
      updateSlot(index, { sessionId: result.newSessionId })
      // Re-save with new ID
      localStorage.removeItem(`blog-session-${target.sessionId}`)
      saveCurrentSession(result.newSessionId)
    }
  }

  const handleRemoveSession = async (index: number, e: React.MouseEvent) => {
    e.stopPropagation()
    const slot = slots[index]
    if (!slot) return

    await deleteSession(slot.sessionId).catch(() => {})
    removeSlot(index)

    // If we removed the active session, reset stores
    if (index === activeIndex) {
      reset()
      resetDraft()
      clearMessages()
      setActiveArtifact(null)
    }
  }

  if (sidebarCollapsed) {
    return (
      <div className="flex h-full w-12 flex-col items-center border-r bg-sidebar py-3">
        <Button size="icon-xs" variant="ghost" onClick={toggleSidebar}>
          <PanelLeftOpen className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className="flex h-full w-[260px] flex-col border-r bg-sidebar">
      <div className="flex items-center justify-between px-4 py-3">
        <h2 className="text-sm font-bold text-sidebar-foreground">Blog Writer</h2>
        <Button size="icon-xs" variant="ghost" onClick={toggleSidebar}>
          <PanelLeftClose className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="px-4 py-2">
          {/* Workflow Steps */}
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Workflow
          </p>
          <div className="space-y-1">
            {WORKFLOW_STEPS.map((step, index) => {
              const isComplete = index < currentPhaseIndex
              const isCurrent = index === currentPhaseIndex
              const Icon = step.icon

              return (
                <div
                  key={step.phase}
                  className={cn(
                    'flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm',
                    isCurrent && 'bg-sidebar-accent text-sidebar-accent-foreground font-medium',
                    isComplete && 'text-sidebar-foreground',
                    !isComplete && !isCurrent && 'text-muted-foreground'
                  )}
                >
                  {isComplete ? (
                    <CheckCircle2 className="h-4 w-4 text-sidebar-primary" />
                  ) : (
                    <Circle
                      className={cn(
                        'h-4 w-4',
                        isCurrent ? 'text-sidebar-primary' : 'text-muted-foreground/40'
                      )}
                    />
                  )}
                  <span>{step.label}</span>
                </div>
              )
            })}
          </div>

          <Separator className="my-4" />

          {/* Collected Context */}
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Collected
          </p>
          <div className="space-y-2.5 text-sm">
            {planningContext.topic ? (
              <ContextItem label="Topic" value={planningContext.topic} />
            ) : (
              <p className="text-xs text-muted-foreground italic">Chat to start planning...</p>
            )}
            {planningContext.personas.length > 0 && (
              <ContextItem label="Audience" value={planningContext.personas.join(', ')} />
            )}
            {planningContext.technical_level && planningContext.technical_level !== 'intermediate' && (
              <ContextItem label="Level" value={planningContext.technical_level} />
            )}
            {planningContext.style && planningContext.style !== 'tutorial' && (
              <ContextItem label="Style" value={planningContext.style} />
            )}
            {planningContext.reference_urls.length > 0 && (
              <ContextItem
                label="Refs"
                value={`${planningContext.reference_urls.length} URL${planningContext.reference_urls.length > 1 ? 's' : ''}`}
              />
            )}
          </div>

          <Separator className="my-4" />

          {/* Artifacts */}
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Artifacts
          </p>
          <div className="space-y-1">
            {ARTIFACT_ITEMS.map((item) => {
              const available = artifactAvailable(item.key)
              const Icon = item.icon

              return (
                <button
                  key={item.key}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors',
                    available
                      ? 'text-sidebar-foreground hover:bg-sidebar-accent cursor-pointer'
                      : 'text-muted-foreground/40 cursor-default',
                    activeArtifact === item.key && 'bg-sidebar-accent font-medium'
                  )}
                  onClick={() => {
                    if (!available) return
                    setActiveArtifact(activeArtifact === item.key ? null : item.key)
                  }}
                  disabled={!available}
                >
                  {available ? (
                    <CheckCircle2 className="h-4 w-4 text-sidebar-primary" />
                  ) : (
                    <Circle className="h-4 w-4" />
                  )}
                  <span>{item.label}</span>
                </button>
              )
            })}
          </div>

          {/* Stats */}
          {stats && (
            <>
              <Separator className="my-4" />
              <div className="text-xs text-muted-foreground space-y-1">
                <p>{stats.word_count} words</p>
                <p>{stats.read_time_minutes} min read</p>
              </div>
            </>
          )}
        </div>
      </ScrollArea>

      {/* Sessions */}
      <div className="border-t px-4 py-3 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Sessions
        </p>
        <div className="space-y-1">
          {slots.map((slot, index) => (
            <div
              key={slot.sessionId}
              className={cn(
                'group flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors',
                index === activeIndex
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
              )}
              onClick={() => handleSwitchSession(index)}
            >
              {editingIndex === index ? (
                <input
                  className="flex-1 bg-transparent border-b border-sidebar-primary text-sm outline-none"
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  onBlur={() => handleRename(index)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRename(index)
                    if (e.key === 'Escape') setEditingIndex(null)
                  }}
                  autoFocus
                />
              ) : (
                <span
                  className="truncate flex-1"
                  onDoubleClick={() => { setEditingIndex(index); setEditLabel(slot.label) }}
                >
                  {slot.label}
                </span>
              )}
              {slots.length > 1 && (
                <button
                  className="opacity-0 group-hover:opacity-100 shrink-0 rounded p-0.5 hover:bg-destructive/20 transition-opacity"
                  onClick={(e) => handleRemoveSession(index, e)}
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
          {slots.length < 3 && (
            <Button
              size="sm"
              variant="ghost"
              className="w-full justify-start text-muted-foreground"
              onClick={handleNewSession}
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              New Post
            </Button>
          )}
        </div>
        <div className="flex items-center pt-1">
          <Button size="icon-sm" variant="ghost" onClick={toggleTheme}>
            {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  )
}

function ContextItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="truncate text-sidebar-foreground">{value}</p>
    </div>
  )
}
