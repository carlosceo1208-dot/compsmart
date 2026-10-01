import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const NAO = '__nao_informar__';

/** Grupo autodeclarado (opcional). Valor gravado fica como histórico mesmo se sair da lista. */
export function Nr1GrupoSelect({ value, onChange, disabled }: { value: string | null; onChange: (v: string | null) => void; disabled?: boolean }) {
  const { data: grupos = [] } = useQuery({
    queryKey: ['nr1-grupos-empresa'],
    queryFn: async () => {
      const { data } = await supabase.rpc('nr1_grupos_empresa' as any);
      return ((data as { grupo: string }[] | null) ?? []).map((g) => g.grupo);
    },
  });
  const opcoes = value && !grupos.includes(value) ? [...grupos, value] : grupos;
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">Meu grupo (opcional)</label>
      <Select value={value ?? NAO} onValueChange={(v) => onChange(v === NAO ? null : v)} disabled={disabled}>
        <SelectTrigger className="w-full sm:w-72"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value={NAO}>Prefiro não informar</SelectItem>
          {opcoes.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">Usado só para médias de grupos com 5 pessoas ou mais. Ninguém vê o seu grupo nem suas respostas.</p>
    </div>
  );
}
