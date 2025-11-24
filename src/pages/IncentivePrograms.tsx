import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Plus, Target, Users, Award, TrendingUp, Edit, Trash2 } from 'lucide-react';
import { ProgramDialog } from '@/components/incentives/ProgramDialog';
import { IncentivesKPIDashboard } from '@/components/incentives/IncentivesKPIDashboard';
import { useCurrencyConverter } from '@/hooks/useCurrencyConverter';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

const IncentivePrograms = () => {
  const { currency } = useCurrencyConverter();
  const { toast } = useToast();
  const [programDialogOpen, setProgramDialogOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [programToDelete, setProgramToDelete] = useState<any>(null);

  const { data: programs, isLoading, refetch } = useQuery({
    queryKey: ['incentive-programs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('incentive_programs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const handleEdit = (program: any) => {
    setSelectedProgram(program);
    setProgramDialogOpen(true);
  };

  const handleDeleteClick = (program: any) => {
    setProgramToDelete(program);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!programToDelete) return;

    try {
      const { error } = await supabase
        .from('incentive_programs')
        .delete()
        .eq('id', programToDelete.id);

      if (error) throw error;

      toast({ title: 'Programa excluído com sucesso!' });
      refetch();
    } catch (error: any) {
      toast({
        title: 'Erro ao excluir programa',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setProgramToDelete(null);
    }
  };

  const shortTermPrograms = programs?.filter((p) => p.program_type === 'short_term') || [];
  const longTermPrograms = programs?.filter((p) => p.program_type === 'long_term') || [];

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Programas de Incentivos</h1>
          <p className="text-muted-foreground">
            Gerencie ICP, ILP, PLR, Stock Options e demais incentivos
          </p>
        </div>
        <Button
          onClick={() => {
            setSelectedProgram(null);
            setProgramDialogOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo Programa
        </Button>
      </div>

      <Tabs defaultValue="programs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="programs" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Programas
          </TabsTrigger>
          <TabsTrigger value="assignments" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Atribuições
          </TabsTrigger>
          <TabsTrigger value="kpis" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            KPIs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="programs" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  ICP - Incentivos de Curto Prazo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {isLoading ? (
                  <p className="text-sm text-muted-foreground">Carregando...</p>
                ) : shortTermPrograms.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nenhum programa de curto prazo cadastrado
                  </p>
                ) : (
                  shortTermPrograms.map((program) => (
                    <div
                      key={program.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{program.name}</h4>
                          {!program.is_active && (
                            <Badge variant="secondary">Inativo</Badge>
                          )}
                        </div>
                        {program.description && (
                          <p className="text-xs text-muted-foreground mb-1">
                            {program.description}
                          </p>
                        )}
                        {program.target_percentage && (
                          <p className="text-xs text-muted-foreground">
                            Alvo: {program.target_percentage}% sobre salário
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(program)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteClick(program)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-accent" />
                  ILP - Incentivos de Longo Prazo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {isLoading ? (
                  <p className="text-sm text-muted-foreground">Carregando...</p>
                ) : longTermPrograms.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nenhum programa de longo prazo cadastrado
                  </p>
                ) : (
                  longTermPrograms.map((program) => (
                    <div
                      key={program.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{program.name}</h4>
                          {!program.is_active && (
                            <Badge variant="secondary">Inativo</Badge>
                          )}
                        </div>
                        {program.description && (
                          <p className="text-xs text-muted-foreground mb-1">
                            {program.description}
                          </p>
                        )}
                        <div className="flex gap-3 text-xs text-muted-foreground">
                          {program.vesting_months && (
                            <span>Vesting: {program.vesting_months} meses</span>
                          )}
                          {program.cliff_months && (
                            <span>Cliff: {program.cliff_months} meses</span>
                          )}
                          {program.matching_percentage && (
                            <span>Matching: {program.matching_percentage}%</span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(program)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteClick(program)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="assignments">
          <Card>
            <CardHeader>
              <CardTitle>Atribuições de Incentivos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Em breve: Atribuir programas de incentivos aos funcionários
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="kpis">
          <IncentivesKPIDashboard currency={currency} />
        </TabsContent>
      </Tabs>

      <ProgramDialog
        open={programDialogOpen}
        onOpenChange={setProgramDialogOpen}
        program={selectedProgram}
        onSuccess={refetch}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o programa "{programToDelete?.name}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default IncentivePrograms;
