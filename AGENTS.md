# AGENTS.md
- SEO público só por src/config/seoRoutes.ts (SeoHead + seoPlugin). Why: Helmet, sitemap e prerender alinhados.
- Anti-robô: site key pública em TurnstileWidget.tsx, segredo TURNSTILE_SECRET_KEY; sem token o botão não libera, falha vira "Tentar novamente". Why: evitar trava em "Verificando…".
- Maturidade: nível via nivelDoScore; público só por RPCs limitadas; sem leitura direta de respostas; médias via maturidade_pode_gerir; gestores "Gestor N". Why: LGPD.
- Consultor só acessa empresa onde é dono de projeto ativo em andamento (consultor_dono_ativo em maturidade_pode_gerir, has_consultor_modulo_access, rh_service_can_read/write). Why: decisão dos sócios.
- NR-1: 4 etapas; Psi só agregado k≥5; cruzamentos só com os módulos de origem. Why: LGPD.
- Travas de módulo: só super admin passa (exceto 'ver como cliente'); Core sempre ativo; has_module no banco igual. Why: cliente não vê módulo não contratado.
- Funções do servidor com id de empresa/unidade/colaborador checam dentro via rh_admin_da_empresa; gatilhos (pg_trigger_depth>0) passam. Why: sem vazamento entre empresas.
- Detalhes: supabase/functions/AGENTS.md (Talent), src/pages/AGENTS.md (leads).
