import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { ToolActivity } from '@/types'
import { ChevronDown, ChevronRight, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

interface ToolActivityCardProps {
  activity: ToolActivity
}

const TOOL_LABELS: Record<string, string> = {
  fetch_url: 'Fetching URL',
  fetch_databricks_docs: 'Searching Databricks docs',
  parse_code_file: 'Parsing code file',
  create_outline: 'Creating outline',
  review_draft: 'Reviewing draft',
  get_word_stats: 'Calculating stats',
}

export function ToolActivityCard({ activity }: ToolActivityCardProps) {
  const [expanded, setExpanded] = useState(false)

  const label = TOOL_LABELS[activity.tool] || activity.tool
  const inputSummary = Object.entries(activity.input)
    .map(([k, v]) => `${k}: ${typeof v === 'string' ? v.slice(0, 60) : JSON.stringify(v).slice(0, 60)}`)
    .join(', ')

  return (
    <div className="rounded-md border border-border/50 bg-muted/30 text-xs">
      <button
        className="flex w-full items-center gap-2 px-3 py-2 text-left"
        onClick={() => setExpanded(!expanded)}
      >
        {activity.status === 'running' ? (
          <Loader2 className="h-3 w-3 animate-spin text-primary" />
        ) : activity.status === 'error' ? (
          <AlertCircle className="h-3 w-3 text-destructive" />
        ) : (
          <CheckCircle2 className="h-3 w-3 text-green-500" />
        )}
        <span className="flex-1 font-medium">{label}</span>
        {activity.result && (
          expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />
        )}
      </button>
      {expanded && activity.result && (
        <div className="border-t border-border/50 px-3 py-2 text-muted-foreground">
          <p className="line-clamp-4 whitespace-pre-wrap">{activity.result}</p>
        </div>
      )}
      {!expanded && inputSummary && (
        <div className={cn('px-3 pb-2 text-muted-foreground truncate')}>
          {inputSummary}
        </div>
      )}
    </div>
  )
}
