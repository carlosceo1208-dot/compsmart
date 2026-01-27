
# Plano de Hardening de Seguranca - CompSmart

## Resumo Executivo

Este plano aborda 3 vulnerabilidades de seguranca identificadas na analise focada:

1. **RLS budget_submissions** - Managers podem modificar submissoes apos aprovacao
2. **Rate Limiting em Edge Functions de IA** - Prevenir abuso de consumo de tokens
3. **Auditoria de Operacoes Sensiveis** - Melhorar rastreabilidade de acoes criticas

---

## 1. Correcao RLS budget_submissions

### Problema Identificado
A politica atual permite que managers facam UPDATE em qualquer submissao da sua unidade, independente do status. Isso permite modificar orcamentos ja aprovados.

### Politica Atual
```sql
Policy: Update submissions policy
USING: (has_any_role(..., ARRAY['admin', 'hr_manager']) 
   OR (has_role(..., 'manager') AND unit_id = user.unit_id))
```

### Solucao
Adicionar restricao de status para managers - permitir UPDATE apenas quando status IN ('draft', 'rejected', 'unlocked').

```sql
-- Corrigir politica UPDATE para managers
DROP POLICY IF EXISTS "Update submissions policy" ON budget_submissions;

CREATE POLICY "Update submissions policy" ON budget_submissions
FOR UPDATE USING (
  -- Admin/HR podem atualizar qualquer submissao
  has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role])
  OR
  -- Managers so podem atualizar sua unidade E apenas em status editaveis
  (
    has_role(auth.uid(), 'manager'::app_role) 
    AND unit_id = (SELECT unit_id FROM profiles WHERE id = auth.uid())
    AND status IN ('draft', 'rejected', 'unlocked')
  )
);
```

### Impacto
- Managers nao poderao mais modificar submissoes em status 'pending', 'approved' ou 'submitted'
- Admin/HR mantem controle total para unlock e ajustes emergenciais

---

## 2. Rate Limiting Server-Side para Edge Functions de IA

### Problema Identificado
As edge functions de IA (salary-assistant, legal-assistant, incentive-assistant) nao possuem rate limiting server-side, permitindo abuso de consumo de tokens via chamadas automatizadas.

### Solucao
Criar tabela de controle e funcao de rate limiting.

### Passo 1: Criar tabela de rate limiting
```sql
CREATE TABLE IF NOT EXISTS rate_limit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  function_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_rate_limit_user_function 
ON rate_limit_log(user_id, function_name, created_at DESC);

-- Limpar logs antigos automaticamente (retention 24h)
CREATE OR REPLACE FUNCTION cleanup_rate_limit_logs()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM rate_limit_log WHERE created_at < now() - interval '24 hours';
$$;
```

### Passo 2: Criar funcao de verificacao
```sql
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_user_id uuid,
  p_function_name text,
  p_max_requests int DEFAULT 30,
  p_window_minutes int DEFAULT 60
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  request_count int;
BEGIN
  -- Contar requisicoes na janela de tempo
  SELECT COUNT(*) INTO request_count
  FROM rate_limit_log
  WHERE user_id = p_user_id
    AND function_name = p_function_name
    AND created_at > now() - (p_window_minutes || ' minutes')::interval;
  
  -- Se dentro do limite, registrar e permitir
  IF request_count < p_max_requests THEN
    INSERT INTO rate_limit_log (user_id, function_name)
    VALUES (p_user_id, p_function_name);
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;
```

### Passo 3: Integrar nas Edge Functions

Adicionar verificacao no inicio de cada edge function de IA:

```typescript
// Verificar rate limit (30 requests/hora por usuario)
const { data: allowed, error: rlError } = await supabase.rpc('check_rate_limit', {
  p_user_id: user.id,
  p_function_name: 'salary-assistant',
  p_max_requests: 30,
  p_window_minutes: 60
});

if (!allowed) {
  return new Response(
    JSON.stringify({ 
      error: 'Limite de requisicoes excedido. Aguarde alguns minutos.',
      retry_after: 60 
    }),
    { status: 429, headers: corsHeaders }
  );
}
```

### Limites Propostos
| Edge Function | Max Requests | Janela |
|--------------|--------------|--------|
| salary-assistant | 30 | 60 min |
| legal-assistant | 30 | 60 min |
| incentive-assistant | 30 | 60 min |
| support-assistant | 50 | 60 min |

---

## 3. Auditoria de Operacoes Sensiveis

### Problema Identificado
Operacoes criticas como aprovacao de orcamentos e alteracoes salariais nao geram logs detalhados suficientes para auditoria.

### Solucao
Criar trigger de auditoria automatica para tabelas sensiveis.

### Tabelas a Auditar
- budget_submissions (aprovacoes, rejeicoes)
- profiles (alteracoes salariais)
- collective_salary_adjustments (efetivacao de ajustes)

### Implementacao
```sql
-- Trigger para budget_submissions
CREATE OR REPLACE FUNCTION audit_budget_submissions()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    -- Registrar apenas mudancas de status
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      INSERT INTO audit_logs (
        user_id, 
        table_name, 
        action, 
        record_id, 
        old_data, 
        new_data
      ) VALUES (
        auth.uid(),
        'budget_submissions',
        'status_change',
        NEW.id,
        jsonb_build_object(
          'status', OLD.status,
          'unit_id', OLD.unit_id,
          'fiscal_year', OLD.fiscal_year
        ),
        jsonb_build_object(
          'status', NEW.status,
          'unit_id', NEW.unit_id,
          'fiscal_year', NEW.fiscal_year,
          'review_notes', NEW.review_notes
        )
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_audit_budget_submissions
AFTER UPDATE ON budget_submissions
FOR EACH ROW
EXECUTE FUNCTION audit_budget_submissions();
```

---

## Checklist de Implementacao

| Item | Prioridade | Risco Atual |
|------|------------|-------------|
| Corrigir RLS budget_submissions | Alta | Medio |
| Rate limiting edge functions | Media | Medio |
| Triggers de auditoria | Media | Baixo |

---

## Secao Tecnica

### Arquivos a Modificar

**Migrations (SQL)**
- Nova migration para RLS budget_submissions
- Nova migration para tabela rate_limit_log
- Nova migration para triggers de auditoria

**Edge Functions**
- supabase/functions/salary-assistant/index.ts
- supabase/functions/legal-assistant/index.ts
- supabase/functions/incentive-assistant/index.ts

### Consideracoes de Rollback
- Todas as alteracoes sao reversiveis via DROP POLICY / DROP FUNCTION
- Rate limiting pode ser desabilitado alterando a funcao para sempre retornar true
- Triggers de auditoria podem ser removidos sem impacto funcional

### Testes Recomendados
1. Tentar UPDATE em budget_submissions com status='approved' como manager (deve falhar)
2. Fazer 31 chamadas consecutivas ao salary-assistant (deve retornar 429 na 31a)
3. Verificar audit_logs apos mudanca de status em budget_submissions
