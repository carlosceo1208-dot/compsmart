
-- Harden helper function
CREATE OR REPLACE FUNCTION public.nr1_calc_risco(score numeric)
RETURNS public.nr1_nivel_risco
LANGUAGE sql IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN score IS NULL THEN NULL
    WHEN score <= 25 THEN 'baixo'::public.nr1_nivel_risco
    WHEN score <= 50 THEN 'moderado'::public.nr1_nivel_risco
    WHEN score <= 75 THEN 'alto'::public.nr1_nivel_risco
    ELSE 'critico'::public.nr1_nivel_risco
  END;
$$;

-- Seed question bank (idempotent via UNIQUE codigo)
INSERT INTO public.nr1_questoes (codigo, dimensao, enunciado, peso, ordem, is_free_diagnostic, reverso) VALUES
-- Demandas no trabalho (1-8)
('DT01','demandas_trabalho','Sou exigido(a) a trabalhar muito rapidamente.',1.0,1,true,false),
('DT02','demandas_trabalho','Tenho muito trabalho para realizar no tempo disponível.',1.0,2,true,false),
('DT03','demandas_trabalho','Meu trabalho exige esforço emocional intenso.',1.0,3,false,false),
('DT04','demandas_trabalho','Preciso esconder meus sentimentos no trabalho.',1.0,4,false,false),
('DT05','demandas_trabalho','Tenho que tomar decisões difíceis com frequência.',0.8,5,false,false),
('DT06','demandas_trabalho','Recebo demandas contraditórias de pessoas diferentes.',1.0,6,false,false),
('DT07','demandas_trabalho','Levo trabalho para casa nos fins de semana.',1.0,7,false,false),
('DT08','demandas_trabalho','Meu ritmo de trabalho é insustentável.',1.2,8,true,false),

-- Organização e conteúdo (9-15)
('OC01','organizacao_conteudo','Tenho autonomia para organizar minhas tarefas.',1.0,9,true,true),
('OC02','organizacao_conteudo','Meu trabalho tem sentido e propósito para mim.',1.0,10,true,true),
('OC03','organizacao_conteudo','Posso usar minhas habilidades plenamente no trabalho.',1.0,11,false,true),
('OC04','organizacao_conteudo','Sei o que se espera de mim no trabalho.',1.0,12,false,true),
('OC05','organizacao_conteudo','Recebo informações claras sobre minhas responsabilidades.',0.8,13,false,true),
('OC06','organizacao_conteudo','Tenho oportunidade de aprender coisas novas.',1.0,14,false,true),
('OC07','organizacao_conteudo','Meu trabalho é repetitivo e monótono.',0.8,15,false,false),

-- Relações sociais e liderança (16-22)
('RL01','relacoes_lideranca','Recebo apoio do meu líder direto quando preciso.',1.2,16,true,true),
('RL02','relacoes_lideranca','Meu líder fornece feedback construtivo regularmente.',1.0,17,false,true),
('RL03','relacoes_lideranca','As decisões da liderança são justas e transparentes.',1.0,18,false,true),
('RL04','relacoes_lideranca','Posso contar com colegas de trabalho.',1.0,19,true,true),
('RL05','relacoes_lideranca','Sou tratado(a) com respeito no ambiente de trabalho.',1.2,20,false,true),
('RL06','relacoes_lideranca','Já presenciei ou sofri assédio moral no trabalho.',1.5,21,false,false),
('RL07','relacoes_lideranca','Conflitos no trabalho são resolvidos de forma adequada.',1.0,22,false,true),

-- Interface trabalho-indivíduo (23-29)
('IT01','interface_trabalho_individuo','Sinto insegurança quanto à manutenção do meu emprego.',1.2,23,false,false),
('IT02','interface_trabalho_individuo','Há equilíbrio entre minha vida pessoal e profissional.',1.0,24,true,true),
('IT03','interface_trabalho_individuo','O trabalho prejudica meu tempo com família/amigos.',1.0,25,false,false),
('IT04','interface_trabalho_individuo','Tenho clareza sobre meu plano de carreira.',0.8,26,false,true),
('IT05','interface_trabalho_individuo','Preocupações do trabalho me atrapalham fora do expediente.',1.0,27,false,false),
('IT06','interface_trabalho_individuo','Preciso ficar conectado(a) ao trabalho fora do horário.',0.8,28,false,false),
('IT07','interface_trabalho_individuo','Sinto que poderia ser substituído(a) facilmente.',0.8,29,false,false),

-- Valores no trabalho (30-34)
('VT01','valores_trabalho','Confio nas informações que recebo da liderança.',1.0,30,false,true),
('VT02','valores_trabalho','A empresa cumpre o que promete aos colaboradores.',1.0,31,false,true),
('VT03','valores_trabalho','Os processos de promoção/aumento são justos.',1.2,32,true,true),
('VT04','valores_trabalho','A empresa valoriza a diversidade e inclusão.',0.8,33,false,true),
('VT05','valores_trabalho','Tenho orgulho de trabalhar na minha empresa.',1.0,34,false,true),

-- Saúde e bem-estar (35-40)
('SB01','saude_bem_estar','Tenho me sentido esgotado(a) emocionalmente.',1.5,35,true,false),
('SB02','saude_bem_estar','Tenho dificuldade para dormir por causa do trabalho.',1.2,36,false,false),
('SB03','saude_bem_estar','Sinto sintomas físicos de estresse (dores, tensão).',1.2,37,false,false),
('SB04','saude_bem_estar','Considero seriamente pedir demissão.',1.5,38,true,false),
('SB05','saude_bem_estar','Tenho sintomas de ansiedade relacionados ao trabalho.',1.5,39,false,false),
('SB06','saude_bem_estar','Sinto-se motivado(a) ao iniciar a semana de trabalho.',1.0,40,false,true)
ON CONFLICT (codigo) DO NOTHING;
