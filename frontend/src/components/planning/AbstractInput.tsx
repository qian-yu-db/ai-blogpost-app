import { Textarea } from "@/components/ui/textarea";
import { useBlog } from "@/contexts/BlogContext";

export function AbstractInput() {
  const { planning, setPlanning } = useBlog();

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">
        Abstract / Outline
      </label>
      <Textarea
        placeholder="Describe your blog post topic, key points you want to cover, and any specific objectives..."
        className="min-h-[150px] resize-y"
        value={planning.abstract}
        onChange={(e) =>
          setPlanning({ ...planning, abstract: e.target.value })
        }
      />
      <p className="text-xs text-muted-foreground">
        Be as detailed as possible. Include the main topic, key concepts, and what readers should learn.
      </p>
    </div>
  );
}
