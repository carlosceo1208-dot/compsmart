import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ChevronDown, ChevronUp, Target, Eye, Heart, TrendingUp, Pencil, X, Save } from 'lucide-react';
import { useCompanyIdentity } from '@/hooks/useCompanyIdentity';
import { useCurrentUserRole } from '@/hooks/useCurrentUserRole';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export const OrganizationalIdentityCard = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newValue, setNewValue] = useState('');
  
  const { data: identity, isLoading } = useCompanyIdentity();
  const { data: roleData } = useCurrentUserRole();
  const queryClient = useQueryClient();

  const canEdit = roleData?.isAdmin || roleData?.isHR;

  const [formData, setFormData] = useState({
    mission: '',
    vision: '',
    values: [] as string[],
    annual_goal_year: new Date().getFullYear(),
    annual_goal_description: '',
    is_visible: true
  });

  // Sync form data with identity when it loads or changes
  useEffect(() => {
    if (identity) {
      setFormData({
        mission: identity.mission || '',
        vision: identity.vision || '',
        values: identity.values || [],
        annual_goal_year: identity.annual_goal_year || new Date().getFullYear(),
        annual_goal_description: identity.annual_goal_description || '',
        is_visible: identity.is_visible
      });
    }
  }, [identity]);

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase
        .from('company_identity')
        .upsert({
          id: identity?.id,
          root_company_id: identity?.root_company_id,
          ...data
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-identity'] });
      toast.success('Identidade atualizada com sucesso!');
      setIsEditing(false);
    },
    onError: (error) => {
      console.error('Error updating identity:', error);
      toast.error('Erro ao atualizar identidade');
    }
  });

  const handleEdit = () => {
    if (isEditing) {
      // Cancel editing - restore original values
      if (identity) {
        setFormData({
          mission: identity.mission || '',
          vision: identity.vision || '',
          values: identity.values || [],
          annual_goal_year: identity.annual_goal_year || new Date().getFullYear(),
          annual_goal_description: identity.annual_goal_description || '',
          is_visible: identity.is_visible
        });
      }
      setIsEditing(false);
    } else {
      // Start editing - expand card if collapsed
      if (!isExpanded) setIsExpanded(true);
      setIsEditing(true);
    }
  };

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  const handleAddValue = () => {
    if (newValue.trim() && formData.values.length < 10) {
      setFormData({
        ...formData,
        values: [...formData.values, newValue.trim()]
      });
      setNewValue('');
    }
  };

  const handleRemoveValue = (index: number) => {
    setFormData({
      ...formData,
      values: formData.values.filter((_, i) => i !== index)
    });
  };

  // Don't render if not visible or no data
  if (!isLoading && (!identity || !identity.is_visible)) {
    return null;
  }

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className={cn(
        "bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200/50 hover:border-purple-300 transition-all duration-300 overflow-hidden",
        isExpanded ? "shadow-lg" : "shadow-sm"
      )}
    >
      <CardContent className="p-0">
        {/* Header - Always Visible */}
        <div className="p-4 flex items-center justify-between">
          <button
            onClick={() => !isEditing && setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 hover:bg-purple-100/30 transition-colors rounded px-2 py-1"
          >
            <Target className="h-5 w-5 text-purple-600" />
            <span className="font-semibold text-purple-900">Identidade Organizacional</span>
          </button>
          
          <div className="flex items-center gap-2">
            {canEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleEdit}
                disabled={updateMutation.isPending}
              >
                {isEditing ? (
                  <>
                    <X className="h-4 w-4 mr-1" />
                    Cancelar
                  </>
                ) : (
                  <>
                    <Pencil className="h-4 w-4 mr-1" />
                    Editar
                  </>
                )}
              </Button>
            )}
            
            {!isEditing && (
              <button onClick={() => setIsExpanded(!isExpanded)}>
                {isExpanded ? (
                  <ChevronUp className="h-5 w-5 text-purple-600" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-purple-600" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Expandable Content */}
        {isExpanded && identity && (
          <div className="px-4 pb-4 space-y-4 animate-in slide-in-from-top-2 duration-300">
            {isEditing ? (
              /* Edit Mode */
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="mission" className="text-xs font-bold text-purple-900 uppercase tracking-wide">
                    Missão
                  </Label>
                  <Textarea
                    id="mission"
                    value={formData.mission}
                    onChange={(e) => setFormData({ ...formData, mission: e.target.value })}
                    placeholder="Descreva a missão da sua empresa (máx. 500 caracteres)"
                    maxLength={500}
                    rows={3}
                    className="text-sm"
                  />
                  <p className="text-xs text-purple-600">
                    {formData.mission.length}/500 caracteres
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vision" className="text-xs font-bold text-purple-900 uppercase tracking-wide">
                    Visão
                  </Label>
                  <Textarea
                    id="vision"
                    value={formData.vision}
                    onChange={(e) => setFormData({ ...formData, vision: e.target.value })}
                    placeholder="Descreva a visão de futuro da sua empresa (máx. 500 caracteres)"
                    maxLength={500}
                    rows={3}
                    className="text-sm"
                  />
                  <p className="text-xs text-purple-600">
                    {formData.vision.length}/500 caracteres
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold text-purple-900 uppercase tracking-wide">
                    Valores (máximo 10)
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      value={newValue}
                      onChange={(e) => setNewValue(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddValue()}
                      placeholder="Digite um valor e pressione Enter"
                      disabled={formData.values.length >= 10}
                      className="text-sm"
                    />
                    <Button 
                      size="sm"
                      onClick={handleAddValue} 
                      disabled={!newValue.trim() || formData.values.length >= 10}
                    >
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {formData.values.map((value, index) => (
                      <Badge 
                        key={index} 
                        variant="secondary"
                        className="bg-purple-200/60 text-purple-900 hover:bg-purple-200 text-xs gap-1"
                      >
                        {value}
                        <button onClick={() => handleRemoveValue(index)} className="ml-1 hover:text-destructive">
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="year" className="text-xs font-bold text-purple-900 uppercase tracking-wide">
                    Ano da Meta
                  </Label>
                  <Input
                    id="year"
                    type="number"
                    value={formData.annual_goal_year}
                    onChange={(e) => setFormData({ ...formData, annual_goal_year: parseInt(e.target.value) })}
                    min={2024}
                    max={2035}
                    className="text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="goal" className="text-xs font-bold text-purple-900 uppercase tracking-wide">
                    Descrição da Meta Anual
                  </Label>
                  <Textarea
                    id="goal"
                    value={formData.annual_goal_description}
                    onChange={(e) => setFormData({ ...formData, annual_goal_description: e.target.value })}
                    placeholder="Descreva a principal meta para o ano (máx. 300 caracteres)"
                    maxLength={300}
                    rows={2}
                    className="text-sm"
                  />
                  <p className="text-xs text-purple-600">
                    {formData.annual_goal_description.length}/300 caracteres
                  </p>
                </div>

                <div className="flex items-center justify-between p-3 border border-purple-200 rounded-lg bg-purple-50/30">
                  <div>
                    <Label htmlFor="visible" className="text-xs font-bold text-purple-900">
                      Exibir no Dashboard
                    </Label>
                    <p className="text-xs text-purple-600">
                      Mostrar identidade na página inicial
                    </p>
                  </div>
                  <Switch
                    id="visible"
                    checked={formData.is_visible}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_visible: checked })}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-purple-200">
                  <Button variant="outline" onClick={handleEdit} disabled={updateMutation.isPending}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSave} disabled={updateMutation.isPending}>
                    <Save className="h-4 w-4 mr-1" />
                    {updateMutation.isPending ? 'Salvando...' : 'Salvar'}
                  </Button>
                </div>
              </div>
            ) : (
              /* View Mode */
              <>
                {/* Mission */}
                {identity.mission && (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <Eye className="h-4 w-4 text-purple-600" />
                      <h4 className="text-xs font-bold text-purple-900 uppercase tracking-wide">Missão</h4>
                    </div>
                    <p className="text-sm text-purple-800 leading-relaxed">{identity.mission}</p>
                  </div>
                )}

                {/* Vision */}
                {identity.vision && (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <TrendingUp className="h-4 w-4 text-purple-600" />
                      <h4 className="text-xs font-bold text-purple-900 uppercase tracking-wide">Visão</h4>
                    </div>
                    <p className="text-sm text-purple-800 leading-relaxed">{identity.vision}</p>
                  </div>
                )}

                {/* Values */}
                {identity.values && identity.values.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <Heart className="h-4 w-4 text-purple-600" />
                      <h4 className="text-xs font-bold text-purple-900 uppercase tracking-wide">Valores</h4>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {identity.values.map((value, index) => (
                        <Badge 
                          key={index} 
                          variant="secondary"
                          className="bg-purple-200/60 text-purple-900 hover:bg-purple-200 text-xs"
                        >
                          {value}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Annual Goal */}
                {identity.annual_goal_year && identity.annual_goal_description && (
                  <div className="space-y-1.5 pt-2 border-t border-purple-200">
                    <div className="flex items-center gap-1.5">
                      <Target className="h-4 w-4 text-purple-600" />
                      <h4 className="text-xs font-bold text-purple-900 uppercase tracking-wide">
                        Meta {identity.annual_goal_year}
                      </h4>
                    </div>
                    <p className="text-sm text-purple-800 leading-relaxed">
                      {identity.annual_goal_description}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
