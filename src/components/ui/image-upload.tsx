import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  value: string | null;
  onChange: (url: string | null) => void;
  bucket: string;
  maxSizeMB?: number;
  acceptedTypes?: string[];
  previewClassName?: string;
  label?: string;
  description?: string;
}

export const ImageUpload = ({
  value,
  onChange,
  bucket,
  maxSizeMB = 2,
  acceptedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/svg+xml"],
  previewClassName,
  label = "Clique para selecionar ou arraste a imagem",
  description = "PNG, JPG, WEBP ou SVG até 2MB",
}: ImageUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [preview, setPreview] = useState<string | null>(value);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateImage = async (file: File): Promise<boolean> => {
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`Imagem muito grande. Máximo: ${maxSizeMB}MB`);
      return false;
    }

    if (!acceptedTypes.includes(file.type)) {
      toast.error("Formato inválido. Use PNG, JPG, WEBP ou SVG");
      return false;
    }

    return true;
  };

  const generateFileName = (originalName: string): string => {
    const timestamp = Date.now();
    const randomId = crypto.randomUUID();
    const extension = originalName.split(".").pop();
    return `${timestamp}_${randomId}.${extension}`;
  };

  const handleFileSelect = async (file: File) => {
    const isValid = await validateImage(file);
    if (!isValid) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const fileName = generateFileName(file.name);
      const filePath = fileName;

      setUploadProgress(30);

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      setUploadProgress(70);

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      setUploadProgress(100);
      setPreview(publicUrl);
      onChange(publicUrl);

      toast.success("✨ Imagem enviada com sucesso!");
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error("Erro ao enviar imagem: " + error.message);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleRemove = async () => {
    if (!value) return;

    try {
      const fileName = value.split("/").pop();
      if (fileName) {
        await supabase.storage.from(bucket).remove([fileName]);
      }
      setPreview(null);
      onChange(null);
      toast.success("Imagem removida");
    } catch (error: any) {
      console.error("Remove error:", error);
      toast.error("Erro ao remover imagem");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="space-y-2">
      {preview ? (
        <div className="relative group">
          <img
            src={preview}
            alt="Preview"
            className={cn(
              "w-full h-48 object-contain bg-muted rounded-lg border",
              previewClassName
            )}
          />
          {isUploading && (
            <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center rounded-lg">
              <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
              <p className="text-sm font-medium">{uploadProgress}%</p>
            </div>
          )}
          {!isUploading && (
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handleRemove}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 cursor-pointer hover:border-primary/50 hover:bg-accent/5 transition-colors"
        >
          <div className="flex flex-col items-center gap-4">
            {isUploading ? (
              <>
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
                <Progress value={uploadProgress} className="w-full max-w-xs" />
                <p className="text-sm text-muted-foreground">{uploadProgress}%</p>
              </>
            ) : (
              <>
                <div className="p-4 bg-primary/10 rounded-full">
                  <Upload className="w-8 h-8 text-primary" />
                </div>
                <div className="text-center">
                  <p className="font-medium">{label}</p>
                  <p className="text-sm text-muted-foreground mt-1">{description}</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes.join(",")}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileSelect(file);
        }}
        className="hidden"
      />
    </div>
  );
};