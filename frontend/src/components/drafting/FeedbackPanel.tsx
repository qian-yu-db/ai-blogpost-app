import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useBlog } from "@/contexts/BlogContext";
import { getFeedback } from "@/api/client";
import { MessageSquare, Loader2, Check, X } from "lucide-react";
import type { Suggestion } from "@/types";

export function FeedbackPanel() {
  const { draft, suggestions, setSuggestions, setDraft } = useBlog();
  const [feedbackType, setFeedbackType] = useState("comprehensive");
  const [isLoading, setIsLoading] = useState(false);

  const handleGetFeedback = async () => {
    if (!draft) return;

    setIsLoading(true);
    const response = await getFeedback(draft, feedbackType);
    setSuggestions(response.suggestions);
    setIsLoading(false);
  };

  const applySuggestion = (suggestion: Suggestion) => {
    if (suggestion.original && suggestion.replacement) {
      setDraft(draft.replace(suggestion.original, suggestion.replacement));
      setSuggestions(suggestions.filter((s) => s !== suggestion));
    }
  };

  const dismissSuggestion = (suggestion: Suggestion) => {
    setSuggestions(suggestions.filter((s) => s !== suggestion));
  };

  const getBadgeVariant = (type: string) => {
    switch (type) {
      case "grammar":
        return "destructive";
      case "style":
        return "secondary";
      case "technical":
        return "default";
      default:
        return "outline";
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Feedback</CardTitle>
          <div className="flex items-center gap-2">
            <Select value={feedbackType} onValueChange={setFeedbackType}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="comprehensive">Comprehensive</SelectItem>
                <SelectItem value="grammar">Grammar</SelectItem>
                <SelectItem value="style">Style</SelectItem>
                <SelectItem value="technical">Technical</SelectItem>
              </SelectContent>
            </Select>
            <Button
              size="sm"
              onClick={handleGetFeedback}
              disabled={!draft || isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MessageSquare className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {suggestions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Click the button above to get AI feedback on your draft
          </p>
        ) : (
          <ScrollArea className="h-[200px]">
            <div className="space-y-3">
              {suggestions.map((suggestion, i) => (
                <div
                  key={i}
                  className="rounded-lg border p-3 text-sm"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <Badge variant={getBadgeVariant(suggestion.type)}>
                      {suggestion.type}
                    </Badge>
                    <div className="flex gap-1">
                      {suggestion.replacement && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={() => applySuggestion(suggestion)}
                        >
                          <Check className="h-3 w-3 text-green-600" />
                        </Button>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={() => dismissSuggestion(suggestion)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <p>{suggestion.message}</p>
                  {suggestion.original && suggestion.replacement && (
                    <div className="mt-2 text-xs">
                      <span className="line-through text-muted-foreground">
                        {suggestion.original}
                      </span>
                      {" → "}
                      <span className="text-green-600">
                        {suggestion.replacement}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
