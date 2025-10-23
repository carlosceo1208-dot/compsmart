import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building, Plus } from "lucide-react";

const Organization = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Estrutura Organizacional</h1>
          <p className="text-muted-foreground mt-1">
            Configure hierarquia, departamentos, áreas e cargos da empresa
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Nova Estrutura
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <Building className="w-8 h-8 text-primary mb-2" />
            <CardTitle>Departamentos</CardTitle>
            <CardDescription>Gerencie os departamentos da empresa</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              Gerenciar
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Building className="w-8 h-8 text-primary mb-2" />
            <CardTitle>Áreas</CardTitle>
            <CardDescription>Configure as áreas organizacionais</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              Gerenciar
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Building className="w-8 h-8 text-primary mb-2" />
            <CardTitle>Cargos</CardTitle>
            <CardDescription>Defina cargos e posições</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              Gerenciar
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Organization;
