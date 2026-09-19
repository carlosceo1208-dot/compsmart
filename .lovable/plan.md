# Reativar auditoria RLS automática no GitHub Actions

## Contexto
O workflow `.github/workflows/rls-tenant-isolation.yml` (auditoria de isolamento RLS, matriz de papéis e permissões de edge functions) está atualmente restrito a disparo manual (`workflow_dispatch`) — os gatilhos por pull request e agendamento foram desativados por gerarem e-mails de falha com problemas transitórios de infraestrutura.

## Objetivo
Voltar a rodar a auditoria automaticamente, sem recriar o ruído de e-mails por falhas transitórias.

## Mudanças no `rls-tenant-isolation.yml`

1. **Reativar gatilhos:**
   ```yaml
   on:
     workflow_dispatch:
     pull_request:
       branches: [main]
     schedule:
       - cron: "0 3 * * 1"   # toda segunda-feira às 03:00 UTC (00:00 em São Paulo)
   ```
   - Cron semanal (não noturno) para reduzir janelas de falha transitória e o volume de e-mails; segunda-feira de manhã é o horário em que a equipe realmente vê o resultado.

2. **Mitigar falhas transitórias** (causa original dos e-mails):
   - Instalação com retry: trocar `bun install --frozen-lockfile` por um pequeno passo que tenta a instalação até 2 vezes.
   - Passos de teste com `retry` leve não é necessário — as suítes já são determinísticas; a fonte de ruído era o download do Bun/dependências.

3. **Manter como está:**
   - Checagem de secrets (`secrets_check`) que apenas avisa e pula a auditoria quando `SUPABASE_SERVICE_ROLE_KEY` etc. não estão configurados.
   - `concurrency` com `cancel-in-progress` e `timeout-minutes: 10`.

## Validação
- Ler o YAML final e conferir sintaxe (via `bunx` actionlint não disponível — validação por inspeção e CI real no próximo PR/push).
- Os testes RLS continuam pulando com segurança localmente (requerem `SUPABASE_SERVICE_ROLE_KEY`, que existe nos secrets do repositório).
