# Fase 8 — Dossiê: Importações da Matriz (ciclo de conferência)
Escopo: opção A (conferência). Integração com a Matriz de Risco (opção B) = incremento futuro.
- Status: pendente → conferido | rejeitado; sem reabertura. Gatilho nr1_importacao_transicao.
- Trilha: conferido_por/conferido_em gravados só pelo servidor (valores da tela ignorados).
- Acesso: nr1_importacao_pode_gerir (RH/admin ou consultor dono ativo + has_module nr1).
- Arquivo: link assinado de 10 min, criado no clique; nunca exportado.
## Validação (2026-10-02)
- Banco (desfeito): sem motivo bloqueado; conferir OK; reabrir bloqueado; rejeitar conferida bloqueado; trilha falsa ignorada; hora do servidor.
- Perfis (desfeito): RH=1, outra empresa=0, consultor ativo=1, consultor sem projeto=0.
- Tela (testes automáticos): botões só em pendente; rejeitar sem motivo bloqueado.
- Tela 1280/390: página e estado vazio conferidos.
- Rodada final: importação real temporária criada como pendente e removida ao final; PDF e planilha abertos com período, filtro, aviso de fatores sem dados pessoais e explicação do k=5; sem nomes nem URLs; link abriu imediatamente e expirou após 10 minutos (HTTP 400).
- Logins esclarecidos: 190 é o total histórico; 18 corresponde exatamente a setembro de 2026. A nova linha de base usa 190 e ficou igual antes/depois.
- Empresa sem NR-1: a função de gestão exige has_module('nr1'); não existe hoje RH/admin real fora da única empresa com NR-1. O teste temporário ficou bloqueado porque este acesso não pode criar conta nem reassociar perfil; pendência registrada antes da publicação.
