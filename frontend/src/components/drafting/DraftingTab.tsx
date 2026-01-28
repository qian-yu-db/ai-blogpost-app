import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useBlog } from "@/contexts/BlogContext";
import { Loader2 } from "lucide-react";

import { DraftEditor } from "./DraftEditor";
import { WordStats } from "./WordStats";
import { FeedbackPanel } from "./FeedbackPanel";

export function DraftingTab() {
  const { isGenerating } = useBlog();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              Draft Your Post
              {isGenerating && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </CardTitle>
            <WordStats />
          </div>
        </CardHeader>
        <CardContent>
          <DraftEditor />
        </CardContent>
      </Card>

      <FeedbackPanel />
    </div>
  );
}
