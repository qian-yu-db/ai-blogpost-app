import CodeMirror from '@uiw/react-codemirror'
import { markdown } from '@codemirror/lang-markdown'
import { EditorView } from '@codemirror/view'
import { useTheme } from '@/contexts/ThemeContext'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MarkdownRenderer } from '@/components/shared/MarkdownRenderer'
import { useDraftStore } from '@/stores/draftStore'
import { useSessionStore } from '@/stores/sessionStore'
import { updateDraft } from '@/api/client'
import { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { Code, Eye, FileText, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { downloadBlob, extractTitle } from '@/lib/export'
import { exportMarkdown, exportPdf } from '@/api/client'

const darkTheme = EditorView.theme(
  {
    '&': {
      backgroundColor: 'oklch(0.22 0.03 265)',
      color: 'oklch(0.92 0.01 265)',
    },
    '.cm-content': {
      caretColor: 'oklch(0.7 0.15 265)',
    },
    '.cm-cursor, .cm-dropCursor': {
      borderLeftColor: 'oklch(0.7 0.15 265)',
    },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
      backgroundColor: 'oklch(0.35 0.05 265)',
    },
    '.cm-gutters': {
      backgroundColor: 'oklch(0.2 0.028 265)',
      color: 'oklch(0.5 0.02 265)',
      borderRight: '1px solid oklch(0.35 0.04 265)',
    },
    '.cm-activeLineGutter': {
      backgroundColor: 'oklch(0.28 0.035 265)',
    },
    '.cm-activeLine': {
      backgroundColor: 'oklch(0.25 0.03 265)',
    },
  },
  { dark: true }
)

const lightTheme = EditorView.theme({
  '&': {
    backgroundColor: 'oklch(0.995 0.002 270)',
    color: 'oklch(0.25 0.02 265)',
  },
  '.cm-content': {
    caretColor: 'oklch(0.55 0.18 265)',
  },
  '.cm-cursor, .cm-dropCursor': {
    borderLeftColor: 'oklch(0.55 0.18 265)',
  },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
    backgroundColor: 'oklch(0.9 0.03 265)',
  },
  '.cm-gutters': {
    backgroundColor: 'oklch(0.97 0.008 265)',
    color: 'oklch(0.5 0.02 265)',
    borderRight: '1px solid oklch(0.9 0.02 265)',
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'oklch(0.94 0.015 265)',
  },
  '.cm-activeLine': {
    backgroundColor: 'oklch(0.96 0.01 265)',
  },
})

export function DraftViewer() {
  const draft = useDraftStore((s) => s.draft)
  const setDraft = useDraftStore((s) => s.setDraft)
  const isGenerating = useDraftStore((s) => s.isGenerating)
  const { theme } = useTheme()
  const [view, setView] = useState<'editor' | 'preview'>('preview')
  const sessionId = useSessionStore((s) => s.sessionId)
  const syncTimer = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    if (!draft || !sessionId || isGenerating) return
    clearTimeout(syncTimer.current)
    syncTimer.current = setTimeout(() => {
      updateDraft(sessionId, draft).catch(() => {})
    }, 2000)
    return () => clearTimeout(syncTimer.current)
  }, [draft, sessionId, isGenerating])

  if (!draft) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <p className="text-sm">No draft generated yet</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h3 className="font-semibold text-sm">Draft</h3>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 rounded-md border p-0.5">
            <Button
              size="icon-xs"
              variant={view === 'editor' ? 'default' : 'ghost'}
              onClick={() => setView('editor')}
            >
              <Code className="h-3 w-3" />
            </Button>
            <Button
              size="icon-xs"
              variant={view === 'preview' ? 'default' : 'ghost'}
              onClick={() => setView('preview')}
            >
              <Eye className="h-3 w-3" />
            </Button>
          </div>
          <div className="flex gap-1">
            <Button size="icon-xs" variant="ghost" title="Download Markdown"
              onClick={async () => {
                const title = extractTitle(draft)
                const blob = await exportMarkdown(draft, title)
                downloadBlob(blob, `${title}.md`)
              }}>
              <FileText className="h-3 w-3" />
            </Button>
            <Button size="icon-xs" variant="ghost" title="Download PDF"
              onClick={async () => {
                const title = extractTitle(draft)
                const blob = await exportPdf(draft, title)
                downloadBlob(blob, `${title}.pdf`)
              }}>
              <Download className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        {view === 'editor' ? (
          <CodeMirror
            value={draft}
            height="100%"
            extensions={[markdown()]}
            theme={theme === 'dark' ? darkTheme : lightTheme}
            onChange={(value) => setDraft(value)}
            readOnly={isGenerating}
            className="h-full"
          />
        ) : (
          <ScrollArea className="h-full p-4">
            <MarkdownRenderer content={draft} />
          </ScrollArea>
        )}
      </div>
    </div>
  )
}
