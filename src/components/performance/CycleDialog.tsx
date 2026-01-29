import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  type PerformanceCycle,
  type PerformanceCycleInsert,
  evaluationAngleLabels,
  scaleTypeLabels,
} from "@/hooks/usePerformanceCycles";
import type { Enums } from "@/integrations/supabase/types";

const cycleSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  fiscal_year: z.coerce.number().min(2020).max(2100),
  start_date: z.string().min(1, "Data de início é obrigatória"),
  end_date: z.string().min(1, "Data de término é obrigatória"),
  goals_start_date: z.string().optional(),
  goals_end_date: z.string().optional(),
  evaluation_start_date: z.string().optional(),
  evaluation_end_date: z.string().optional(),
  evaluation_angle: z.enum(["90", "180", "360"]),
  scale_type: z.enum(["numeric_1_5", "conceptual", "percentage"]),
  include_competencies: z.boolean(),
  include_probationary: z.boolean(),
  goals_weight: z.coerce.number().min(0).max(100),
  competency_weight: z.coerce.number().min(0).max(100),
});

type CycleFormData = z.infer<typeof cycleSchema>;

interface CycleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cycle?: PerformanceCycle | null;
  onSave: (data: Omit<PerformanceCycleInsert, "root_company_id">) => void;
  isPending?: boolean;
}

export function CycleDialog({
  open,
  onOpenChange,
  cycle,
  onSave,
  isPending,
}: CycleDialogProps) {
  const currentYear = new Date().getFullYear();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CycleFormData>({
    resolver: zodResolver(cycleSchema),
    defaultValues: {
      name: "",
      description: "",
      fiscal_year: currentYear,
      start_date: "",
      end_date: "",
      goals_start_date: "",
      goals_end_date: "",
      evaluation_start_date: "",
      evaluation_end_date: "",
      evaluation_angle: "90",
      scale_type: "numeric_1_5",
      include_competencies: true,
      include_probationary: false,
      goals_weight: 70,
      competency_weight: 30,
    },
  });

  const goalsWeight = watch("goals_weight");
  const includeCompetencies = watch("include_competencies");

  // Auto-update competency weight when goals weight changes
  useEffect(() => {
    if (includeCompetencies) {
      setValue("competency_weight", 100 - goalsWeight);
    }
  }, [goalsWeight, includeCompetencies, setValue]);

  // Reset form when cycle changes
  useEffect(() => {
    if (cycle) {
      reset({
        name: cycle.name,
        description: cycle.description ?? "",
        fiscal_year: cycle.fiscal_year,
        start_date: cycle.start_date,
        end_date: cycle.end_date,
        goals_start_date: cycle.goals_start_date ?? "",
        goals_end_date: cycle.goals_end_date ?? "",
        evaluation_start_date: cycle.evaluation_start_date ?? "",
        evaluation_end_date: cycle.evaluation_end_date ?? "",
        evaluation_angle: cycle.evaluation_angle,
        scale_type: cycle.scale_type,
        include_competencies: cycle.include_competencies ?? true,
        include_probationary: cycle.include_probationary ?? false,
        goals_weight: cycle.goals_weight ?? 70,
        competency_weight: cycle.competency_weight ?? 30,
      });
    } else {
      reset({
        name: "",
        description: "",
        fiscal_year: currentYear,
        start_date: `${currentYear}-01-01`,
        end_date: `${currentYear}-12-31`,
        goals_start_date: `${currentYear}-01-01`,
        goals_end_date: `${currentYear}-03-31`,
        evaluation_start_date: `${currentYear}-11-01`,
        evaluation_end_date: `${currentYear}-12-15`,
        evaluation_angle: "90",
        scale_type: "numeric_1_5",
        include_competencies: true,
        include_probationary: false,
        goals_weight: 70,
        competency_weight: 30,
      });
    }
  }, [cycle, reset, currentYear]);

  const onSubmit = (data: CycleFormData) => {
    onSave({
      name: data.name,
      description: data.description || null,
      fiscal_year: data.fiscal_year,
      start_date: data.start_date,
      end_date: data.end_date,
      goals_start_date: data.goals_start_date || null,
      goals_end_date: data.goals_end_date || null,
      evaluation_start_date: data.evaluation_start_date || null,
      evaluation_end_date: data.evaluation_end_date || null,
      evaluation_angle: data.evaluation_angle as Enums<"performance_evaluation_angle">,
      scale_type: data.scale_type as Enums<"performance_scale_type">,
      include_competencies: data.include_competencies,
      include_probationary: data.include_probationary,
      goals_weight: data.goals_weight,
      competency_weight: data.include_competencies ? data.competency_weight : 0,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {cycle ? "Editar Ciclo" : "Novo Ciclo de Avaliação"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="general">Geral</TabsTrigger>
              <TabsTrigger value="dates">Datas</TabsTrigger>
              <TabsTrigger value="config">Configurações</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4 mt-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Ciclo *</Label>
                  <Input
                    id="name"
                    {...register("name")}
                    placeholder="Ex: Avaliação de Desempenho 2025"
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    {...register("description")}
                    placeholder="Descreva o objetivo deste ciclo..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fiscal_year">Ano Fiscal *</Label>
                    <Input
                      id="fiscal_year"
                      type="number"
                      {...register("fiscal_year")}
                    />
                    {errors.fiscal_year && (
                      <p className="text-sm text-destructive">
                        {errors.fiscal_year.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="evaluation_angle">Ângulo de Avaliação</Label>
                    <Select
                      value={watch("evaluation_angle")}
                      onValueChange={(v) =>
                        setValue("evaluation_angle", v as "90" | "180" | "360")
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.entries(evaluationAngleLabels) as [Enums<"performance_evaluation_angle">, string][]).map(
                          ([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="dates" className="space-y-4 mt-4">
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_date">Início do Ciclo *</Label>
                    <Input
                      id="start_date"
                      type="date"
                      {...register("start_date")}
                    />
                    {errors.start_date && (
                      <p className="text-sm text-destructive">
                        {errors.start_date.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="end_date">Término do Ciclo *</Label>
                    <Input
                      id="end_date"
                      type="date"
                      {...register("end_date")}
                    />
                    {errors.end_date && (
                      <p className="text-sm text-destructive">
                        {errors.end_date.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium mb-3">Período de Definição de Metas</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="goals_start_date">Início</Label>
                      <Input
                        id="goals_start_date"
                        type="date"
                        {...register("goals_start_date")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="goals_end_date">Término</Label>
                      <Input
                        id="goals_end_date"
                        type="date"
                        {...register("goals_end_date")}
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium mb-3">Período de Avaliação</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="evaluation_start_date">Início</Label>
                      <Input
                        id="evaluation_start_date"
                        type="date"
                        {...register("evaluation_start_date")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="evaluation_end_date">Término</Label>
                      <Input
                        id="evaluation_end_date"
                        type="date"
                        {...register("evaluation_end_date")}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="config" className="space-y-4 mt-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="scale_type">Escala de Avaliação</Label>
                  <Select
                    value={watch("scale_type")}
                    onValueChange={(v) =>
                      setValue(
                        "scale_type",
                        v as "numeric_1_5" | "conceptual" | "percentage"
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.entries(scaleTypeLabels) as [Enums<"performance_scale_type">, string][]).map(
                        ([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Incluir Competências</Label>
                    <p className="text-sm text-muted-foreground">
                      Avaliar competências além das metas
                    </p>
                  </div>
                  <Switch
                    checked={watch("include_competencies")}
                    onCheckedChange={(v) => setValue("include_competencies", v)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Incluir Período de Experiência</Label>
                    <p className="text-sm text-muted-foreground">
                      Avaliar colaboradores em período de experiência
                    </p>
                  </div>
                  <Switch
                    checked={watch("include_probationary")}
                    onCheckedChange={(v) => setValue("include_probationary", v)}
                  />
                </div>

                {includeCompetencies && (
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-medium mb-3">Pesos da Avaliação</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="goals_weight">Peso das Metas (%)</Label>
                        <Input
                          id="goals_weight"
                          type="number"
                          min={0}
                          max={100}
                          {...register("goals_weight")}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="competency_weight">
                          Peso das Competências (%)
                        </Label>
                        <Input
                          id="competency_weight"
                          type="number"
                          min={0}
                          max={100}
                          {...register("competency_weight")}
                          disabled
                        />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      O peso das competências é calculado automaticamente (100% - Peso das Metas)
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Salvando..." : cycle ? "Salvar Alterações" : "Criar Ciclo"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
