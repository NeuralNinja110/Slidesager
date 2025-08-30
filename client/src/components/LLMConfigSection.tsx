import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bot, Eye, EyeOff, Shield } from "lucide-react";
import { LLMProvider, Model, models, SlideCountOption, slideCountOptions } from "@shared/schema";

interface LLMConfigSectionProps {
  onConfigChange: (config: { provider: LLMProvider; model: Model; apiKey: string; slideCountOption: SlideCountOption }) => void;
}

export default function LLMConfigSection({ onConfigChange }: LLMConfigSectionProps) {
  const [provider, setProvider] = useState<LLMProvider>("openai");
  const [model, setModel] = useState<Model>("gpt-5");
  const [apiKey, setApiKey] = useState("");
  const [slideCountOption, setSlideCountOption] = useState<SlideCountOption>("automatic");
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    onConfigChange({ provider, model, apiKey, slideCountOption });
  }, [provider, model, apiKey, slideCountOption, onConfigChange]);

  const handleProviderChange = (newProvider: LLMProvider) => {
    setProvider(newProvider);
    // Set default model for the provider
    const availableModels = models[newProvider];
    setModel(availableModels[0]);
  };

  return (
    <Card className="bg-card border border-border" data-testid="card-llm-config">
      <CardContent className="p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Bot className="h-5 w-5 text-accent" />
          <h2 className="text-lg font-semibold">AI Configuration</h2>
        </div>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="provider-select" className="block text-sm font-medium mb-2">
              LLM Provider
            </Label>
            <Select value={provider} onValueChange={handleProviderChange}>
              <SelectTrigger 
                id="provider-select"
                className="w-full bg-input border border-border"
                data-testid="select-provider"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="openai">OpenAI</SelectItem>
                <SelectItem value="anthropic">Anthropic (Claude)</SelectItem>
                <SelectItem value="gemini">Google (Gemini)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="model-select" className="block text-sm font-medium mb-2">
              Model
            </Label>
            <Select value={model} onValueChange={(value) => setModel(value as Model)}>
              <SelectTrigger 
                id="model-select"
                className="w-full bg-input border border-border"
                data-testid="select-model"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {models[provider].map((modelOption) => (
                  <SelectItem key={modelOption} value={modelOption}>
                    {modelOption}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="slide-count-select" className="block text-sm font-medium mb-2">
              Number of Slides
            </Label>
            <Select value={slideCountOption} onValueChange={(value) => setSlideCountOption(value as SlideCountOption)}>
              <SelectTrigger 
                id="slide-count-select"
                className="w-full bg-input border border-border"
                data-testid="select-slide-count"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {slideCountOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="relative">
            <Label htmlFor="api-key-input" className="block text-sm font-medium mb-2">
              API Key
            </Label>
            <div className="relative">
              <Input 
                id="api-key-input"
                type={showApiKey ? "text" : "password"}
                className="w-full bg-input border border-border rounded-md px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-ring font-mono"
                placeholder="sk-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                data-testid="input-api-key"
              />
              <button 
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setShowApiKey(!showApiKey)}
                data-testid="button-toggle-api-key"
              >
                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center">
              <Shield className="h-3 w-3 text-green-500 mr-1" />
              Your API key is never stored or logged
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
