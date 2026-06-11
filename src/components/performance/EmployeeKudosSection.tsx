import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Award, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { useEmployeeKudos, type EmployeeKudos } from "@/hooks/useEmployeeKudos";
import { kudosCategoryEmojis, kudosCategoryLabels } from "@/hooks/usePerformanceKudos";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface EmployeeKudosSectionProps {
  employeeId: string;
  employeeName?: string;
  cycleStartDate?: string;
  cycleEndDate?: string;
  showAsCard?: boolean;
  maxHeight?: string;
  className?: string;
}

export function EmployeeKudosSection({
  employeeId,
  employeeName,
  cycleStartDate,
  cycleEndDate,
  showAsCard = true,
  maxHeight = "300px",
  className,
}: EmployeeKudosSectionProps) {
  const [isOpen, setIsOpen] = useState(true);
  
  const { kudos, isLoading, totalKudos } = useEmployeeKudos({
    employeeId,
    startDate: cycleStartDate,
    endDate: cycleEndDate,
  });

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const content = (
    <>
      {totalKudos === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <Award className="h-10 w-10 text-muted-foreground/30 mb-2" />
          <p className="text-sm text-muted-foreground">
            Nenhum reconhecimento recebido
            {cycleStartDate && cycleEndDate && " neste período"}
          </p>
        </div>
      ) : (
        <ScrollArea style={{ maxHeight }} className="pr-2">
          <div className="space-y-3">
            {kudos.map((k) => (
              <KudosEvidenceCard key={k.id} kudos={k} />
            ))}
          </div>
        </ScrollArea>
      )}
    </>
  );

  if (!showAsCard) {
    return <div className={className}>{content}</div>;
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className={`border-indigo-200/50 dark:border-indigo-800/30 ${className}`}>
        <CardHeader className="pb-2">
          <CollapsibleTrigger asChild>
            <Button 
              variant="ghost" 
              className="w-full justify-between p-0 h-auto hover:bg-transparent"
            >
              <CardTitle className="text-base flex items-center gap-2">
                <Award className="h-5 w-5 text-indigo-600" />
                Reconhecimentos
                {totalKudos > 0 && (
                  <Badge variant="secondary" className="ml-2 bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
                    {totalKudos}
                  </Badge>
                )}
              </CardTitle>
              {isOpen ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          </CollapsibleTrigger>
          <p className="text-xs text-muted-foreground mt-1">
            Evidências qualitativas de reconhecimento entre pares
            {employeeName && ` para ${employeeName}`}
          </p>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="pt-2">
            {content}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

function KudosEvidenceCard({ kudos }: { kudos: EmployeeKudos }) {
  const categoryEmoji = kudosCategoryEmojis[kudos.category];
  const categoryLabel = kudosCategoryLabels[kudos.category];

  return (
    <div className="p-3 rounded-lg border bg-gradient-to-r from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/20 dark:to-purple-950/20 border-indigo-200/50 dark:border-indigo-800/30">
      <div className="flex items-start gap-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src={kudos.from_employee?.avatar_url || undefined} />
          <AvatarFallback className="text-xs bg-indigo-100 text-indigo-700">
            {kudos.from_employee?.full_name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-medium text-sm truncate">
                {kudos.from_employee?.full_name}
              </span>
              <Badge variant="outline" className="text-xs shrink-0">
                {categoryEmoji} {categoryLabel}
              </Badge>
            </div>
            <time className="text-xs text-muted-foreground shrink-0">
              {format(new Date(kudos.created_at), "dd/MM/yy", { locale: ptBR })}
            </time>
          </div>
          
          {kudos.from_employee?.job_title && (
            <p className="text-xs text-muted-foreground mb-1 truncate">
              {kudos.from_employee.job_title}
            </p>
          )}
          
          <p className="text-sm text-foreground/80 leading-relaxed">
            "{kudos.message}"
          </p>
          
          {!kudos.is_public && (
            <Badge variant="secondary" className="mt-2 text-xs">
              🔒 Privado
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
