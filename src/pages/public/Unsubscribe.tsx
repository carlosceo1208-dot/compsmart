import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

type State = "loading" | "valid" | "used" | "invalid" | "done" | "error";

const Unsubscribe = () => {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [state, setState] = useState<State>("loading");

  useEffect(() => {
    if (!token) { setState("invalid"); return; }
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`;
    fetch(url, { headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY } })
      .then(async (r) => {
        const j = await r.json().catch(() => ({}));
        if (j?.valid === false && j?.reason === "already_unsubscribed") setState("used");
        else if (r.ok && j?.valid !== false) setState("valid");
        else setState("invalid");
      })
      .catch(() => setState("error"));
  }, [token]);

  const confirm = async () => {
    const { error } = await supabase.functions.invoke("handle-email-unsubscribe", { body: { token } });
    setState(error ? "error" : "done");
  };

  const msg: Record<State, string> = {
    loading: "Verificando...",
    valid: "Deseja deixar de receber e-mails da CompSmart?",
    used: "Este e-mail já foi descadastrado.",
    invalid: "Link inválido ou expirado.",
    done: "Pronto. Você não receberá mais e-mails da CompSmart.",
    error: "Não foi possível concluir agora. Tente novamente mais tarde.",
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="rounded-2xl max-w-md w-full">
        <CardContent className="p-8 text-center space-y-5">
          <p className="text-sm font-bold tracking-wider text-primary">COMPSMART</p>
          <p className="text-lg">{msg[state]}</p>
          {state === "valid" && <Button onClick={confirm}>Confirmar descadastro</Button>}
        </CardContent>
      </Card>
    </div>
  );
};

export default Unsubscribe;
