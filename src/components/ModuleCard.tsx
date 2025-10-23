import { LucideIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ModuleCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  onClick?: () => void;
  status?: "active" | "coming-soon" | "beta";
  category?: "management" | "simulation" | "consultation" | "export";
}

const categoryColors = {
  management: "bg-primary/10 text-primary border-primary/20",
  simulation: "bg-warning/10 text-warning border-warning/20",
  consultation: "bg-success/10 text-success border-success/20",
  export: "bg-secondary/10 text-secondary border-secondary/20",
};

const statusBadges = {
  active: <Badge variant="outline" className="bg-success/10 text-success border-success/20">Ativo</Badge>,
  "coming-soon": <Badge variant="outline" className="bg-muted/50 text-muted-foreground">Em Breve</Badge>,
  beta: <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">Beta</Badge>,
};

export const ModuleCard = ({ 
  title, 
  description, 
  icon: Icon, 
  onClick, 
  status = "active",
  category = "management" 
}: ModuleCardProps) => {
  const isClickable = status === "active" && onClick;
  
  return (
    <Card
      className={`
        group transition-all duration-300 h-full
        ${isClickable 
          ? "cursor-pointer hover:shadow-lg hover:-translate-y-1 hover:border-primary/50" 
          : "opacity-60 cursor-not-allowed"
        }
        ${categoryColors[category]} border-2
      `}
      onClick={isClickable ? onClick : undefined}
    >
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between">
          <div className={`
            w-12 h-12 rounded-lg flex items-center justify-center
            transition-transform duration-300
            ${isClickable ? "group-hover:scale-110" : ""}
          `}>
            <Icon className="w-6 h-6" />
          </div>
          {statusBadges[status]}
        </div>
        <CardTitle className="text-lg leading-tight">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-sm leading-relaxed">
          {description}
        </CardDescription>
      </CardContent>
    </Card>
  );
};
