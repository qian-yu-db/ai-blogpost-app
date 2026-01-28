import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";
import type {
  PlanningInput,
  Suggestion,
  StatsResponse,
  TabType,
  UploadedFile,
} from "@/types";

interface BlogContextType {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;

  planning: PlanningInput;
  setPlanning: (planning: PlanningInput) => void;

  uploadedFiles: UploadedFile[];
  addUploadedFile: (file: UploadedFile) => void;
  removeUploadedFile: (id: string) => void;

  draft: string;
  setDraft: (draft: string) => void;

  isGenerating: boolean;
  setIsGenerating: (generating: boolean) => void;

  suggestions: Suggestion[];
  setSuggestions: (suggestions: Suggestion[]) => void;

  stats: StatsResponse | null;
  setStats: (stats: StatsResponse | null) => void;
}

const defaultPlanning: PlanningInput = {
  abstract: "",
  personas: [],
  technicalLevel: "intermediate",
  targetLength: "5",
  style: "tutorial",
  referenceUrls: [],
  documentReferences: [],
  codeContent: "",
};

const BlogContext = createContext<BlogContextType | null>(null);

export function BlogProvider({ children }: { children: ReactNode }) {
  const [activeTab, setActiveTab] = useState<TabType>("planning");
  const [planning, setPlanning] = useState<PlanningInput>(defaultPlanning);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [draft, setDraft] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [stats, setStats] = useState<StatsResponse | null>(null);

  const addUploadedFile = (file: UploadedFile) => {
    setUploadedFiles((prev) => [...prev, file]);
    setPlanning((prev) => ({
      ...prev,
      codeContent: prev.codeContent
        ? `${prev.codeContent}\n\n// --- ${file.filename} ---\n${file.content}`
        : `// --- ${file.filename} ---\n${file.content}`,
    }));
  };

  const removeUploadedFile = (id: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  return (
    <BlogContext.Provider
      value={{
        activeTab,
        setActiveTab,
        planning,
        setPlanning,
        uploadedFiles,
        addUploadedFile,
        removeUploadedFile,
        draft,
        setDraft,
        isGenerating,
        setIsGenerating,
        suggestions,
        setSuggestions,
        stats,
        setStats,
      }}
    >
      {children}
    </BlogContext.Provider>
  );
}

export function useBlog() {
  const context = useContext(BlogContext);
  if (!context) {
    throw new Error("useBlog must be used within a BlogProvider");
  }
  return context;
}
