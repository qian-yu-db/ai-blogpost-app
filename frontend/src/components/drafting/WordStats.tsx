import { useEffect } from "react";
import { useBlog } from "@/contexts/BlogContext";
import { getStats } from "@/api/client";
import { FileText, Clock, Type } from "lucide-react";

export function WordStats() {
  const { draft, stats, setStats } = useBlog();

  useEffect(() => {
    if (!draft) {
      setStats(null);
      return;
    }

    const timer = setTimeout(async () => {
      const newStats = await getStats(draft);
      setStats(newStats);
    }, 500);

    return () => clearTimeout(timer);
  }, [draft, setStats]);

  if (!stats) return null;

  return (
    <div className="flex gap-6 text-sm text-muted-foreground">
      <div className="flex items-center gap-2">
        <FileText className="h-4 w-4" />
        <span>{stats.word_count} words</span>
      </div>
      <div className="flex items-center gap-2">
        <Type className="h-4 w-4" />
        <span>{stats.character_count.toLocaleString()} chars</span>
      </div>
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4" />
        <span>{stats.read_time_minutes} min read</span>
      </div>
    </div>
  );
}
