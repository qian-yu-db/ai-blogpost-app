import { ThemeProvider } from '@/contexts/ThemeContext'
import { Sidebar } from '@/components/layout/Sidebar'
import { MainArea } from '@/components/layout/MainArea'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'

function App() {
  return (
    <ThemeProvider>
      <ErrorBoundary>
        <div className="flex h-screen bg-background">
          <Sidebar />
          <MainArea />
        </div>
      </ErrorBoundary>
    </ThemeProvider>
  )
}

export default App
