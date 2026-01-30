-- Adicionar coluna rank à tabela performance_succession
ALTER TABLE performance_succession 
ADD COLUMN rank INTEGER DEFAULT 1;

-- Adicionar constraint de validação
ALTER TABLE performance_succession 
ADD CONSTRAINT chk_succession_rank CHECK (rank >= 1 AND rank <= 3);

-- Índice único para evitar duplicação de rank por posição
CREATE UNIQUE INDEX idx_succession_position_rank 
ON performance_succession (key_position_id, rank) 
WHERE rank IS NOT NULL;

-- Comentário para documentação
COMMENT ON COLUMN performance_succession.rank IS 'Ranking do sucessor (1=primeiro, 2=segundo, 3=terceiro)';