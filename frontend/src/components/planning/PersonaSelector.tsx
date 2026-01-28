import { Badge } from "@/components/ui/badge";
import { useBlog } from "@/contexts/BlogContext";
import { X } from "lucide-react";

const PERSONAS = [
  "Software Engineers",
  "Data Scientists",
  "ML Engineers",
  "DevOps Engineers",
  "Backend Developers",
  "Frontend Developers",
  "Full-Stack Developers",
  "Tech Leads",
  "Students",
  "Career Changers",
];

export function PersonaSelector() {
  const { planning, setPlanning } = useBlog();

  const togglePersona = (persona: string) => {
    const isSelected = planning.personas.includes(persona);
    setPlanning({
      ...planning,
      personas: isSelected
        ? planning.personas.filter((p) => p !== persona)
        : [...planning.personas, persona],
    });
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">
        Target Audience
      </label>
      <div className="flex flex-wrap gap-2">
        {PERSONAS.map((persona) => {
          const isSelected = planning.personas.includes(persona);
          return (
            <Badge
              key={persona}
              variant={isSelected ? "default" : "outline"}
              className="cursor-pointer select-none"
              onClick={() => togglePersona(persona)}
            >
              {persona}
              {isSelected && <X className="ml-1 h-3 w-3" />}
            </Badge>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">
        Select one or more target reader groups
      </p>
    </div>
  );
}
