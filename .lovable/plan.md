

## Diagnóstico do Problema

### Situação Atual
Quando um colaborador recebe um convite por email e clica no link para definir sua senha, ele é redirecionado incorretamente para a tela de **Onboarding de Empresa** (cadastro de CNPJ, Razão Social, etc.) ao invés de ir diretamente para o Dashboard.

### Causa Raiz Identificada
O problema ocorre devido a uma dessincronização entre o perfil do colaborador e o usuário Auth:

1. **Perfil Original**: O colaborador foi cadastrado na tabela `profiles` com todos os dados (cargo, salário, `root_company_id`, etc.)
2. **Envio do Convite**: A edge function `send-employee-invitation` cria um novo usuário no Auth
3. **Trigger automático**: O trigger `handle_new_user` cria um **novo perfil** vinculado ao usuário Auth
4. **Perfil Duplicado**: Agora existem dois perfis: o original (com dados) e o novo (vazio, sem `root_company_id`)
5. **Login do colaborador**: O `DashboardLayout` busca o perfil pelo `auth.uid()` e encontra o perfil **vazio**
6. **Redirecionamento incorreto**: Como `root_company_id = null`, o sistema direciona para `/onboarding`

### Evidência no Banco de Dados
Encontrado caso concreto do problema:
- **Perfil original** (ID: `05a4166c...`): `root_company_id` preenchido, `has_system_access = false`
- **Auth user** (ID: `6901dce8...`): `raw_user_meta_data` **sem** `root_company_id`  
- **Novo perfil** (ID: `6901dce8...`): `root_company_id = NULL`

---

## Solução Proposta

### Abordagem 1: Correção na Edge Function (Recomendada)
Modificar a `send-employee-invitation` para **vincular o usuário Auth ao perfil existente** ao invés de criar um novo:

**Alterações:**
1. Após criar o usuário Auth, transferir os dados do perfil original para o novo perfil (igual à `activate-employee`)
2. Garantir que o `root_company_id` seja passado corretamente no `user_metadata`
3. Copiar os roles do perfil original
4. Deletar o perfil original para evitar duplicatas

### Abordagem 2: Validação no Frontend (Complementar)
Adicionar lógica no `DashboardLayout` para tratar colaboradores que perderam vínculo:

**Alterações:**
1. Ao detectar `root_company_id = null`, verificar se existe um perfil original com o mesmo email
2. Se encontrar, vincular automaticamente ou direcionar para uma tela de "reconexão"
3. Nunca direcionar colaboradores com role `employee` para o onboarding de empresa

### Abordagem 3: Correção no Trigger (Prevenção)
Modificar o trigger `handle_new_user` para verificar se já existe um perfil com o mesmo email:

**Alterações:**
1. Antes de criar novo perfil, verificar se existe perfil com mesmo email
2. Se existir, atualizar o perfil existente com o novo `id` do Auth

---

## Plano de Implementação

### Fase 1: Correção da Edge Function `send-employee-invitation`
Modificar para que, ao criar um usuário Auth para um colaborador:
- Copie todos os dados do perfil original para o novo perfil criado
- Preserve `root_company_id`, cargo, salário e outros dados
- Copie os roles (`user_roles`) 
- Delete o perfil órfão original

### Fase 2: Correção da Edge Function `activate-employee` 
Revisar a lógica para garantir que não haja conflitos similares no fluxo de ativação manual.

### Fase 3: Validação no DashboardLayout
Adicionar verificação para:
- Se usuário tem role `employee` mas não tem `root_company_id`, buscar perfil pelo email
- Exibir mensagem apropriada caso haja problema de vinculação
- Nunca redirecionar colaboradores para onboarding de empresa

### Fase 4: Script de Correção de Dados
Criar script SQL para corrigir os perfis existentes que estão órfãos:
- Identificar perfis duplicados por email
- Mesclar dados do perfil original para o perfil com Auth
- Limpar perfis órfãos

---

## Seção Técnica

### Arquivos a Modificar

1. **`supabase/functions/send-employee-invitation/index.ts`**
   - Adicionar lógica para copiar dados do perfil original após criar usuário Auth
   - Implementar merge de dados similar ao que existe em `activate-employee`

2. **`src/components/DashboardLayout.tsx`**
   - Modificar a função `fetchProfile` (linhas 126-159)
   - Adicionar verificação: se `root_company_id` for null, verificar se existe perfil com mesmo email que tenha empresa
   - Adicionar tratamento para colaboradores órfãos

3. **`src/pages/Onboarding.tsx`**
   - Adicionar verificação de role do usuário
   - Se for `employee`, não permitir acesso ao onboarding de empresa

### Migração de Banco de Dados
```sql
-- Script para corrigir perfis órfãos existentes
WITH duplicates AS (
  SELECT 
    p1.id as orphan_id,
    p2.id as original_id,
    p2.root_company_id,
    p2.job_title,
    p2.grade,
    p2.salary,
    p2.unit_id
  FROM profiles p1
  JOIN profiles p2 ON p1.email = p2.email AND p1.id != p2.id
  WHERE p1.root_company_id IS NULL 
    AND p2.root_company_id IS NOT NULL
)
UPDATE profiles p
SET 
  root_company_id = d.root_company_id,
  job_title = COALESCE(p.job_title, d.job_title),
  grade = COALESCE(p.grade, d.grade),
  salary = COALESCE(p.salary, d.salary),
  unit_id = COALESCE(p.unit_id, d.unit_id)
FROM duplicates d
WHERE p.id = d.orphan_id;
```

### Fluxo Corrigido

```text
[Colaborador Cadastrado] --> [RH Envia Convite] --> [Edge Function]
                                                          |
                                                          v
                                           [Cria Auth User com metadata]
                                                          |
                                                          v
                                           [Trigger cria novo profile]
                                                          |
                                                          v
                                           [Edge Function copia dados]
                                           [do perfil original + roles]
                                                          |
                                                          v
                                           [Deleta perfil original]
                                                          |
                                                          v
                                    [Colaborador recebe email e define senha]
                                                          |
                                                          v
                                    [Login: DashboardLayout encontra perfil]
                                    [com root_company_id correto]
                                                          |
                                                          v
                                           [Dashboard do Colaborador]
```

