import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useVagas } from "@/hooks/useVagas";
import { upsertCandidato } from "@/hooks/useCandidatos";
import { validarColagem } from "@/lib/importarCandidatos";
import { IMPORTACAO_MAX_LINHAS } from "@/config/recrutamento";

interface Resultado { linha: number; email: string; ok: boolean; msg: string }

export const ImportarCandidatosDialog = ({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) => {
  const [texto, setTexto] = useState("");
  const [vagaId, setVagaId] = useState("nenhuma");
  const [importando, setImportando] = useState(false);
  const [resultado, setResultado] = useState<Resultado[] | null>(null);
  const { data: vagas = [] } = useVagas();
  const qc = useQueryClient();

  useEffect(() => { if (open) { setTexto(""); setVagaId("nenhuma"); setResultado(null); } }, [open]);
  const linhas = useMemo(() => validarColagem(texto), [texto]);
  const validas = linhas.filter((l) => !l.erro);
  const invalidas = linhas.filter((l) => l.erro);

  const importar = async () => {
    setImportando(true);
    const out: Resultado[] = invalidas.map((l) => ({ linha: l.linha, email: l.email, ok: false, msg: l.erro! }));
    for (const l of validas) {
      try {
        const r = await upsertCandidato({ nome: l.nome, email: l.email, telefone: l.telefone, cargo: "", senioridade: "", observacoes: "",
          vagaIds: vagaId === "nenhuma" ? [] : [vagaId] });
        out.push({ linha: l.linha, email: l.email, ok: true, msg: r.existed ? "Já existia — não duplicado" : "Importado" });
      } catch (e) {
        out.push({ linha: l.linha, email: l.email, ok: false, msg: e instanceof Error ? e.message : "Erro ao importar" });
      }
    }
    out.sort((a, b) => a.linha - b.linha);
    setResultado(out); setImportando(false);
    qc.invalidateQueries({ queryKey: ["candidatos"] }); qc.invalidateQueries({ queryKey: ["candidaturas-contagem"] });
    toast.success(`${out.filter((r) => r.ok).length} candidato(s) processado(s).`);
  };

  const lista = resultado ?? linhas.map((l) => ({ linha: l.linha, email: l.email, ok: !l.erro, msg: l.erro ?? "Pronto para importar" }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader><DialogTitle>Colar da planilha</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Uma linha por candidato: nome;email;telefone</Label>
            <Textarea rows={6} value={texto} disabled={importando || !!resultado} className="rounded-xl font-mono text-sm"
              placeholder={"Maria Souza;maria@email.com;(11) 91234-5678"} onChange={(e) => setTexto(e.target.value)} />
            <p className="text-xs text-muted-foreground">Até {IMPORTACAO_MAX_LINHAS} linhas. Linhas inválidas são sinalizadas e não são importadas.</p>
          </div>
          <div className="space-y-1.5">
            <Label>Vincular a uma vaga (opcional)</Label>
            <Select value={vagaId} onValueChange={setVagaId} disabled={importando || !!resultado}>
              <SelectTrigger className="rounded-xl" aria-label="Vincular a uma vaga"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="nenhuma">Só importar os candidatos</SelectItem>
                {vagas.filter((v) => v.status !== "fechada").map((v) => <SelectItem key={v.id} value={v.id}>{v.titulo}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {lista.length > 0 && (
            <div className="space-y-2">
              <div className="flex gap-2 text-sm">
                <Badge className="rounded-full">{resultado ? resultado.filter((r) => r.ok).length : validas.length} válidas</Badge>
                <Badge variant="destructive" className="rounded-full">{resultado ? resultado.filter((r) => !r.ok).length : invalidas.length} com erro</Badge>
              </div>
              <div className="max-h-60 overflow-y-auto rounded-xl border divide-y text-sm">
                {lista.map((r) => (
                  <div key={r.linha} className="flex items-center justify-between gap-2 px-3 py-2">
                    <span className="truncate"><span className="text-muted-foreground">Linha {r.linha}:</span> {r.email || "—"}</span>
                    <span className={r.ok ? "text-muted-foreground shrink-0" : "text-destructive shrink-0"}>{r.msg}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" className="rounded-xl" onClick={() => onOpenChange(false)} disabled={importando}>{resultado ? "Fechar" : "Cancelar"}</Button>
          {!resultado && (
            <Button className="rounded-xl" onClick={importar} disabled={importando || validas.length === 0}>
              {importando && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Importar {validas.length} válida(s)
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
