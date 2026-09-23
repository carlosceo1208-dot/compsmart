import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  usePublicLead,
  PORTE_OPTIONS,
  type LeadOrigem,
} from "@/hooks/usePublicLead";

export type LeadFormField =
  | "empresa"
  | "cargo"
  | "porte"
  | "modulo_interesse"
  | "mensagem"
  | "linkedin"
  | "parceria_tipo"
  | "especialidade";

interface LeadFormProps {
  origem: LeadOrigem;
  fields?: LeadFormField[];
  leadMagnet?: string;
  moduloInteresse?: string;
  submitLabel?: string;
  successTitle?: string;
  successMessage?: string;
  onSuccess?: () => void;
}

export const LeadForm = ({
  origem,
  fields = ["empresa", "cargo", "porte"],
  leadMagnet,
  moduloInteresse,
  submitLabel = "Enviar",
  successTitle = "Recebemos seu contato!",
  successMessage = "Nosso time responde em até 1 dia útil pelo e-mail informado.",
  onSuccess,
}: LeadFormProps) => {
  const { mutateAsync, isPending } = usePublicLead();
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({
    nome: "",
    email: "",
    empresa: "",
    cargo: "",
    porte: "",
    mensagem: "",
    linkedin: "",
    parceria_tipo: "",
    especialidade: "",
  });

  const has = (f: LeadFormField) => fields.includes(f);
  const set = (k: keyof typeof form, v: string) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome.trim() || !form.email.trim()) {
      toast.error("Informe seu nome e e-mail.");
      return;
    }
    if (has("parceria_tipo") && !form.parceria_tipo) {
      toast.error("Escolha o tipo de parceria.");
      return;
    }
    try {
      await mutateAsync({
        nome: form.nome,
        email: form.email,
        empresa: form.empresa,
        cargo: form.cargo,
        porte: form.porte,
        modulo_interesse: moduloInteresse ?? null,
        lead_magnet: leadMagnet ?? null,
        origem,
        linkedin: form.linkedin,
        parceria_tipo:
          (form.parceria_tipo as "indicacao" | "consultor" | "ambos") || null,
        especialidade: has("mensagem")
          ? form.especialidade || form.mensagem
          : form.especialidade,
      });
      setDone(true);
      onSuccess?.();
    } catch {
      toast.error("Não foi possível enviar agora. Tente novamente em instantes.");
    }
  };

  if (done) {
    return (
      <div className="text-center py-8 space-y-3">
        <CheckCircle2 className="h-12 w-12 text-[#16A34A] mx-auto" />
        <h3 className="text-lg font-semibold">{successTitle}</h3>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          {successMessage}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor={`${origem}-nome`}>Nome*</Label>
          <Input
            id={`${origem}-nome`}
            value={form.nome}
            onChange={(e) => set("nome", e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${origem}-email`}>E-mail profissional*</Label>
          <Input
            id={`${origem}-email`}
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            required
          />
        </div>
        {has("empresa") && (
          <div className="space-y-1.5">
            <Label htmlFor={`${origem}-empresa`}>Empresa</Label>
            <Input
              id={`${origem}-empresa`}
              value={form.empresa}
              onChange={(e) => set("empresa", e.target.value)}
            />
          </div>
        )}
        {has("cargo") && (
          <div className="space-y-1.5">
            <Label htmlFor={`${origem}-cargo`}>Cargo</Label>
            <Input
              id={`${origem}-cargo`}
              value={form.cargo}
              onChange={(e) => set("cargo", e.target.value)}
            />
          </div>
        )}
        {has("porte") && (
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Porte da empresa</Label>
            <Select value={form.porte} onValueChange={(v) => set("porte", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                {PORTE_OPTIONS.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        {has("parceria_tipo") && (
          <div className="space-y-1.5">
            <Label>Tipo de parceria*</Label>
            <Select
              value={form.parceria_tipo}
              onValueChange={(v) => set("parceria_tipo", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="indicacao">Indique e ganhe</SelectItem>
                <SelectItem value="consultor">Atuar como consultor</SelectItem>
                <SelectItem value="ambos">Ambos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        {has("especialidade") && (
          <div className="space-y-1.5">
            <Label htmlFor={`${origem}-esp`}>
              Área de especialidade (se consultor)
            </Label>
            <Input
              id={`${origem}-esp`}
              placeholder="Remuneração, NR-1, clima, cargos…"
              value={form.especialidade}
              onChange={(e) => set("especialidade", e.target.value)}
            />
          </div>
        )}
        {has("linkedin") && (
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor={`${origem}-li`}>LinkedIn</Label>
            <Input
              id={`${origem}-li`}
              placeholder="https://www.linkedin.com/in/…"
              value={form.linkedin}
              onChange={(e) => set("linkedin", e.target.value)}
            />
          </div>
        )}
        {has("mensagem") && (
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor={`${origem}-msg`}>Como podemos ajudar?</Label>
            <Textarea
              id={`${origem}-msg`}
              rows={4}
              value={form.mensagem}
              onChange={(e) => set("mensagem", e.target.value)}
            />
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Ao enviar, você concorda com o uso dos seus dados para contato
        comercial, conforme a LGPD.
      </p>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        {submitLabel}
      </Button>
    </form>
  );
};
