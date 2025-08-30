import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Edit } from "lucide-react";

interface TextInputSectionProps {
  onContentChange: (content: string, guidance?: string) => void;
  initialContent?: string;
  initialGuidance?: string;
}

export default function TextInputSection({ onContentChange, initialContent = "", initialGuidance = "" }: TextInputSectionProps) {
  const [content, setContent] = useState(initialContent);
  const [guidance, setGuidance] = useState(initialGuidance);
  const [contentFocused, setContentFocused] = useState(false);
  const [guidanceFocused, setGuidanceFocused] = useState(false);

  const contentRef = useRef<HTMLTextAreaElement>(null);
  const guidanceRef = useRef<HTMLInputElement>(null);

  // Update local state when initial values change
  useEffect(() => {
    setContent(initialContent);
    setGuidance(initialGuidance);
  }, [initialContent, initialGuidance]);

  useEffect(() => {
    // Direct call without debouncing for immediate UI updates
    onContentChange(content, guidance);
  }, [content, guidance, onContentChange]);

  return (
    <Card className="bg-card border border-border" data-testid="card-text-input">
      <CardContent className="p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Edit className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Content Input</h2>
        </div>
        
        <div className="space-y-4">
          <div className="relative">
            <label 
              className={`floating-label absolute left-3 top-3 text-muted-foreground pointer-events-none transition-all duration-200 ${
                contentFocused || content ? 'active' : ''
              }`}
              htmlFor="content-input"
            >
              Paste your text, markdown, or prose here...
            </label>
            <Textarea 
              id="content-input"
              ref={contentRef}
              className="w-full h-48 bg-input border border-border rounded-md px-3 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring transition-all pt-8"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onFocus={() => setContentFocused(true)}
              onBlur={() => setContentFocused(false)}
              data-testid="textarea-content"
            />
          </div>
          
          <div className="relative">
            <label 
              className={`floating-label absolute left-3 top-3 text-muted-foreground pointer-events-none transition-all duration-200 ${
                guidanceFocused || guidance ? 'active' : ''
              }`}
              htmlFor="guidance-input"
            >
              Guidance (Optional)
            </label>
            <Input 
              id="guidance-input"
              ref={guidanceRef}
              className="w-full bg-input border border-border rounded-md px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all pt-8"
              value={guidance}
              onChange={(e) => setGuidance(e.target.value)}
              onFocus={() => setGuidanceFocused(true)}
              onBlur={() => setGuidanceFocused(false)}
              placeholder="e.g., 'turn into an investor pitch deck'"
              data-testid="input-guidance"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
