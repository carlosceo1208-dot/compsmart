
# Plano: Corrigir Dominio para compsmart.ia.br

## Problema Identificado

O dominio correto e **compsmart.ia.br** e nao compsmart.com.br. Preciso atualizar a edge function para usar o remetente correto apos a verificacao do dominio.

---

## Alteracao Necessaria

### Arquivo: `supabase/functions/send-employee-invitation/index.ts`

**Linha 209 - Alterar de:**
```typescript
from: 'CompSmart <onboarding@resend.dev>',
```

**Para:**
```typescript
from: 'CompSmart <noreply@compsmart.ia.br>',
```

---

## Instrucoes de Verificacao DNS para compsmart.ia.br

### Passo 1: Adicionar Dominio no Resend

1. Acesse https://resend.com/domains
2. Clique em **Add Domain**
3. Digite: `compsmart.ia.br`
4. Clique em **Add**

### Passo 2: Adicionar Registros DNS

O Resend fornecera 3 registros para adicionar no painel DNS do seu provedor:

| Tipo | Nome | Valor |
|------|------|-------|
| TXT | `compsmart.ia.br` | `resend-verification=xxxxxx` (fornecido pelo Resend) |
| CNAME | `resend._domainkey.compsmart.ia.br` | `xxxxx.dkim.resend.dev` (fornecido pelo Resend) |
| CNAME | `bounces.compsmart.ia.br` | `bounces.resend.dev` |

**Nota:** Os valores exatos serao exibidos no painel do Resend apos adicionar o dominio.

### Passo 3: Verificar Dominio

1. Apos adicionar os registros DNS, aguarde propagacao (pode levar ate 48h)
2. Volte ao Resend e clique em **Verify**
3. O status mudara para **Verified**

---

## Sequencia de Execucao

1. Voce adiciona o dominio `compsmart.ia.br` no Resend
2. Voce configura os registros DNS no provedor
3. Voce confirma que o dominio foi verificado
4. Eu atualizo a edge function para usar `noreply@compsmart.ia.br`
5. Faco deploy da funcao
6. Convites poderao ser enviados para qualquer email

---

## Alternativa: Continuar com Sandbox

Se quiser continuar testando enquanto verifica o dominio:
- Mantenho `onboarding@resend.dev` como remetente
- Voce so podera enviar para `carlosceo1208@gmail.com` (email do proprietario Resend)

---

## Apos Verificacao do Dominio

Me avise quando o dominio `compsmart.ia.br` estiver verificado no Resend, e eu farei a atualizacao imediata da edge function para:

```typescript
from: 'CompSmart <noreply@compsmart.ia.br>',
```
