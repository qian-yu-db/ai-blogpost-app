import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useBlog } from "@/contexts/BlogContext";
import { FileText, Clock, Type, Users } from "lucide-react";

export function StatsPanel() {
  const { stats, planning } = useBlog();

  if (!stats) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Post Statistics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.word_count}</p>
              <p className="text-xs text-muted-foreground">Words</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <Type className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {stats.character_count.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">Characters</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.read_time_minutes}</p>
              <p className="text-xs text-muted-foreground">Min Read</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{planning.personas.length || 1}</p>
              <p className="text-xs text-muted-foreground">Audiences</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
