import { useState, useEffect } from 'react';
import { useLabels } from '@/contexts/LabelsContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Settings as SettingsIcon, Target, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyIdentity } from '@/hooks/useCompanyIdentity';
import { useQueryClient } from '@tanstack/react-query';

export default function Settings() {
  const { labels, updateLabel } = useLabels();
  const [localLabels, setLocalLabels] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  
  // Company Identity state
  const queryClient = useQueryClient();
  const { data: identity } = useCompanyIdentity();
  const [identityData, setIdentityData] = useState({
    mission: '',
    vision: '',
    values: [] as string[],
    annual_goal_year: new Date().getFullYear(),
    annual_goal_description: '',
    is_visible: true
  });
  const [newValue, setNewValue] = useState('');
  const [savingIdentity, setSavingIdentity] = useState(false);

  useEffect(() => {
    setLocalLabels(labels);
  }, [labels]);

  useEffect(() => {
    if (identity) {
      setIdentityData({
        mission: identity.mission || '',
        vision: identity.vision || '',
        values: identity.values || [],
        annual_goal_year: identity.annual_goal_year || new Date().getFullYear(),
        annual_goal_description: identity.annual_goal_description || '',
        is_visible: identity.is_visible
      });
    }
  }, [identity]);

  const handleSave = async (key: string) => {
    setSaving(key);
    try {
      const newValue = localLabels[key];
      const defaultValue = labels[key];
      
      // Se o valor é igual ao padrão, salvar como null (usa o padrão)
      await updateLabel(key, newValue === defaultValue ? null : newValue);
      toast.success('Label atualizado com sucesso!');
    } catch (error) {
      toast.error('Erro ao atualizar label');
    } finally {
      setSaving(null);
    }
  };

  const handleReset = async (key: string, defaultLabel: string) => {
    setSaving(key);
    try {
      setLocalLabels({ ...localLabels, [key]: defaultLabel });
      await updateLabel(key, null);
      toast.success('Label restaurado para o padrão');
    } catch (error) {
      toast.error('Erro ao restaurar label');
    } finally {
      setSaving(null);
    }
  };

  const handleAddValue = () => {
    if (newValue.trim() && identityData.values.length < 5) {
      setIdentityData({
        ...identityData,
        values: [...identityData.values, newValue.trim()]
      });
      setNewValue('');
    }
  };

  const handleRemoveValue = (index: number) => {
    setIdentityData({
      ...identityData,
      values: identityData.values.filter((_, i) => i !== index)
    });
  };

  const handleSaveIdentity = async () => {
    setSavingIdentity(true);
    try {
      const { error } = await supabase
        .from('company_identity')
        .upsert({
          root_company_id: (await supabase.auth.getUser()).data.user?.id,
          ...identityData,
          values: identityData.values
        });

      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ['company-identity'] });
      toast.success('Identidade organizacional atualizada com sucesso!');
    } catch (error) {
      console.error('Error saving identity:', error);
      toast.error('Erro ao atualizar identidade organizacional');
    } finally {
      setSavingIdentity(false);
    }
  };

  const labelConfigs = [
    {
      key: 'grade',
      defaultLabel: 'Grade',
      title: 'Nomenclatura para Níveis Hierárquicos',
      description: 'Usado em: Cadastro de Cargos, Perfil de Funcionários, Filtros, Tabela Salarial',
      placeholder: 'Ex: Grade, Nível, Faixa, etc.'
    },
    {
      key: 'salary',
      defaultLabel: 'Salário',
      title: 'Nomenclatura para Remuneração',
      description: 'Usado em: Perfil de Funcionários, Relatórios',
      placeholder: 'Ex: Salário, Remuneração, Vencimento, etc.'
    },
    {
      key: 'unit',
      defaultLabel: 'Unidade',
      title: 'Nomenclatura para Unidades Organizacionais',
      description: 'Usado em: Estrutura Organizacional, Perfil de Funcionários',
      placeholder: 'Ex: Unidade, Lotação, Centro de Custo, etc.'
    },
    {
      key: 'job_title',
      defaultLabel: 'Cargo',
      title: 'Nomenclatura para Cargos',
      description: 'Usado em: Cadastro de Cargos, Perfil de Funcionários',
      placeholder: 'Ex: Cargo, Função, Posição, etc.'
    },
    {
      key: 'employee',
      defaultLabel: 'Funcionário',
      title: 'Nomenclatura para Colaboradores',
      description: 'Usado em: Gestão de Pessoas, Relatórios',
      placeholder: 'Ex: Funcionário, Colaborador, Servidor, etc.'
    },
    {
      key: 'manager',
      defaultLabel: 'Gestor',
      title: 'Nomenclatura para Gestores',
      description: 'Usado em: Perfil de Funcionários, Hierarquia',
      placeholder: 'Ex: Gestor, Supervisor, Gerente, etc.'
    },
    {
      key: 'salary_range',
      defaultLabel: 'Faixa Salarial',
      title: 'Nomenclatura para Faixas de Remuneração',
      description: 'Usado em: Tabela Salarial, Análise de Cargos',
      placeholder: 'Ex: Faixa Salarial, Tabela Salarial, etc.'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <SettingsIcon className="w-8 h-8" />
        <div>
          <h1 className="text-3xl font-bold">Configurações do Sistema</h1>
          <p className="text-muted-foreground mt-1">
            Personalize a nomenclatura utilizada no sistema
          </p>
        </div>
      </div>

      {/* Organizational Identity Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-600" />
            <div>
              <CardTitle>Identidade Organizacional</CardTitle>
              <CardDescription>
                Configure missão, visão, valores e meta anual da sua empresa
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mission">Missão</Label>
              <Textarea
                id="mission"
                value={identityData.mission}
                onChange={(e) => setIdentityData({ ...identityData, mission: e.target.value })}
                placeholder="Descreva a missão da sua empresa (máx. 500 caracteres)"
                maxLength={500}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                {identityData.mission.length}/500 caracteres
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vision">Visão</Label>
              <Textarea
                id="vision"
                value={identityData.vision}
                onChange={(e) => setIdentityData({ ...identityData, vision: e.target.value })}
                placeholder="Descreva a visão de futuro da sua empresa (máx. 500 caracteres)"
                maxLength={500}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                {identityData.vision.length}/500 caracteres
              </p>
            </div>

            <div className="space-y-2">
              <Label>Valores (máximo 5)</Label>
              <div className="flex gap-2">
                <Input
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddValue()}
                  placeholder="Digite um valor e pressione Enter"
                  disabled={identityData.values.length >= 5}
                />
                <Button onClick={handleAddValue} disabled={!newValue.trim() || identityData.values.length >= 5}>
                  Adicionar
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {identityData.values.map((value, index) => (
                  <Badge key={index} variant="secondary" className="gap-1">
                    {value}
                    <button onClick={() => handleRemoveValue(index)} className="ml-1 hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="year">Ano da Meta</Label>
                <Input
                  id="year"
                  type="number"
                  value={identityData.annual_goal_year}
                  onChange={(e) => setIdentityData({ ...identityData, annual_goal_year: parseInt(e.target.value) })}
                  min={new Date().getFullYear()}
                  max={new Date().getFullYear() + 10}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="goal">Descrição da Meta Anual</Label>
              <Textarea
                id="goal"
                value={identityData.annual_goal_description}
                onChange={(e) => setIdentityData({ ...identityData, annual_goal_description: e.target.value })}
                placeholder="Descreva a principal meta para o ano (máx. 300 caracteres)"
                maxLength={300}
                rows={2}
              />
              <p className="text-xs text-muted-foreground">
                {identityData.annual_goal_description.length}/300 caracteres
              </p>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label htmlFor="visible">Exibir no Dashboard</Label>
                <p className="text-xs text-muted-foreground">
                  Mostrar identidade organizacional na página inicial
                </p>
              </div>
              <Switch
                id="visible"
                checked={identityData.is_visible}
                onCheckedChange={(checked) => setIdentityData({ ...identityData, is_visible: checked })}
              />
            </div>

            <Button onClick={handleSaveIdentity} disabled={savingIdentity} className="w-full">
              {savingIdentity ? 'Salvando...' : 'Salvar Identidade Organizacional'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Labels Section */}
      <Card>
        <CardHeader>
          <CardTitle>Labels Personalizáveis</CardTitle>
          <CardDescription>
            Ajuste os termos usados no sistema para se adequar à nomenclatura da sua organização
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {labelConfigs.map((config) => (
            <div key={config.key} className="space-y-2 pb-4 border-b last:border-b-0">
              <div>
                <Label className="text-base font-semibold">{config.title}</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  {config.description}
                </p>
              </div>
              <div className="flex gap-2">
                <Input
                  value={localLabels[config.key] || ''}
                  onChange={(e) => setLocalLabels({ ...localLabels, [config.key]: e.target.value })}
                  placeholder={config.placeholder}
                  className="flex-1"
                />
                <Button 
                  onClick={() => handleSave(config.key)}
                  disabled={saving === config.key || localLabels[config.key] === labels[config.key]}
                >
                  {saving === config.key ? 'Salvando...' : 'Salvar'}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => handleReset(config.key, config.defaultLabel)}
                  disabled={saving === config.key || localLabels[config.key] === config.defaultLabel}
                >
                  Restaurar
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                <strong>Padrão:</strong> {config.defaultLabel} | <strong>Atual:</strong> {labels[config.key] || config.defaultLabel}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
