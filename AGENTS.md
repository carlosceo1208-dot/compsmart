# AGENTS.md
- Leads status values are fixed: novo, em_contato, convertido, descartado (DB check + useAdminLeads). Why: one source of truth for counters and filters.
- "Responder" in /admin/leads sets status em_contato optimistically on mailto click; alternative is manual-only. Why: mailto can't confirm sending.
- Public-route SEO (title/description/canonical/sitemap/per-route HTML) comes only from src/config/seoRoutes.ts via SeoHead + seoPlugin in vite.config. Why: crawlers see static HTML; one list keeps Helmet, sitemap and prerender in sync.
- /admin/leads uses submitted_at for `leads` and created_at for `nr1_leads`; form re-submissions bump submitted_at, while admin edits never do. Why: Data must always mean the actual latest form submission.
- /admin/leads merges `leads` + `nr1_leads` client-side; NR-1 rows are read-only (no status column). Why: one panel for all funnels without migrating data.
- Vagas (módulo talent) ficam em `vagas` com tenant root_company_id; cargo novo vindo do CBO entra em job_titles só via RPC talent_link_or_create_job_title. Why: dedupe por CBO/nome no servidor.
- agent-talent envia ao modelo só dados da vaga, com filtro de e-mail/CPF/telefone. Why: LGPD.
