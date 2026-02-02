

# Plano: Finalizar Padronização de Email (2 arquivos restantes)

## Situação Atual

A padronização está **90% completa**. Apenas 2 edge functions ainda precisam ser atualizadas:

| Arquivo | Domínio Atual | Novo Domínio |
|---------|---------------|--------------|
| `send-budget-report/index.ts` | `onboarding@resend.dev` | `noreply@compsmart.ia.br` |
| `delete-expired-data/index.ts` | `noreply@compsmart.com.br` | `noreply@compsmart.ia.br` |

---

## Alterações Necessárias

### 1. `supabase/functions/send-budget-report/index.ts`

**Linha 156:**
```typescript
// ANTES
from: 'CompSmart <onboarding@resend.dev>',

// DEPOIS
from: 'CompSmart <noreply@compsmart.ia.br>',
```

---

### 2. `supabase/functions/delete-expired-data/index.ts`

**Linha 37 (link de privacidade):**
```html
<!-- ANTES -->
<a href="https://compsmart.com.br/privacy">Política de Privacidade</a>

<!-- DEPOIS -->
<a href="https://compsmart.ia.br/privacy">Política de Privacidade</a>
```

**Linha 71 (botão CTA):**
```html
<!-- ANTES -->
<a href="https://compsmart.com.br" class="button">Conhecer o CompSmart Novamente</a>

<!-- DEPOIS -->
<a href="https://compsmart.ia.br" class="button">Conhecer o CompSmart Novamente</a>
```

**Linha 75 (email de suporte):**
```html
<!-- ANTES -->
Dúvidas? Entre em contato: suporte@compsmart.com.br

<!-- DEPOIS -->
Dúvidas? Entre em contato: suporte@compsmart.ia.br
```

**Linha 353 (remetente):**
```typescript
// ANTES
from: "CompSmart <noreply@compsmart.com.br>",

// DEPOIS
from: "CompSmart <noreply@compsmart.ia.br>",
```

---

## Resumo das Alterações

| Arquivo | Tipo | Descrição |
|---------|------|-----------|
| `send-budget-report/index.ts` | Edge Function | Atualizar remetente |
| `delete-expired-data/index.ts` | Edge Function | Atualizar remetente + 3 links no HTML |

---

## Resultado Final

Após estas alterações, **100% das edge functions** estarão usando o domínio verificado `compsmart.ia.br`:

| Tipo de Email | Remetente Padronizado |
|---------------|----------------------|
| Transacionais | `CompSmart <noreply@compsmart.ia.br>` |
| Alertas | `CompSmart Alertas <alerts@compsmart.ia.br>` |

---

## Seção Técnica

### Benefícios da padronização completa:

1. **Deliverability**: Todos os emails usam domínio verificado com SPF/DKIM corretos
2. **Consistência**: Nenhuma referência ao sandbox do Resend
3. **Profissionalismo**: Links e emails apontam para o domínio oficial
4. **Compliance**: Todos os links de privacidade funcionais

### Edge Functions a serem deployadas após alterações:
- `send-budget-report`
- `delete-expired-data`

