import { ThemeProvider } from '@/contexts/ThemeContext'
import { Sidebar } from '@/components/layout/Sidebar'
import { MainArea } from '@/components/layout/MainArea'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'
import { BackgroundBeams } from '@/components/ui/background-beams'

function App() {
  return (
    <ThemeProvider>
      <ErrorBoundary>
        <div className="relative flex h-screen bg-background overflow-hidden">
          <BackgroundBeams className="z-0 opacity-40 dark:opacity-100" />
          <div className="relative z-10 flex h-full w-full">
            <Sidebar />
            <MainArea />
          </div>
        </div>
      </ErrorBoundary>
    </ThemeProvider>
  )
}

export default App
