import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { LIKERT } from "@/lib/maturidade";

type Q = { id: string; numero: number; dimensao: number; afirmacao: string };

const MENSAGENS: Record<string, string> = {
  convite_invalido: "Este link não é válido. Confira o endereço recebido ou peça um novo convite ao consultor.",
  convite_expirado: "Este link expirou. Peça um novo convite ao consultor da CompSmart.",
  convite_respondido: "Este questionário já foi respondido. Obrigado!",
  convite_encerrado: "Este diagnóstico já foi encerrado.",
  muitas_tentativas: "Muitas tentativas em pouco tempo. Tente novamente mais tarde.",
};
const msgDoErro = (m: string) => MENSAGENS[Object.keys(MENSAGENS).find((k) => m.includes(k)) ?? ""] ?? "Não foi possível carregar o questionário.";

export default function MaturidadeResponder() {
  const { token = "" } = useParams();
  const [qs, setQs] = useState<Q[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [idx, setIdx] = useState(0);
  const [resp, setResp] = useState<Record<string, number>>({});
  const [enviando, setEnviando] = useState(false);
  const [feito, setFeito] = useState(false);

  useEffect(() => {
    supabase.rpc("maturidade_convite_questoes", { p_token: token }).then(({ data, error }) => {
      if (error) setErro(msgDoErro(error.message));
      else setQs((data ?? []) as Q[]);
    });
  }, [token]);

  const total = qs?.length ?? 0;
  const q = qs?.[idx];
  const completo = qs != null && Object.keys(resp).length === total;

  const enviar = async () => {
    setEnviando(true);
    const { error } = await supabase.rpc("maturidade_convite_responder", { p_token: token, p_respostas: resp });
    setEnviando(false);
    if (error) setErro(msgDoErro(error.message));
    else setFeito(true);
  };

  return (
    <div className="min-h-screen bg-muted/30 py-10 px-4">
      <Helmet><title>Diagnóstico de Maturidade do RH | CompSmart</title><meta name="robots" content="noindex,nofollow" /></Helmet>
      <Card className="max-w-2xl mx-auto rounded-2xl">
        <CardHeader>
          <CardTitle>Diagnóstico de Maturidade do RH</CardTitle>
          <p className="text-sm text-muted-foreground">Autoavaliação do RH conduzida pela consultoria CompSmart. Os resultados são apresentados apenas de forma agregada.</p>
        </CardHeader>
        <CardContent>
          {erro ? (
            <div className="flex gap-3 rounded-xl border p-4"><AlertCircle className="h-5 w-5 text-destructive shrink-0" /><p className="text-foreground">{erro}</p></div>
          ) : feito ? (
            <div className="flex gap-3 rounded-xl border p-4"><CheckCircle2 className="h-5 w-5 text-primary shrink-0" /><p className="text-foreground">Respostas enviadas. Obrigado pela participação!</p></div>
          ) : !qs ? (
            <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : (
            <>
              <div className="flex justify-between text-xs text-muted-foreground mb-2"><span>Afirmação {idx + 1} de {total}</span><span>{Object.keys(resp).length} respondidas</span></div>
              <Progress value={(Object.keys(resp).length / total) * 100} className="h-2" />
              <p className="mt-6 text-lg font-medium text-foreground leading-snug">{q!.afirmacao}</p>
              <div className="mt-6 grid gap-2">
                {LIKERT.map((o) => (
                  <Button key={o.v} variant={resp[q!.id] === o.v ? "default" : "outline"} className="justify-start h-auto py-3"
                    onClick={() => { setResp({ ...resp, [q!.id]: o.v }); if (idx + 1 < total) setIdx(idx + 1); }}>
                    <span className="w-6 font-semibold">{o.v}</span> {o.label}
                  </Button>
                ))}
              </div>
              <div className="mt-4 flex justify-between">
                <Button variant="ghost" size="sm" disabled={idx === 0} onClick={() => setIdx(idx - 1)}>← Anterior</Button>
                {completo && <Button onClick={enviar} disabled={enviando}>{enviando ? "Enviando…" : "Enviar respostas"}</Button>}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
