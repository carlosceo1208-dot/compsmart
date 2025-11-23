import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { User, Briefcase, DollarSign, Shield, Camera } from 'lucide-react';
import { toast } from 'sonner';
import { useLabels } from '@/contexts/LabelsContext';
import { format } from 'date-fns';
import { AvatarUpload } from '@/components/profile/AvatarUpload';

interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  cpf: string | null;
  birth_date: string | null;
  job_title: string | null;
  grade: string | null;
  unit_id: string | null;
  salary: number | null;
  variable_salary: number | null;
  manager_id: string | null;
  avatar_url: string | null;
}

export default function MyProfile() {
  const { getLabel } = useLabels();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [unitName, setUnitName] = useState<string>('');
  const [managerName, setManagerName] = useState<string>('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setProfile(data);

      // Buscar nome da unidade
      if (data.unit_id) {
        const { data: unit } = await supabase
          .from('organizational_structure')
          .select('name')
          .eq('id', data.unit_id)
          .single();
        
        if (unit) setUnitName(unit.name);
      }

      // Buscar nome do gestor
      if (data.manager_id) {
        const { data: manager } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', data.manager_id)
          .single();
        
        if (manager) setManagerName(manager.full_name);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Erro ao carregar perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          phone: profile.phone,
          cpf: profile.cpf,
          birth_date: profile.birth_date
        })
        .eq('id', profile.id);

      if (error) throw error;
      toast.success('Dados atualizados com sucesso!');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      if (error.message?.includes('campos sensíveis')) {
        toast.error('Você não pode modificar campos sensíveis como salário ou cargo');
      } else {
        toast.error('Erro ao atualizar dados');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Carregando...</div>;
  }

  if (!profile) {
    return <div className="text-center py-12">Perfil não encontrado</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <User className="w-8 h-8" />
        <div>
          <h1 className="text-3xl font-bold">Meu Perfil</h1>
          <p className="text-muted-foreground mt-1">
            Visualize e edite suas informações pessoais
          </p>
        </div>
      </div>

      {/* Foto de Perfil */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Foto de Perfil
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AvatarUpload
            userId={profile.id}
            currentAvatarUrl={profile.avatar_url}
            userName={profile.full_name}
            onAvatarChange={(url) => setProfile({ ...profile, avatar_url: url })}
          />
        </CardContent>
      </Card>

      {/* Dados Pessoais (Editável) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Dados Pessoais
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Nome Completo</Label>
              <Input value={profile.full_name} disabled />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={profile.email} disabled />
            </div>
            <div>
              <Label>Telefone</Label>
              <Input
                value={profile.phone || ''}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                placeholder="(00) 00000-0000"
              />
            </div>
            <div>
              <Label>CPF</Label>
              <Input
                value={profile.cpf || ''}
                onChange={(e) => setProfile({ ...profile, cpf: e.target.value })}
                placeholder="000.000.000-00"
              />
            </div>
            <div>
              <Label>Data de Nascimento</Label>
              <Input
                type="date"
                value={profile.birth_date || ''}
                onChange={(e) => setProfile({ ...profile, birth_date: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dados de Cargo (Read-only) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="w-5 h-5" />
            Dados de Cargo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>{getLabel('job_title')}</Label>
              <Input value={profile.job_title || 'Não informado'} disabled />
            </div>
            <div>
              <Label>{getLabel('grade')}</Label>
              <Input value={profile.grade || 'Não informado'} disabled />
            </div>
            <div>
              <Label>{getLabel('unit')}</Label>
              <Input value={unitName || 'Não informado'} disabled />
            </div>
            <div>
              <Label>{getLabel('manager')}</Label>
              <Input value={managerName || 'Não informado'} disabled />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dados Salariais (Read-only com aviso) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Dados Salariais
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
            <Shield className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-900">Informações Confidenciais</p>
              <p className="text-sm text-amber-700">
                Estes dados são apenas para consulta e não podem ser editados.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>{getLabel('salary')} Base</Label>
              <Input
                value={profile.salary ? `R$ ${profile.salary.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'Não informado'}
                disabled
              />
            </div>
            <div>
              <Label>{getLabel('salary')} Variável</Label>
              <Input
                value={profile.variable_salary ? `R$ ${profile.variable_salary.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'Não informado'}
                disabled
              />
            </div>
          </div>

          <Separator />

          <p className="text-sm text-muted-foreground">
            <strong>Observação:</strong> Para mais detalhes sobre sua {getLabel('salary_range').toLowerCase()} e posicionamento, 
            entre em contato com o setor de Recursos Humanos.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
