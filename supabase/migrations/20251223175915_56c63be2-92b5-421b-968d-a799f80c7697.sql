-- Add reference_points column to salary_ranges
ALTER TABLE salary_ranges ADD COLUMN IF NOT EXISTS reference_points INTEGER;

-- Add Hay evaluation fields to job_titles
ALTER TABLE job_titles ADD COLUMN IF NOT EXISTS hay_knowhow_technical TEXT;
ALTER TABLE job_titles ADD COLUMN IF NOT EXISTS hay_knowhow_managerial TEXT;
ALTER TABLE job_titles ADD COLUMN IF NOT EXISTS hay_knowhow_human_relations TEXT;
ALTER TABLE job_titles ADD COLUMN IF NOT EXISTS hay_problem_environment TEXT;
ALTER TABLE job_titles ADD COLUMN IF NOT EXISTS hay_problem_challenge TEXT;
ALTER TABLE job_titles ADD COLUMN IF NOT EXISTS hay_accountability_freedom TEXT;
ALTER TABLE job_titles ADD COLUMN IF NOT EXISTS hay_accountability_magnitude TEXT;
ALTER TABLE job_titles ADD COLUMN IF NOT EXISTS hay_accountability_impact TEXT;
ALTER TABLE job_titles ADD COLUMN IF NOT EXISTS hay_total_points INTEGER;
ALTER TABLE job_titles ADD COLUMN IF NOT EXISTS hay_profile TEXT;
ALTER TABLE job_titles ADD COLUMN IF NOT EXISTS hay_evaluation_notes TEXT;

-- Add comment for documentation
COMMENT ON COLUMN salary_ranges.reference_points IS 'Pontos de referência Hay para a faixa salarial';
COMMENT ON COLUMN job_titles.hay_knowhow_technical IS 'Know-How Técnico/Profissional (A-H)';
COMMENT ON COLUMN job_titles.hay_knowhow_managerial IS 'Know-How Gerencial (I, II, III, IV)';
COMMENT ON COLUMN job_titles.hay_knowhow_human_relations IS 'Know-How Relações Humanas (1, 2, 3)';
COMMENT ON COLUMN job_titles.hay_problem_environment IS 'Ambiente de Pensamento (A-H)';
COMMENT ON COLUMN job_titles.hay_problem_challenge IS 'Desafio do Pensamento (10%-33%)';
COMMENT ON COLUMN job_titles.hay_accountability_freedom IS 'Liberdade de Ação (A-H)';
COMMENT ON COLUMN job_titles.hay_accountability_magnitude IS 'Magnitude (1-4)';
COMMENT ON COLUMN job_titles.hay_accountability_impact IS 'Impacto (R, C, S, P)';
COMMENT ON COLUMN job_titles.hay_total_points IS 'Total de Pontos Hay calculados';
COMMENT ON COLUMN job_titles.hay_profile IS 'Perfil do cargo (A, C, P)';
COMMENT ON COLUMN job_titles.hay_evaluation_notes IS 'Justificativa da avaliação Hay';