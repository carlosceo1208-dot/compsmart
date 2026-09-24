import { Navigate, useParams, Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bot, Check, ArrowRight, Link2, Download } from "lucide-react";
import { PublicLayout } from "@/components/landing/public/PublicLayout";
import { DemoDialog } from "@/components/landing/public/DemoDialog";
import { LANDING_MODULES } from "@/config/landingModules";
import { ImageSlot } from "@/components/landing/public/ImageSlot";
import imagemDashboard from "@/assets/imagem-b-dashboard.png.asset.json";
import imagemClima from "@/assets/imagem-c-clima.png.asset.json";
import imagemConsultores from "@/assets/imagem-d-consultores.png.asset.json";

const MODULE_IMAGES: Record<string, { label: string; alt: string; src?: string }> = {
  "/modulos/core": { label: "Imagem B", alt: "Profissional analisando dashboard de remuneração", src: imagemDashboard.url },
  "/modulos/clima": { label: "Imagem C", alt: "Sessão de clima e feedback com equipe", src: imagemClima.url },
  "/modulos/rh-service": { label: "Imagem D", alt: "Consultores seniores em mentoria", src: imagemConsultores.url },
};

const ModuloPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const modulo = LANDING_MODULES.find((m) => m.route === `/modulos/${slug}`);

  if (!modulo) return <Navigate to="/" replace />;

  const Icon = modulo.icon;

  return (
    <PublicLayout
      title={`${modulo.nome} | CompSmart`}
      description={modulo.solucao}
      path={modulo.route}
    >
      <section className="py-16 md:py-20 bg-gradient-to-br from-background via-primary/5 to-muted/40">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto space-y-5 text-center">
            <div className="flex justify-center">
              <span className="p-3 rounded-2xl bg-primary/10">
                <Icon className="h-7 w-7 text-primary" />
              </span>
            </div>
            <Badge
              variant="outline"
              className={
                modulo.legal
                  ? "rounded-full border-[#DC2626]/30 bg-[#DC2626]/10 text-[#DC2626] mx-auto"
                  : "rounded-full mx-auto"
              }
            >
              {modulo.selo}
            </Badge>
            <h1 className="text-3xl md:text-5xl font-bold">{modulo.nome}</h1>
            <p className="text-base md:text-lg text-muted-foreground">
              {modulo.problema}
            </p>
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary">
              <Bot className="h-4 w-4" />
              Agente {modulo.agente}
            </span>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <DemoDialog size="lg" moduloInteresse={modulo.nomeCurto} />
              <Button asChild variant="outline" size="lg">
                <Link to="/precos">
                  Ver preços
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {MODULE_IMAGES[modulo.route] && (
        <section className="pt-14 bg-background">
          <div className="container mx-auto px-4 max-w-4xl">
            <ImageSlot {...MODULE_IMAGES[modulo.route]} className="rounded-2xl shadow-md" />
          </div>
        </section>
      )}

      <section className="py-14 bg-background">
        <div className="container mx-auto px-4">
          <Card className="max-w-3xl mx-auto rounded-2xl border-primary/20">
            <CardContent className="p-6 md:p-8 space-y-3 text-center">
              <h2 className="text-2xl font-bold">A solução</h2>
              <p className="text-muted-foreground leading-relaxed">
                {modulo.solucao}
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="py-14 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
              O que está incluído
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {modulo.recursos.map((r) => (
                <div
                  key={r}
                  className="flex gap-3 rounded-2xl border border-border bg-card p-5"
                >
                  <Check className="h-5 w-5 text-[#16A34A] shrink-0 mt-0.5" />
                  <p className="text-sm">{r}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-14 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="text-center">
              <h2 className="text-2xl md:text-3xl font-bold">
                Como se conecta com os outros módulos
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {modulo.legal
                  ? "Os cruzamentos são complementos modulares, ativáveis à parte — nenhum deles é necessário para cumprir a NR-1."
                  : "Cada módulo funciona sozinho; combinados, geram inteligência que nenhuma planilha alcança."}
              </p>
            </div>
            <ul className="space-y-3">
              {modulo.cruzamentos.map((c) => (
                <li
                  key={c}
                  className="flex gap-3 rounded-2xl border border-border bg-card p-5 text-sm"
                >
                  <Link2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  {c}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="py-16 bg-primary">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center space-y-5 text-primary-foreground">
            <h2 className="text-2xl md:text-3xl font-bold">
              Veja o {modulo.nomeCurto} funcionando com os seus dados
            </h2>
            <p className="text-primary-foreground/90 text-sm md:text-base">
              {modulo.negociavel
                ? "Projetos e apoio contínuo são negociados caso a caso, conforme o escopo."
                : "Agende uma demonstração e comece pelo que mais dói hoje."}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <DemoDialog
                size="lg"
                variant="secondary"
                moduloInteresse={modulo.nomeCurto}
              />
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-primary-foreground/50 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
              >
                <Link to="/materiais">
                  <Download className="h-4 w-4 mr-2" />
                  Materiais gratuitos
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};

export default ModuloPage;
