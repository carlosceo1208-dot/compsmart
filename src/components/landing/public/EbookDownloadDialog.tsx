import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle2, Download, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import ebook from "@/assets/ebook-remuneracao-estrategica.pdf.asset.json";

const FILE_NAME = "ebook-remuneracao-estrategica.pdf";
const emailSchema = z.string().trim().email().max(255);

const triggerDownload = () => {
  const a = document.createElement("a");
  a.href = ebook.url;
  a.download = FILE_NAME;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EbookDownloadDialog = ({ open, onOpenChange }: Props) => {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const valid =
    nome.trim().length > 0 &&
    nome.trim().length <= 100 &&
    emailSchema.safeParse(email).success &&
    consent;

  const reset = () => {
    setNome("");
    setEmail("");
    setConsent(false);
    setLoading(false);
    setError(null);
    setDone(false);
  };

  const handleOpenChange = (o: boolean) => {
    if (!o) reset();
    onOpenChange(o);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || loading) return;
    setLoading(true);
    setError(null);
    const { error: rpcError } = await supabase.rpc("capture_ebook_lead", {
      _nome: nome.trim(),
      _email: email.trim().toLowerCase(),
      _origem: "materiais-ebook-remuneracao",
    });
    setLoading(false);
    if (rpcError) {
      setError("Não foi possível concluir. Tente novamente.");
      return;
    }
    setDone(true);
    triggerDownload();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[480px] rounded-2xl bg-background">
        {done ? (
          <div className="text-center py-6 space-y-4">
            <CheckCircle2 className="h-12 w-12 text-primary mx-auto" />
            <h3 className="text-lg font-semibold">
              Pronto! Faça o download do seu e-book.
            </h3>
            <Button onClick={triggerDownload} className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Baixar e-book
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Receber o material</DialogTitle>
              <DialogDescription>
                Informe seus dados para baixar o e-book.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="ebook-nome">Nome*</Label>
                <Input
                  id="ebook-nome"
                  value={nome}
                  maxLength={100}
                  onChange={(e) => setNome(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ebook-email">E-mail corporativo*</Label>
                <Input
                  id="ebook-email"
                  type="email"
                  value={email}
                  maxLength={255}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="flex items-start gap-2">
                <Checkbox
                  id="ebook-consent"
                  checked={consent}
                  onCheckedChange={(v) => setConsent(v === true)}
                  className="mt-0.5"
                />
                <Label htmlFor="ebook-consent" className="text-sm font-normal leading-snug">
                  Concordo em receber conteúdos e contato comercial da
                  CompSmart, conforme a LGPD.
                </Label>
              </div>
              {error && (
                <p role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              )}
              <Button type="submit" className="w-full" disabled={!valid || loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Baixar e-book
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
