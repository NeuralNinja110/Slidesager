import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { History, Eye, Download, Presentation } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Presentation as PresentationType } from "@shared/schema";

interface RecentGenerationsProps {
  onPresentationSelect: (id: string) => void;
}

export default function RecentGenerations({ onPresentationSelect }: RecentGenerationsProps) {
  const { data: presentations = [], isLoading } = useQuery<PresentationType[]>({
    queryKey: ["/api/presentations"],
  });

  if (isLoading) {
    return (
      <Card className="bg-card border border-border" data-testid="card-recent-generations">
        <CardContent className="p-6">
          <div className="flex items-center space-x-2 mb-4">
            <History className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Recent Generations</h2>
          </div>
          <div className="space-y-3">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                  <div className="flex items-center space-x-3">
                    <div className="w-5 h-5 bg-muted-foreground/20 rounded"></div>
                    <div>
                      <div className="w-32 h-4 bg-muted-foreground/20 rounded mb-1"></div>
                      <div className="w-24 h-3 bg-muted-foreground/20 rounded"></div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 bg-muted-foreground/20 rounded"></div>
                    <div className="w-5 h-5 bg-muted-foreground/20 rounded"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border border-border" data-testid="card-recent-generations">
      <CardContent className="p-6">
        <div className="flex items-center space-x-2 mb-4">
          <History className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Recent Generations</h2>
        </div>
        
        <div className="space-y-3">
          {presentations.length === 0 ? (
            <div className="text-center py-8">
              <Presentation className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">
                No presentations generated yet
              </p>
            </div>
          ) : (
            presentations.map((presentation: PresentationType) => (
              <div 
                key={presentation.id}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-md hover:bg-muted/70 transition-colors"
                data-testid={`presentation-item-${presentation.id}`}
              >
                <div 
                  className="flex items-center space-x-3 flex-1 cursor-pointer"
                  onClick={() => onPresentationSelect(presentation.id)}
                >
                  <Presentation className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium" data-testid="text-presentation-title">
                      {presentation.title}
                    </p>
                    <p className="text-xs text-muted-foreground" data-testid="text-presentation-meta">
                      Generated {formatDistanceToNow(new Date(presentation.createdAt))} ago • {presentation.slideCount} slides
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 ml-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-primary transition-colors"
                    title="Preview"
                    onClick={() => onPresentationSelect(presentation.id)}
                    data-testid="button-preview-presentation"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-accent transition-colors"
                    title="View & Download"
                    onClick={() => onPresentationSelect(presentation.id)}
                    data-testid="button-download-presentation"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
          
          {presentations.length > 0 && (
            <Button
              variant="ghost"
              className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
              data-testid="button-view-all"
            >
              View All Generations
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}