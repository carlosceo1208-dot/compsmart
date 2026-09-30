# Decisões 1 e 2 + revisão complementar (sem publicar)

## Decisão 1 — Travar a base de pesquisa de mercado
- A base de mercado da CompSmart (10 tabelas globais, 483 linhas) só pode ser lida por empresas com o Insight contratado ou por super admin.
- As tabelas de pesquisa que a própria empresa sobe continuam visíveis para ela (são dados dela).
- Continua valendo que só o super admin sobe ou edita a base global.
- A cópia da base global para a empresa ("Copiar pesquisa") também exige o Insight. Sem isso, a cópia contornaria a trava.
- Efeito colateral: a sugestão de faixa salarial ao abrir uma vaga (Talent) passa a usar só os dados da própria empresa quando não houver Insight. Hoje ela usa também a base global.
- Teste por papel, desfeito ao final:
  - RH de A (sem Insight) vê 0 linhas da base global.
  - A mesma empresa com o Insight ativado temporariamente vê as 483.
  - Super admin vê tudo.
  - Visitante vê 0.
  - RH sem Insight tentando copiar é recusado.

## Decisão 2 — Diagnóstico gratuito: cada envio grava um registro novo
- Reenviar com o mesmo e-mail cria um registro novo com data própria. Nunca sobrescreve o anterior, e o registro da Marli fica intacto.
- A tela de leads agrupa por e-mail: mostra o número de envios e a data do último. Ao expandir, aparecem todos os envios, sem apagar nenhum.
- O limite contra abuso por hora que já existe continua valendo.
- Teste: 2 envios com o mesmo e-mail geram 2 registros com horários diferentes (desfeito ao final).

## Revisão complementar
- Ler uma a uma as 392 regras de acesso, com foco em dado individual sensível: saúde, humor, respostas, salário individual, candidatos, avaliações. Corrigir qualquer brecha nova.
- Comparar as 79 funções liberadas a logados com a rodada anterior e confirmar que nenhuma perdeu a checagem de empresa ou papel.
- Gerar o relatório atualizado em arquivo novo (versão 2).

## Encerramento
- A verificação completa do projeto precisa passar sem erros.
- Conferir que os dados reais estão intactos: os 2 ciclos do NR-1, Carlos, Josue e os 2 registros da Marli.
- Nenhum dado de teste pode ficar gravado.
- Nada será publicado.

## Detalhes técnicos
- Regras de leitura em survey_tables e survey_data: tabela global (root_company_id NULL) exige `has_module('insight')` ou super admin. Tabelas próprias mantêm a regra atual, que já exige a mesma empresa.
- CopySurveyDialog: esconder a origem global sem o Insight. O servidor já recusa pela regra de leitura.
- submit_diagnostico_lead: remover o ramo que atualiza o registro e passar a sempre inserir.
- /admin/leads: agrupar por e-mail no cliente, com contagem e último envio; atualizar src/pages/AGENTS.md.
- Relatório: relatorio-seguranca-final_v2.pdf/.xlsx.
