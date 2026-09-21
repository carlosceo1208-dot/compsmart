# Página do módulo RH Service

## Objetivo
Criar a experiência do RH Service em `/rh-service`, conectada à estrutura já existente, preservando o visual e a navegação atuais. A entrega será somente no frontend.

## Implementação

### 1. Rota, card e controle de acesso
- Criar a página `RhService` e carregá-la sob o layout autenticado já usado pelo dashboard.
- Proteger `/rh-service` com o `ModuleGate` existente para `rh-service`, exibindo cadeado e CTA **“Ativar módulo RH Service”** quando não contratado.
- Alterar o card RH Service do dashboard, que hoje aponta para `/dashboard`, para abrir `/rh-service` quando liberado.
- Restringir o conteúdo a:
  - cliente: `admin` e `hr_manager`, em modo de consulta;
  - equipe CompSmart: `super_admin` e `consultor`, com os controles de escrita permitidos.
- Impedir que `manager` e `employee` carreguem os dados da página e mostrar uma mensagem clara de acesso restrito.

### 2. Camada de dados do RH Service
- Criar hooks com cache e chaves por empresa ativa para consultar consultores, projetos, horas, diagnósticos, scores e recomendações.
- Filtrar todas as consultas por `activeCompanyId`, além da proteção já aplicada pelo banco.
- Buscar os vínculos necessários para exibir nomes de consultores/projetos e nomes legíveis dos módulos recomendados.
- Reconhecer o papel `consultor` apenas dentro do RH Service, por meio de um verificador local do módulo (`isRhServiceEditor`, verdadeiro para `super_admin` ou `consultor`), usado somente na página `/rh-service` e em seus hooks.
- Não alterar o reconhecimento global de papéis: o consultor continua sem acesso a salários, desempenho, NR-1, clima e demais módulos.
- Disponibilizar mutações apenas para `super_admin`/`consultor`:
  - cadastrar e editar consultores, inclusive situação ativo/inativo;
  - cadastrar e editar projetos e seu status;
  - registrar e editar horas por projeto.
- Manter diagnósticos, scores e recomendações em consulta nesta etapa; a aplicação do questionário não faz parte deste pedido.

### 3. Página e seções
- Criar cabeçalho do módulo e navegação por abas responsiva, seguindo os componentes e tokens visuais existentes.
- **Consultores:** nome, especialidade, e-mail, bio e situação; ações de cadastro/edição somente para a equipe CompSmart.
- **Projetos:** título, consultor responsável, status, horas estimadas, valor negociado e datas; cliente somente visualiza.
- **Horas:** projeto, consultor, quantidade, descrição e data; equipe CompSmart pode registrar/editar.
- **Diagnósticos:** lista com projeto/consultor vinculados, status e maturidade geral.
- **Detalhe do diagnóstico:** abrir cada diagnóstico em painel lateral ou janela, mostrando as práticas com score de 0–100 e nível, e os módulos recomendados com nome legível, origem (`automática`, `editada`, `manual`) e justificativa. Admin e RH do cliente também podem abrir o detalhe, em modo de consulta.
- Usar tabelas em telas amplas e apresentação compacta em telas menores, sem alterar o design global.

### 4. Formatação e estados
- Formatar `valor_negociado` com o formatador monetário brasileiro já existente.
- Formatar horas e datas com os utilitários/padrões do projeto.
- Não renderizar valor nem horas para papéis fora do público autorizado; esses papéis também não executarão as consultas protegidas.
- Incluir carregamento, vazio, erro e confirmação das ações, sem inventar dados quando não houver registros.

## Validação
- Testar o bloqueio do módulo, o bloqueio por papel e a diferença entre leitura do cliente e escrita da equipe CompSmart.
- Validar a navegação pelo card até `/rh-service`.
- Validar abas, estados vazios e registros existentes em tamanhos desktop e móvel.
- Executar os testes relevantes, verificação de tipos e confirmar a compilação da prévia.

## Fora do escopo
- Nenhuma alteração no banco, pagamentos, checkout ou landing page.
- Nenhuma criação/aplicação do questionário de diagnóstico nesta etapa.
