import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBlog } from "@/contexts/BlogContext";

const LENGTHS = [
  { value: "1", label: "1 min", desc: "~300 words, quick tip" },
  { value: "3", label: "3 min", desc: "~600 words, short article" },
  { value: "5", label: "5 min", desc: "~1000 words, standard post" },
  { value: "10", label: "10 min", desc: "~2000 words, in-depth guide" },
  { value: "15", label: "15+ min", desc: "~3000+ words, comprehensive tutorial" },
];

export function LengthSelector() {
  const { planning, setPlanning } = useBlog();

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">
        Target Read Time
      </label>
      <Select
        value={planning.targetLength}
        onValueChange={(value) =>
          setPlanning({ ...planning, targetLength: value })
        }
      >
        <SelectTrigger>
          <SelectValue placeholder="Select length" />
        </SelectTrigger>
        <SelectContent>
          {LENGTHS.map((length) => (
            <SelectItem key={length.value} value={length.value}>
              <div className="flex items-center gap-2">
                <span className="font-medium">{length.label}</span>
                <span className="text-xs text-muted-foreground">
                  {length.desc}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
