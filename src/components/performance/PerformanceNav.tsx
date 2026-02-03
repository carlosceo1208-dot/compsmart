import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Target,
  Calendar,
  ClipboardCheck,
  LayoutGrid,
  Users,
  Award,
  TrendingUp,
  BookOpen,
  Bot,
  FileText,
  UserPlus,
} from "lucide-react";

const navItems = [
  { path: "/performance", label: "Dashboard", icon: LayoutGrid },
  { path: "/performance/employees", label: "Colaboradores", icon: Users },
  { path: "/performance/cycles", label: "Ciclos", icon: Calendar },
  { path: "/performance/goals", label: "Metas", icon: Target },
  { path: "/performance/evaluations", label: "Avaliações", icon: ClipboardCheck },
  { path: "/performance/templates", label: "Modelos", icon: FileText },
  { path: "/performance/9box", label: "9Box", icon: LayoutGrid },
  { path: "/performance/one-on-ones", label: "1:1s", icon: Users },
  { path: "/performance/kudos", label: "Kudos", icon: Award },
  { path: "/performance/pdi", label: "PDI", icon: TrendingUp },
  { path: "/performance/succession", label: "Sucessão", icon: UserPlus },
  { path: "/performance/feedback-360", label: "Feedback 360", icon: Users },
  { path: "/performance/glossary", label: "Glossário", icon: BookOpen },
  { path: "/performance/assistant", label: "PerformAI", icon: Bot },
];

export function PerformanceNav() {
  const location = useLocation();

  return (
    <nav className="flex flex-wrap gap-1 p-1 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-lg border border-indigo-200/50 dark:border-indigo-800/30">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;

        return (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200",
              isActive
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/30"
            )}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
