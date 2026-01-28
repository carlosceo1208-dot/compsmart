
# Plano: Permitir Edição de Email de Funcionários

## Contexto do Problema

O campo de email está **bloqueado** no diálogo de edição de funcionários (linha 749 do `UserDialog.tsx`):
```tsx
disabled={loading || !!userId}
```

Isso impede que Admin, RH e Gestores atualizem o email dos colaboradores. Além disso, na página "Meu Perfil" (`MyProfile.tsx`), o próprio colaborador também não consegue alterar seu email.

## Desafio Técnico

O email está vinculado a dois lugares:
1. **Tabela `profiles`** - dados do funcionário
2. **Tabela `auth.users`** - sistema de autenticação

Se alterarmos apenas o `profiles.email`, o funcionário não conseguirá fazer login com o novo email. Precisamos atualizar **ambos** simultaneamente.

## Solução Proposta

### Parte 1: Nova Edge Function para Atualizar Email

Criar uma edge function `update-employee-email` que:
- Recebe `userId` e `newEmail`
- Valida se o usuário chamador tem permissão (Admin, RH, ou o próprio funcionário)
- Atualiza o email no `auth.users` usando `supabase.auth.admin.updateUserById()`
- Atualiza o email no `profiles`
- Envia email de confirmação (opcional)

### Parte 2: Habilitar Campo Email no UserDialog

Modificar `UserDialog.tsx` para:
- Remover `disabled={!!userId}` do campo email
- Adicionar chamada à edge function ao salvar
- Mostrar aviso sobre impacto na autenticação

### Parte 3: Permitir Colaborador Editar Próprio Email

Modificar `MyProfile.tsx` para:
- Habilitar campo email
- Adicionar lógica de atualização via edge function
- Exigir confirmação por segurança

---

## Detalhes Técnicos

### Nova Edge Function: `update-employee-email`

```
supabase/functions/update-employee-email/index.ts
```

Fluxo:
1. Receber `targetUserId` e `newEmail`
2. Validar token do chamador
3. Verificar permissões:
   - Admin/HR pode alterar qualquer funcionário da empresa
   - Funcionário pode alterar apenas seu próprio email
4. Verificar se novo email já está em uso
5. Atualizar `auth.users.email` via `admin.updateUserById()`
6. Atualizar `profiles.email`
7. Retornar sucesso

### Modificação em UserDialog.tsx

Linha 749:
```tsx
// ANTES
disabled={loading || !!userId}

// DEPOIS
disabled={loading}
```

Linha 518-540 (handleSubmit):
Adicionar chamada à edge function para atualizar email se foi alterado.

### Modificação em MyProfile.tsx

Linha 171:
```tsx
// ANTES
<Input value={profile.email} disabled />

// DEPOIS
<Input 
  value={profile.email} 
  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
/>
```

Modificar `handleSave()` para incluir lógica de atualização de email.

---

## Considerações de Segurança

1. **Rate Limiting**: A edge function usará rate limiting (5 alterações de email por hora)
2. **Validação de Email**: Formato válido obrigatório
3. **Empresa Correta**: Verificar que Admin/RH só altera funcionários da própria empresa
4. **Auditoria**: Registrar alterações de email no audit_log

---

## Impacto no Sistema

| Componente | Alteração |
|------------|-----------|
| `supabase/functions/update-employee-email/index.ts` | **Novo arquivo** |
| `src/components/UserDialog.tsx` | Habilitar campo email, chamar edge function |
| `src/pages/MyProfile.tsx` | Habilitar campo email, chamar edge function |

---

## Fluxo de Uso

### Admin/RH editando funcionário:
1. Abre diálogo de edição
2. Altera campo email
3. Clica "Salvar"
4. Sistema atualiza auth.users + profiles
5. Funcionário pode fazer login com novo email

### Colaborador editando próprio email:
1. Acessa "Meu Perfil"
2. Altera campo email
3. Clica "Salvar Alterações"
4. Sistema solicita confirmação
5. Email atualizado em ambas as tabelas

---

## Status: ✅ IMPLEMENTADO

Todas as etapas foram concluídas:

1. ✅ Edge function `update-employee-email` criada e deployada
2. ✅ `UserDialog.tsx` modificado para habilitar edição de email
3. ✅ `MyProfile.tsx` modificado para permitir edição de email pelo colaborador
4. ✅ Auditoria de alterações de email no audit_logs
5. ✅ Rate limiting (5 alterações por hora)

