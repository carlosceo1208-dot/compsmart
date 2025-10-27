import { useState, useEffect } from 'react';
import { useLabels } from '@/contexts/LabelsContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { Settings as SettingsIcon } from 'lucide-react';

export default function Settings() {
  const { labels, updateLabel } = useLabels();
  const [localLabels, setLocalLabels] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    setLocalLabels(labels);
  }, [labels]);

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
