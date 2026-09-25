import { useMemo } from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PasswordStrengthIndicatorProps {
  password: string;
}

interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
}

const requirements: PasswordRequirement[] = [
  { label: "Mínimo 10 caracteres", test: (p) => p.length >= 10 },
  { label: "Uma letra maiúscula", test: (p) => /[A-Z]/.test(p) },
  { label: "Uma letra minúscula", test: (p) => /[a-z]/.test(p) },
  { label: "Um número", test: (p) => /[0-9]/.test(p) },
  { label: "Um caractere especial (!@#$%^&*)", test: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
];

export const PasswordStrengthIndicator = ({ password }: PasswordStrengthIndicatorProps) => {
  const strength = useMemo(() => {
    if (!password) return 0;
    return requirements.filter((req) => req.test(password)).length;
  }, [password]);

  const strengthPercentage = (strength / requirements.length) * 100;

  const getStrengthColor = () => {
    if (strengthPercentage <= 20) return "bg-destructive";
    if (strengthPercentage <= 40) return "bg-orange-500";
    if (strengthPercentage <= 60) return "bg-yellow-500";
    if (strengthPercentage <= 80) return "bg-lime-500";
    return "bg-green-500";
  };

  const getStrengthLabel = () => {
    if (strengthPercentage <= 20) return "Muito fraca";
    if (strengthPercentage <= 40) return "Fraca";
    if (strengthPercentage <= 60) return "Média";
    if (strengthPercentage <= 80) return "Forte";
    return "Muito forte";
  };

  if (!password) return null;

  return (
    <div className="space-y-3 mt-2">
      {/* Strength Bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Força da senha</span>
          <span className={cn(
            "font-medium",
            strengthPercentage <= 40 ? "text-destructive" : 
            strengthPercentage <= 60 ? "text-yellow-600" : "text-green-600"
          )}>
            {getStrengthLabel()}
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={cn("h-full transition-all duration-300", getStrengthColor())}
            style={{ width: `${strengthPercentage}%` }}
          />
        </div>
      </div>

      {/* Requirements Checklist */}
      <div className="grid grid-cols-1 gap-1">
        {requirements.map((req, index) => {
          const isMet = req.test(password);
          return (
            <div
              key={index}
              className={cn(
                "flex items-center gap-2 text-xs transition-colors",
                isMet ? "text-green-600" : "text-muted-foreground"
              )}
            >
              {isMet ? (
                <Check className="h-3 w-3 flex-shrink-0" />
              ) : (
                <X className="h-3 w-3 flex-shrink-0" />
              )}
              <span>{req.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 10) {
    errors.push("Senha deve ter no mínimo 10 caracteres");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Senha deve conter pelo menos uma letra maiúscula");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("Senha deve conter pelo menos uma letra minúscula");
  }
  if (!/[0-9]/.test(password)) {
    errors.push("Senha deve conter pelo menos um número");
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push("Senha deve conter pelo menos um caractere especial (!@#$%^&*)");
  }
  
  return { isValid: errors.length === 0, errors };
};
