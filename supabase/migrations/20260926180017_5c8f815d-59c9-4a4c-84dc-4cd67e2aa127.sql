ALTER TABLE public.vagas ADD COLUMN IF NOT EXISTS observacao text;
ALTER TABLE public.vagas DROP CONSTRAINT IF EXISTS vagas_observacao_len;
ALTER TABLE public.vagas ADD CONSTRAINT vagas_observacao_len CHECK (observacao IS NULL OR char_length(observacao) <= 2000);
ALTER TABLE public.vagas DROP CONSTRAINT IF EXISTS vagas_senioridade_check;
ALTER TABLE public.vagas ADD CONSTRAINT vagas_senioridade_check CHECK (senioridade IN ('junior','pleno','senior','especialista','profissional','consultor'));