import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Heart, CheckCircle2 } from 'lucide-react';

export default function Nr1Obrigado() {
  return (
    <div className="nr1-scope min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-10 pb-10 text-center space-y-4">
          <div className="h-14 w-14 rounded-full nr1-bg-soft flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-7 w-7 nr1-text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold flex items-center justify-center gap-2">
              <Heart className="h-5 w-5 nr1-text-primary" /> Obrigado!
            </h1>
            <p className="text-muted-foreground mt-2">
              Recebemos seus dados. Nossa equipe entrará em contato em até 24h úteis com uma proposta
              personalizada para sua empresa.
            </p>
          </div>
          <div className="space-y-2 pt-2">
            <Button asChild className="w-full nr1-bg-primary">
              <Link to="/auth">Criar conta e iniciar trial</Link>
            </Button>
            <Button asChild variant="ghost" className="w-full">
              <Link to="/nr1-publico">Voltar à página NR-1</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
