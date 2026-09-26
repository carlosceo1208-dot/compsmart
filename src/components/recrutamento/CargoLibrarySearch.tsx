import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyContext } from "@/contexts/CompanyContext";

export interface CargoEmpresa {
  kind: "empresa";
  id: string;
  title: string;
  cbo: string;
  main_responsibilities: string | null;
  hard_skills: string | null;
  soft_skills: string | null;
  required_experience: string | null;
  required_education: string | null;
}
export interface CargoCbo { kind: "cbo"; code: string; title: string; family: string | null }
export type CargoSelecionado = CargoEmpresa | CargoCbo;

export const CargoLibrarySearch = ({ onSelect, disabled }: { onSelect: (c: CargoSelecionado) => void; disabled?: boolean }) => {
  const { activeCompanyId } = useCompanyContext();
  const [term, setTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [empresa, setEmpresa] = useState<CargoEmpresa[]>([]);
  const [cbo, setCbo] = useState<CargoCbo[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const t = term.trim().replace(/[%,()]/g, "");
    if (t.length < 2) { setEmpresa([]); setCbo([]); return; }
    const handle = setTimeout(async () => {
      setLoading(true);
      const isCode = /^\d/.test(t);
      const [e, c] = await Promise.all([
        activeCompanyId
          ? supabase.from("job_titles")
              .select("id,title,cbo,main_responsibilities,hard_skills,soft_skills,required_experience,required_education")
              .eq("root_company_id", activeCompanyId).eq("is_active", true)
              .or(isCode ? `cbo.ilike.${t}%` : `title.ilike.%${t}%`).limit(8)
          : Promise.resolve({ data: [] }),
        supabase.from("cbo_codes").select("code,title,family")
          .ilike(isCode ? "code" : "title", isCode ? `${t}%` : `%${t}%`).limit(12),
      ]);
      setEmpresa(((e.data ?? []) as Omit<CargoEmpresa, "kind">[]).map((r) => ({ ...r, kind: "empresa" })));
      setCbo(((c.data ?? []) as Omit<CargoCbo, "kind">[]).map((r) => ({ ...r, kind: "cbo" })));
      setLoading(false);
      setOpen(true);
    }, 300);
    return () => clearTimeout(handle);
  }, [term, activeCompanyId]);

  const pick = (c: CargoSelecionado) => { onSelect(c); setOpen(false); setTerm(""); };

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        value={term}
        disabled={disabled}
        onChange={(e) => setTerm(e.target.value)}
        placeholder="Buscar cargo por nome ou CBO (ex.: Analista de RH, 2524)"
        className="pl-9 rounded-xl"
        aria-label="Buscar cargo na biblioteca"
      />
      {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />}
      {open && (empresa.length > 0 || cbo.length > 0 || !loading) && (
        <div className="absolute z-50 mt-1 w-full max-h-72 overflow-auto rounded-xl border bg-popover shadow-lg">
          {empresa.length > 0 && <p className="px-3 pt-2 text-xs font-semibold text-muted-foreground">Biblioteca da empresa</p>}
          {empresa.map((c) => (
            <button type="button" key={c.id} onClick={() => pick(c)} className="w-full text-left px-3 py-2 hover:bg-accent flex items-center justify-between gap-2">
              <span className="text-sm">{c.title}</span>
              {c.cbo && <Badge variant="secondary" className="rounded-full">{c.cbo}</Badge>}
            </button>
          ))}
          {cbo.length > 0 && <p className="px-3 pt-2 text-xs font-semibold text-muted-foreground">Catálogo CBO completo</p>}
          {cbo.map((c) => (
            <button type="button" key={c.code} onClick={() => pick(c)} className="w-full text-left px-3 py-2 hover:bg-accent flex items-center justify-between gap-2">
              <span className="text-sm">{c.title}</span>
              <Badge variant="outline" className="rounded-full">{c.code}</Badge>
            </button>
          ))}
          {!loading && empresa.length === 0 && cbo.length === 0 && (
            <p className="px-3 py-3 text-sm text-muted-foreground">Nenhum cargo encontrado. Use "Gerar perfil da vaga com IA".</p>
          )}
        </div>
      )}
    </div>
  );
};
