import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Calendar } from "lucide-react";
import { LeadForm } from "./LeadForm";

interface DemoDialogProps {
  triggerLabel?: string;
  moduloInteresse?: string;
  variant?: "default" | "outline" | "secondary";
  size?: "default" | "sm" | "lg";
  className?: string;
}

export const DemoDialog = ({
  triggerLabel = "Agendar demonstração",
  moduloInteresse,
  variant = "default",
  size = "default",
  className,
}: DemoDialogProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <Calendar className="h-4 w-4 mr-2" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg bg-background max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Agendar demonstração</DialogTitle>
          <DialogDescription>
            Conte um pouco sobre a sua empresa e nosso time entra em contato
            para agendar a demonstração.
          </DialogDescription>
        </DialogHeader>
        <LeadForm
          origem="demo"
          moduloInteresse={moduloInteresse}
          fields={["empresa", "cargo", "porte", "mensagem"]}
          submitLabel="Quero a demonstração"
          successTitle="Solicitação enviada!"
          successMessage="Entramos em contato em até 1 dia útil para agendar a demonstração."
        />
      </DialogContent>
    </Dialog>
  );
};
