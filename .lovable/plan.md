# Plano: Conhecimento de "Plano Sustentável NR-1" no Agente Bem-Estar

## Objetivo
Expandir o `SYSTEM_PROMPT` do agente `nr1-bem-estar-agent` com uma nova seção metodológica detalhada sobre **como elaborar um Plano Sustentável de NR-1** — cobrindo o ciclo completo (governança → diagnóstico → priorização → ações → monitoramento → melhoria contínua), para que o agente entregue planos consistentes, defensáveis em fiscalização e sustentáveis no tempo.

## Arquivo afetado
- `supabase/functions/nr1-bem-estar-agent/index.ts` — apenas edição da constante `SYSTEM_PROMPT` (entre as seções atuais "INSTRUMENTOS" e "PROTOCOLO DE RISCO CRÍTICO").

Nenhuma outra mudança: sem alterações de UI, rotas, banco, RLS ou dependências.

## Conteúdo a adicionar (nova seção do prompt)

**## METODOLOGIA: PLANO SUSTENTÁVEL DE NR-1 (ciclo PDCA + ISO 45003)**

Estrutura em 8 etapas que o agente deve seguir/recomendar sempre que o usuário pedir "plano NR-1", "como começar", "plano de ação sustentável", "implantação NR-1":

1. **Governança e patrocínio** — comitê multidisciplinar (RH, SESMT, jurídico, liderança executiva, representação dos trabalhadores/CIPA), política formal aprovada pela alta direção, orçamento dedicado, responsáveis nomeados (RACI), cadência de reuniões.
2. **Mapeamento de contexto (baseline)** — inventário de processos, jornadas, modalidades (presencial/híbrido/home office), turnos, populações vulneráveis, histórico de afastamentos CID-F (eSocial S-2220/S-2240), absenteísmo, turnover, reclamações no canal de ética, indicadores de clima.
3. **Diagnóstico psicossocial** — Quick Screening (DASS-21 subset) + COPSOQ-III-BR completo, garantindo anonimato (mín. 5 respondentes por recorte), consentimento LGPD, comunicação prévia, meta de adesão ≥ 60%.
4. **Análise e priorização (matriz risco × esforço)** — cruzar as 6 dimensões COPSOQ × 13 fatores NR-1, classificar risco (baixo/moderado/alto/crítico), ranquear por gravidade × nº de expostos × esforço/custo de mitigação; usar critério ISO 45003 (eliminar > substituir > controles administrativos > EPI psicossocial).
5. **Desenho do plano de ação** — para cada risco prioritário entregar: **objetivo SMART → ação (com base científica) → responsável → prazo → recurso → indicador de sucesso → evidência documental**. Combinar ações de 3 níveis (Cox & Griffiths):
   - **Primárias** (eliminar a fonte: redesenho de carga, jornada, liderança, metas)
   - **Secundárias** (capacitar pessoas: treinamento de líderes, mindfulness, comunicação não-violenta)
   - **Terciárias** (tratar quem já adoeceu: EAP, retorno ao trabalho, reabilitação)
6. **Implementação e comunicação** — cronograma realista (quick wins em 30/60/90 dias + ações estruturais em 6–18 meses), comunicação transparente dos resultados agregados, treinamento obrigatório de líderes (item 1.5.3.2 da NR-1), integração com onboarding e PDI.
7. **Monitoramento contínuo (KPIs sustentáveis)** — pulse checks trimestrais, rediagnóstico COPSOQ anual, indicadores: índice de risco psicossocial, eNPS, absenteísmo CID-F, turnover voluntário, taxa de adesão a EAP, nº de afastamentos > 15 dias, ROI (custo evitado de turnover/afastamento × investimento).
8. **Revisão crítica e melhoria contínua (PDCA)** — análise crítica pela alta direção a cada 12 meses, atualização da matriz de riscos, lições aprendidas, ajuste de metas, documentação completa para fiscalização (atas, evidências de treinamento, planos, indicadores, ações tomadas).

**Princípios de sustentabilidade** (sempre reforçar):
- Não é projeto pontual: é **sistema de gestão contínuo**, integrado ao SGSST.
- Liderança como variável crítica — sem líder treinado, plano não sobrevive.
- Dados conectados (psicossocial + performance + remuneração) para evitar decisões isoladas.
- Transparência radical com agregados; sigilo absoluto com individuais.
- Cultura > campanha: ações estruturais (carga, autonomia, reconhecimento) > ações cosméticas (yoga na sexta).

**Bases científicas/normativas a citar:** NR-1 itens 1.5.3 e 1.5.4, ISO 45003:2021, OIT Guidelines on Mental Health at Work (2022), HSE Management Standards, modelo JD-R (Demerouti & Bakker), Cox & Griffiths (primária/secundária/terciária), LaMontagne et al. (integrated approach), Karasek (demand-control), Edmondson (segurança psicológica).

## Detalhes técnicos
- Edição localizada na string `SYSTEM_PROMPT` (linhas ~10–59) — inserir nova seção `## METODOLOGIA: PLANO SUSTENTÁVEL DE NR-1` após a seção "INSTRUMENTOS — USO CORRETO" e antes de "PROTOCOLO DE RISCO CRÍTICO".
- Deploy automático do edge function após salvar.
- Não requer migração, secret, ou mudança de tipos.

## Critério de aceite
Ao perguntar ao agente "Como elaboro um plano sustentável de NR-1 para minha empresa?", a resposta deve enumerar as 8 etapas, com objetivo/ações/indicadores, citar NR-1 + ISO 45003 + Cox & Griffiths, e reforçar os princípios de sustentabilidade.
