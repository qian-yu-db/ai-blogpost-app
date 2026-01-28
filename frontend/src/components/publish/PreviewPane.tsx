import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useBlog } from "@/contexts/BlogContext";
import ReactMarkdown from "react-markdown";

export function PreviewPane() {
  const { draft } = useBlog();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Final Preview</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] rounded-lg border p-6">
          <article className="prose prose-lg max-w-none dark:prose-invert">
            <ReactMarkdown>{draft}</ReactMarkdown>
          </article>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
