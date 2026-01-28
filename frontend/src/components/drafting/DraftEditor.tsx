import CodeMirror from "@uiw/react-codemirror";
import { markdown } from "@codemirror/lang-markdown";
import { EditorView } from "@codemirror/view";
import { useBlog } from "@/contexts/BlogContext";
import { useTheme } from "@/contexts/ThemeContext";
import ReactMarkdown from "react-markdown";
import { ScrollArea } from "@/components/ui/scroll-area";

const darkTheme = EditorView.theme(
  {
    "&": {
      backgroundColor: "oklch(0.22 0.03 265)",
      color: "oklch(0.92 0.01 265)",
    },
    ".cm-content": {
      caretColor: "oklch(0.7 0.15 265)",
    },
    ".cm-cursor, .cm-dropCursor": {
      borderLeftColor: "oklch(0.7 0.15 265)",
    },
    "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection":
      {
        backgroundColor: "oklch(0.35 0.05 265)",
      },
    ".cm-gutters": {
      backgroundColor: "oklch(0.2 0.028 265)",
      color: "oklch(0.5 0.02 265)",
      borderRight: "1px solid oklch(0.35 0.04 265)",
    },
    ".cm-activeLineGutter": {
      backgroundColor: "oklch(0.28 0.035 265)",
    },
    ".cm-activeLine": {
      backgroundColor: "oklch(0.25 0.03 265)",
    },
  },
  { dark: true }
);

const lightTheme = EditorView.theme({
  "&": {
    backgroundColor: "oklch(0.995 0.002 270)",
    color: "oklch(0.25 0.02 265)",
  },
  ".cm-content": {
    caretColor: "oklch(0.55 0.18 265)",
  },
  ".cm-cursor, .cm-dropCursor": {
    borderLeftColor: "oklch(0.55 0.18 265)",
  },
  "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection":
    {
      backgroundColor: "oklch(0.9 0.03 265)",
    },
  ".cm-gutters": {
    backgroundColor: "oklch(0.97 0.008 265)",
    color: "oklch(0.5 0.02 265)",
    borderRight: "1px solid oklch(0.9 0.02 265)",
  },
  ".cm-activeLineGutter": {
    backgroundColor: "oklch(0.94 0.015 265)",
  },
  ".cm-activeLine": {
    backgroundColor: "oklch(0.96 0.01 265)",
  },
});

export function DraftEditor() {
  const { draft, setDraft, isGenerating } = useBlog();
  const { theme } = useTheme();

  return (
    <div className="grid h-[600px] grid-cols-2 gap-4">
      <div className="flex flex-col overflow-hidden rounded-lg border">
        <div className="border-b bg-muted px-4 py-2 text-sm font-medium">
          Editor
        </div>
        <div className="flex-1 overflow-hidden">
          <CodeMirror
            value={draft}
            height="100%"
            extensions={[markdown()]}
            theme={theme === "dark" ? darkTheme : lightTheme}
            onChange={(value) => setDraft(value)}
            readOnly={isGenerating}
            className="h-full"
          />
        </div>
      </div>

      <div className="flex flex-col overflow-hidden rounded-lg border">
        <div className="border-b bg-muted px-4 py-2 text-sm font-medium">
          Preview
        </div>
        <ScrollArea className="flex-1 p-4">
          <article className="prose prose-sm max-w-none dark:prose-invert">
            <ReactMarkdown>{draft}</ReactMarkdown>
          </article>
        </ScrollArea>
      </div>
    </div>
  );
}
