import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useDraftStore } from '@/stores/draftStore'
import { exportMarkdown, exportPdf, getStats } from '@/api/client'
import { downloadBlob, extractTitle } from '@/lib/export'
import { Download, FileText, Loader2, Clock, Type } from 'lucide-react'

export function ExportPanel() {
  const draft = useDraftStore((s) => s.draft)
  const stats = useDraftStore((s) => s.stats)
  const setStats = useDraftStore((s) => s.setStats)
  const [isExportingMd, setIsExportingMd] = useState(false)
  const [isExportingPdf, setIsExportingPdf] = useState(false)

  useEffect(() => {
    if (!draft) {
      setStats(null)
      return
    }
    const timer = setTimeout(async () => {
      const newStats = await getStats(draft)
      setStats(newStats)
    }, 500)
    return () => clearTimeout(timer)
  }, [draft, setStats])

  const title = extractTitle(draft)

  const handleExportMd = async () => {
    setIsExportingMd(true)
    try {
      const blob = await exportMarkdown(draft, title)
      downloadBlob(blob, `${title}.md`)
    } catch {
      alert('Failed to export Markdown')
    } finally {
      setIsExportingMd(false)
    }
  }

  const handleExportPdf = async () => {
    setIsExportingPdf(true)
    try {
      const blob = await exportPdf(draft, title)
      downloadBlob(blob, `${title}.pdf`)
    } catch {
      alert('Failed to export PDF. WeasyPrint system libraries may not be installed.')
    } finally {
      setIsExportingPdf(false)
    }
  }

  if (!draft) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-muted-foreground gap-3">
        <Download className="h-10 w-10 text-muted-foreground/30" />
        <p className="text-sm">No draft to export yet</p>
        <p className="text-xs">Complete the drafting phase first</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b bg-accent/50 px-4 py-3">
        <h3 className="font-semibold text-sm">Export</h3>
      </div>
      <div className="flex-1 p-4 space-y-6">
        {stats && (
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-lg border p-3 text-center">
              <FileText className="mx-auto h-5 w-5 text-primary mb-1" />
              <p className="text-lg font-bold">{stats.word_count}</p>
              <p className="text-xs text-muted-foreground">Words</p>
            </div>
            <div className="rounded-lg border p-3 text-center">
              <Type className="mx-auto h-5 w-5 text-primary mb-1" />
              <p className="text-lg font-bold">{stats.character_count.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Characters</p>
            </div>
            <div className="rounded-lg border p-3 text-center">
              <Clock className="mx-auto h-5 w-5 text-primary mb-1" />
              <p className="text-lg font-bold">{stats.read_time_minutes}</p>
              <p className="text-xs text-muted-foreground">Min Read</p>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <Button
            variant="outline"
            className="w-full"
            onClick={handleExportMd}
            disabled={isExportingMd}
          >
            {isExportingMd ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileText className="mr-2 h-4 w-4" />
            )}
            Download Markdown
          </Button>
          <Button
            className="w-full"
            onClick={handleExportPdf}
            disabled={isExportingPdf}
          >
            {isExportingPdf ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Download PDF
          </Button>
        </div>
      </div>
    </div>
  )
}
