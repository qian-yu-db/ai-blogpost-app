import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBlog } from "@/contexts/BlogContext";

const LEVELS = [
  { value: "beginner", label: "Beginner", desc: "New to the topic, needs foundational explanations" },
  { value: "intermediate", label: "Intermediate", desc: "Familiar with basics, ready for practical patterns" },
  { value: "advanced", label: "Advanced", desc: "Deep expertise, interested in internals and edge cases" },
];

export function TechnicalLevelMenu() {
  const { planning, setPlanning } = useBlog();

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">
        Technical Level
      </label>
      <Select
        value={planning.technicalLevel}
        onValueChange={(value) =>
          setPlanning({ ...planning, technicalLevel: value })
        }
      >
        <SelectTrigger>
          <SelectValue placeholder="Select level" />
        </SelectTrigger>
        <SelectContent>
          {LEVELS.map((level) => (
            <SelectItem key={level.value} value={level.value}>
              <div>
                <div className="font-medium">{level.label}</div>
                <div className="text-xs text-muted-foreground">{level.desc}</div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
