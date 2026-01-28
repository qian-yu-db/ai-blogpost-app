import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useBlog } from "@/contexts/BlogContext";
import { uploadFile } from "@/api/client";
import { Upload, Link, X, FileCode, Loader2, ExternalLink, FileText } from "lucide-react";
import type { DocumentReference } from "@/types";

export function ReferenceInput() {
  const { planning, setPlanning, uploadedFiles, addUploadedFile, removeUploadedFile } = useBlog();
  const [urlInput, setUrlInput] = useState("");
  const [docLabel, setDocLabel] = useState("");
  const [docUrl, setDocUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    setIsUploading(true);
    for (const file of Array.from(files)) {
      const uploaded = await uploadFile(file);
      addUploadedFile(uploaded);
    }
    setIsUploading(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const addUrl = () => {
    if (urlInput.trim() && !planning.referenceUrls.includes(urlInput.trim())) {
      setPlanning({
        ...planning,
        referenceUrls: [...planning.referenceUrls, urlInput.trim()],
      });
      setUrlInput("");
    }
  };

  const removeUrl = (url: string) => {
    setPlanning({
      ...planning,
      referenceUrls: planning.referenceUrls.filter((u) => u !== url),
    });
  };

  const addDocumentReference = () => {
    if (docLabel.trim() && docUrl.trim()) {
      const exists = planning.documentReferences.some(
        (ref) => ref.url === docUrl.trim()
      );
      if (!exists) {
        setPlanning({
          ...planning,
          documentReferences: [
            ...planning.documentReferences,
            { label: docLabel.trim(), url: docUrl.trim() },
          ],
        });
        setDocLabel("");
        setDocUrl("");
      }
    }
  };

  const removeDocumentReference = (url: string) => {
    setPlanning({
      ...planning,
      documentReferences: planning.documentReferences.filter((ref) => ref.url !== url),
    });
  };

  return (
    <div className="space-y-4">
      <label className="text-sm font-medium">
        References
      </label>

      <div className="space-y-3">
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".py,.ipynb"
            multiple
            className="hidden"
            onChange={handleFileUpload}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            Upload .py / .ipynb
          </Button>
        </div>

        {uploadedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {uploadedFiles.map((file) => (
              <Badge key={file.id} variant="secondary" className="gap-1">
                <FileCode className="h-3 w-3" />
                {file.filename}
                <X
                  className="h-3 w-3 cursor-pointer hover:text-destructive"
                  onClick={() => removeUploadedFile(file.id)}
                />
              </Badge>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <Input
            placeholder="https://github.com/..."
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addUrl()}
          />
          <Button type="button" variant="outline" onClick={addUrl}>
            <Link className="mr-2 h-4 w-4" />
            Add URL
          </Button>
        </div>

        {planning.referenceUrls.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {planning.referenceUrls.map((url) => (
              <Badge key={url} variant="outline" className="gap-1 max-w-[300px]">
                <Link className="h-3 w-3 shrink-0" />
                <span className="truncate">{url}</span>
                <X
                  className="h-3 w-3 shrink-0 cursor-pointer hover:text-destructive"
                  onClick={() => removeUrl(url)}
                />
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <label className="text-sm font-medium">Document References</label>
        <div className="space-y-2">
          <Input
            placeholder="Label (e.g., React Documentation)"
            value={docLabel}
            onChange={(e) => setDocLabel(e.target.value)}
          />
          <div className="flex gap-2">
            <Input
              placeholder="URL (e.g., https://react.dev/docs)"
              value={docUrl}
              onChange={(e) => setDocUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addDocumentReference()}
            />
            <Button type="button" variant="outline" onClick={addDocumentReference}>
              <FileText className="mr-2 h-4 w-4" />
              Add
            </Button>
          </div>
        </div>

        {planning.documentReferences.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {planning.documentReferences.map((ref) => (
              <Badge
                key={ref.url}
                variant="secondary"
                className="gap-1 cursor-pointer hover:bg-secondary/80"
                onClick={() => window.open(ref.url, "_blank")}
              >
                <ExternalLink className="h-3 w-3 shrink-0" />
                <span>{ref.label}</span>
                <X
                  className="h-3 w-3 shrink-0 cursor-pointer hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeDocumentReference(ref.url);
                  }}
                />
              </Badge>
            ))}
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Upload code files, add URLs, or add labeled document references for the AI to reference when generating your draft
      </p>
    </div>
  );
}
