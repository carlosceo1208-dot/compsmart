import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileDown, FileSpreadsheet, Download } from "lucide-react";
import { toast } from "sonner";

export const ExportCard = () => {
  const handleExportPDF = () => {
    toast.success("Exportando relatório em PDF...", {
      description: "O download será iniciado em instantes"
    });
    // TODO: Implementar lógica de exportação PDF
  };

  const handleExportExcel = () => {
    toast.success("Exportando dados para Excel...", {
      description: "O download será iniciado em instantes"
    });
    // TODO: Implementar lógica de exportação Excel
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Download className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Exportação de Dados</CardTitle>
        </div>
        <CardDescription>
          Exporte relatórios e análises do sistema
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <Button
          variant="outline"
          className="w-full justify-start gap-2"
          onClick={handleExportPDF}
        >
          <FileDown className="h-4 w-4" />
          Exportar PDF
        </Button>
        <Button
          variant="outline"
          className="w-full justify-start gap-2"
          onClick={handleExportExcel}
        >
          <FileSpreadsheet className="h-4 w-4" />
          Exportar Excel
        </Button>
      </CardContent>
    </Card>
  );
};
