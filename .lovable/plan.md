
# Plano: Habilitar Envio de Email com Dominio Temporario do Resend

## Problema Identificado

A funcao `send-employee-invitation` esta tentando enviar emails de `noreply@compsmart.com.br`, mas o dominio ainda nao esta verificado no Resend, causando status "failed".

Alem disso, a funcao nao esta registrada no `config.toml`, o que pode impedir o deploy.

---

## Solucao em 2 Passos

### Passo 1: Registrar a Edge Function no config.toml

Adicionar a configuracao da funcao `send-employee-invitation`:

```toml
[functions.send-employee-invitation]
verify_jwt = true
```

---

### Passo 2: Usar Dominio Sandbox do Resend Temporariamente

Alterar a linha 209 da edge function de:

```typescript
from: 'CompSmart <noreply@compsmart.com.br>',
```

Para:

```typescript
from: 'CompSmart <onboarding@resend.dev>',
```

**Nota:** O dominio `onboarding@resend.dev` e o sandbox gratuito do Resend que funciona imediatamente sem verificacao de DNS.

---

## Limitacao Temporaria

Usando o dominio sandbox (`onboarding@resend.dev`):
- Os emails serao entregues normalmente
- O remetente aparecera como "onboarding@resend.dev" para o destinatario
- Funciona apenas para testes (limite de 100 emails/dia)

---

## Arquivos a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| `supabase/config.toml` | Adicionar registro da funcao |
| `supabase/functions/send-employee-invitation/index.ts` | Alterar remetente para sandbox |

---

## Proximos Passos para Dominio Personalizado

Enquanto usamos o sandbox, voce pode verificar o dominio `compsmart.com.br`:

1. Acesse https://resend.com/domains
2. Clique em "Add Domain"
3. Digite `compsmart.com.br`
4. O Resend fornecera registros DNS (TXT e CNAME)
5. Adicione esses registros no painel de DNS do seu provedor
6. Aguarde propagacao (ate 48h)
7. Clique em "Verify" no Resend
8. Quando verificado, voltamos para `noreply@compsmart.com.br`

---

## Apos Aprovacao

1. Atualizo o `config.toml` com a funcao
2. Altero o remetente para `onboarding@resend.dev`
3. Faco deploy da funcao
4. Voce podera testar o envio de convites imediatamente
