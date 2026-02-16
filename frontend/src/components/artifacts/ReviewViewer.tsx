import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MarkdownRenderer } from '@/components/shared/MarkdownRenderer'
import { useDraftStore } from '@/stores/draftStore'
import { useChatStore } from '@/stores/chatStore'
import { useSessionStore } from '@/stores/sessionStore'
import { downloadBlob, extractTitle } from '@/lib/export'
import { updateDraft } from '@/api/client'
import { Check, X, Download, Upload, RefreshCw, Wrench, FileText } from 'lucide-react'

const SEVERITY_VARIANTS = {
  info: 'secondary' as const,
  warning: 'outline' as const,
  error: 'destructive' as const,
}

const TYPE_LABELS = {
  grammar: 'Grammar',
  style: 'Style',
  technical: 'Technical',
}

export function ReviewViewer() {
  const suggestions = useDraftStore((s) => s.suggestions)
  const reviewSummary = useDraftStore((s) => s.reviewSummary)
  const draft = useDraftStore((s) => s.draft)
  const setDraft = useDraftStore((s) => s.setDraft)
  const removeSuggestion = useDraftStore((s) => s.removeSuggestion)
  const setQueuedMessage = useChatStore((s) => s.setQueuedMessage)
  const sessionId = useSessionStore((s) => s.sessionId)

  const applySuggestion = (index: number) => {
    const suggestion = suggestions[index]
    if (suggestion.original && suggestion.replacement) {
      setDraft(draft.replace(suggestion.original, suggestion.replacement))
    }
    removeSuggestion(index)
  }

  const handleReviseAll = () => {
    const issues = suggestions.map((s) => `- [${s.severity}] ${s.message}`).join('\n')
    setQueuedMessage(
      `Please fix ALL of the following issues in the draft using the revise_draft tool:\n${issues}`
    )
  }

  const handleUploadDraft = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.md,.markdown,.txt'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const text = await file.text()
      setDraft(text)
      if (sessionId) {
        await updateDraft(sessionId, text)
      }
    }
    input.click()
  }

  const handleRequestNewReview = () => {
    setQueuedMessage('Please re-review the current draft using the review_draft tool.')
  }

  const handleDownloadDraft = () => {
    const title = extractTitle(draft)
    const blob = new Blob([draft], { type: 'text/markdown' })
    downloadBlob(blob, `${title}.md`)
  }

  const handleDownloadReview = () => {
    const title = extractTitle(draft)
    const blob = new Blob([reviewSummary], { type: 'text/markdown' })
    downloadBlob(blob, `${title}-review.md`)
  }

  if (suggestions.length === 0 && reviewSummary) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b bg-accent/50 px-4 py-3">
          <h3 className="font-semibold text-sm">Review Summary</h3>
          <Button size="sm" variant="outline" onClick={handleDownloadReview}>
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Download
          </Button>
        </div>
        <ScrollArea className="flex-1 p-4">
          <MarkdownRenderer content={reviewSummary} />
        </ScrollArea>
        <div className="flex gap-2 border-t px-4 py-3">
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={handleUploadDraft}
          >
            <Upload className="mr-1.5 h-3.5 w-3.5" />
            Upload Revised Draft
          </Button>
          <Button
            size="sm"
            variant="default"
            className="flex-1"
            onClick={handleRequestNewReview}
          >
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            Request New Review
          </Button>
        </div>
      </div>
    )
  }

  if (suggestions.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-muted-foreground gap-3">
        <FileText className="h-10 w-10 text-muted-foreground/30" />
        <p className="text-sm">No review suggestions yet</p>
        <p className="text-xs">Complete the drafting phase to get a review</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h3 className="font-semibold text-sm">Review</h3>
        <span className="text-xs text-muted-foreground">{suggestions.length} suggestions</span>
      </div>
      <ScrollArea className="flex-1">
        <div className="space-y-2 p-4">
          {suggestions.map((suggestion, i) => (
            <div key={i} className="rounded-lg border p-3 text-sm">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant={SEVERITY_VARIANTS[suggestion.severity]}>
                    {suggestion.severity}
                  </Badge>
                  <Badge variant="outline">
                    {TYPE_LABELS[suggestion.type]}
                  </Badge>
                  {suggestion.line_start !== null && (
                    <span className="text-xs text-muted-foreground">
                      Line {suggestion.line_start}
                      {suggestion.line_end && suggestion.line_end !== suggestion.line_start
                        ? `–${suggestion.line_end}`
                        : ''}
                    </span>
                  )}
                </div>
                <div className="flex gap-1">
                  {suggestion.replacement && (
                    <Button
                      size="icon-xs"
                      variant="ghost"
                      onClick={() => applySuggestion(i)}
                    >
                      <Check className="h-3 w-3 text-green-600" />
                    </Button>
                  )}
                  <Button
                    size="icon-xs"
                    variant="ghost"
                    onClick={() => removeSuggestion(i)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <p>{suggestion.message}</p>
              {suggestion.original && suggestion.replacement && (
                <div className="mt-2 rounded bg-muted px-2 py-1 text-xs">
                  <span className="line-through text-muted-foreground">
                    {suggestion.original}
                  </span>
                  {' → '}
                  <span className="text-green-600 dark:text-green-400">
                    {suggestion.replacement}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
      <div className="space-y-2 border-t px-4 py-3">
        <Button
          size="sm"
          variant="default"
          className="w-full"
          onClick={handleReviseAll}
        >
          <Wrench className="mr-1.5 h-3.5 w-3.5" />
          Revise All
        </Button>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={handleUploadDraft}
          >
            <Upload className="mr-1.5 h-3.5 w-3.5" />
            Upload Revised Draft
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={handleRequestNewReview}
          >
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            Request New Review
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleDownloadDraft}
          >
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Download Draft
          </Button>
        </div>
      </div>
    </div>
  )
}
