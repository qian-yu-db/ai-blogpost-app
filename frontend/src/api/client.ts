import type {
  DraftRequest,
  FeedbackResponse,
  StatsResponse,
  UploadedFile,
} from "@/types";

const API_BASE = "/api";

export async function uploadFile(file: File): Promise<UploadedFile> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE}/files/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Failed to upload file");
  }

  return response.json();
}

export async function* streamDraft(
  request: DraftRequest
): AsyncGenerator<string> {
  const response = await fetch(`${API_BASE}/draft/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error("Failed to generate draft");
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const data = line.slice(6);
        if (data === "[DONE]") return;
        yield data;
      }
    }
  }
}

export async function getStats(content: string): Promise<StatsResponse> {
  const response = await fetch(`${API_BASE}/draft/stats`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });

  if (!response.ok) {
    throw new Error("Failed to get stats");
  }

  return response.json();
}

export async function getFeedback(
  content: string,
  feedbackType: string = "comprehensive"
): Promise<FeedbackResponse> {
  const response = await fetch(`${API_BASE}/feedback/review`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content, feedback_type: feedbackType }),
  });

  if (!response.ok) {
    throw new Error("Failed to get feedback");
  }

  return response.json();
}

export async function exportMarkdown(
  content: string,
  title: string
): Promise<Blob> {
  const response = await fetch(`${API_BASE}/export/markdown`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content, title }),
  });

  if (!response.ok) {
    throw new Error("Failed to export markdown");
  }

  return response.blob();
}

export async function exportPdf(content: string, title: string): Promise<Blob> {
  const response = await fetch(`${API_BASE}/export/pdf`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content, title }),
  });

  if (!response.ok) {
    throw new Error("Failed to export PDF");
  }

  return response.blob();
}
