import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
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
  formatRelativeTime,
  MAX_SLOTS,
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
  Trash2,
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
  const reviewSummary = useDraftStore((s) => s.reviewSummary)
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

  const clearOtherSlots = useSessionListStore((s) => s.clearOtherSlots)
  const clearOlderThan = useSessionListStore((s) => s.clearOlderThan)

  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editLabel, setEditLabel] = useState('')
  const [showCleanupMenu, setShowCleanupMenu] = useState(false)

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
      case 'review': return suggestions.length > 0 || !!reviewSummary
      case 'export': return !!draft
    }
  }

  const handleNewSession = async () => {
    // Save current session if it exists
    if (sessionId) {
      saveCurrentSession(sessionId)
    }

    // If we're at max slots, replace the oldest inactive one
    if (slots.length >= MAX_SLOTS) {
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

    // If we removed the active session (or the last session), create a fresh one
    if (index === activeIndex || slots.length <= 1) {
      reset()
      resetDraft()
      clearMessages()
      setActiveArtifact(null)

      // If that was the last slot, auto-create a new session
      if (slots.length <= 1) {
        const newSession = await startSession()
        useSessionStore.getState().setSessionId(newSession.id)
        if (newSession.planningContext) {
          useSessionStore.getState().updatePlanningContext(newSession.planningContext)
        }
        useChatStore.getState().addMessage(WELCOME_MESSAGE())
        addSlot({
          sessionId: newSession.id,
          label: 'Untitled Post',
          phase: 'planning',
          updatedAt: new Date().toISOString(),
        })
      }
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
        <h2 className="text-sm font-bold gradient-text">Blog Writer</h2>
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
          <div className="relative ml-3">
            {/* Progress line */}
            <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-border" />
            <div
              className="absolute left-[7px] top-2 w-0.5 bg-primary transition-all duration-500"
              style={{ height: `${Math.max(0, currentPhaseIndex) * 36}px` }}
            />

            <div className="relative space-y-1">
              {WORKFLOW_STEPS.map((step, index) => {
                const isComplete = index < currentPhaseIndex
                const isCurrent = index === currentPhaseIndex
                const Icon = step.icon

                return (
                  <div
                    key={step.phase}
                    className={cn(
                      'flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-all duration-300',
                      isCurrent && 'bg-sidebar-accent text-sidebar-accent-foreground font-medium',
                      isComplete && 'text-sidebar-foreground',
                      !isComplete && !isCurrent && 'text-muted-foreground'
                    )}
                  >
                    <div className="relative">
                      {isComplete ? (
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                      ) : isCurrent ? (
                        <>
                          <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" style={{ animationDuration: '2s' }} />
                          <Circle className="h-4 w-4 text-primary fill-primary" />
                        </>
                      ) : (
                        <Circle className="h-4 w-4 text-muted-foreground/40" />
                      )}
                    </div>
                    <span>{step.label}</span>
                  </div>
                )
              })}
            </div>
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
      <div className="border-t flex flex-col min-h-0" style={{ maxHeight: '45%' }}>
        <div className="flex items-center justify-between px-4 pt-3 pb-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Sessions ({slots.length})
          </p>
          <div className="flex items-center gap-1">
            {slots.length > 1 && (
              <div className="relative">
                <Button
                  size="icon-xs"
                  variant="ghost"
                  onClick={() => setShowCleanupMenu(!showCleanupMenu)}
                  title="Clean up sessions"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
                {showCleanupMenu && (
                  <div className="absolute right-0 top-full mt-1 z-50 w-48 rounded-md border bg-popover p-1 shadow-md">
                    <button
                      className="w-full rounded-sm px-2 py-1.5 text-left text-xs hover:bg-accent transition-colors"
                      onClick={() => {
                        clearOtherSlots()
                        setShowCleanupMenu(false)
                      }}
                    >
                      Clear all except current
                    </button>
                    <button
                      className="w-full rounded-sm px-2 py-1.5 text-left text-xs hover:bg-accent transition-colors"
                      onClick={() => {
                        const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
                        clearOlderThan(cutoff)
                        setShowCleanupMenu(false)
                      }}
                    >
                      Clear older than 1 day
                    </button>
                    <button
                      className="w-full rounded-sm px-2 py-1.5 text-left text-xs hover:bg-accent transition-colors"
                      onClick={() => {
                        const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
                        clearOlderThan(cutoff)
                        setShowCleanupMenu(false)
                      }}
                    >
                      Clear older than 1 week
                    </button>
                  </div>
                )}
              </div>
            )}
            <Button
              size="icon-xs"
              variant="ghost"
              onClick={handleNewSession}
              title="New post"
              disabled={slots.length >= MAX_SLOTS}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>
        <ScrollArea className="flex-1 px-4 pb-2">
          <div className="space-y-1">
            {slots.map((slot, index) => (
              <div
                key={slot.sessionId}
                className={cn(
                  'group rounded-md px-2 py-1.5 cursor-pointer transition-colors',
                  index === activeIndex
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                )}
                onClick={() => handleSwitchSession(index)}
              >
                <div className="flex items-center justify-between">
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
                      className={cn('truncate flex-1 text-sm', index === activeIndex && 'font-medium')}
                      onDoubleClick={() => { setEditingIndex(index); setEditLabel(slot.label) }}
                    >
                      {slot.label}
                    </span>
                  )}
                  <button
                    className="opacity-0 group-hover:opacity-100 shrink-0 rounded p-0.5 hover:bg-destructive/20 transition-opacity"
                    onClick={(e) => handleRemoveSession(index, e)}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="outline" className="text-[10px] px-1 py-0">{slot.phase}</Badge>
                  <span className="text-[10px] text-muted-foreground">{formatRelativeTime(slot.updatedAt)}</span>
                  {slot.wordCount && <span className="text-[10px] text-muted-foreground">{slot.wordCount}w</span>}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        <div className="flex items-center px-4 py-2 border-t">
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
