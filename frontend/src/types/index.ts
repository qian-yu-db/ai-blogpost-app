export interface PlanningInput {
  abstract: string;
  personas: string[];
  technicalLevel: string;
  targetLength: string;
  style: string;
  referenceUrls: string[];
  documentReferences: DocumentReference[];
  codeContent: string;
}

export interface DraftRequest {
  abstract: string;
  personas: string[];
  technical_level: string;
  target_length: string;
  style: string;
  reference_urls: string[];
  code_content: string;
}

export interface Suggestion {
  type: "grammar" | "style" | "technical";
  message: string;
  line_start: number | null;
  line_end: number | null;
  original: string | null;
  replacement: string | null;
}

export interface FeedbackResponse {
  suggestions: Suggestion[];
}

export interface StatsResponse {
  word_count: number;
  character_count: number;
  read_time_minutes: number;
}

export interface UploadedFile {
  id: string;
  filename: string;
  content: string;
}

export interface DocumentReference {
  label: string;
  url: string;
}

export type TabType = "planning" | "drafting" | "publish";
