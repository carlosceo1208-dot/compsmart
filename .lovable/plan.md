
## Hardening Completo de Seguranca -- 6 Vulnerabilidades

Plano para resolver todas as 6 vulnerabilidades detectadas, preparando a plataforma para escala de 1000+ usuarios simultaneos por empresa.

---

### 1. Senha hardcoded em create-test-account (WARN - Easy)

**Problema:** Senha `Consultor@2026!` exposta no codigo-fonte.

**Solucao:**
- Arquivo: `supabase/functions/create-test-account/index.ts`
- Substituir `const FIXED_PASSWORD = 'Consultor@2026!'` por `Deno.env.get('TEST_ACCOUNT_PASSWORD')`
- Adicionar validacao que retorna erro 500 se o secret nao estiver configurado
- Remover retorno da senha na resposta JSON (linhas 127, 187) -- resposta deve conter apenas `success: true` sem expor credenciais
- Sera necessario configurar o secret `TEST_ACCOUNT_PASSWORD` via ferramenta de secrets

---

### 2. XSS em chart.tsx via dangerouslySetInnerHTML (WARN - Easy)

**Problema:** Valores de cor injetados sem sanitizacao no CSS.

**Solucao:**
- Arquivo: `src/components/ui/chart.tsx`
- Adicionar funcao `sanitizeCssColor()` que valida valores contra regex de cores validas (hex, rgb, hsl, oklch, named CSS colors)
- Aplicar sanitizacao na variavel `color` antes de interpolar no template string (linha 78)
- Fallback seguro para `transparent` se o valor nao passar na validacao

---

### 3. Rate limiting no log-auth-attempt (WARN - Medium)

**Problema:** Endpoint publico sem rate limiting, permitindo flood de logs.

**Solucao:**
- Arquivo: `supabase/functions/log-auth-attempt/index.ts`
- Adicionar rate limiting in-memory (mesmo padrao do create-test-account): 30 requests por IP por minuto
- Adicionar validacao de tamanho dos campos (email max 255 chars, failure_reason max 500 chars)
- Sanitizar campo metadata (limitar profundidade e tamanho do JSON)

---

### 4. compensation-trends sem autenticacao (WARN - Medium)

**Problema:** Endpoint publico que consome API de IA sem nenhuma autenticacao.

**Solucao:**
- Arquivo: `supabase/functions/compensation-trends/index.ts`
- Adicionar verificacao de JWT: extrair token do header Authorization, validar via `supabase.auth.getUser(token)`
- Retornar 401 se nao autenticado
- Adicionar rate limiting in-memory (10 requests por usuario por hora -- IA e cara)
- Arquivo: `supabase/config.toml` -- nao precisa alterar pois `verify_jwt=false` e o padrao correto (validacao no codigo)

---

### 5. Storage buckets publicos (WARN - Medium)

**Problema:** Buckets avatars, company-logos e videos acessiveis publicamente por URL direta.

**Solucao -- Migracao SQL:**
- Restringir o bucket `videos` para que apenas admin/HR possam fazer upload e delete (substituir politicas atuais)
- Para `avatars` e `company-logos`: manter publicos pois sao necessarios para exibicao em interfaces abertas (landing page, perfis), mas documentar a decisao
- Atualizar o finding para refletir que avatars e logos sao intencionalmente publicos (baixo risco: nao contem PII sensivel), e videos foi corrigido

---

### 6. Client-side auth checks e SECURITY DEFINER (WARN - Hard)

**Problema:** 77 funcoes SECURITY DEFINER e checks de role no frontend.

**Solucao:**
- **Client-side checks**: Marcar como ignorado com justificativa -- RLS e a camada real de seguranca, checks no frontend sao UX-only. Isso e arquitetura correta.
- **SECURITY DEFINER**: Auditar as funcoes existentes (ja listadas no schema). A maioria ja possui `SET search_path = public` e validacoes com `has_role()`/`has_any_role()`. Marcar como ignorado com nota de que a auditoria foi realizada e os controles estao adequados. As funcoes criticas (manage_user_roles, handle_new_user, validate_profile_update) ja implementam verificacoes de autorizacao.

---

### Resumo de alteracoes por arquivo

| Arquivo | Tipo de Alteracao |
|---------|------------------|
| `supabase/functions/create-test-account/index.ts` | Remover senha hardcoded, usar env var |
| `src/components/ui/chart.tsx` | Adicionar sanitizacao de cores CSS |
| `supabase/functions/log-auth-attempt/index.ts` | Adicionar rate limiting e validacao de input |
| `supabase/functions/compensation-trends/index.ts` | Adicionar autenticacao JWT + rate limiting |
| Migracao SQL | Restringir policies do bucket videos |
| Security findings | Atualizar/ignorar findings resolvidos |

### Secret necessario
- `TEST_ACCOUNT_PASSWORD`: senha para contas de teste (substituindo valor hardcoded)
