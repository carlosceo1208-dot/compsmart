import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, X, FileText, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

interface DocumentUploadProps {
  onFileSelect: (file: File, text: string) => void;
  onFileRemove: () => void;
  uploadedFile: File | null;
  isProcessing: boolean;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
];

export const DocumentUpload = ({
  onFileSelect,
  onFileRemove,
  uploadedFile,
  isProcessing,
}: DocumentUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): boolean => {
    if (file.size > MAX_FILE_SIZE) {
      toast.error('Arquivo muito grande', {
        description: 'O tamanho máximo permitido é 10MB.',
      });
      return false;
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Tipo de arquivo não suportado', {
        description: 'Tipos permitidos: PDF, DOC, DOCX, TXT',
      });
      return false;
    }

    return true;
  };

  const readFileContent = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const text = reader.result as string;
        resolve(text);
      };
      reader.onerror = reject;

      if (file.type === 'text/plain') {
        reader.readAsText(file);
      } else {
        // For PDF/DOC/DOCX, we'll just use filename as content
        // In production, you'd want a proper document parser
        resolve(`[Documento anexado: ${file.name}]\n\nPor favor, analise este documento.`);
      }
    });
  };

  const handleFileChange = async (file: File) => {
    if (!validateFile(file)) return;

    try {
      const text = await readFileContent(file);
      onFileSelect(file, text);
      toast.success('Arquivo carregado', {
        description: `${file.name} está pronto para análise.`,
      });
    } catch (error) {
      console.error('Error reading file:', error);
      toast.error('Erro ao ler arquivo', {
        description: 'Não foi possível processar o arquivo.',
      });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileChange(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (uploadedFile) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">{uploadedFile.name}</p>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(uploadedFile.size)}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onFileRemove}
            disabled={isProcessing}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card
        className={`border-2 border-dashed transition-colors ${
          isDragging ? 'border-primary bg-primary/5' : 'border-border'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className="p-6 text-center">
          <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm font-medium mb-1">Arraste um arquivo aqui</p>
          <p className="text-xs text-muted-foreground mb-3">
            ou clique no botão abaixo
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
          >
            Selecionar Arquivo
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.doc,.docx,.txt"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileChange(file);
            }}
          />
        </div>
      </Card>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="text-xs">
          Tipos permitidos: PDF, DOC, DOCX, TXT • Tamanho máximo: 10MB
        </AlertDescription>
      </Alert>
    </>
  );
};