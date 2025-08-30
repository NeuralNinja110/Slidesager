import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation } from "@tanstack/react-query";
import { Download, FileSpreadsheet, File, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DownloadControlsProps {
  presentationId: string;
}

export default function DownloadControls({ presentationId }: DownloadControlsProps) {
  const [slideSelection, setSlideSelection] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);
  const { toast } = useToast();

  const downloadMutation = useMutation({
    mutationFn: async ({ format, ranges }: { format: 'pptx' | 'pdf'; ranges?: string }) => {
      const response = await fetch(`/api/presentations/${presentationId}/download/${format}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ slideRanges: ranges }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Failed to download ${format.toUpperCase()}`);
      }

      return response.blob();
    },
    onSuccess: (blob, variables) => {
      setIsDownloading(false);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `presentation.${variables.format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Download Complete",
        description: `Successfully downloaded ${variables.format.toUpperCase()}`,
      });
    },
    onError: (error) => {
      setIsDownloading(false);
      toast({
        title: "Download Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDownload = (format: 'pptx' | 'pdf') => {
    setIsDownloading(true);
    downloadMutation.mutate({ 
      format, 
      ranges: slideSelection.trim() || undefined 
    });
  };

  const validateSlideSelection = () => {
    if (!slideSelection.trim()) return true;
    
    // Basic validation for slide ranges (e.g., "1-3, 5, 7-9")
    const rangePattern = /^(\d+(-\d+)?)(,\s*\d+(-\d+)?)*$/;
    return rangePattern.test(slideSelection.trim());
  };

  const isValidSelection = validateSlideSelection();

  return (
    <Card className="bg-card border border-border" data-testid="card-download-controls">
      <CardContent className="p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Download className="h-5 w-5 text-accent" />
          <h2 className="text-lg font-semibold">Download Options</h2>
        </div>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="slide-selection" className="block text-sm font-medium mb-2">
              Slide Selection
            </Label>
            <div className="flex space-x-2">
              <Input 
                id="slide-selection"
                className={`flex-1 bg-input border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring font-mono ${
                  !isValidSelection ? 'border-destructive' : 'border-border'
                }`}
                placeholder="1-5, 7, 9-12 (All by default)"
                value={slideSelection}
                onChange={(e) => setSlideSelection(e.target.value)}
                data-testid="input-slide-selection"
              />
              <Button
                variant="secondary"
                size="sm"
                className="bg-secondary text-secondary-foreground hover:bg-secondary/80"
                disabled={!isValidSelection}
                data-testid="button-validate-selection"
              >
                <Check className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Specify slides to download (e.g., "1-3, 5" for slides 1, 2, 3, and 5)
            </p>
            {!isValidSelection && (
              <p className="text-xs text-destructive mt-1">
                Invalid format. Use ranges like "1-3, 5, 7-9"
              </p>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <Button
              className="bg-primary text-primary-foreground py-3 rounded-md font-medium text-sm hover:bg-primary/90 transition-all hover:shadow-lg flex items-center justify-center space-x-2"
              onClick={() => handleDownload('pptx')}
              disabled={isDownloading || !isValidSelection}
              data-testid="button-download-pptx"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>Download PPTX</span>
            </Button>
            <Button
              className="bg-destructive text-destructive-foreground py-3 rounded-md font-medium text-sm hover:bg-destructive/90 transition-all hover:shadow-lg flex items-center justify-center space-x-2"
              onClick={() => handleDownload('pdf')}
              disabled={isDownloading || !isValidSelection}
              data-testid="button-download-pdf"
            >
              <File className="h-4 w-4" />
              <span>Download PDF</span>
            </Button>
          </div>
          
          {/* Download Progress */}
          {isDownloading && (
            <div 
              className="mt-4 p-3 bg-muted rounded-md"
              data-testid="download-progress"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Preparing download...</span>
                <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full"></div>
              </div>
              <div className="w-full h-2 bg-background rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all duration-300 animate-pulse w-3/4"></div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
