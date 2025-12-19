-- Adicionar colunas de coordenadas para geolocalização
ALTER TABLE organizational_structure 
ADD COLUMN IF NOT EXISTS latitude numeric DEFAULT NULL,
ADD COLUMN IF NOT EXISTS longitude numeric DEFAULT NULL;

-- Comentários para documentação
COMMENT ON COLUMN organizational_structure.latitude IS 'Latitude da localização da unidade (geocodificado do endereço)';
COMMENT ON COLUMN organizational_structure.longitude IS 'Longitude da localização da unidade (geocodificado do endereço)';