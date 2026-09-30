# AGENTS.md — Recrutamento & Seleção (Talent)
- Vagas em `vagas` com root_company_id; cargo novo do CBO só via RPC talent_link_or_create_job_title. Why: dedupe no servidor.
- Candidatura pública só via portal-candidatura: empresa vem da vaga, PDF validado (%PDF, 5 MB), aceite LGPD grava data/versão/IP/navegador. Why: anônimo não decide empresa.
- Currículo em curriculos/{empresa}/{candidato}.pdf (reenvio sobrescreve); só abre via curriculo-download (blob). Why: um currículo vigente; extensões bloqueiam o storage.
- Empresa mascarada no servidor (portal_listar_vagas/portal_vaga); logo/"Sobre" só se vaga pública e exibir_nome_empresa; logos-vagas privado. Why: nunca revelar empresa oculta.
- Etapa só muda via RPC talent_mover_candidatura (histórico + etapa_desde + entrevista_em juntos; mesma etapa recusada). Why: auditoria sem buracos.
- agent-talent: ao modelo só dados anonimizados (nome/e-mail/telefone/CPF/CEP/endereço/links); `analisar` extrai PDF no servidor, valida com Zod, só grava analise_talent; logs só tamanhos. Why: LGPD; agente nunca move etapa.
- Cliente usa só useFilaAnalise (máx. 2 em voo; 402/429 pausa sem reenvio). Why: custo e 429.
- Cidades de vagas do IBGE (cache localStorage). Faixa sugerida só via RPC talent_sugerir_faixa (RH/admin da empresa; retorna só {min,max,fonte} com fonte genérica; recusa = erro 42501). Sem Insight usa também a base global da CompSmart — intencional. Why: exposição controlada sem liberar a base.
