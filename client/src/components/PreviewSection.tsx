import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Monitor, Maximize, RotateCcw, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { LLMProvider, Model, SlideCountOption } from "@shared/schema";

interface PreviewSectionProps {
  presentationId: string | null;
  onPresentationGenerated: (id: string) => void;
  contentData: { content: string; guidance?: string };
  llmConfig: { provider: LLMProvider; model: Model; apiKey: string; slideCountOption: SlideCountOption } | null;
  templateFile: File | null;
}

interface GenerationData {
  content: string;
  guidance?: string;
  llmProvider: string;
  model: string;
  apiKey: string;
  slideCountOption: string;
  templateFile?: File;
}

export default function PreviewSection({ 
  presentationId, 
  onPresentationGenerated, 
  contentData, 
  llmConfig, 
  templateFile 
}: PreviewSectionProps) {
  const [currentSlide, setCurrentSlide] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  // Get presentation data
  const { data: presentation, isLoading: isPresentationLoading } = useQuery({
    queryKey: ["/api/presentations", presentationId],
    enabled: !!presentationId,
  });

  // Get presentation preview HTML
  const { data: previewHtml, isLoading: isPreviewLoading } = useQuery({
    queryKey: ["/api/presentations", presentationId, "preview"],
    enabled: !!presentationId,
  });

  const generateMutation = useMutation({
    mutationFn: async (data: GenerationData) => {
      const formData = new FormData();
      formData.append("content", data.content);
      formData.append("llmProvider", data.llmProvider);
      formData.append("model", data.model);
      formData.append("apiKey", data.apiKey);
      
      if (data.guidance) {
        formData.append("guidance", data.guidance);
      }
      
      if (data.templateFile) {
        formData.append("template", data.templateFile);
      }
      
      formData.append("slideCountOption", data.slideCountOption);

      const response = await fetch("/api/presentations/generate", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate presentation");
      }

      return response.json();
    },
    onSuccess: (data) => {
      setIsGenerating(false);
      onPresentationGenerated(data.id);
      setCurrentSlide(1);
      toast({
        title: "Presentation Generated",
        description: `Successfully created ${data.slideCount} slides`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/presentations"] });
    },
    onError: (error) => {
      setIsGenerating(false);
      toast({
        title: "Generation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const canGenerate = contentData.content.trim() && llmConfig?.apiKey.trim();

  const handleGenerate = () => {
    if (!canGenerate) {
      toast({
        title: "Missing Information",
        description: "Please fill in your content and API key",
        variant: "destructive",
      });
      return;
    }

    if (!llmConfig) {
      toast({
        title: "Missing Configuration",
        description: "Please configure your AI provider",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    generateMutation.mutate({
      content: contentData.content,
      guidance: contentData.guidance,
      llmProvider: llmConfig.provider,
      model: llmConfig.model,
      apiKey: llmConfig.apiKey,
      slideCountOption: llmConfig.slideCountOption,
      templateFile: templateFile || undefined,
    });
  };

  const totalSlides = (presentation as any)?.slideCount || 0;

  const nextSlide = () => {
    if (currentSlide < totalSlides) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const previousSlide = () => {
    if (currentSlide > 1) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const goToSlide = (slideNumber: number) => {
    if (slideNumber >= 1 && slideNumber <= totalSlides) {
      setCurrentSlide(slideNumber);
    }
  };

  const isLoading = isGenerating || isPresentationLoading || isPreviewLoading;

  return (
    <Card className="bg-card border border-border overflow-hidden" data-testid="card-preview">
      <div className="bg-secondary px-6 py-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Monitor className="h-5 w-5 text-accent" />
            <h2 className="text-lg font-semibold">Live Preview</h2>
            {totalSlides > 0 && (
              <span 
                className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full"
                data-testid="text-slide-count"
              >
                {totalSlides} slides
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
              title="Fullscreen"
              data-testid="button-fullscreen"
            >
              <Maximize className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
              title="Refresh"
              data-testid="button-refresh"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Slide Preview Area */}
      <div className="relative">
        {isLoading ? (
          <div 
            className="flex items-center justify-center h-96 bg-muted/20"
            data-testid="loading-state"
          >
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-sm text-muted-foreground">
                {isGenerating ? "Generating your presentation..." : "Loading preview..."}
              </p>
              {isGenerating && (
                <div className="w-64 h-2 bg-muted rounded-full mt-4 overflow-hidden mx-auto">
                  <div className="progress-bar h-full w-1/3 rounded-full"></div>
                </div>
              )}
            </div>
          </div>
        ) : presentationId ? (
          <div 
            className="aspect-video bg-gradient-to-br from-slate-900 to-slate-800 relative overflow-hidden"
            data-testid="preview-content"
          >
            <iframe
              src={`/api/presentations/${presentationId}/preview`}
              className="w-full h-full border-0"
              title="Presentation Preview"
              data-testid="iframe-preview"
            />
          </div>
        ) : (
          <div 
            className="flex items-center justify-center h-96 bg-muted/20"
            data-testid="empty-state"
          >
            <div className="text-center">
              <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium mb-2">Ready to Generate</p>
              <p className="text-sm text-muted-foreground">
                Fill in your content and API key to generate your presentation
              </p>
              <Button
                className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90 glow-effect"
                onClick={handleGenerate}
                disabled={!canGenerate || isGenerating}
                data-testid="button-generate-presentation"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Presentation
              </Button>
            </div>
          </div>
        )}
      </div>
      
      {/* Navigation Controls */}
      {presentationId && totalSlides > 0 && (
        <div className="bg-secondary px-6 py-4 border-t border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button
                variant="secondary"
                size="sm"
                className="slide-nav-btn bg-muted text-muted-foreground hover:bg-muted/80"
                disabled={currentSlide === 1}
                onClick={previousSlide}
                data-testid="button-previous-slide"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="slide-nav-btn bg-muted text-muted-foreground hover:bg-muted/80"
                disabled={currentSlide === totalSlides}
                onClick={nextSlide}
                data-testid="button-next-slide"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
            
            <div className="flex items-center space-x-4">
              <span 
                className="text-sm text-muted-foreground"
                data-testid="text-current-slide"
              >
                Slide {currentSlide} of {totalSlides}
              </span>
              <div className="flex space-x-1">
                {Array.from({ length: Math.min(totalSlides, 10) }, (_, i) => (
                  <button
                    key={i + 1}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      currentSlide === i + 1 ? 'bg-primary' : 'bg-muted'
                    }`}
                    onClick={() => goToSlide(i + 1)}
                    data-testid={`button-slide-${i + 1}`}
                  />
                ))}
                {totalSlides > 10 && (
                  <span className="text-xs text-muted-foreground ml-2">...</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}