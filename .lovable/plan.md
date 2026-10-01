# Acabamento final da Segurança Psicológica — Fase 5B-1

## Objetivo
Concluir os ajustes aprovados de clareza metodológica e gestão por grupo, executar os testes pendentes em ambiente isolado, comprovar a limpeza e entregar a validação final sem publicar.

## Estado confirmado
- A tela ainda exibe **“sem itens”** nas dimensões sem perguntas próprias.
- A planilha e o PDF atuais exportam os agregados, mas ainda não incluem a nota metodológica pedida.
- O gestor sem vínculo recebe hoje uma mensagem genérica; a consulta do servidor já recusa o acesso e registra o motivo.
- O painel de vínculo lista pessoas ativas, mas ainda não oferece indicador/filtro específico de gestores sem grupo. Na empresa real consultada existem 2 gestores e ambos estão sem grupo; isso será apenas usado como conferência, sem alteração nesses registros.
- A correlação já está protegida pela contratação do Clima, e toda a área interna do NR-1 já está protegida pela contratação do NR-1.
- Contagens atuais de referência: auditoria NR-1 1, auditoria geral 2, respostas COPSOQ 440, respostas de Segurança Psicológica 0 e 18 logins.

## Ajustes de produto
1. **Dimensões não avaliadas**
   - Substituir “sem itens” por **“Não avaliada nesta escala — consulte o diagnóstico COPSOQ”** em Demandas e Saúde.
   - Manter essas dimensões fora do cálculo da escala de Segurança Psicológica.
   - Incluir no PDF e na planilha uma nota curta informando que Demandas e Saúde são avaliadas pelo diagnóstico COPSOQ.

2. **Gestor sem grupo**
   - Manter a recusa no servidor e o registro de auditoria, sem inferir equipe por colaborador e sem enfraquecer o anonimato.
   - Mostrar ao gestor: **“Seu acesso será liberado quando o RH vincular sua equipe a um grupo.”**
   - No painel do RH, identificar somente usuários com papel de gestor, mostrar a quantidade sem vínculo e permitir filtrar essa lista antes da vinculação.
   - Preservar o isolamento por empresa e impedir que o indicador exponha gestores de outra empresa.

3. **Documentação interna**
   - Atualizar as regras do módulo para registrar as dimensões não avaliadas, o comportamento do gestor sem grupo e a exportação exclusivamente agregada.
   - Atualizar a pendência da Fase 5B-1 no roteiro do projeto sem mexer nos demais itens.

## Validação obrigatória
1. Registrar as contagens iniciais e os dados reais protegidos: ciclos, Carlos, Josue, os 2 registros da Marli e total de logins.
2. Criar um ciclo, grupo, gestor, convites e respostas exclusivamente temporários em uma empresa fictícia de teste, sem usar as empresas reais A ou B.
3. Executar o questionário completo COPSOQ + 11 perguntas de Segurança Psicológica no navegador:
   - fluxo completo em 1280 px;
   - fluxo completo em 390 px;
   - resultado individual exibido somente na tela final;
   - recarregar/sair e confirmar que o resultado individual não pode ser recuperado;
   - confirmar ausência de identidade nas respostas armazenadas.
4. Gerar respostas temporárias suficientes para atingir o mínimo de 5 no grupo, mantendo ao menos um fluxo completo em cada largura.
5. Baixar e abrir de fato a planilha e o PDF:
   - somente números agregados;
   - nenhum microdado ou identificação;
   - nota metodológica presente;
   - nenhum grupo abaixo de 5 exposto.
6. Validar acessos:
   - gestor vinculado vê apenas seu grupo elegível;
   - gestor sem grupo recebe a nova mensagem e não vê resultados;
   - RH vê o indicador/filtro e consegue vincular antes dos convites;
   - empresa sem NR-1 vê o cadeado;
   - com Clima contratado, o atalho abre a correlação existente;
   - sem Clima, a correlação permanece bloqueada com convite de contratação.
7. Remover integralmente empresa, ciclo, convites, respostas, vínculos, usuários e demais registros temporários criados para o teste.
8. Repetir as contagens e confirmar igualdade com a linha de base, inclusive 0 respostas reais de Segurança Psicológica, 18 logins e preservação de Carlos, Josue, Marli e dos dois ciclos reais.
9. Executar a verificação completa do projeto e revisar visualmente os prints de 1280 px e 390 px.

## Entrega
- Tabela **esperado × obtido** para cada ajuste e teste.
- Prints dos novos rótulos, estado do gestor sem grupo, indicador/filtro do RH, questionário e travas.
- Planilha e PDF temporários abertos e conferidos; sem incorporar dados de teste ao produto.
- Contagens antes e depois da limpeza.
- Lista objetiva de qualquer ressalva restante.
- **Nada será publicado nesta rodada; a publicação continuará aguardando aprovação explícita.**

## Critérios de aceite
- Demandas e Saúde aparecem com o texto aprovado e não entram no score próprio.
- Exportações contêm só agregados e a nota COPSOQ.
- Gestor sem vínculo permanece sem acesso e recebe orientação clara.
- RH identifica gestores sem grupo sem vazamento entre empresas.
- Questionário completo funciona em desktop e celular.
- Travas de NR-1 e Clima permanecem corretas.
- Dados temporários são totalmente removidos e os dados reais ficam intactos.
- Verificação do projeto sem erros e nenhuma publicação realizada.
