import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { BlogProvider, useBlog } from "@/contexts/BlogContext";
import { ThemeProvider, useTheme } from "@/contexts/ThemeContext";
import { PlanningTab } from "@/components/planning/PlanningTab";
import { DraftingTab } from "@/components/drafting/DraftingTab";
import { PublishTab } from "@/components/publish/PublishTab";
import { FileEdit, PenTool, Send, Sun, Moon } from "lucide-react";
import type { TabType } from "@/types";

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button variant="ghost" size="icon" onClick={toggleTheme}>
      {theme === "light" ? (
        <Moon className="h-5 w-5" />
      ) : (
        <Sun className="h-5 w-5" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}

function AppContent() {
  const { activeTab, setActiveTab } = useBlog();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <h1 className="text-xl font-bold">AI Blog Post App</h1>
          <ThemeToggle />
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as TabType)}
        >
          <TabsList className="mb-6 grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="planning" className="gap-2">
              <FileEdit className="h-4 w-4" />
              Planning
            </TabsTrigger>
            <TabsTrigger value="drafting" className="gap-2">
              <PenTool className="h-4 w-4" />
              Drafting
            </TabsTrigger>
            <TabsTrigger value="publish" className="gap-2">
              <Send className="h-4 w-4" />
              Publish
            </TabsTrigger>
          </TabsList>

          <TabsContent value="planning">
            <PlanningTab />
          </TabsContent>
          <TabsContent value="drafting">
            <DraftingTab />
          </TabsContent>
          <TabsContent value="publish">
            <PublishTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <BlogProvider>
        <AppContent />
      </BlogProvider>
    </ThemeProvider>
  );
}

export default App;
