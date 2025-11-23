import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Building2, ArrowRight } from "lucide-react";

interface CompanyDataStepProps {
  formData: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
}

export const CompanyDataStep = ({ formData, onUpdate, onNext }: CompanyDataStepProps) => {
  const formatCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 14) {
      return numbers.replace(
        /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
        "$1.$2.$3/$4-$5"
      );
    }
    return value;
  };

  const handleCNPJChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCNPJ(e.target.value);
    onUpdate({ ...formData, cnpj: formatted });
  };

  const canContinue = formData.name.trim().length > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-lg">
            <Building2 className="w-6 h-6 text-primary" />
          </div>
          <div>
            <CardTitle>Dados da Empresa</CardTitle>
            <CardDescription>
              Informações básicas sobre sua empresa
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">
            Razão Social <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            placeholder="Ex: CompSmart Tecnologia Ltda"
            value={formData.name}
            onChange={(e) => onUpdate({ ...formData, name: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="fantasy_name">Nome Fantasia</Label>
          <Input
            id="fantasy_name"
            placeholder="Ex: CompSmart"
            value={formData.fantasy_name}
            onChange={(e) => onUpdate({ ...formData, fantasy_name: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">
            Como sua empresa é conhecida no mercado
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="cnpj">CNPJ</Label>
          <Input
            id="cnpj"
            placeholder="00.000.000/0000-00"
            value={formData.cnpj}
            onChange={handleCNPJChange}
            maxLength={18}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Endereço</Label>
          <Textarea
            id="address"
            placeholder="Endereço completo da empresa"
            value={formData.address}
            onChange={(e) => onUpdate({ ...formData, address: e.target.value })}
            rows={3}
          />
        </div>

        <Button
          onClick={onNext}
          disabled={!canContinue}
          className="w-full gap-2"
        >
          Continuar
          <ArrowRight className="w-4 h-4" />
        </Button>
      </CardContent>
    </Card>
  );
};