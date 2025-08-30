import { useState, useRef, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, CloudUpload, FolderOpen, X, FileText } from "lucide-react";

interface TemplateUploadSectionProps {
  onTemplateUpload: (file: File | null) => void;
}

export default function TemplateUploadSection({ onTemplateUpload }: TemplateUploadSectionProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((file: File) => {
    // Validate file type
    const allowedTypes = [
      "application/vnd.openxmlformats-officedocument.presentationml.presentation", // .pptx
      "application/vnd.openxmlformats-officedocument.presentationml.template", // .potx
    ];

    if (!allowedTypes.includes(file.type)) {
      alert("Invalid file type. Only .pptx and .potx files are allowed.");
      return;
    }

    // Validate file size (50MB limit)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      alert("File size too large. Maximum size is 50MB.");
      return;
    }

    setUploadedFile(file);
    onTemplateUpload(file);
  }, [onTemplateUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    onTemplateUpload(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <Card className="bg-card border border-border" data-testid="card-template-upload">
      <CardContent className="p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Upload className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">PowerPoint Template</h2>
        </div>
        
        {!uploadedFile ? (
          <div 
            className={`upload-zone rounded-lg p-8 text-center cursor-pointer transition-all duration-300 ${
              isDragging ? 'drag-over' : ''
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={handleBrowseClick}
            data-testid="upload-zone"
          >
            <div className="mb-4">
              <CloudUpload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground mb-2">
                Drag & drop your PowerPoint template here
              </p>
              <p className="text-xs text-muted-foreground">
                Supports .pptx and .potx files (Max 50MB)
              </p>
            </div>
            <Button 
              variant="secondary" 
              className="bg-secondary text-secondary-foreground hover:bg-secondary/80"
              data-testid="button-browse-files"
            >
              <FolderOpen className="h-4 w-4 mr-2" />
              Browse Files
            </Button>
          </div>
        ) : (
          <div 
            className="mt-4 p-3 bg-muted rounded-md border-l-4 border-l-primary"
            data-testid="file-preview"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-orange-500" />
                <span className="text-sm font-medium" data-testid="text-filename">
                  {uploadedFile.name}
                </span>
                <span className="text-xs text-muted-foreground" data-testid="text-filesize">
                  ({formatFileSize(uploadedFile.size)})
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-destructive transition-colors"
                onClick={handleRemoveFile}
                data-testid="button-remove-file"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept=".pptx,.potx"
          onChange={handleFileInputChange}
          className="hidden"
          data-testid="input-file"
        />
      </CardContent>
    </Card>
  );
}
