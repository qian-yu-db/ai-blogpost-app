import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBlog } from "@/contexts/BlogContext";

const STYLES = [
  { value: "tutorial", label: "Tutorial", desc: "Step-by-step guide with code examples" },
  { value: "explainer", label: "Explainer", desc: "Concept-focused, understanding why" },
  { value: "comparison", label: "Comparison", desc: "Compare approaches or technologies" },
  { value: "case-study", label: "Case Study", desc: "Real-world example with lessons learned" },
  { value: "conversational", label: "Conversational", desc: "Friendly, engaging tone" },
];

export function StyleSelector() {
  const { planning, setPlanning } = useBlog();

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">
        Writing Style
      </label>
      <Select
        value={planning.style}
        onValueChange={(value) =>
          setPlanning({ ...planning, style: value })
        }
      >
        <SelectTrigger>
          <SelectValue placeholder="Select style" />
        </SelectTrigger>
        <SelectContent>
          {STYLES.map((style) => (
            <SelectItem key={style.value} value={style.value}>
              <div>
                <div className="font-medium">{style.label}</div>
                <div className="text-xs text-muted-foreground">{style.desc}</div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
