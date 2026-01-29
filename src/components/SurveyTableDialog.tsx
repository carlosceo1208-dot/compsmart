import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCurrentUserRole } from "@/hooks/useCurrentUserRole";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { AlertTriangle, Lock } from "lucide-react";
import { MODALITY_OPTIONS, type SalaryModality, getModalityConfig } from '@/lib/salaryModality';

interface SurveyTableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  surveyTable?: {
    id: string;
    name: string;
    effective_month: number;
    effective_year: number;
    is_active: boolean;
    default_amplitude: number | null;
    root_company_id?: string | null;
    modality?: SalaryModality;
  };
  onSuccess: () => void;
}

export function SurveyTableDialog({
  open,
  onOpenChange,
  surveyTable,
  onSuccess,
}: SurveyTableDialogProps) {
  const { toast } = useToast();
  const { data: userRole } = useCurrentUserRole();
  const { hasAccess, isAdminOrSuperAdmin } = useFeatureAccess();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [effectiveMonth, setEffectiveMonth] = useState("1");
  const [effectiveYear, setEffectiveYear] = useState(new Date().getFullYear().toString());
  const [isActive, setIsActive] = useState(false);
  const [defaultAmplitude, setDefaultAmplitude] = useState("");
  const [isGlobalTemplate, setIsGlobalTemplate] = useState(false);
  const [modality, setModality] = useState<SalaryModality>('fixed_salary');

  // Check if user has access to advanced modalities (Pro/Enterprise OR admin/super_admin)
  const hasAdvancedModalities = hasAccess('salary_modality_advanced');

  useEffect(() => {
    if (surveyTable) {
      setName(surveyTable.name);
      setEffectiveMonth(surveyTable.effective_month.toString());
      setEffectiveYear(surveyTable.effective_year.toString());
      setIsActive(surveyTable.is_active);
      setDefaultAmplitude(surveyTable.default_amplitude?.toString() || "");
      setIsGlobalTemplate(surveyTable.root_company_id === null);
      setModality((surveyTable.modality as SalaryModality) || 'fixed_salary');
    } else {
      setName("");
      setEffectiveMonth("1");
      setEffectiveYear(new Date().getFullYear().toString());
      setIsActive(false);
      setDefaultAmplitude("");
      setIsGlobalTemplate(false);
      setModality('fixed_salary');
    }
  }, [surveyTable, open]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast({
        title: "Erro",
        description: "Nome da pesquisa é obrigatório",
        variant: "destructive",
      });
      return;
    }

    const year = parseInt(effectiveYear);
    if (year < 2000 || year > 2100) {
      toast({
        title: "Erro",
        description: "Ano inválido",
        variant: "destructive",
      });
      return;
    }

    // Check modality access
    if (modality !== 'fixed_salary' && !hasAdvancedModalities) {
      toast({
        title: 'Plano Insuficiente',
        description: 'Total Cash e Total Compensation requerem plano Pro ou Enterprise',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // Determine root_company_id
      let rootCompanyId: string | null = null;
      
      if (!isGlobalTemplate || !userRole?.isSuperAdmin) {
        // Get user's company for non-template surveys
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("root_company_id")
            .eq("id", user.id)
            .single();
          rootCompanyId = profile?.root_company_id || null;
        }
      }
      // If isGlobalTemplate AND isSuperAdmin, rootCompanyId stays null (template)

      const data: any = {
        name: name.trim(),
        effective_month: parseInt(effectiveMonth),
        effective_year: year,
        is_active: isActive,
        default_amplitude: defaultAmplitude ? parseFloat(defaultAmplitude) : null,
        modality: modality,
      };

      if (surveyTable) {
        // Only update root_company_id if super_admin is changing template status
        if (userRole?.isSuperAdmin) {
          data.root_company_id = isGlobalTemplate ? null : rootCompanyId;
        }

        const { error } = await supabase
          .from("survey_tables")
          .update(data)
          .eq("id", surveyTable.id);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Pesquisa atualizada com sucesso",
        });
      } else {
        // For new surveys, always set root_company_id
        data.root_company_id = isGlobalTemplate && userRole?.isSuperAdmin ? null : rootCompanyId;

        const { error } = await supabase
          .from("survey_tables")
          .insert(data);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: isGlobalTemplate ? "Template CompSmart criado com sucesso" : "Pesquisa criada com sucesso",
        });
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error saving survey table:", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar pesquisa",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const isEditingTemplate = surveyTable?.root_company_id === null;

  const isModalityLocked = (mod: SalaryModality) => {
    return mod !== 'fixed_salary' && !hasAdvancedModalities;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {surveyTable ? "Editar Pesquisa" : "Nova Pesquisa Salarial"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {isEditingTemplate && !userRole?.isSuperAdmin && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Esta é uma pesquisa template CompSmart. Apenas super administradores podem editá-la.
              </p>
            </div>
          )}

          <div>
            <Label htmlFor="name">Nome da Pesquisa</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Pesquisa Agronegócio 2024 - Total Cash"
              disabled={isEditingTemplate && !userRole?.isSuperAdmin}
            />
          </div>

          {/* Modality Selection */}
          <div className="space-y-2">
            <Label>Modalidade de Remuneração *</Label>
            <div className="grid grid-cols-1 gap-2">
              {MODALITY_OPTIONS.map((opt) => {
                const config = getModalityConfig(opt.value);
                const locked = isModalityLocked(opt.value);
                const isSelected = modality === opt.value;
                const disabled = (isEditingTemplate && !userRole?.isSuperAdmin) || locked;
                
                return (
                  <div
                    key={opt.value}
                    onClick={() => !disabled && setModality(opt.value)}
                    className={`
                      relative flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all
                      ${isSelected ? `${config.borderColor} ${config.bgColor}` : 'border-muted hover:border-muted-foreground/50'}
                      ${disabled ? 'opacity-60 cursor-not-allowed' : ''}
                    `}
                  >
                    <div className={`w-3 h-3 rounded-full`} 
                      style={{ backgroundColor: isSelected ? (opt.value === 'fixed_salary' ? '#2563eb' : opt.value === 'total_cash' ? '#059669' : '#9333ea') : '#d1d5db' }}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${isSelected ? config.color : ''}`}>
                          {opt.label}
                        </span>
                        {locked && (
                          <Badge variant="outline" className="text-xs gap-1">
                            <Lock className="w-3 h-3" />
                            Pro+
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{opt.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="month">Mês de Vigência</Label>
              <Select 
                value={effectiveMonth} 
                onValueChange={setEffectiveMonth}
                disabled={isEditingTemplate && !userRole?.isSuperAdmin}
              >
                <SelectTrigger id="month">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[
                    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
                    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
                  ].map((month, index) => (
                    <SelectItem key={index + 1} value={(index + 1).toString()}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="year">Ano de Vigência</Label>
              <Input
                id="year"
                type="number"
                value={effectiveYear}
                onChange={(e) => setEffectiveYear(e.target.value)}
                min="2000"
                max="2100"
                disabled={isEditingTemplate && !userRole?.isSuperAdmin}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="amplitude">Amplitude Padrão (%)</Label>
            <Input
              id="amplitude"
              type="number"
              value={defaultAmplitude}
              onChange={(e) => setDefaultAmplitude(e.target.value)}
              placeholder="Ex: 45 (opcional)"
              step="0.01"
              disabled={isEditingTemplate && !userRole?.isSuperAdmin}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Será sugerida ao adicionar novos cargos no modo automático
            </p>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="active">Marcar como ativa</Label>
            <Switch
              id="active"
              checked={isActive}
              onCheckedChange={setIsActive}
              disabled={isEditingTemplate && !userRole?.isSuperAdmin}
            />
          </div>

          {/* Super admin only: create as global template */}
          {userRole?.isSuperAdmin && (
            <div className="pt-2 border-t">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="globalTemplate"
                  checked={isGlobalTemplate}
                  onCheckedChange={(checked) => setIsGlobalTemplate(checked === true)}
                />
                <div className="space-y-1">
                  <Label htmlFor="globalTemplate" className="text-sm font-medium cursor-pointer">
                    Criar como Template Global CompSmart
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Templates globais ficam disponíveis para todas as empresas copiarem
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={loading || (isEditingTemplate && !userRole?.isSuperAdmin)}
          >
            {loading ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
