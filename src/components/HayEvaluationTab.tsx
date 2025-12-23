import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Loader2, AlertTriangle, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface HayEvaluationData {
  hay_knowhow_technical: string;
  hay_knowhow_managerial: string;
  hay_knowhow_human_relations: string;
  hay_problem_environment: string;
  hay_problem_challenge: string;
  hay_accountability_freedom: string;
  hay_accountability_magnitude: string;
  hay_accountability_impact: string;
  hay_total_points: number;
  hay_profile: string;
  hay_evaluation_notes: string;
}

interface HayEvaluationTabProps {
  jobTitle: string;
  grade: string;
  jobFamily: string;
  summary?: string;
  mainResponsibilities?: string;
  hayData: HayEvaluationData;
  onHayDataChange: (data: Partial<HayEvaluationData>) => void;
  onMedianPointsChange: (points: number) => void;
}

// Hay factor options
const KNOWHOW_TECHNICAL = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const KNOWHOW_MANAGERIAL = ['I', 'II', 'III', 'IV'];
const KNOWHOW_HUMAN = ['1', '2', '3'];
const PROBLEM_ENVIRONMENT = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const PROBLEM_CHALLENGE = ['10%', '14%', '19%', '25%', '33%'];
const ACCOUNTABILITY_FREEDOM = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const ACCOUNTABILITY_MAGNITUDE = ['1', '2', '3', '4'];
const ACCOUNTABILITY_IMPACT = ['R', 'C', 'S', 'P'];

const PROFILE_LABELS: Record<string, string> = {
  'A': 'Administrativo',
  'C': 'Coordenação',
  'P': 'Pensamento Estratégico',
  'T': 'Técnico Especializado',
};

const IMPACT_LABELS: Record<string, string> = {
  'R': 'Remoto',
  'C': 'Contribuinte',
  'S': 'Compartilhado',
  'P': 'Primário',
};

export function HayEvaluationTab({
  jobTitle,
  grade,
  jobFamily,
  summary,
  mainResponsibilities,
  hayData,
  onHayDataChange,
  onMedianPointsChange,
}: HayEvaluationTabProps) {
  const [aiLoading, setAiLoading] = useState(false);

  const handleGenerateHayEvaluation = async () => {
    if (!jobTitle || !grade) {
      toast.error('Preencha título e grade antes de gerar avaliação');
      return;
    }

    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-job-description', {
        body: {
          jobTitle,
          grade,
          jobFamily,
          summary,
          mainResponsibilities,
          mode: 'hay_evaluation'
        }
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      // Update Hay data
      const hayUpdate: Partial<HayEvaluationData> = {
        hay_knowhow_technical: data.knowhow_technical || '',
        hay_knowhow_managerial: data.knowhow_managerial || '',
        hay_knowhow_human_relations: data.knowhow_human_relations || '',
        hay_problem_environment: data.problem_environment || '',
        hay_problem_challenge: data.problem_challenge || '',
        hay_accountability_freedom: data.accountability_freedom || '',
        hay_accountability_magnitude: data.accountability_magnitude || '',
        hay_accountability_impact: data.accountability_impact || '',
        hay_total_points: data.total_points || 0,
        hay_profile: data.profile || '',
        hay_evaluation_notes: data.evaluation_notes || '',
      };

      onHayDataChange(hayUpdate);
      
      // Update median_points with hay_total_points
      if (data.total_points) {
        onMedianPointsChange(data.total_points);
      }

      toast.success('Avaliação Hay gerada! Você pode ajustar os valores conforme necessário.', {
        description: `Grade sugerido: ${data.suggested_grade || grade}`,
        duration: 5000,
      });
    } catch (error: any) {
      console.error('Hay evaluation error:', error);
      toast.error('Erro ao gerar avaliação Hay');
    } finally {
      setAiLoading(false);
    }
  };

  const getSuggestedGrade = (points: number): string => {
    if (points <= 150) return '1-2';
    if (points <= 230) return '3-4';
    if (points <= 350) return '5-6';
    if (points <= 500) return '7-8';
    if (points <= 700) return '9-10';
    return '11+';
  };

  return (
    <div className="space-y-4">
      <Alert className="border-amber-500/50 bg-amber-500/10">
        <AlertTriangle className="h-4 w-4 text-amber-500" />
        <AlertDescription className="text-sm">
          <strong>Avaliação inicial por IA.</strong> Você pode ajustar todos os valores conforme a estrutura da sua empresa.
          Os pontos finais serão salvos no campo "Pontos Médios" do cargo.
        </AlertDescription>
      </Alert>

      <div className="flex justify-end">
        <Button
          onClick={handleGenerateHayEvaluation}
          disabled={aiLoading || !jobTitle || !grade}
          variant="outline"
        >
          {aiLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
          Gerar Avaliação com IA
        </Button>
      </div>

      {/* Know-How Section */}
      <Card>
        <CardContent className="pt-4">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            📚 KNOW-HOW (Conhecimento)
          </h4>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">Técnico/Profissional</Label>
              <Select 
                value={hayData.hay_knowhow_technical || ''} 
                onValueChange={(v) => onHayDataChange({ hay_knowhow_technical: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {KNOWHOW_TECHNICAL.map(opt => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">A (básico) → H (especialista)</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Gerencial (Amplitude)</Label>
              <Select 
                value={hayData.hay_knowhow_managerial || ''} 
                onValueChange={(v) => onHayDataChange({ hay_knowhow_managerial: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {KNOWHOW_MANAGERIAL.map(opt => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">I (nenhuma) → IV (máxima)</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Relações Humanas</Label>
              <Select 
                value={hayData.hay_knowhow_human_relations || ''} 
                onValueChange={(v) => onHayDataChange({ hay_knowhow_human_relations: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {KNOWHOW_HUMAN.map(opt => (
                    <SelectItem key={opt} value={opt}>
                      {opt} - {opt === '1' ? 'Básica' : opt === '2' ? 'Importante' : 'Crítica'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Problem Solving Section */}
      <Card>
        <CardContent className="pt-4">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            🧩 PROBLEM SOLVING (Solução de Problemas)
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">Ambiente de Pensamento</Label>
              <Select 
                value={hayData.hay_problem_environment || ''} 
                onValueChange={(v) => onHayDataChange({ hay_problem_environment: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {PROBLEM_ENVIRONMENT.map(opt => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">A (rotineiro) → H (abstrato)</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Desafio do Pensamento</Label>
              <Select 
                value={hayData.hay_problem_challenge || ''} 
                onValueChange={(v) => onHayDataChange({ hay_problem_challenge: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {PROBLEM_CHALLENGE.map(opt => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">% do Know-How aplicado</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Accountability Section */}
      <Card>
        <CardContent className="pt-4">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            📈 ACCOUNTABILITY (Responsabilidade)
          </h4>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">Liberdade de Ação</Label>
              <Select 
                value={hayData.hay_accountability_freedom || ''} 
                onValueChange={(v) => onHayDataChange({ hay_accountability_freedom: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {ACCOUNTABILITY_FREEDOM.map(opt => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">A (mínima) → H (máxima)</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Magnitude ($)</Label>
              <Select 
                value={hayData.hay_accountability_magnitude || ''} 
                onValueChange={(v) => onHayDataChange({ hay_accountability_magnitude: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {ACCOUNTABILITY_MAGNITUDE.map(opt => (
                    <SelectItem key={opt} value={opt}>
                      {opt} - {opt === '1' ? 'Mínima' : opt === '2' ? 'Pequena' : opt === '3' ? 'Média' : 'Grande'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Impacto nos Resultados</Label>
              <Select 
                value={hayData.hay_accountability_impact || ''} 
                onValueChange={(v) => onHayDataChange({ hay_accountability_impact: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {ACCOUNTABILITY_IMPACT.map(opt => (
                    <SelectItem key={opt} value={opt}>{opt} - {IMPACT_LABELS[opt]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-4">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            🔢 RESULTADO DA AVALIAÇÃO
          </h4>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">Total de Pontos</Label>
              <Input
                type="number"
                value={hayData.hay_total_points || ''}
                onChange={(e) => {
                  const points = parseInt(e.target.value) || 0;
                  onHayDataChange({ hay_total_points: points });
                  onMedianPointsChange(points);
                }}
                placeholder="0"
                className="font-bold text-lg"
              />
              <p className="text-xs text-muted-foreground mt-1">Editável - sobrescreve cálculo</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Perfil do Cargo</Label>
              <Select 
                value={hayData.hay_profile || ''} 
                onValueChange={(v) => onHayDataChange({ hay_profile: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PROFILE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{key} - {label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col justify-center">
              {hayData.hay_total_points > 0 && (
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Grade Sugerido</p>
                  <Badge variant="secondary" className="text-lg px-3 py-1">
                    {getSuggestedGrade(hayData.hay_total_points)}
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Evaluation Notes */}
      <div>
        <Label htmlFor="hay_notes" className="flex items-center gap-2">
          📝 Justificativa da Avaliação
          <Info className="w-3 h-3 text-muted-foreground" />
        </Label>
        <Textarea
          id="hay_notes"
          value={hayData.hay_evaluation_notes || ''}
          onChange={(e) => onHayDataChange({ hay_evaluation_notes: e.target.value })}
          placeholder="Documente aqui as razões para a pontuação atribuída ou divergências da sugestão da IA..."
          rows={4}
          className="mt-1"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Use este campo para registrar justificativas, especialmente quando divergir da sugestão da IA.
        </p>
      </div>
    </div>
  );
}