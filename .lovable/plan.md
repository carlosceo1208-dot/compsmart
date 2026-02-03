
# Plano: Implementar Avaliacao 360 com Feedback Externo

## Contexto e Problema Identificado

O modulo de Avaliacao de Desempenho atual nao possui funcionalidade de **Avaliacao 360 completa** com coleta de feedback de **pessoas externas a empresa** (clientes e fornecedores). O sistema ja tem o enum `performance_evaluation_angle` com valores "90", "180" e "360", porem nao esta sendo utilizado no fluxo.

A Avaliacao 360 tradicional inclui apenas avaliadores internos (gestor, pares, subordinados). Para uma visao realmente holistica, e necessario capturar a perspectiva de stakeholders externos que interagem com o colaborador.

---

## Solucao Proposta

### Visao Geral do Fluxo

```text
+-------------------+     +------------------+     +-------------------+
|  Gestor/RH cria   | --> | E-mail enviado   | --> | Pessoa externa    |
|  solicitacao de   |     | com link unico   |     | responde          |
|  feedback 360     |     | + explicacao     |     | formulario        |
+-------------------+     +------------------+     +-------------------+
                                                           |
                                                           v
                          +------------------+     +-------------------+
                          | Gestor visualiza | <-- | Resposta salva    |
                          | e consolida      |     | no sistema        |
                          +------------------+     +-------------------+
```

---

## Fase 1: Estrutura de Banco de Dados

### 1.1 Nova Tabela: `external_feedback_requests`

Armazena as solicitacoes de feedback enviadas para pessoas externas.

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | UUID | Identificador unico |
| root_company_id | UUID | Empresa |
| cycle_id | UUID | Ciclo de avaliacao |
| employee_id | UUID | Colaborador sendo avaliado |
| requested_by | UUID | Gestor que solicitou |
| external_name | TEXT | Nome do avaliador externo |
| external_email | TEXT | E-mail do avaliador externo |
| external_type | ENUM | "customer" ou "supplier" |
| token | UUID | Token unico para acesso ao formulario |
| deadline | TIMESTAMPTZ | Prazo para resposta |
| status | ENUM | "pending", "sent", "completed", "expired" |
| template_questions | JSONB | Perguntas especificas (opcional) |
| created_at | TIMESTAMPTZ | Data de criacao |
| sent_at | TIMESTAMPTZ | Data de envio do e-mail |
| completed_at | TIMESTAMPTZ | Data da resposta |

### 1.2 Nova Tabela: `external_feedback_responses`

Armazena as respostas recebidas dos avaliadores externos.

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | UUID | Identificador unico |
| request_id | UUID | FK para external_feedback_requests |
| answers | JSONB | Respostas as perguntas |
| overall_rating | NUMERIC | Nota geral (1-5) |
| strengths | TEXT | Pontos fortes identificados |
| improvement_areas | TEXT | Areas de melhoria |
| additional_comments | TEXT | Comentarios livres |
| created_at | TIMESTAMPTZ | Data da resposta |

### 1.3 Novo Enum: `external_evaluator_type`

```sql
CREATE TYPE external_evaluator_type AS ENUM ('customer', 'supplier', 'partner', 'other');
```

### 1.4 Atualizacao do Enum `performance_evaluator_type`

Adicionar valor `external` para identificar avaliacoes vindas de externos.

---

## Fase 2: Backend - Edge Function

### 2.1 Edge Function: `send-external-feedback-request`

Responsavel por:
- Gerar token unico de acesso
- Compor e-mail explicativo com:
  - Texto introdutorio sobre a ferramenta (o que e Avaliacao 360)
  - Nome do colaborador sendo avaliado
  - Link unico para o formulario
  - Prazo para resposta
  - Esclarecimento de anonimato/confidencialidade
- Enviar via Resend
- Atualizar status para "sent"

### Modelo do E-mail

```text
Assunto: Solicitacao de Feedback - [Nome Colaborador] | [Nome Empresa]

Prezado(a) [Nome Externo],

A [Nome Empresa] esta realizando um ciclo de Avaliacao 360, 
uma ferramenta de gestao de pessoas que busca coletar perspectivas 
de diferentes stakeholders para desenvolver nossos colaboradores.

Como voce interage com [Nome Colaborador] em sua funcao de [cargo], 
gostaríamos de contar com sua contribuicao para esse processo.

O que e Avaliacao 360?
E um metodo onde coletamos feedback de multiplas fontes 
(gestor, colegas, subordinados e parceiros externos como voce) 
para obter uma visao completa do desempenho profissional.

Suas respostas serao tratadas com confidencialidade e utilizadas 
exclusivamente para fins de desenvolvimento profissional.

Prazo para resposta: [DATA]

[BOTAO: Responder Avaliacao]

Tempo estimado: 5-10 minutos

Agradecemos sua colaboracao!
Equipe de RH - [Nome Empresa]
```

---

## Fase 3: Frontend - Componentes

### 3.1 Nova Pagina: `ExternalFeedback360.tsx`

Pagina para gestores gerenciarem solicitacoes de feedback externo:
- Lista de solicitacoes enviadas com status
- Botao para nova solicitacao
- Visualizacao de respostas recebidas
- Filtros por ciclo, colaborador, status

### 3.2 Dialog: `ExternalFeedbackRequestDialog.tsx`

Formulario para criar nova solicitacao:
- Selecao do colaborador
- Dados do avaliador externo (nome, e-mail)
- Tipo de relacionamento (cliente/fornecedor/parceiro)
- Prazo para resposta
- Perguntas customizadas (opcional)
- Perguntas padrao pre-selecionadas

### 3.3 Pagina Publica: `/feedback/:token`

Formulario acessivel sem login para o avaliador externo:
- Header com logo da empresa e explicacao breve
- Card explicativo "O que e Avaliacao 360?"
- Nome do colaborador sendo avaliado
- Perguntas estruturadas
- Campos de texto para pontos fortes/melhorias
- Nota geral
- Botao de envio
- Tela de confirmacao pos-envio

---

## Fase 4: Integracao com Modulo Existente

### 4.1 Atualizacao do PerformanceNav

Adicionar link para "Feedback 360" na navegacao:
```javascript
{ path: "/performance/feedback-360", label: "Feedback 360", icon: Users }
```

### 4.2 Atualizacao da Pagina de Avaliacoes

Exibir badge indicando se avaliacao tem feedbacks externos coletados.

### 4.3 Dashboard de Desempenho

Adicionar card mostrando:
- Total de solicitacoes enviadas
- Pendentes de resposta
- Recebidas no periodo

---

## Fase 5: Hooks e Servicos

### 5.1 `useExternalFeedbackRequests.ts`

Hook para gerenciar solicitacoes:
- Listar solicitacoes por empresa/ciclo
- Criar nova solicitacao
- Reenviar e-mail
- Cancelar solicitacao

### 5.2 `useExternalFeedbackResponses.ts`

Hook para gerenciar respostas:
- Listar respostas por solicitacao
- Visualizar detalhes da resposta
- Exportar para relatorio

---

## Fase 6: Perguntas Padrao Sugeridas

O sistema oferecera um conjunto de perguntas padrao que podem ser personalizadas:

### Para Clientes:
1. Como voce avalia a qualidade do atendimento prestado por [Nome]?
2. O colaborador demonstra conhecimento tecnico adequado?
3. Como e a comunicacao e clareza nas interacoes?
4. O colaborador cumpre prazos e compromissos?
5. Voce recomendaria trabalhar com este profissional?

### Para Fornecedores:
1. Como voce avalia a clareza nas negociacoes com [Nome]?
2. O colaborador demonstra profissionalismo e etica?
3. A comunicacao e objetiva e respeitosa?
4. Os compromissos acordados sao cumpridos?
5. Como e o relacionamento profissional de modo geral?

---

## Secao Tecnica

### Estrutura de Arquivos

```text
src/
  pages/
    performance/
      ExternalFeedback360.tsx          # Pagina de gestao
    public/
      ExternalFeedbackForm.tsx         # Formulario publico
  
  components/
    performance/
      ExternalFeedbackRequestDialog.tsx
      ExternalFeedbackResponseCard.tsx
      ExternalFeedbackStatusBadge.tsx
  
  hooks/
    useExternalFeedbackRequests.ts
    useExternalFeedbackResponses.ts

supabase/
  functions/
    send-external-feedback-request/
      index.ts
```

### Rotas

```javascript
// Rota protegida (dentro do PerformanceLayout)
<Route path="/performance/feedback-360" element={<ExternalFeedback360 />} />

// Rota publica (sem autenticacao)
<Route path="/feedback/:token" element={<ExternalFeedbackForm />} />
```

### RLS Policies

```sql
-- Gestores e RH podem criar/ver solicitacoes da sua empresa
CREATE POLICY "Managers can manage feedback requests"
ON external_feedback_requests
FOR ALL
USING (root_company_id = get_user_company_id());

-- Respostas publicas via token (sem autenticacao)
CREATE POLICY "Public can submit responses via token"
ON external_feedback_responses
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM external_feedback_requests
    WHERE id = request_id
    AND status = 'sent'
    AND deadline > NOW()
  )
);
```

---

## Estimativa de Complexidade

| Componente | Complexidade | Motivo |
|------------|--------------|--------|
| Banco de Dados | Media | 2 tabelas + 1 enum + policies |
| Edge Function | Media | Integracao Resend + template |
| Pagina Gestao | Media | CRUD + listagem + filtros |
| Formulario Publico | Alta | Rota publica + validacoes + UX |
| Integracao | Baixa | Adicionar links e badges |

---

## Proximos Passos Apos Aprovacao

1. Criar migration com tabelas e enums
2. Implementar Edge Function de envio
3. Criar pagina de gestao de solicitacoes
4. Criar formulario publico
5. Integrar com navegacao existente
6. Testar fluxo completo

