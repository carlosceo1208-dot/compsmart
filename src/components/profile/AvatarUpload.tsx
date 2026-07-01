import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface AvatarUploadProps {
  userId: string;
  currentAvatarUrl: string | null;
  userName: string;
  onAvatarChange: (url: string | null) => void;
  isAdmin?: boolean;
}

export function AvatarUpload({
  userId,
  currentAvatarUrl,
  userName,
  onAvatarChange,
  isAdmin = false
}: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

      const file = event.target.files[0];
      
      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        toast.error('Por favor, selecione uma imagem válida');
        return;
      }

      // Validar tamanho (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('A imagem deve ter no máximo 5MB');
        return;
      }

      // Criar nome único para o arquivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;

      // Fazer upload para o bucket
      const { error: uploadError, data } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Gerar URL assinada de longa duração (bucket privado)
      const { data: signedData, error: signedErr } = await supabase.storage
        .from('avatars')
        .createSignedUrl(fileName, 60 * 60 * 24 * 365 * 10);
      if (signedErr || !signedData?.signedUrl) throw signedErr ?? new Error('Falha ao gerar URL');
      const publicUrl = signedData.signedUrl;

      // Atualizar no banco
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', userId);

      if (updateError) throw updateError;

      onAvatarChange(publicUrl);
      toast.success('Foto atualizada com sucesso!');
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast.error('Erro ao fazer upload da foto');
    } finally {
      setUploading(false);
    }
  };

  const removeAvatar = async () => {
    try {
      setDeleting(true);

      if (currentAvatarUrl) {
        // Extrair caminho do arquivo da URL (funciona para signed e public URLs)
        const match = currentAvatarUrl.match(/\/avatars\/(.+?)(?:\?|$)/);
        const filePath = match?.[1];
        
        if (filePath) {
          await supabase.storage
            .from('avatars')
            .remove([filePath]);
        }
      }

      // Atualizar no banco
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', userId);

      if (error) throw error;

      onAvatarChange(null);
      toast.success('Foto removida com sucesso!');
    } catch (error: any) {
      console.error('Error removing avatar:', error);
      toast.error('Erro ao remover foto');
    } finally {
      setDeleting(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="flex items-center gap-6">
      <Avatar className="h-24 w-24">
        {currentAvatarUrl && (
          <AvatarImage src={currentAvatarUrl} alt={userName} />
        )}
        <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
          {getInitials(userName)}
        </AvatarFallback>
      </Avatar>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={uploading || deleting}
            onClick={() => document.getElementById(`avatar-upload-${userId}`)?.click()}
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Alterar Foto
              </>
            )}
          </Button>

          {currentAvatarUrl && (
            <Button
              variant="ghost"
              size="sm"
              disabled={uploading || deleting}
              onClick={removeAvatar}
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Removendo...
                </>
              ) : (
                <>
                  <X className="w-4 h-4 mr-2" />
                  Remover
                </>
              )}
            </Button>
          )}
        </div>

        <input
          id={`avatar-upload-${userId}`}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={uploadAvatar}
          disabled={uploading || deleting}
          className="hidden"
        />

        <p className="text-xs text-muted-foreground">
          JPG, PNG, GIF ou WebP. Máximo 5MB.
        </p>
      </div>
    </div>
  );
}
