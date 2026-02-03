import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { EmployeeSelector } from "@/components/performance/EmployeeSelector";
import { useCompanyContext } from "@/contexts/CompanyContext";
import { supabase } from "@/integrations/supabase/client";
import {
  useCreateFeedbackRequest,
  useSendFeedbackRequest,
  DEFAULT_CUSTOMER_QUESTIONS,
  DEFAULT_SUPPLIER_QUESTIONS,
} from "@/hooks/useExternalFeedbackRequests";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const formSchema = z.object({
  employee_id: z.string().min(1, "Selecione um colaborador"),
  external_name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  external_email: z.string().email("E-mail inválido"),
  external_type: z.enum(["customer", "supplier", "partner", "other"]),
  deadline: z.date({
    required_error: "Selecione uma data limite",
  }),
  custom_message: z.string().optional(),
  use_default_questions: z.boolean().default(true),
});

type FormData = z.infer<typeof formSchema>;

interface ExternalFeedbackRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cycleId?: string;
}

export function ExternalFeedbackRequestDialog({
  open,
  onOpenChange,
  cycleId,
}: ExternalFeedbackRequestDialogProps) {
  const { activeCompanyId } = useCompanyContext();
  const [userId, setUserId] = useState<string | null>(null);
  const [customQuestions, setCustomQuestions] = useState<
    Array<{ id: string; question: string; type: "rating" | "text" }>
  >([]);
  const [sendImmediately, setSendImmediately] = useState(true);

  const createRequest = useCreateFeedbackRequest();
  const sendRequest = useSendFeedbackRequest();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      employee_id: "",
      external_name: "",
      external_email: "",
      external_type: "customer",
      deadline: addDays(new Date(), 14),
      custom_message: "",
      use_default_questions: true,
    },
  });

  const watchExternalType = form.watch("external_type");
  const watchUseDefault = form.watch("use_default_questions");

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setUserId(data.user.id);
      }
    };
    getUser();
  }, []);

  useEffect(() => {
    if (watchUseDefault) {
      if (watchExternalType === "customer") {
        setCustomQuestions(DEFAULT_CUSTOMER_QUESTIONS);
      } else if (watchExternalType === "supplier") {
        setCustomQuestions(DEFAULT_SUPPLIER_QUESTIONS);
      } else {
        setCustomQuestions(DEFAULT_CUSTOMER_QUESTIONS);
      }
    }
  }, [watchExternalType, watchUseDefault]);

  const addCustomQuestion = () => {
    setCustomQuestions([
      ...customQuestions,
      { id: `custom-${Date.now()}`, question: "", type: "rating" },
    ]);
  };

  const removeQuestion = (index: number) => {
    setCustomQuestions(customQuestions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index: number, question: string) => {
    const updated = [...customQuestions];
    updated[index].question = question;
    setCustomQuestions(updated);
  };

  const onSubmit = async (data: FormData) => {
    if (!activeCompanyId || !userId) return;

    try {
      const result = await createRequest.mutateAsync({
        root_company_id: activeCompanyId,
        cycle_id: cycleId,
        employee_id: data.employee_id,
        requested_by: userId,
        external_name: data.external_name,
        external_email: data.external_email,
        external_type: data.external_type,
        deadline: data.deadline.toISOString(),
        template_questions: customQuestions.filter((q) => q.question.trim() !== ""),
        custom_message: data.custom_message || undefined,
      });

      if (sendImmediately && result?.id) {
        await sendRequest.mutateAsync(result.id);
      }

      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating feedback request:", error);
    }
  };

  const externalTypeLabels = {
    customer: "Cliente",
    supplier: "Fornecedor",
    partner: "Parceiro",
    other: "Outro",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">🎯</span>
            Nova Solicitação de Feedback 360°
          </DialogTitle>
          <DialogDescription>
            Solicite feedback de clientes, fornecedores ou parceiros externos sobre um colaborador.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Colaborador */}
            <FormField
              control={form.control}
              name="employee_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Colaborador a ser avaliado</FormLabel>
                  <FormControl>
                    <EmployeeSelector
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Selecione o colaborador..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Dados do Avaliador Externo */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="external_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Avaliador Externo</FormLabel>
                    <FormControl>
                      <Input placeholder="João Silva" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="external_email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail do Avaliador</FormLabel>
                    <FormControl>
                      <Input placeholder="joao@empresa.com" type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="external_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Relacionamento</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(externalTypeLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="deadline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prazo para Resposta</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value
                              ? format(field.value, "PPP", { locale: ptBR })
                              : "Selecione uma data"}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Perguntas */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <FormField
                  control={form.control}
                  name="use_default_questions"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2 space-y-0">
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <FormLabel className="font-normal">
                        Usar perguntas padrão para {externalTypeLabels[watchExternalType]}
                      </FormLabel>
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-3 rounded-lg border p-4 bg-muted/30">
                <Label className="text-sm font-medium">Perguntas do Formulário</Label>
                {customQuestions.map((q, index) => (
                  <div key={q.id} className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground w-6">{index + 1}.</span>
                    <Input
                      value={q.question}
                      onChange={(e) => updateQuestion(index, e.target.value)}
                      placeholder="Digite a pergunta..."
                      className="flex-1"
                      disabled={watchUseDefault}
                    />
                    {!watchUseDefault && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeQuestion(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                ))}
                {!watchUseDefault && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addCustomQuestion}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Pergunta
                  </Button>
                )}
              </div>
            </div>

            {/* Mensagem Personalizada */}
            <FormField
              control={form.control}
              name="custom_message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mensagem Personalizada (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Adicione uma mensagem personalizada que será incluída no e-mail..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Esta mensagem será exibida no corpo do e-mail enviado ao avaliador.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Enviar Imediatamente */}
            <div className="flex items-center gap-2 p-4 rounded-lg bg-primary/5 border border-primary/20">
              <Switch
                id="send-immediately"
                checked={sendImmediately}
                onCheckedChange={setSendImmediately}
              />
              <Label htmlFor="send-immediately" className="flex-1">
                Enviar e-mail imediatamente após criar a solicitação
              </Label>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createRequest.isPending || sendRequest.isPending}
              >
                {createRequest.isPending || sendRequest.isPending
                  ? "Criando..."
                  : sendImmediately
                  ? "Criar e Enviar"
                  : "Criar Solicitação"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
