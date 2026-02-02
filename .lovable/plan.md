
# Plano: Padronizar Domínio de Email nas Edge Functions

## Situação Atual

Após a verificação do domínio `compsmart.ia.br` no Resend, identifiquei **inconsistências** nos domínios de envio de email nas edge functions:

| Arquivo | Domínio Atual | Status |
|---------|---------------|--------|
| `send-employee-invitation` | `noreply@compsmart.ia.br` | OK |
| `send-payment-emails` | `noreply@compsmart.com.br` | Precisa atualizar |
| `send-trial-reminders` | `noreply@compsmart.com.br` | Precisa atualizar |
| `send-budget-deadline-reminder` | `onboarding@resend.dev` | Precisa atualizar |
| `check-agent-alerts` | `alerts@resend.dev` | Precisa atualizar |
| `process-trial-expiration` | `noreply@compsmart.com.br` | Precisa atualizar |
| `create-employee-user` | `noreply@compsmart.com.br` | Precisa atualizar |
| `notify-budget-submission` | - | Verificar |

---

## Padronização Proposta

Todos os emails passarão a usar o domínio verificado `compsmart.ia.br`:

| Tipo de Email | Remetente Padronizado |
|---------------|----------------------|
| Transacionais gerais | `CompSmart <noreply@compsmart.ia.br>` |
| Alertas do sistema | `CompSmart Alertas <alerts@compsmart.ia.br>` |
| Comercial/Marketing | `CompSmart <comercial@compsmart.ia.br>` |

---

## Arquivos a Atualizar

### 1. `supabase/functions/send-payment-emails/index.ts`
- Linha 325: `noreply@compsmart.com.br` → `noreply@compsmart.ia.br`
- Links no HTML: `compsmart.com.br` → `compsmart.ia.br`

### 2. `supabase/functions/send-trial-reminders/index.ts`
- Linhas 330, 410: `noreply@compsmart.com.br` → `noreply@compsmart.ia.br`
- Links no HTML: `compsmart.com.br` → `compsmart.ia.br`

### 3. `supabase/functions/send-budget-deadline-reminder/index.ts`
- Linha 242: `onboarding@resend.dev` → `noreply@compsmart.ia.br`

### 4. `supabase/functions/check-agent-alerts/index.ts`
- Linha 391: `alerts@resend.dev` → `alerts@compsmart.ia.br`

### 5. `supabase/functions/process-trial-expiration/index.ts`
- Atualizar domínio do remetente para `noreply@compsmart.ia.br`

### 6. `supabase/functions/create-employee-user/index.ts`
- Linha 28: `noreply@compsmart.com.br` → `noreply@compsmart.ia.br`

### 7. `supabase/functions/notify-budget-submission/index.ts`
- Verificar e atualizar domínio do remetente

---

## Links nos Templates HTML

Também atualizarei os links dos templates HTML para apontar para o domínio correto:

| Link Atual | Link Atualizado |
|------------|-----------------|
| `compsmart.com.br/dashboard` | `compsmart.ia.br/dashboard` |
| `compsmart.com.br/pricing` | `compsmart.ia.br/pricing` |
| `compsmart.com.br/settings/billing` | `compsmart.ia.br/settings/billing` |
| `compsmart.com.br/privacy` | `compsmart.ia.br/privacy` |
| `suporte@compsmart.com.br` | `suporte@compsmart.ia.br` |
| `comercial@compsmart.com.br` | `comercial@compsmart.ia.br` |

---

## Resumo das Alterações

| Componente | Tipo | Descrição |
|------------|------|-----------|
| `send-payment-emails` | Edge Function | Atualizar domínio + links |
| `send-trial-reminders` | Edge Function | Atualizar domínio + links |
| `send-budget-deadline-reminder` | Edge Function | Atualizar domínio |
| `check-agent-alerts` | Edge Function | Atualizar domínio |
| `process-trial-expiration` | Edge Function | Atualizar domínio + links |
| `create-employee-user` | Edge Function | Atualizar domínio |
| `notify-budget-submission` | Edge Function | Verificar e atualizar |

---

## Seção Técnica

### Padrão de Substituição

```typescript
// ANTES
from: "CompSmart <noreply@compsmart.com.br>"
from: "CompSmart <onboarding@resend.dev>"
from: "CompSmart Alertas <alerts@resend.dev>"

// DEPOIS
from: "CompSmart <noreply@compsmart.ia.br>"
from: "CompSmart <noreply@compsmart.ia.br>"
from: "CompSmart Alertas <alerts@compsmart.ia.br>"
```

### Benefícios

1. **Deliverability melhorada**: Usar domínio verificado aumenta taxa de entrega
2. **Consistência**: Todos os emails vêm do mesmo domínio
3. **Profissionalismo**: Remove referências ao sandbox do Resend
4. **SPF/DKIM corretos**: O domínio verificado tem as configurações DNS corretas
