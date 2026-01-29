
# Plano de Correção: Edge Function update-employee-email

## Problema Identificado

A Edge Function `update-employee-email` está falhando com "Edge Function returned a non-2xx status code" porque usa o método `auth.getClaims(token)` que **não existe** na versão atual do supabase-js usada em Edge Functions.

O método `getClaims()` é uma feature experimental introduzida apenas em julho de 2025 para suporte a JWTs assimétricos, e não está disponível na importação padrão `https://esm.sh/@supabase/supabase-js@2`.

## Solução Proposta

Substituir o método `getClaims()` pelo método padrão e estável `getUser(token)`, que é a abordagem recomendada oficialmente pelo Supabase para Edge Functions.

## Alterações Necessárias

### Arquivo: `supabase/functions/update-employee-email/index.ts`

**Antes (linhas 38-48):**
```typescript
// Verify user token
const token = authHeader.replace('Bearer ', '');
const { data: claims, error: claimsError } = await supabaseUser.auth.getClaims(token);
if (claimsError || !claims?.claims) {
  return new Response(
    JSON.stringify({ error: 'Token inválido' }),
    { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

const callerId = claims.claims.sub as string;
```

**Depois:**
```typescript
// Verify user token using getUser (stable API)
const token = authHeader.replace('Bearer ', '');
const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
if (userError || !user) {
  return new Response(
    JSON.stringify({ error: 'Token inválido' }),
    { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

const callerId = user.id;
```

## Detalhes Adicionais

- Mover a criação do `supabaseAdmin` para antes da verificação do token (para usar o service role key na validação)
- O método `getUser(token)` faz uma chamada ao Supabase Auth para verificar a validade do token
- Retorna o objeto `user` completo com `id`, `email`, etc.

## Impacto

- Correção imediata do erro ao atualizar email de colaboradores
- Compatibilidade garantida com todas as versões do Supabase
- Sem alteração de comportamento funcional
