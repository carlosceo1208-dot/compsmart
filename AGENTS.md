# AGENTS.md
- Leads status values are fixed: novo, em_contato, convertido, descartado (DB check + useAdminLeads). Why: one source of truth for counters and filters.
- "Responder" in /admin/leads sets status em_contato optimistically on mailto click; alternative is manual-only. Why: mailto can't confirm sending.
- Public-route SEO (title/description/canonical/sitemap/per-route HTML) comes only from src/config/seoRoutes.ts via SeoHead + seoPlugin in vite.config. Why: crawlers see static HTML; one list keeps Helmet, sitemap and prerender in sync.
