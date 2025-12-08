-- Criar bucket de vídeos para vídeo institucional
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('videos', 'videos', true, 104857600);

-- Política de leitura pública para vídeos
CREATE POLICY "Videos são públicos para visualização"
ON storage.objects FOR SELECT
USING (bucket_id = 'videos');

-- Política de upload para usuários autenticados
CREATE POLICY "Upload de vídeos para autenticados"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'videos' AND auth.role() = 'authenticated');

-- Política de delete para admins
CREATE POLICY "Delete de vídeos para admins"
ON storage.objects FOR DELETE
USING (bucket_id = 'videos' AND auth.role() = 'authenticated');