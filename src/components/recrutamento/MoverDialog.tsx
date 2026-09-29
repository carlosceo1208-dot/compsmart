import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ETAPA_ENTREVISTA, ETAPA_LABEL, type Etapa } from "@/config/recrutamento";

export interface PedidoMover { id: string; nome: string; etapaAtual: Etapa; etapa: Etapa; origem: "agente" | "manual"; agendar?: boolean }

/** Data sugerida: próximo dia útil às 10h, no formato do campo datetime-local. */
const sugestao = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
  d.setHours(10, 0, 0, 0);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

export const MoverDialog = ({ pedido, onClose, onConfirm, enviando }: {
  pedido: PedidoMover | null; onClose: () => void; enviando: boolean;
  onConfirm: (p: PedidoMover, motivo: string, entrevistaEm: string | null) => void;
}) => {
  const [motivo, setMotivo] = useState("");
  const [data, setData] = useState("");
  useEffect(() => { if (pedido) { setMotivo(""); setData(sugestao()); } }, [pedido]);
  if (!pedido) return null;
  const arquivar = pedido.etapa === "arquivado";
  const entrevista = ETAPA_ENTREVISTA.includes(pedido.etapa);
  const titulo = pedido.agendar ? "Agendar entrevista" : arquivar ? "Arquivar candidato" : `Mover para ${ETAPA_LABEL[pedido.etapa]}`;
  const invalido = (arquivar && !motivo.trim()) || (pedido.agendar && !data);

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>{titulo}</DialogTitle>
          <DialogDescription>{pedido.nome}{pedido.origem === "agente" ? " · recomendação do agente Talent" : ""}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {entrevista && (
            <div className="space-y-1.5">
              <Label htmlFor="entrevista-em">Data da entrevista {pedido.agendar ? "" : "(opcional)"}</Label>
              <Input id="entrevista-em" type="datetime-local" value={data} onChange={(e) => setData(e.target.value)} className="rounded-xl" />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="motivo">Motivo {arquivar ? "(obrigatório)" : "(opcional)"}</Label>
            <Textarea id="motivo" value={motivo} onChange={(e) => setMotivo(e.target.value.slice(0, 500))} rows={3} className="rounded-xl"
              placeholder={arquivar ? "Ex.: não atende aos requisitos obrigatórios" : ""} />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" className="rounded-xl" onClick={onClose}>Cancelar</Button>
          <Button className="rounded-xl" disabled={!!invalido || enviando} variant={arquivar ? "destructive" : "default"}
            onClick={() => onConfirm(pedido, motivo.trim(), entrevista && data ? new Date(data).toISOString() : null)}>
            {enviando ? "Salvando…" : "Confirmar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
