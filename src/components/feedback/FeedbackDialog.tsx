import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFeedback, FeedbackType } from '@/hooks/useFeedback';
import { Lightbulb, Bug, Heart, HelpCircle, Star, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pageUrl?: string;
}

const feedbackTypes: { value: FeedbackType; label: string; icon: React.ReactNode; color: string }[] = [
  { value: 'suggestion', label: 'Sugestão', icon: <Lightbulb className="h-4 w-4" />, color: 'text-amber-500' },
  { value: 'bug', label: 'Reportar Bug', icon: <Bug className="h-4 w-4" />, color: 'text-red-500' },
  { value: 'praise', label: 'Elogio', icon: <Heart className="h-4 w-4" />, color: 'text-pink-500' },
  { value: 'question', label: 'Dúvida', icon: <HelpCircle className="h-4 w-4" />, color: 'text-blue-500' },
];

export function FeedbackDialog({ open, onOpenChange, pageUrl }: FeedbackDialogProps) {
  const { createFeedback } = useFeedback();
  const [type, setType] = useState<FeedbackType>('suggestion');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [npsScore, setNpsScore] = useState<number | null>(null);
  const [hoveredNps, setHoveredNps] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await createFeedback.mutateAsync({
      type,
      title,
      description,
      page_url: pageUrl,
      user_agent: navigator.userAgent,
      nps_score: npsScore,
    });

    // Reset form
    setType('suggestion');
    setTitle('');
    setDescription('');
    setNpsScore(null);
    onOpenChange(false);
  };

  const getNpsLabel = (score: number) => {
    if (score <= 6) return 'Detrator';
    if (score <= 8) return 'Neutro';
    return 'Promotor';
  };

  const getNpsColor = (score: number) => {
    if (score <= 6) return 'text-red-500';
    if (score <= 8) return 'text-amber-500';
    return 'text-green-500';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            Envie seu Feedback
          </DialogTitle>
          <DialogDescription>
            Sua opinião é muito importante para melhorarmos o CompSmart.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Tipo de Feedback</Label>
            <Select value={type} onValueChange={(v) => setType(v as FeedbackType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {feedbackTypes.map((ft) => (
                  <SelectItem key={ft.value} value={ft.value}>
                    <div className="flex items-center gap-2">
                      <span className={ft.color}>{ft.icon}</span>
                      {ft.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Resuma seu feedback em uma frase"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva em detalhes..."
              rows={4}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Qual nota você daria ao CompSmart? (Opcional)</Label>
            <div className="flex flex-col items-center gap-2 py-2">
              <div className="flex gap-1">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                  <button
                    key={score}
                    type="button"
                    onClick={() => setNpsScore(score)}
                    onMouseEnter={() => setHoveredNps(score)}
                    onMouseLeave={() => setHoveredNps(null)}
                    className={cn(
                      'w-8 h-8 rounded-full text-sm font-medium transition-all',
                      'border hover:scale-110',
                      npsScore === score
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background border-border hover:border-primary/50'
                    )}
                  >
                    {score}
                  </button>
                ))}
              </div>
              <div className="flex justify-between w-full text-xs text-muted-foreground px-1">
                <span>Não recomendo</span>
                <span>Recomendo muito</span>
              </div>
              {(npsScore !== null || hoveredNps !== null) && (
                <div className={cn(
                  'text-sm font-medium',
                  getNpsColor(hoveredNps ?? npsScore ?? 0)
                )}>
                  {getNpsLabel(hoveredNps ?? npsScore ?? 0)}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createFeedback.isPending}>
              {createFeedback.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Enviar Feedback
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
