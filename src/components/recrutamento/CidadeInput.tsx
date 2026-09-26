import { useEffect, useId, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { useCidadesIBGE } from "@/hooks/useCidadesIBGE";

const norm = (t: string) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

/** Cidade dependente da UF (lista do IBGE com busca; texto livre se a API falhar). */
export const CidadeInput = ({ uf, value, onChange, disabled }: { uf: string; value: string; onChange: (v: string) => void; disabled?: boolean }) => {
  const id = useId();
  const { data: cidades = [], isError, isLoading } = useCidadesIBGE(uf || null);
  const [termo, setTermo] = useState(value);
  useEffect(() => { const h = setTimeout(() => setTermo(value), 250); return () => clearTimeout(h); }, [value]);
  const opcoes = useMemo(() => {
    const t = norm(termo.trim());
    return (t ? cidades.filter((c) => norm(c).includes(t)) : cidades).slice(0, 50);
  }, [cidades, termo]);
  return (
    <>
      <Input
        aria-label="Cidade"
        list={isError ? undefined : id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={120}
        disabled={disabled || !uf}
        placeholder={!uf ? "Escolha o estado primeiro" : isLoading ? "Carregando cidades..." : "Digite para buscar"}
      />
      {!isError && <datalist id={id}>{opcoes.map((c) => <option key={c} value={c} />)}</datalist>}
    </>
  );
};
