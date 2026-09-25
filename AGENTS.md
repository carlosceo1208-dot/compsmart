# AGENTS.md
- Leads status values are fixed: novo, em_contato, convertido, descartado (DB check + useAdminLeads). Why: one source of truth for counters and filters.
- "Responder" in /admin/leads sets status em_contato optimistically on mailto click; alternative is manual-only. Why: mailto can't confirm sending.
