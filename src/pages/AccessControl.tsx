import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, UserCheck, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface UserAccess {
  id: string;
  full_name: string;
  email: string;
  has_system_access: boolean;
  roles: string[];
  last_sign_in: string | null;
}

export default function AccessControl() {
  const [users, setUsers] = useState<UserAccess[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      // Buscar perfis com acesso ao sistema
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email, has_system_access')
        .eq('has_system_access', true)
        .order('full_name');

      if (profilesError) throw profilesError;

      // Buscar roles de cada usuário
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Montar dados combinados
      const usersData: UserAccess[] = await Promise.all(
        (profiles || []).map(async (profile) => {
          const roles = userRoles?.filter(r => r.user_id === profile.id).map(r => r.role) || [];
          
          // Buscar último login
          const { data: authData } = await supabase.auth.admin.getUserById(profile.id);
          
          return {
            ...profile,
            roles,
            last_sign_in: authData?.user?.last_sign_in_at || null
          };
        })
      );

      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-700 border-red-300';
      case 'hr_manager':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'manager':
        return 'bg-green-100 text-green-700 border-green-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      admin: 'Administrador',
      hr_manager: 'Gestor de RH',
      manager: 'Gestor',
      employee: 'Funcionário'
    };
    return labels[role] || role;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ShieldCheck className="w-8 h-8" />
        <div>
          <h1 className="text-3xl font-bold">Controle de Acesso</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie usuários com acesso ao sistema e suas permissões
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <UserCheck className="w-8 h-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{users.length}</p>
                <p className="text-sm text-muted-foreground">Usuários Ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-8 h-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold">
                  {users.filter(u => u.roles.includes('admin')).length}
                </p>
                <p className="text-sm text-muted-foreground">Administradores</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">
                  {users.filter(u => u.roles.includes('hr_manager')).length}
                </p>
                <p className="text-sm text-muted-foreground">Gestores de RH</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Carregando...</p>
          ) : users.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum usuário com acesso ao sistema
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Perfis de Acesso</TableHead>
                  <TableHead>Último Acesso</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.full_name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        {user.roles.length === 0 ? (
                          <Badge variant="outline">Sem perfil</Badge>
                        ) : (
                          user.roles.map((role) => (
                            <Badge key={role} variant="outline" className={getRoleBadgeColor(role)}>
                              {getRoleLabel(role)}
                            </Badge>
                          ))
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.last_sign_in ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          {format(new Date(user.last_sign_in), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">Nunca acessou</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
