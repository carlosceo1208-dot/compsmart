import { useState } from "react";
import { LucideIcon, Lock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useFeatureAccess, PlanType } from "@/hooks/useFeatureAccess";
import { UpgradePlanModal } from "@/components/UpgradePlanModal";

interface ModuleCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  onClick?: () => void;
  status?: "active" | "coming-soon" | "beta";
  category?: "management" | "simulation" | "consultation" | "export";
  requiredPlan?: PlanType;
}

const categoryColors = {
  management: "bg-primary/10 text-primary border-primary/20 hover:border-primary/40",
  simulation: "bg-warning/10 text-warning border-warning/20 hover:border-warning/40",
  consultation: "bg-success/10 text-success border-success/20 hover:border-success/40",
  export: "bg-accent/10 text-accent border-accent/20 hover:border-accent/40",
};

const statusBadges = {
  active: <Badge variant="success">Ativo</Badge>,
  "coming-soon": <Badge variant="outline" className="bg-muted/50 text-muted-foreground">Em Breve</Badge>,
  beta: <Badge variant="warning">Beta</Badge>,
};

export const ModuleCard = ({ 
  title, 
  description, 
  icon: Icon, 
  onClick, 
  status = "active",
  category = "management",
  requiredPlan
}: ModuleCardProps) => {
  const { hasAccess } = useFeatureAccess();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const hasFeatureAccess = !requiredPlan || hasAccess(`${title.toLowerCase().replace(/\s+/g, '_')}`);
  const isClickable = status === "active" && onClick && hasFeatureAccess;
  
  const handleClick = () => {
    if (!hasFeatureAccess && requiredPlan) {
      setShowUpgradeModal(true);
    } else if (onClick) {
      onClick();
    }
  };
  
  return (
    <>
      <Card
        className={`
          group transition-all duration-300 h-full relative
          bg-gradient-to-br from-background to-primary/8
          ${(isClickable || (!hasFeatureAccess && requiredPlan))
            ? "cursor-pointer hover:shadow-xl hover:-translate-y-3 hover:scale-[1.03]" 
            : "opacity-60 cursor-not-allowed"
          }
          ${categoryColors[category]} border-2
        `}
        onClick={hasFeatureAccess ? (isClickable ? onClick : undefined) : handleClick}
      >
        {requiredPlan && !hasFeatureAccess && (
          <div className="absolute top-3 right-3 z-10">
            <div className="bg-background/90 backdrop-blur-sm rounded-full p-2 shadow-md">
              <Lock className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
        )}
        <CardHeader className="space-y-3">
          <div className="flex items-start justify-between">
            <div className={`
              w-14 h-14 bg-primary/15 rounded-xl flex items-center justify-center shadow-md
              transition-all duration-300
              ${isClickable ? "group-hover:scale-110 group-hover:shadow-primary" : ""}
            `}>
              <Icon className="w-7 h-7 text-primary" />
            </div>
            {statusBadges[status]}
          </div>
          <CardTitle className="text-lg leading-tight font-bold">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription className="text-sm leading-relaxed">
            {description}
          </CardDescription>
        </CardContent>
      </Card>
      
      <UpgradePlanModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        feature={title}
        requiredPlan={requiredPlan || 'pro'}
      />
    </>
  );
};
