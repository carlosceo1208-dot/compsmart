# Fase 3 — Triagem com Agente Talent (Recrutamento & Seleção)

## Decisões já tomadas
- **Passo 0 (limpeza) não será feito**: a sua candidatura de teste fica no sistema como base para os testes, conforme sua última mensagem. Os 2 candidatos fictícios da validação serão criados e apagados ao final; a sua candidatura fica.
- A etapa fica **por candidatura** (candidato + vaga), não no candidato: a mesma pessoa pode estar em Triagem numa vaga e em Proposta em outra. O kanban é filtrado por vaga.
- O módulo continua bloqueado pelo código já existente do módulo (`talent`), não por um novo nome.
- **Nada é renomeado nem apagado**: só entram campos novos (vazios nos registros antigos) e a etapa "Arquivado" como opção extra. A sua candidatura (origem Portal, etapa Triagem) continua igual, sem migrar dados. Se for preciso renomear algo, aviso antes.

## O que o RH vai ter
1. **Aba "Triagem"** em Candidatos (ao lado da lista atual), com seletor de vaga e colunas: Triagem, Entrevista RH, Entrevista Gestor, Proposta, Contratado e Arquivado (cada uma com contador).
2. **Card do candidato**: nome, origem, nota de match (se houver), dias na etapa e "Ver currículo" (mesma abertura interna já no ar).
3. **Mover candidatos**: arrastar entre colunas (com motivo opcional) e botões "Avançar", "Agendar entrevista" (data sugerida, editável) e "Arquivar" (motivo obrigatório). No celular, colunas com rolagem lateral; os botões funcionam sem arrastar.
4. **Detalhe do candidato** (painel lateral) com abas "Análise" e "Histórico".
5. **"Analisar currículo"** (admin e gestor de RH da empresa): o agente Talent lê o PDF, retira dados pessoais, compara com a vaga e devolve nota 0–100, pontos fortes, lacunas, recomendação e justificativa. Um botão aplica a recomendação — o agente **nunca** move sozinho.
   - Estados: sem análise, analisando, concluída, falha com "Tentar novamente".
   - PDF escaneado/imagem: aviso "Não foi possível ler o PDF"; a triagem manual segue normal.
   - Créditos de IA esgotados / muitos pedidos: mensagem clara.
6. **Histórico**: cada movimento, arquivamento, **agendamento de entrevista** (com a data marcada) ou recomendação aplicada registra etapa anterior, nova, motivo, origem (agente/manual), responsável e data.
7. **Resposta do agente conferida**: se o modelo devolver algo fora do formato, nota fora de 0–100 ou recomendação diferente de Avançar/Agendar/Arquivar, nada é salvo nem movido; aparece aviso amigável com "Tentar novamente".

## Cores
Triagem azul #2563EB, Entrevistas teal #0D9488, Proposta/Contratado verde #16A34A, Arquivado cinza; nota ≥80 verde, 60–79 azul, <60 âmbar. Tokens atuais, cards arredondados, badges pílula.

## Detalhes técnicos
- **Migração**:
  - `candidaturas`: adicionar etapa `arquivado` aos valores aceitos, `etapa_desde timestamptz`, `motivo_arquivamento`, `entrevista_em timestamptz`, `analise_talent jsonb`, `analise_em timestamptz`.
  - Nova `candidato_historico` (candidatura_id, candidato_id, root_company_id, etapa_anterior, etapa_nova, motivo, origem check agente/manual, criado_por, criado_em). GRANT authenticated/service_role; RLS: leitura e inserção só da própria empresa com `has_module('talent')` e papel admin/hr_manager; sem edição/exclusão.
  - RPC `talent_mover_candidatura(_id, _etapa, _motivo, _origem, _entrevista_em)` security definer: valida tenant/papel, exige motivo ao arquivar, atualiza etapa e grava histórico na mesma transação.
- **Edge function `agent-talent`**: nova ação `analisar` (mantém a geração de perfil). Valida JWT, módulo e que a candidatura é da empresa; baixa o PDF com service role; extrai texto (`unpdf`); remove nome do candidato, e-mail, telefone, CPF, CEP/endereço e links (LinkedIn/URLs) antes de chamar o modelo; envia só texto anônimo + dados públicos da vaga; `openai/gpt-6-astra` em streaming com saída estruturada; grava apenas o JSON da análise. Logs registram só tamanhos e contagem de substituições, nunca o texto.
- Arrastar com HTML5 nativo + `aria-label` nas colunas/cards; sem biblioteca nova.
- Front: `TriagemKanban.tsx`, `CandidaturaCard.tsx`, `CandidatoDrawer.tsx` e hook `useTriagem.ts` filtrando por `activeCompanyId`.
- Atualizar `roadmap.md` e `AGENTS.md`.

## Validação (check de aceite)
- `bun run ci` passando (lint, tipos, testes, código não usado, build).
- Kanban em 1280px e 390px sem cortes; arrastar, botões e painel lateral funcionando no celular.
- Dois fictícios (um compatível, um não) com PDFs de texto: notas diferentes e coerentes com os currículos.
- Aplicar recomendação grava histórico com origem "agente"; movimento manual com origem "manual".
- Arquivar exige motivo; agendar grava a data da entrevista e aparece no histórico.
- Resposta do modelo fora do formato/enum/faixa (simulada no teste): aviso + "Tentar novamente", sem mover nem quebrar o painel.
- PDF só-imagem: aviso "Não foi possível ler o PDF" e triagem manual segue.
- Logs da função sem nenhum dado pessoal (só tamanhos e contagem de substituições).
- Usuário de outra empresa não vê candidaturas, histórico nem currículos.
- Sua candidatura da Fase 2 continua legível (Portal, Triagem) após a migração.
- Fictícios apagados; sua candidatura mantida; `roadmap.md` e `AGENTS.md` atualizados.

## Detalhe técnico extra
- Contrato de saída: schema estrito (`match_score` integer 0–100, `recomendacao` enum) + validação Zod no servidor após `JSON.parse`; falha retorna 502 com mensagem segura e não grava nada.
