import { useState } from "react";
import { LucideIcon, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useFeatureAccess, PlanType } from "@/hooks/useFeatureAccess";
import { UpgradePlanModal } from "@/components/UpgradePlanModal";
import { cn } from "@/lib/utils";

interface ModuleCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  onClick?: () => void;
  status?: "active" | "coming-soon" | "beta";
  category?: "management" | "simulation" | "consultation" | "export";
  requiredPlan?: PlanType;
  isSmartAgent?: boolean;
  index?: number;
}

const categoryStyles = {
  management: "border-primary/20 hover:border-primary/50",
  simulation: "border-warning/20 hover:border-warning/50",
  consultation: "border-secondary/20 hover:border-secondary/50",
  export: "border-accent/20 hover:border-accent/50",
};

const categoryGlow = {
  management: "hover:shadow-primary",
  simulation: "hover:shadow-warning",
  consultation: "hover:shadow-success",
  export: "hover:shadow-accent",
};

const categoryIconColor = {
  management: "text-primary bg-primary/15",
  simulation: "text-warning bg-warning/15",
  consultation: "text-secondary bg-secondary/15",
  export: "text-accent bg-accent/15",
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
  requiredPlan,
  isSmartAgent = false,
  index = 0,
}: ModuleCardProps) => {
  const { hasAccess } = useFeatureAccess();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const hasFeatureAccess = !requiredPlan || hasAccess(`${title.toLowerCase().replace(/\s+/g, '_')}`);
  const isClickable = status === "active" && onClick && hasFeatureAccess;
  const isLocked = requiredPlan && !hasFeatureAccess;

  const handleClick = () => {
    if (!hasFeatureAccess && requiredPlan) {
      setIsShaking(true);
      setTimeout(() => {
        setIsShaking(false);
        setShowUpgradeModal(true);
      }, 500);
    } else if (onClick) {
      onClick();
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, delay: Math.min(index, 12) * 0.04, ease: [0.22, 1, 0.36, 1] }}
        whileHover={isClickable || isLocked ? { y: -6, scale: 1.02, transition: { duration: 0.2 } } : undefined}
        whileTap={isClickable ? { scale: 0.98 } : undefined}
        className="h-full"
      >
        <Card
          className={cn(
            "group transition-all duration-300 h-full relative border-2 overflow-hidden",
            isSmartAgent
              ? "bg-gradient-to-br from-primary/8 via-card to-secondary/8 border-primary/40 hover:border-primary/70 hover:shadow-glow-primary"
              : "bg-gradient-card hover:bg-gradient-card-hover",
            !isSmartAgent && categoryStyles[category],
            !isSmartAgent && categoryGlow[category],
            isClickable || isLocked ? "cursor-pointer" : "opacity-60 cursor-not-allowed"
          )}
          onClick={hasFeatureAccess ? (isClickable ? onClick : undefined) : handleClick}
        >
          {isSmartAgent && (
            <div className="absolute top-2 right-2 z-10">
              <Badge className="text-xs bg-gradient-primary border-0 shadow-primary">
                IA
              </Badge>
            </div>
          )}
          {isLocked && (
            <div className="absolute top-3 right-3 z-10">
              <div className={cn("bg-background/90 backdrop-blur-sm rounded-full p-2 shadow-md transition-transform", isShaking && "animate-shake")}>
                <Lock className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
          )}
          <CardHeader className="space-y-2">
            <div className="flex items-start justify-between">
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center shadow-sm transition-all duration-300",
                isSmartAgent ? "bg-gradient-primary text-primary-foreground" : categoryIconColor[category],
                isClickable && "group-hover:scale-110 group-hover:rotate-3"
              )}>
                <Icon className={cn("w-6 h-6", isSmartAgent && "text-primary-foreground")} />
              </div>
              {statusBadges[status]}
            </div>
            <CardTitle className="text-sm sm:text-base leading-tight font-bold line-clamp-2 group-hover:text-primary transition-colors">
              {title}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <CardDescription className="text-xs leading-relaxed">
              {description}
            </CardDescription>
          </CardContent>
        </Card>
      </motion.div>

      <UpgradePlanModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        feature={title}
        requiredPlan={requiredPlan || 'pro'}
      />
    </>
  );
};
