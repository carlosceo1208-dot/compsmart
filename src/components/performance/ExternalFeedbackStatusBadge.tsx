import { Badge } from "@/components/ui/badge";
import { Clock, Mail, CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface ExternalFeedbackStatusBadgeProps {
  status: "pending" | "sent" | "completed" | "expired" | "cancelled";
}

const statusConfig = {
  pending: {
    label: "Pendente",
    variant: "secondary" as const,
    icon: Clock,
    className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  },
  sent: {
    label: "Enviado",
    variant: "default" as const,
    icon: Mail,
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
  completed: {
    label: "Respondido",
    variant: "default" as const,
    icon: CheckCircle,
    className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  },
  expired: {
    label: "Expirado",
    variant: "destructive" as const,
    icon: AlertCircle,
    className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  },
  cancelled: {
    label: "Cancelado",
    variant: "destructive" as const,
    icon: XCircle,
    className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  },
};

export function ExternalFeedbackStatusBadge({ status }: ExternalFeedbackStatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={`gap-1.5 ${config.className}`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}
