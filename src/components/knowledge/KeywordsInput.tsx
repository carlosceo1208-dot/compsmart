import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface KeywordsInputProps {
  keywords: string[];
  onChange: (keywords: string[]) => void;
  placeholder?: string;
}

export function KeywordsInput({ keywords, onChange, placeholder = "Digite e pressione Enter..." }: KeywordsInputProps) {
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const trimmed = inputValue.trim().toLowerCase();
      if (trimmed && !keywords.includes(trimmed)) {
        onChange([...keywords, trimmed]);
        setInputValue('');
      }
    }
    
    if (e.key === 'Backspace' && !inputValue && keywords.length > 0) {
      onChange(keywords.slice(0, -1));
    }
  };

  const removeKeyword = (kw: string) => {
    onChange(keywords.filter(k => k !== kw));
  };

  return (
    <div className="border rounded-md p-2 flex flex-wrap gap-2 min-h-[80px] bg-background">
      {keywords.map(kw => (
        <Badge key={kw} variant="secondary" className="gap-1">
          {kw}
          <button 
            onClick={() => removeKeyword(kw)} 
            className="hover:text-destructive"
            type="button"
          >
            <X className="w-3 h-3" />
          </button>
        </Badge>
      ))}
      
      <Input
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={keywords.length === 0 ? placeholder : ""}
        className="flex-1 border-0 focus-visible:ring-0 min-w-[150px] h-8"
      />
    </div>
  );
}
