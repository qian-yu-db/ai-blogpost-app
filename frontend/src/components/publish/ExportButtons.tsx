import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useBlog } from "@/contexts/BlogContext";
import { exportMarkdown, exportPdf } from "@/api/client";
import { Download, FileText, Loader2 } from "lucide-react";

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function extractTitle(content: string): string {
  const match = content.match(/^#\s+(.+)$/m);
  if (match) {
    return match[1].toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 50);
  }
  return "blog-post";
}

export function ExportButtons() {
  const { draft } = useBlog();
  const [isExportingMd, setIsExportingMd] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const title = extractTitle(draft);

  const handleExportMd = async () => {
    setIsExportingMd(true);
    const blob = await exportMarkdown(draft, title);
    downloadBlob(blob, `${title}.md`);
    setIsExportingMd(false);
  };

  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    const blob = await exportPdf(draft, title);
    downloadBlob(blob, `${title}.pdf`);
    setIsExportingPdf(false);
  };

  return (
    <div className="flex gap-3">
      <Button
        variant="outline"
        onClick={handleExportMd}
        disabled={!draft || isExportingMd}
      >
        {isExportingMd ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <FileText className="mr-2 h-4 w-4" />
        )}
        Download Markdown
      </Button>
      <Button onClick={handleExportPdf} disabled={!draft || isExportingPdf}>
        {isExportingPdf ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Download className="mr-2 h-4 w-4" />
        )}
        Download PDF
      </Button>
    </div>
  );
}
