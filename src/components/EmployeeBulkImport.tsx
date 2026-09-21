import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Upload } from "lucide-react";
import { EmployeeImportWizard } from "@/components/employee-import/EmployeeImportWizard";
import { ImportHistory } from "@/components/employee-import/ImportHistory";
import { useEmployeeImportAccess } from "@/hooks/useEmployeeImport";

interface EmployeeBulkImportProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EmployeeBulkImport({ open, onOpenChange, onSuccess }: EmployeeBulkImportProps) {
  const { canImport, loading: isLoading } = useEmployeeImportAccess();
  const [tab, setTab] = useState("importar");

  useEffect(() => {
    if (open) setTab("importar");
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Importação de Colaboradores
          </DialogTitle>
          <DialogDescription>
            Importe a base de colaboradores exportada do seu sistema de folha, com mapeamento de
            colunas, validação e log de erros.
          </DialogDescription>
        </DialogHeader>

        {!isLoading && !canImport ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Você não tem permissão para importar colaboradores. Fale com o administrador ou o RH da
              sua empresa.
            </AlertDescription>
          </Alert>
        ) : (
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="importar">Importar</TabsTrigger>
              <TabsTrigger value="historico">Histórico</TabsTrigger>
            </TabsList>

            <TabsContent value="importar" className="pt-4">
              <EmployeeImportWizard
                onImported={onSuccess}
                onClose={() => onOpenChange(false)}
                onViewHistory={() => setTab("historico")}
              />
            </TabsContent>

            <TabsContent value="historico" className="pt-4">
              <ImportHistory />
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
