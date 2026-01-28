import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useBlog } from "@/contexts/BlogContext";
import { streamDraft } from "@/api/client";
import { Sparkles, Loader2 } from "lucide-react";

import { AbstractInput } from "./AbstractInput";
import { PersonaSelector } from "./PersonaSelector";
import { TechnicalLevelMenu } from "./TechnicalLevelMenu";
import { LengthSelector } from "./LengthSelector";
import { StyleSelector } from "./StyleSelector";
import { ReferenceInput } from "./ReferenceInput";

export function PlanningTab() {
  const {
    planning,
    setDraft,
    setActiveTab,
    isGenerating,
    setIsGenerating,
  } = useBlog();

  const handleGenerate = async () => {
    if (!planning.abstract.trim()) return;

    setIsGenerating(true);
    setDraft("");
    setActiveTab("drafting");

    const request = {
      abstract: planning.abstract,
      personas: planning.personas,
      technical_level: planning.technicalLevel,
      target_length: planning.targetLength,
      style: planning.style,
      reference_urls: planning.referenceUrls,
      code_content: planning.codeContent,
    };

    let fullDraft = "";
    for await (const chunk of streamDraft(request)) {
      fullDraft += chunk;
      setDraft(fullDraft);
    }

    setIsGenerating(false);
  };

  const isValid = planning.abstract.trim().length > 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Plan Your Blog Post</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <AbstractInput />

          <div className="grid gap-6 md:grid-cols-2">
            <TechnicalLevelMenu />
            <LengthSelector />
          </div>

          <StyleSelector />
          <PersonaSelector />
          <ReferenceInput />

          <div className="flex justify-end pt-4">
            <Button
              size="lg"
              onClick={handleGenerate}
              disabled={!isValid || isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Draft
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
