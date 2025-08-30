import { useState } from "react";
import TextInputSection from "@/components/TextInputSection";
import LLMConfigSection from "@/components/LLMConfigSection";
import TemplateUploadSection from "@/components/TemplateUploadSection";
import PreviewSection from "@/components/PreviewSection";
import DownloadControls from "@/components/DownloadControls";
import RecentGenerations from "@/components/RecentGenerations";
import ThemeToggle from "@/components/ThemeToggle";
import { Github, HelpCircle } from "lucide-react";
import { LLMProvider, Model, SlideCountOption } from "@shared/schema";

export default function Home() {
  const [currentPresentationId, setCurrentPresentationId] = useState<string | null>(null);
  const [contentData, setContentData] = useState<{ content: string; guidance?: string }>({
    content: "",
    guidance: ""
  });
  const [llmConfig, setLlmConfig] = useState<{
    provider: LLMProvider;
    model: Model;
    apiKey: string;
    slideCountOption: SlideCountOption;
  } | null>(null);
  const [templateFile, setTemplateFile] = useState<File | null>(null);

  const handleContentChange = (content: string, guidance?: string) => {
    setContentData({ content, guidance });
    setCurrentPresentationId(null);
  };

  const handleConfigChange = (config: { provider: LLMProvider; model: Model; apiKey: string; slideCountOption: SlideCountOption }) => {
    setLlmConfig(config);
  };

  const handleTemplateUpload = (file: File | null) => {
    setTemplateFile(file);
  };

  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50 backdrop-blur-lg bg-opacity-80">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm0 2h12v10H4V5z"/>
                </svg>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Slidesager
              </h1>
              <span className="text-xs bg-accent/20 text-accent px-2 py-1 rounded-full">Beta</span>
            </div>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <button 
                className="text-muted-foreground hover:text-foreground transition-colors"
                data-testid="button-github"
              >
                <Github className="w-5 h-5" />
              </button>
              <button 
                className="text-muted-foreground hover:text-foreground transition-colors"
                data-testid="button-help"
              >
                <HelpCircle className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-12 gap-8">
          {/* Left Panel - Input Controls */}
          <div className="lg:col-span-5 space-y-6">
            <TextInputSection onContentChange={handleContentChange} />
            <LLMConfigSection onConfigChange={handleConfigChange} />
            <TemplateUploadSection onTemplateUpload={handleTemplateUpload} />
          </div>

          {/* Right Panel - Preview and Controls */}
          <div className="lg:col-span-7 space-y-6">
            <PreviewSection 
              presentationId={currentPresentationId}
              onPresentationGenerated={setCurrentPresentationId}
              contentData={contentData}
              llmConfig={llmConfig}
              templateFile={templateFile}
            />
            
            {currentPresentationId && (
              <DownloadControls presentationId={currentPresentationId} />
            )}
            <RecentGenerations onPresentationSelect={setCurrentPresentationId} />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-card border-t border-border mt-16">
        <div className="container mx-auto px-6 py-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-6 h-6 bg-primary rounded-md flex items-center justify-center">
                  <svg className="w-3 h-3 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm0 2h12v10H4V5z"/>
                  </svg>
                </div>
                <span className="font-semibold">Slidesager</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Transform your text into beautiful presentations with AI-powered automation.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium mb-3">Features</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>AI Text Analysis</li>
                <li>Template Extraction</li>
                <li>Marp Integration</li>
                <li>Multi-format Export</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-3">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">API Reference</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Examples</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">GitHub</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-3">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border mt-8 pt-6 flex flex-col md:flex-row items-center justify-between">
            <p className="text-sm text-muted-foreground">
              © 2024 Slidesager. All rights reserved.
            </p>
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/>
                </svg>
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <Github className="w-5 h-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419-.0188 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9554 2.4189-2.1568 2.4189Z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}