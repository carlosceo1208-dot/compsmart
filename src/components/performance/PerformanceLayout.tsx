import { Outlet, Link } from "react-router-dom";
import { ArrowLeft, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PerformanceNav } from "./PerformanceNav";

export function PerformanceLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-indigo-50 dark:from-indigo-950/20 dark:via-background dark:to-indigo-950/20">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-indigo-200/50 dark:border-indigo-800/30 bg-white/80 dark:bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <Link to="/dashboard">
                <Button variant="ghost" size="sm" className="gap-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-100 dark:text-indigo-400 dark:hover:bg-indigo-900/30">
                  <ArrowLeft className="h-4 w-4" />
                  Voltar ao Dashboard
                </Button>
              </Link>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-lg shadow-lg">
                <TrendingUp className="h-5 w-5 text-white" />
                <span className="text-lg font-bold text-white">Avaliação de Desempenho</span>
              </div>
            </div>
          </div>
          
          <PerformanceNav />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
