import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageUpload } from "@/components/ui/image-upload";
import { Image, ArrowLeft, ArrowRight } from "lucide-react";

interface LogoUploadStepProps {
  logoUrl: string | null;
  onUpdate: (url: string | null) => void;
  onNext: () => void;
  onBack: () => void;
}

export const LogoUploadStep = ({
  logoUrl,
  onUpdate,
  onNext,
  onBack,
}: LogoUploadStepProps) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-lg">
            <Image className="w-6 h-6 text-primary" />
          </div>
          <div>
            <CardTitle>Logo da Empresa</CardTitle>
            <CardDescription>
              Personalize sua experiência com a identidade visual da sua empresa
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <ImageUpload
          value={logoUrl}
          onChange={onUpdate}
          bucket="company-logos"
          label="Arraste o logo aqui ou clique para selecionar"
          description="PNG, JPG, WEBP ou SVG até 2MB. Recomendado: 512x512px"
        />

        <div className="bg-muted/50 p-4 rounded-lg space-y-2">
          <p className="text-sm font-medium">💡 Dicas para um logo perfeito:</p>
          <ul className="text-sm text-muted-foreground space-y-1 ml-4">
            <li>✓ Use fundo transparente (PNG)</li>
            <li>✓ Formato quadrado (1:1)</li>
            <li>✓ Resolução mínima: 512x512px</li>
            <li>✓ Máximo 2MB</li>
          </ul>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onBack}
            className="flex-1 gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
          <Button onClick={onNext} className="flex-1 gap-2">
            {logoUrl ? "Continuar" : "Pular por agora"}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};