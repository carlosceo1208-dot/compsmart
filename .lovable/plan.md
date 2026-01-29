

## Plano: Verificar Dominio compsmart.com.br no Resend

### Problema Identificado
O email de convite nao esta sendo enviado porque o dominio `compsmart.com.br` nao esta verificado no Resend. O codigo esta correto, mas o Resend bloqueia envios de dominios nao verificados.

### Passo a Passo para Voce (Usuario)

#### Passo 1: Acessar o Resend
1. Acesse: https://resend.com/domains
2. Faca login com sua conta Resend

#### Passo 2: Adicionar o Dominio
1. Clique em **"Add Domain"**
2. Digite: `compsmart.com.br`
3. Clique em **"Add"**

#### Passo 3: Configurar DNS
O Resend vai mostrar registros DNS que voce precisa adicionar. Geralmente sao:

| Tipo | Nome | Valor |
|------|------|-------|
| TXT | `_resend` | `resend-verify=xxxxx` |
| CNAME | `resend._domainkey` | `xxxxx.dkim.resend.dev` |
| CNAME | `resend2._domainkey` | `xxxxx.dkim2.resend.dev` |

1. Acesse o painel de DNS do seu provedor de dominio (onde voce registrou `compsmart.com.br`)
2. Adicione cada registro conforme mostrado no Resend
3. Salve as alteracoes

#### Passo 4: Verificar
1. Volte ao Resend
2. Clique em **"Verify DNS Records"**
3. Aguarde a propagacao (pode levar de 5 minutos a 24 horas)
4. O status mudara para **"Verified"** (verde)

#### Passo 5: Testar
Apos a verificacao:
1. Volte a pagina de Colaboradores no CompSmart
2. Selecione um colaborador com email
3. Clique em "Enviar Convite"
4. O email sera enviado com sucesso

---

### Codigo Atual (Ja Correto)
O codigo da Edge Function `send-employee-invitation` ja esta configurado corretamente:

```typescript
from: 'CompSmart <noreply@compsmart.com.br>'
```

Nao e necessaria nenhuma alteracao no codigo. Apenas a verificacao do dominio no Resend.

---

### Alternativa Temporaria (Opcional)
Se precisar testar urgentemente antes da verificacao, posso alterar temporariamente o remetente para `onboarding@resend.dev`. Porem, isso so permite enviar emails para o email do titular da conta Resend.

