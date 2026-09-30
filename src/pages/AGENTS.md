# AGENTS.md — páginas
- /admin/leads: cada envio é um registro (diagnóstico nunca sobrescreve); lista agrupa por e-mail com "N envios". Status fixos novo/em_contato/convertido/descartado; "Responder" marca em_contato ao abrir mailto; junta `leads` (submitted_at) + `nr1_leads` (created_at, somente leitura); datas não editáveis. Why: fonte única e Data = última submissão real.
