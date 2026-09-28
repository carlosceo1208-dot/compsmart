# Marca empregadora na vaga (logo + "Sobre a empresa" + faixa salarial destacada)

## O que o RH vai ver no cadastro da vaga
- Nova seção **"Visibilidade no portal"**, em destaque:
  - Opção **"Exibir faixa salarial no portal"**, desligada por padrão, com o texto de apoio do briefing.
  - Em vaga confidencial, a opção fica bloqueada com o aviso "Vagas confidenciais nunca exibem faixa salarial." (e é desligada automaticamente).
- **Logo da empresa** (opcional, só vaga pública): PNG, JPG ou WebP até 2 MB, com prévia, "Trocar" e "Remover". Arquivo de outro tipo ou maior é recusado com mensagem clara.
- **"Conte quem é a empresa"** (opcional, só vaga pública): até 600 caracteres, com contador e a dica do briefing.
- Ao mudar a vaga para confidencial, logo e texto ficam ocultos e deixam de ser enviados ao portal.

## O que o candidato vai ver
- **Lista /vagas**: logo ao lado do título; sem logo, círculo com a inicial da empresa. Vaga que esconde o nome continua "Empresa confidencial", sem logo.
- **Página da vaga**: cabeçalho com logo + nome da empresa + etiquetas; logo abaixo, o bloco "Sobre a empresa"; depois a descrição e o formulário (mantido igual: PDF, LGPD, anti-robô).
- Faixa salarial só aparece quando a opção estiver ligada.

## Regra de proteção
Logo e "Sobre a empresa" só chegam ao navegador quando a vaga é pública **e** mostra o nome da empresa. Se o nome estiver oculto, o logo também fica oculto, para não revelar a empresa pela imagem.

## Testes (desktop e celular)
1. Criar vaga pública: faixa desligada por padrão; logo PNG aceito; arquivo .exe recusado; texto salvo.
2. /vagas: logo no card; vaga sem logo mostra a inicial.
3. Página da vaga: logo, nome e "Sobre a empresa" visíveis; faixa conforme a opção.
4. Vaga confidencial: sem logo, sem texto, sem faixa; link direto funciona.
5. Trocar e remover logo e texto refletem na página.
6. Isolamento: outra empresa não grava nem altera logo/texto (simulação no banco).
7. Candidatura de ponta a ponta continua funcionando; checagem completa (lint, tipos, testes, dead-code, build) passando. Dados de teste apagados ao final.

## Detalhes técnicos
- Migração: `vagas` ganha `logo_path text` e `sobre_empresa text` (check ≤ 600); check `NOT (visibilidade='confidencial' AND exibir_faixa)`.
- Armazenamento: novo espaço público `logos-vagas` (limite 2 MB, tipos png/jpeg/webp), caminho `{root_company_id}/{vaga_id}.{ext}`. Políticas em storage.objects: INSERT/UPDATE/DELETE só para admin/hr_manager cuja `get_user_company_id()` = primeira pasta; leitura pública do arquivo (imagem de marca, sem dado pessoal). Validação de tipo/tamanho no cliente e pelo próprio limite do espaço no servidor.
- `portal_listar_vagas` / `portal_vaga`: retornam `logo_url` e `sobre_empresa` apenas quando `visibilidade='publica' AND exibir_nome_empresa`; senão null. Faixa continua dependente de `exibir_faixa`.
- Front: `VagaDialog.tsx` (seção de visibilidade, upload, texto), `useVagas.ts` (campos + upload/remoção), `VagasPortal.tsx` e `VagaPublica.tsx` (cabeçalho, fallback com inicial, alt "Logo [empresa]").
- Registrar em roadmap.md e AGENTS.md.
