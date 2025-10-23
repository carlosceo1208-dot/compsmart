import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Plus, Users, Settings } from "lucide-react";

const Roles = () => {
  const defaultRoles = [
    {
      name: "Administrador",
      description: "Acesso total ao sistema",
      permissions: ["Todas as permissões"],
      users: 0,
    },
    {
      name: "Gestor de RH",
      description: "Gestão de usuários e remuneração",
      permissions: ["Gerenciar usuários", "Visualizar salários", "Editar benefícios"],
      users: 0,
    },
    {
      name: "Colaborador",
      description: "Acesso básico ao sistema",
      permissions: ["Visualizar próprio perfil", "Editar PDI próprio"],
      users: 0,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Perfis</h1>
          <p className="text-muted-foreground mt-1">
            Configure perfis de acesso e permissões por módulo
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Novo Perfil
        </Button>
      </div>

      <div className="grid gap-6">
        {defaultRoles.map((role) => (
          <Card key={role.name}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Shield className="w-8 h-8 text-primary" />
                  <div>
                    <CardTitle>{role.name}</CardTitle>
                    <CardDescription>{role.description}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="gap-1">
                    <Users className="w-3 h-3" />
                    {role.users} usuários
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold mb-2">Permissões:</h4>
                  <div className="flex flex-wrap gap-2">
                    {role.permissions.map((permission) => (
                      <Badge key={permission} variant="outline">
                        {permission}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Settings className="w-4 h-4 mr-2" />
                    Editar Permissões
                  </Button>
                  <Button variant="outline" size="sm">
                    <Users className="w-4 h-4 mr-2" />
                    Ver Usuários
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Roles;
