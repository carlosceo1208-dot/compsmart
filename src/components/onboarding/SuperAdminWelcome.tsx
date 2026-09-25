import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  ShieldCheck, Users, Building2, Activity, Sparkles, ArrowRight, CheckCircle2,
} from "lucide-react";
import { Link } from "react-router-dom";

const STORAGE_KEY = "compsmart:super-admin-welcome-seen";

const STEPS = [
  {
    icon: ShieldCheck,
    title: "Bem-vindo, Super Admin",
    body: "Você tem acesso total à plataforma CompSmart — todas as empresas, todos os módulos, todas as configurações. Use esse poder com responsabilidade: cada ação fica registrada no log de auditoria (LGPD).",
  },
  {
    icon: Users,
    title: "Perfis & Permissões",
    body: "Existem 4 níveis de acesso na plataforma:",
    roles: [
      { label: "Super Admin", desc: "Acesso global a todas as empresas e configurações da plataforma." },
      { label: "Admin RH", desc: "Gerencia colaboradores, cargos, faixas e remuneração da própria empresa." },
      { label: "Gestor", desc: "Visualiza apenas a equipe direta + simulações de mérito do time." },
      { label: "Colaborador", desc: "Acessa apenas o próprio perfil, Total Rewards e avaliações." },
    ],
  },
  {
    icon: Building2,
    title: "Multi-empresa",
    body: "No topo da tela há um seletor de empresa. Ao alternar, todas as telas mostram dados isolados daquela organização. Um banner amarelo indica quando você está visualizando dados de outra empresa.",
  },
  {
    icon: Activity,
    title: "Próximos passos sugeridos",
    body: "Para extrair valor do CompSmart no seu primeiro dia:",
    actions: [
      { to: "/employees", label: "Conferir colaboradores cadastrados" },
      { to: "/salary-ranges", label: "Revisar tabelas e faixas salariais" },
      { to: "/nr1", label: "Explorar o módulo Saúde & Bem-Estar (NR-1)" },
      { to: "/admin/convidar-socios", label: "Convidar outros sócios / admins" },
      { to: "/admin/leads", label: "Ver e responder leads do site" },
    ],
  },
];

const useIsSuperAdmin = () =>
  useQuery({
    queryKey: ["welcome-is-super-admin"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "super_admin")
        .maybeSingle();
      return { userId: user.id, isSuper: !!data };
    },
    staleTime: 10 * 60 * 1000,
  });

export const SuperAdminWelcome = () => {
  const { data } = useIsSuperAdmin();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!data?.isSuper || !data.userId) return;
    const key = `${STORAGE_KEY}:${data.userId}`;
    if (!localStorage.getItem(key)) {
      const t = setTimeout(() => setOpen(true), 600);
      return () => clearTimeout(t);
    }
  }, [data]);

  const dismiss = () => {
    if (data?.userId) localStorage.setItem(`${STORAGE_KEY}:${data.userId}`, new Date().toISOString());
    setOpen(false);
  };

  const current = STEPS[step];
  const Icon = current.icon;
  const isLast = step === STEPS.length - 1;

  return (
    <Dialog open={open} onOpenChange={(o) => (!o ? dismiss() : setOpen(o))}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-emerald-500 flex items-center justify-center text-white shadow-md">
              <Icon className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-[10px]">
                  <Sparkles className="h-3 w-3 mr-1" /> Tour guiado · {step + 1}/{STEPS.length}
                </Badge>
              </div>
              <DialogTitle className="text-xl mt-1">{current.title}</DialogTitle>
            </div>
          </div>
          <DialogDescription className="pt-3 text-sm leading-relaxed">
            {current.body}
          </DialogDescription>
        </DialogHeader>

        {current.roles && (
          <div className="grid sm:grid-cols-2 gap-2 mt-2">
            {current.roles.map((r) => (
              <Card key={r.label} className="border">
                <CardContent className="p-3">
                  <div className="font-semibold text-sm flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    {r.label}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{r.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {current.actions && (
          <div className="space-y-2 mt-2">
            {current.actions.map((a) => (
              <Link
                key={a.to}
                to={a.to}
                onClick={dismiss}
                className="flex items-center justify-between p-3 rounded-lg border hover:border-primary hover:bg-primary/5 transition-colors group"
              >
                <span className="text-sm font-medium">{a.label}</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition" />
              </Link>
            ))}
          </div>
        )}

        <DialogFooter className="flex sm:justify-between gap-2 pt-2">
          <Button variant="ghost" size="sm" onClick={dismiss}>
            Pular tour
          </Button>
          <div className="flex gap-2">
            {step > 0 && (
              <Button variant="outline" size="sm" onClick={() => setStep((s) => s - 1)}>
                Voltar
              </Button>
            )}
            <Button
              size="sm"
              onClick={() => (isLast ? dismiss() : setStep((s) => s + 1))}
              className="bg-primary"
            >
              {isLast ? "Começar a usar" : "Próximo"}
              {!isLast && <ArrowRight className="h-4 w-4 ml-1" />}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
