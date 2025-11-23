import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Network, ArrowLeft, Check, Loader2 } from "lucide-react";

interface InitialStructureStepProps {
  formData: any;
  onUpdate: (data: any) => void;
  onComplete: () => void;
  onBack: () => void;
  loading: boolean;
}

export const InitialStructureStep = ({
  formData,
  onUpdate,
  onComplete,
  onBack,
  loading,
}: InitialStructureStepProps) => {
  const [option, setOption] = useState<"yes" | "no">("no");

  const handleOptionChange = (value: "yes" | "no") => {
    setOption(value);
    onUpdate({ ...formData, createInitialStructure: value === "yes" });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-lg">
            <Network className="w-6 h-6 text-primary" />
          </div>
          <div>
            <CardTitle>Estrutura Organizacional</CardTitle>
            <CardDescription>
              Configure a hierarquia inicial da sua empresa (opcional)
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <Label>Sua empresa tem matriz e filiais?</Label>
          <RadioGroup value={option} onValueChange={(v) => handleOptionChange(v as "yes" | "no")}>
            <div className="flex items-center space-x-2 p-4 border rounded-lg cursor-pointer hover:bg-accent/50">
              <RadioGroupItem value="no" id="no" />
              <Label htmlFor="no" className="cursor-pointer flex-1">
                Não, fazer depois
              </Label>
            </div>
            <div className="flex items-center space-x-2 p-4 border rounded-lg cursor-pointer hover:bg-accent/50">
              <RadioGroupItem value="yes" id="yes" />
              <Label htmlFor="yes" className="cursor-pointer flex-1">
                Sim, criar estrutura básica agora
              </Label>
            </div>
          </RadioGroup>
        </div>

        {option === "yes" && (
          <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
            <div className="space-y-2">
              <Label htmlFor="hq_name">Nome da Matriz</Label>
              <Input
                id="hq_name"
                placeholder="Ex: Matriz São Paulo"
                value={formData.headquartersName || ""}
                onChange={(e) =>
                  onUpdate({ ...formData, headquartersName: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hq_code">Código da Matriz</Label>
              <Input
                id="hq_code"
                placeholder="Ex: MTZ01"
                value={formData.headquartersCode || ""}
                onChange={(e) =>
                  onUpdate({ ...formData, headquartersCode: e.target.value })
                }
              />
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onBack}
            disabled={loading}
            className="flex-1 gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
          <Button
            onClick={onComplete}
            disabled={loading || (option === "yes" && !formData.headquartersName)}
            className="flex-1 gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Criando...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Finalizar
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};