import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ClipboardCheck } from "lucide-react";
import { LeadForm } from "@/components/landing/public/LeadForm";

interface Props {
  id: string;
  label?: string;
  variant?: "default" | "outline" | "secondary";
  size?: "default" | "sm" | "lg";
  className?: string;
}

/**
 * CTA único do diagnóstico gratuito (hero, simulador, fechamento): grava o lead
 * com origem "diagnostico-home" e leva para a página pública de Maturidade.
 */
export const DiagnosticoCTA = ({
  id,
  label = "Diagnóstico gratuito em 2 min",
  variant = "default",
  size = "lg",
  className,
}: Props) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      <Button id={id} variant={variant} size={size} className={className} onClick={() => setOpen(true)}>
        <ClipboardCheck className="h-4 w-4 mr-2" />
        {label}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg bg-background max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Diagnóstico gratuito</DialogTitle>
            <DialogDescription>
              Informe seus dados para começar. Em seguida você segue para o
              diagnóstico de maturidade da gestão de pessoas.
            </DialogDescription>
          </DialogHeader>
          <LeadForm
            origem="diagnostico-home"
            fields={["empresa", "porte"]}
            submitLabel="Começar o diagnóstico"
            successTitle="Dados recebidos!"
            successMessage="Levando você para o diagnóstico…"
            onSuccess={() => setTimeout(() => navigate("/maturidade"), 1200)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};
