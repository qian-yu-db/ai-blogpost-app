import { useNavigationStore } from '@/stores/navigationStore'
import { ChatPanel } from '@/components/interactive/ChatPanel'
import { OutlineViewer } from '@/components/artifacts/OutlineViewer'
import { DraftViewer } from '@/components/artifacts/DraftViewer'
import { ReviewViewer } from '@/components/artifacts/ReviewViewer'
import { ExportPanel } from '@/components/artifacts/ExportPanel'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'

function ArtifactPanel() {
  const activeArtifact = useNavigationStore((s) => s.activeArtifact)

  switch (activeArtifact) {
    case 'outline':
      return <OutlineViewer />
    case 'draft':
      return <DraftViewer />
    case 'review':
      return <ReviewViewer />
    case 'export':
      return <ExportPanel />
    default:
      return null
  }
}

export function MainArea() {
  const activeArtifact = useNavigationStore((s) => s.activeArtifact)

  const showArtifact = activeArtifact !== null

  if (showArtifact) {
    return (
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 border-r overflow-hidden h-full">
          <ErrorBoundary>
            <ChatPanel />
          </ErrorBoundary>
        </div>
        <div className="h-full w-[50%] max-w-[700px] overflow-hidden">
          <ErrorBoundary>
            <ArtifactPanel />
          </ErrorBoundary>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-hidden h-full">
      <ErrorBoundary>
        <ChatPanel />
      </ErrorBoundary>
    </div>
  )
}
