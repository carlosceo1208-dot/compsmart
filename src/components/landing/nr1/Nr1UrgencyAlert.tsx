import { AlertTriangle } from "lucide-react";

/** Selo de alerta da NR-1 na primeira linha do topo da Home (não é uma faixa). */
export const UrgencyBanner = () => (
  <p
    role="note"
    className="inline-flex items-start gap-2 rounded-full border border-destructive/30 bg-destructive/10 px-4 py-2 text-left text-xs font-semibold text-destructive md:text-sm"
  >
    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
    <span>
      Fiscalização da NR-1 começou. Portaria MTE 1.419/2024 — riscos
      psicossociais agora fazem parte do PGR.
    </span>
  </p>
);
