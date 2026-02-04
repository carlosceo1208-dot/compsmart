
# Plano: Melhorias na Política de Privacidade

## Resumo das Alterações
Com base na análise comparativa com a política da Sólides, proponho 5 melhorias para a CompSmart.

---

## Alteração 1: Remover Telefone de Contato

**Justificativa:** Padrão de mercado (Sólides faz igual). Evita spam e ligações indesejadas.

**Locais:**
- Seção 10 (DPO) - remover linha do telefone
- Seção 12 (Contato) - remover linha do telefone

---

## Alteração 2: Adicionar Glossário de Termos

**Justificativa:** Ajuda usuários leigos a entender conceitos técnicos.

**Posição:** Nova seção após a Introdução (antes da Seção 2)

**Conteúdo:**
```
1.1 Definições

"Dados Pessoais": informações relacionadas à pessoa natural identificada 
ou identificável (nome, e-mail, CPF, etc.)

"Cookies": pequenos arquivos salvos no navegador para lembrar preferências

"Controlador": empresa cliente que decide sobre o tratamento dos dados 
de seus colaboradores

"Operador": a CompSmart, que processa dados conforme instruções do cliente

"LGPD": Lei Geral de Proteção de Dados (Lei nº 13.709/2018)
```

---

## Alteração 3: Adicionar Seção "Crianças e Adolescentes"

**Justificativa:** Compliance essencial. Sólides possui essa seção.

**Posição:** Nova seção 5 (renumerar subsequentes)

**Conteúdo:**
```
5. Tratamento de Dados de Crianças e Adolescentes

A CompSmart não coleta nem processa intencionalmente dados pessoais 
de crianças e adolescentes menores de 18 anos. Nossa plataforma é 
destinada exclusivamente a ambientes corporativos e profissionais.

Caso identifiquemos que dados de menores foram inseridos 
inadvertidamente, estes serão prontamente eliminados.
```

---

## Alteração 4: Especificar Provedor de Infraestrutura

**Justificativa:** Transparência técnica (Sólides menciona AWS).

**Local:** Seção 6.2 (Localização)

**De:**
> Os dados são armazenados em servidores localizados no Brasil ou em data centers certificados...

**Para:**
> Os dados são armazenados em infraestrutura de nuvem segura (Lovable Cloud/AWS), com data centers que garantem conformidade com a LGPD e certificações de segurança internacionais.

---

## Alteração 5: Atualizar Data

**Local:** Subtítulo inicial

**De:** "Última atualização: 26 de novembro de 2025"  
**Para:** "Última atualização: 04 de fevereiro de 2026"

---

## Arquivos a Modificar

| Arquivo | Alterações |
|---------|------------|
| `src/pages/PrivacyPolicy.tsx` | Todas as 5 alterações acima |

---

## Resultado Esperado

- Política mais completa e profissional
- Alinhamento com práticas de mercado (benchmark Sólides)
- Melhor compliance LGPD
- Contato simplificado (apenas e-mail)
