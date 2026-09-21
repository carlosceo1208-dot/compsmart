# Plano — Etapa 2: Dashboard centralizado com gating por módulo

## Confirmação inicial

As funções de backend exigidas para esta etapa existem:
- `get_tenant_modules()` retorna a lista de módulos contratados.
- `has_module(_slug text)` verifica um módulo específico.

A implementação seguirá sem alterações no backend, pagamentos, landing page, checkout ou estrutura de dados.

## O que será alterado

1. **Criar a camada de acesso por módulo no frontend**
   - Adicionar uma forma única de ler os módulos contratados do tenant atual usando `get_tenant_modules()`.
   - Manter o comportamento de administradores e o modo “ver como cliente” coerentes com o painel atual.
   - Trocar, nos cards do dashboard, a lógica de plano/add-on por lógica de módulo contratado.

2. **Atualizar o bloqueio visual dos cards**
   - Card com módulo contratado: ativo e navegável.
   - Card sem módulo contratado: continua visível, com cadeado e CTA “Ativar módulo”.
   - O CTA exibirá o nome legível do módulo vindo do catálogo, por exemplo: “Ativar módulo Clima”, “Ativar módulo Core” ou “Ativar módulo Avaliação de Potencial e Sucessão”.
   - Substituir textos como “Fazer upgrade do plano” por “Ativar módulo”.
   - Preservar o visual atual: cores, cards, sombras, tipografia, botões e hierarquia.

3. **Reorganizar o dashboard executivo sem redesenhar**
   - Manter no topo os widgets globais e KPIs estruturais sempre visíveis.
   - Manter identidade organizacional, orçamento/planejamento, importação/exportação e relatórios rápidos como camada transversal.
   - Exibir abaixo os cards de módulo com gating comercial.
   - Remover o card de monitoramento de segurança do dashboard executivo e deixá-lo apenas na área administrativa para administradores.

4. **Mapear os cards atuais para módulos**
   - `core`: estrutura salarial, cargos, faixas, avaliação de desempenho, pay equity, orçamento ligado à remuneração.
   - `insight`: benchmark, comparação salarial, tendências e defasagem.
   - `match`: descrição de cargos e job matching.
   - `nr1`: saúde mental, bem-estar, riscos psicossociais, diagnóstico NR-1, laudos, PGR, terceiros, vitalidade e plano de ação.
   - `clima`: pesquisa de clima e eNPS.
   - `talent`: vagas e seleção.
   - `evolve`: PDI e trilhas de desenvolvimento.
   - `potencial-sucessao`: 9-Box, sucessão e inteligência de talentos.
   - `rh-service`: consultoria RH Service.

5. **Limpar o módulo NR-1 para refletir o novo desacoplamento**
   - Manter o núcleo legal NR-1 liberado por `nr1`.
   - Bloquear cruzamentos conforme os módulos envolvidos:
     - Clima exige `clima`.
     - 9-Box e sucessão exigem `potencial-sucessao`.
     - Avaliação de desempenho exige `core`.
     - Remuneração & Equidade exige `core` ou `insight`.
   - No dashboard de inteligência NR-1, manter a página visível e bloquear seções específicas sem o módulo necessário.

6. **Preservar áreas administrativas fora do gating comercial**
   - Controle de acesso, permissões e administração permanecem disponíveis para administradores.
   - Segurança e tentativas de login ficam fora do dashboard executivo.

7. **Cards transversais com controle**
   - Jurídico Smart, R&B Smart e People Analytics continuam visíveis no dashboard, mas não ficam liberados por padrão.
   - Esses cards ficam ativos apenas quando o tenant já possuía o serviço ativo antes da migração ou quando tiver o módulo Core contratado.
   - Caso contrário, ficam bloqueados com cadeado e CTA “Conhecer o módulo Core”.
   - Ao concluir, entregar uma lista dos cards que ficaram como transversais para validação.

## Detalhes técnicos

- Criar um hook reutilizável para consultar os módulos contratados e expor helpers como `hasModule('core')` e combinações `any/all`.
- Ler também o catálogo de módulos para usar `modules.nome` nos CTAs de bloqueio, evitando nomes fixos no código.
- Adaptar `PlanGate` ou criar um wrapper equivalente para módulo, mantendo compatibilidade com telas que ainda dependem da regra antiga fora desta etapa.
- Atualizar o dashboard principal e os cards de NR-1 para usar slugs de módulo, não nomes de plano.
- Não tocar em migrações, funções de pagamento, funções de IA, regras de dados, landing page pública ou checkout.

## Validação

- Confirmar que um tenant sem módulo contratado vê cards bloqueados, não ocultos.
- Confirmar que um tenant com módulo contratado navega normalmente.
- Confirmar que widgets globais continuam visíveis.
- Confirmar que o modo “ver como cliente” respeita o gating real do tenant.
- Confirmar que áreas administrativas continuam acessíveis somente aos perfis corretos.
