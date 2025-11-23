import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

type FeaturesManagerProps = {
  features: string[];
  onChange: (features: string[]) => void;
};

export function FeaturesManager({ features, onChange }: FeaturesManagerProps) {
  const [newFeature, setNewFeature] = useState('');

  const handleAddFeature = () => {
    if (!newFeature.trim()) return;
    
    if (features.includes(newFeature.trim())) {
      return; // Evitar duplicatas
    }
    
    onChange([...features, newFeature.trim()]);
    setNewFeature('');
  };

  const handleRemoveFeature = (index: number) => {
    onChange(features.filter((_, i) => i !== index));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddFeature();
    }
  };

  return (
    <div className="space-y-3">
      {/* Input for new feature */}
      <div className="flex gap-2">
        <Input
          value={newFeature}
          onChange={(e) => setNewFeature(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Digite uma feature e pressione Enter"
          className="flex-1"
        />
        <Button type="button" onClick={handleAddFeature} size="sm">
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {/* List of features */}
      {features.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Features adicionadas ({features.length}):
          </p>
          <div className="flex flex-wrap gap-2">
            {features.map((feature, index) => (
              <Badge key={index} variant="secondary" className="pl-3 pr-1 py-1">
                <span className="mr-2">{feature}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => handleRemoveFeature(index)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {features.length === 0 && (
        <p className="text-sm text-muted-foreground italic">
          Nenhuma feature adicionada ainda. Digite acima para começar.
        </p>
      )}
    </div>
  );
}
