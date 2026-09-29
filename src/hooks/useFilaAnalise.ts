import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useCompanyContext } from "@/contexts/CompanyContext";
import { AnaliseErro, chamarAnalise } from "@/hooks/useTriagem";

export type StatusFila = "fila" | "analisando" | "ok" | "erro";
export interface ItemFila { status: StatusFila; erro?: string; code?: string | number; lento?: boolean }
export interface Lote { total: number; ok: number; falhas: number; semTexto: number; ativo: boolean }

const MAX_EM_VOO = 2;
const LENTO_MS = 60_000;
const LOTE_VAZIO: Lote = { total: 0, ok: 0, falhas: 0, semTexto: 0, ativo: false };

/**
 * Fila de análises do agente Talent. Status por candidatura num Map estável (não depende da ordem da lista).
 * Máx. 2 pedidos em voo; o aviso de 60s é só visual. 402/429 pausa tudo sem reenvio automático.
 */
export const useFilaAnalise = (vagaId: string | null) => {
  const qc = useQueryClient();
  const { activeCompanyId } = useCompanyContext();
  const [itens, setItens] = useState<Map<string, ItemFila>>(new Map());
  const [lote, setLote] = useState<Lote>(LOTE_VAZIO);
  const [pausa, setPausa] = useState<string | null>(null);
  const fila = useRef<string[]>([]);
  const emVoo = useRef(0);
  const geracao = useRef(0);
  const pausado = useRef(false);

  const set = useCallback((id: string, v: ItemFila | null) => setItens((m) => {
    const n = new Map(m); if (v) n.set(id, v); else n.delete(id); return n;
  }), []);

  // Trocar de empresa: descarta o estado visual; respostas antigas são ignoradas.
  useEffect(() => {
    geracao.current++; fila.current = []; emVoo.current = 0; pausado.current = false;
    setItens(new Map()); setLote(LOTE_VAZIO); setPausa(null);
  }, [activeCompanyId]);

  // Trocar de vaga: o que ainda não começou sai da fila; o que está em voo conclui e grava.
  useEffect(() => {
    const retirados = fila.current; fila.current = [];
    if (retirados.length) setItens((m) => { const n = new Map(m); retirados.forEach((id) => n.delete(id)); return n; });
    setLote((l) => ({ ...l, total: l.total - retirados.length }));
  }, [vagaId]);

  const bombear = useCallback(() => {
    const g = geracao.current;
    while (!pausado.current && emVoo.current < MAX_EM_VOO && fila.current.length) {
      const id = fila.current.shift()!;
      emVoo.current++;
      set(id, { status: "analisando" });
      const t = setTimeout(() => { if (g === geracao.current) setItens((m) => {
        const it = m.get(id); if (it?.status !== "analisando") return m;
        const n = new Map(m); n.set(id, { ...it, lento: true }); return n;
      }); }, LENTO_MS);
      chamarAnalise(id)
        .then(() => {
          if (g !== geracao.current) return;
          set(id, { status: "ok" });
          setLote((l) => ({ ...l, ok: l.ok + 1 }));
        })
        .catch((e: unknown) => {
          if (g !== geracao.current) return;
          const err = e instanceof AnaliseErro ? e : new AnaliseErro("Falha na análise.");
          set(id, { status: "erro", erro: err.message, code: err.code });
          setLote((l) => ({ ...l, falhas: l.falhas + (err.code === "pdf_sem_texto" ? 0 : 1), semTexto: l.semTexto + (err.code === "pdf_sem_texto" ? 1 : 0) }));
          if (err.code === 402 || err.code === 429) {
            pausado.current = true;
            setPausa(err.message);
            const parados = fila.current; fila.current = [];
            setItens((m) => { const n = new Map(m); parados.forEach((p) => n.set(p, { status: "erro", erro: "Fila pausada. Tente novamente depois." })); return n; });
            setLote((l) => ({ ...l, falhas: l.falhas + parados.length }));
          }
        })
        .finally(() => {
          clearTimeout(t);
          if (g !== geracao.current) return;
          emVoo.current--;
          qc.invalidateQueries({ queryKey: ["triagem"] });
          if (emVoo.current === 0 && !fila.current.length) setLote((l) => ({ ...l, ativo: false }));
          bombear();
        });
    }
  }, [qc, set]);

  /** Enfileira ids (já na ordem desejada). Ignora quem já está na fila/em análise. */
  const enfileirar = useCallback((ids: string[], comoLote = false) => {
    const novos = ids.filter((id) => {
      const s = itens.get(id)?.status;
      return s !== "fila" && s !== "analisando" && !fila.current.includes(id);
    });
    if (!novos.length) return;
    pausado.current = false; setPausa(null);
    fila.current.push(...novos);
    setItens((m) => { const n = new Map(m); novos.forEach((id) => n.set(id, { status: "fila" })); return n; });
    setLote((l) => comoLote || !l.ativo
      ? { total: novos.length + (l.ativo ? l.total : 0), ok: l.ativo ? l.ok : 0, falhas: l.ativo ? l.falhas : 0, semTexto: l.ativo ? l.semTexto : 0, ativo: true }
      : { ...l, total: l.total + novos.length });
    bombear();
  }, [itens, bombear]);

  const ocupado = lote.ativo;
  return { itens, lote, pausa, enfileirar, ocupado };
};
