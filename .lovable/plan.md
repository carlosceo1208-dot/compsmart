# Streaming SSE nos 4 chats

## Objetivo
Ativar streaming em tempo real (token-a-token) nos chats `legal-assistant`, `salary-assistant`, `incentive-assistant` e `support-assistant`, sem perder funcionalidades existentes (referências legais, citações de fonte, métricas, histórico, persistência).

## Backend — cada edge function

1. **Chamar o AI Gateway com `stream: true`** em vez do JSON único atual.
2. **Responder ao cliente como SSE** (`Content-Type: text/event-stream`):
   - `event: delta` + `data: {"text": "..."}` para cada chunk do modelo.
   - `event: done` + `data: {...metadata}` no final, com os mesmos campos que o JSON atual retorna (`answer`, `legal_references`/`sources`, `tokens_used`, `response_time_ms`, `conversation_id`, etc.).
   - `event: error` + `data: {"error": "..."}` para 503/429/falhas.
3. **Acumular a resposta completa no servidor** enquanto faz o streaming. Após o stream:
   - Rodar extratores (ex.: `extractLegalSources`) sobre o texto completo.
   - Persistir `*_conversations` e `agent_source_citations` (mantém comportamento atual).
   - Emitir o `event: done` com metadata.
4. **CORS preservado**, incluindo no fluxo de stream e em respostas de erro.
5. **Autenticação JWT** mantida exatamente como hoje (validação no início do handler).

## Frontend — cada caller

- Substituir `supabase.functions.invoke('xxx-assistant', { body })` por `fetch(<FUNCTIONS_URL>/xxx-assistant, …)` com `Authorization: Bearer <session.access_token>` e leitura via `ReadableStream` + `TextDecoder`.
- Parser SSE inline (~25 linhas) que:
  - acumula buffer, separa por `\n\n`,
  - em `event: delta` faz `setMessages(prev => …)` adicionando texto ao último assistant message,
  - em `event: done` aplica metadata final (referências, tokens, conversation_id),
  - em `event: error` mostra `toast.error`.
- Mostrar a mensagem assistant vazia imediatamente após o envio (indicador "Pensando…") e ir preenchendo conforme os deltas chegam.
- Manter compatibilidade visual: textos, badges de fontes/referências, ações de copiar continuam funcionando porque a forma final do estado da mensagem é igual à atual.

## Arquivos tocados

Backend (4):
- `supabase/functions/legal-assistant/index.ts`
- `supabase/functions/salary-assistant/index.ts`
- `supabase/functions/incentive-assistant/index.ts`
- `supabase/functions/support-assistant/index.ts`

Frontend (4):
- `src/pages/LegalAssistant.tsx`
- `src/pages/SalaryAssistant.tsx`
- `src/pages/IncentiveAssistant.tsx`
- `src/hooks/useSupport.ts`

## Detalhes técnicos

- AI Gateway aceita `stream: true` no payload `chat/completions` e devolve SSE no formato OpenAI (`data: {"choices":[{"delta":{"content":"..."}}]}`). O edge function lê esse stream e re-emite como SSE próprio (mais simples: re-encapsular como `event: delta`).
- Persistência só acontece **após** o stream completar com sucesso — se o cliente desconectar, a função aborta via `req.signal` e nada é salvo (comportamento aceitável; equivalente ao atual em caso de erro).
- 503/429 do gateway: emitidos como `event: error` antes do `done` e a função encerra a resposta.
- Não é introduzida nenhuma nova dependência (sem AI SDK, sem novos pacotes).

## Fora de escopo
- Não trocaremos a stack para `useChat`/AI Elements (seriam mais 2-3 dias de refatoração de UI). Mantemos os componentes atuais e só trocamos o transporte.
- Não trocaremos modelo nem prompts.
- Salvamento parcial em caso de aborto (não há esse comportamento hoje; manter assim).

## Verificação após implementação
1. Build do projeto sem erros.
2. Deploy das 4 functions e teste via `curl_edge_functions` com payload mínimo — verificar SSE no body.
3. Teste manual via preview: enviar pergunta em cada chat e confirmar texto aparecendo gradualmente + metadata final.

Aprovação pedida antes de executar — diga "go" e implemento tudo de uma vez.
