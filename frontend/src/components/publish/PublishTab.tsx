import { useBlog } from "@/contexts/BlogContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

import { StatsPanel } from "./StatsPanel";
import { PreviewPane } from "./PreviewPane";
import { ExportButtons } from "./ExportButtons";

export function PublishTab() {
  const { draft } = useBlog();

  if (!draft) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No draft available. Go to the Planning tab to generate a draft first.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Review & Export</h2>
        <ExportButtons />
      </div>

      <StatsPanel />
      <PreviewPane />
    </div>
  );
}
