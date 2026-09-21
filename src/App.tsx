import { useEffect, lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { CompanyProvider } from "./contexts/CompanyContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { DashboardLayout } from "./components/DashboardLayout";
import { LabelsProvider } from "./contexts/LabelsContext";
import { Skeleton } from "./components/ui/skeleton";
import { TelemetryTracker } from "./components/TelemetryTracker";
import { ViewAsClientToggle } from "./components/ViewAsClientToggle";
import { ModuleGate } from "./components/ModuleGate";

// Eager — critical entry points
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

// Lazy — auth & onboarding
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const ActivateAccount = lazy(() => import("./pages/ActivateAccount"));
const MFAVerify = lazy(() => import("./components/auth/MFAVerify"));
const MFARequired = lazy(() => import("./pages/MFARequired"));
const Onboarding = lazy(() => import("./pages/Onboarding"));

// Lazy — dashboard pages
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Employees = lazy(() => import("./pages/Employees"));
const Organization = lazy(() => import("./pages/Organization"));
const Roles = lazy(() => import("./pages/Roles"));
const AccessControl = lazy(() => import("./pages/AccessControl"));
const ConvidarSocios = lazy(() => import("./pages/admin/ConvidarSocios"));
const PermissionsMatrix = lazy(() => import("./pages/admin/PermissionsMatrix"));
const MyProfile = lazy(() => import("./pages/MyProfile"));
const SalaryRanges = lazy(() => import("./pages/SalaryRanges"));
const Settings = lazy(() => import("./pages/Settings"));
const Plans = lazy(() => import("./pages/settings/Plans"));
const SurveyData = lazy(() => import("./pages/SurveyData"));
const SalaryComparison = lazy(() => import("./pages/SalaryComparison"));
const JobTitles = lazy(() => import("./pages/JobTitles"));
const PeopleAnalytics = lazy(() => import("./pages/PeopleAnalytics"));
const LegalAssistant = lazy(() => import("./pages/LegalAssistant"));
const SalaryAssistant = lazy(() => import("./pages/SalaryAssistant"));
const IncentiveAssistant = lazy(() => import("./pages/IncentiveAssistant"));
const IncentivePrograms = lazy(() => import("./pages/IncentivePrograms"));
const Pricing = lazy(() => import("./pages/Pricing"));
const SalaryAnalysisReport = lazy(() => import("./pages/SalaryAnalysisReport"));
const Budget = lazy(() => import("./pages/Budget"));
const BudgetPlanning = lazy(() => import("./pages/BudgetPlanning"));
const BudgetApprovals = lazy(() => import("./pages/BudgetApprovals"));
const Benefits = lazy(() => import("./pages/Benefits"));
const KnowledgeBase = lazy(() => import("./pages/KnowledgeBase"));
const AuditLogs = lazy(() => import("./pages/AuditLogs"));
const Nr1Auditoria = lazy(() => import("./pages/nr1/Nr1Auditoria"));
const AlertSettings = lazy(() => import("./pages/AlertSettings"));
const DataAudit = lazy(() => import("./pages/DataAudit"));
const Organogram = lazy(() => import("./pages/Organogram"));
const TermsOfUse = lazy(() => import("./pages/TermsOfUse"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const Checkout = lazy(() => import("./pages/Checkout"));
const CheckoutSuccess = lazy(() => import("./pages/checkout/Success"));
const CheckoutProcessing = lazy(() => import("./pages/checkout/Processing"));
const Billing = lazy(() => import("./pages/settings/Billing"));
const LandingContent = lazy(() => import("./pages/settings/LandingContent"));
const MyPlan = lazy(() => import("./pages/settings/MyPlan"));
const SuperAdminDashboard = lazy(() => import("./pages/SuperAdminDashboard"));
const SecurityDashboard = lazy(() => import("./pages/SecurityDashboard"));
const AboutUs = lazy(() => import("./pages/AboutUs"));
const Glossary = lazy(() => import("./pages/Glossary"));
const Changelog = lazy(() => import("./pages/Changelog"));
const TotalRewards = lazy(() => import("./pages/TotalRewards"));
const Equity = lazy(() => import("./pages/Equity"));
const MarketBenchmark = lazy(() => import("./pages/MarketBenchmark"));
const JobMatching = lazy(() => import("./pages/JobMatching"));
const TalentIntelligence = lazy(() => import("./pages/TalentIntelligence"));
const PayEquity = lazy(() => import("./pages/PayEquity"));
const ExecutiveCompensation = lazy(() => import("./pages/ExecutiveCompensation"));
const ExecutiveDashboard = lazy(() => import("./pages/ExecutiveDashboard"));
const MeritGovernance = lazy(() => import("./pages/MeritGovernance"));
const BudgetBurndown = lazy(() => import("./pages/BudgetBurndown"));
const ApprovalInbox = lazy(() => import("./pages/ApprovalInbox"));
const DecisionScenarios = lazy(() => import("./pages/DecisionScenarios"));

// Lazy — Performance Module
const PerformanceLayout = lazy(() =>
  import("./components/performance/PerformanceLayout").then((m) => ({ default: m.PerformanceLayout }))
);
const PerformanceDashboard = lazy(() => import("./pages/PerformanceDashboard"));
const PerformanceCycles = lazy(() => import("./pages/performance/PerformanceCycles"));
const PerformanceGoals = lazy(() => import("./pages/performance/PerformanceGoals"));
const PerformanceEvaluations = lazy(() => import("./pages/performance/PerformanceEvaluations"));
const PerformanceTemplates = lazy(() => import("./pages/performance/PerformanceTemplates"));
const Performance9Box = lazy(() => import("./pages/performance/Performance9Box"));
const PerformanceOneOnOnes = lazy(() => import("./pages/performance/PerformanceOneOnOnes"));
const PerformanceKudos = lazy(() => import("./pages/performance/PerformanceKudos"));
const PerformancePDI = lazy(() => import("./pages/performance/PerformancePDI"));
const PerformanceSuccession = lazy(() => import("./pages/performance/PerformanceSuccession"));
const PerformanceGlossary = lazy(() => import("./pages/performance/PerformanceGlossary"));
const PerformanceAssistant = lazy(() => import("./pages/performance/PerformanceAssistant"));
const ExternalFeedback360 = lazy(() => import("./pages/performance/ExternalFeedback360"));
const PerformanceEmployees = lazy(() => import("./pages/performance/PerformanceEmployees"));

// Lazy — Public
const ExternalFeedbackForm = lazy(() => import("./pages/public/ExternalFeedbackForm"));
const LandingNr1 = lazy(() => import("./pages/public/LandingNr1"));
const LandingNr1Ads = lazy(() => import("./pages/public/LandingNr1Ads"));
const Nr1Obrigado = lazy(() => import("./pages/public/Nr1Obrigado"));
const LandingCargosSalarios = lazy(() => import("./pages/public/LandingCargosSalarios"));
const ClimaPublico = lazy(() => import("./pages/public/ClimaPublico"));

// Lazy — NR-1 Module
const Nr1Layout = lazy(() => import("./components/nr1/Nr1Layout").then((m) => ({ default: m.Nr1Layout })));
const Nr1Dashboard = lazy(() => import("./pages/nr1/Nr1Dashboard"));
const Nr1NovoDiagnostico = lazy(() => import("./pages/nr1/Nr1NovoDiagnostico"));
const Nr1Diagnosticos = lazy(() => import("./pages/nr1/Nr1Diagnosticos"));
const Nr1DiagnosticoDetalhe = lazy(() => import("./pages/nr1/Nr1DiagnosticoDetalhe"));
const Nr1Contratar = lazy(() => import("./pages/nr1/Nr1Contratar"));
const Nr1Inteligencia = lazy(() => import("./pages/nr1/Nr1Inteligencia"));
const Nr1BemEstarAgente = lazy(() => import("./pages/nr1/Nr1BemEstarAgente"));
const Nr1JornadaBemEstar = lazy(() => import("./pages/nr1/Nr1JornadaBemEstar"));
const Nr1Acompanhamento = lazy(() => import("./pages/nr1/Nr1Acompanhamento"));
const Nr1FIB = lazy(() => import("./pages/nr1/Nr1FIB"));
const Nr1FibCard = lazy(() => import("./pages/nr1/Nr1FibCard"));
const Nr1SegPsi = lazy(() => import("./pages/nr1/Nr1SegPsi"));
const Nr1Sociodemografico = lazy(() => import("./pages/nr1/Nr1Sociodemografico"));
const Nr1Universo = lazy(() => import("./pages/nr1/Nr1Universo"));
const Nr1Etapas = lazy(() => import("./pages/nr1/Nr1Etapas"));
const Nr1Consentimento = lazy(() => import("./pages/nr1/Nr1Consentimento"));
const Nr1PlanosAcao = lazy(() => import("./pages/nr1/Nr1PlanosAcao"));
const Nr1Vitalidade = lazy(() => import("./pages/nr1/Nr1Vitalidade"));
const Nr1Biblioteca = lazy(() => import("./pages/nr1/Nr1Biblioteca"));
const Nr1Clima = lazy(() => import("./pages/nr1/Nr1Clima"));
const Nr1ClimaResponder = lazy(() => import("./pages/nr1/Nr1ClimaResponder"));
const Nr1ClimaDashboard = lazy(() => import("./pages/nr1/Nr1ClimaDashboard"));
const Nr1ClimaCorrelacao = lazy(() => import("./pages/nr1/Nr1ClimaCorrelacao"));
const Nr1ClimaExternoDashboard = lazy(() => import("./pages/nr1/Nr1ClimaExternoDashboard"));
const Nr1ClimaRelatorios = lazy(() => import("./pages/nr1/Nr1ClimaRelatorios"));
const Nr1ClimaGovernanca = lazy(() => import("./pages/nr1/Nr1ClimaGovernanca"));
const ClimaExternoPublico = lazy(() => import("./pages/public/ClimaExternoPublico"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000, // 1 min — avoid refetching on quick remounts
      gcTime: 5 * 60_000, // 5 min cache retention
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const RouteFallback = () => (
  <div className="container mx-auto p-6 space-y-4">
    <Skeleton className="h-8 w-1/3" />
    <Skeleton className="h-32 w-full" />
    <Skeleton className="h-64 w-full" />
  </div>
);

const App = () => {
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error("Unhandled promise rejection:", event.reason);
      event.preventDefault();
    };
    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    return () => window.removeEventListener("unhandledrejection", handleUnhandledRejection);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <TooltipProvider>
          <LabelsProvider>
            <CompanyProvider>
              <Toaster />
              <Sonner />
              <ErrorBoundary>
                <BrowserRouter>
                  <TelemetryTracker />
                  <ViewAsClientToggle />
                  <Suspense fallback={<RouteFallback />}>
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/auth" element={<Auth />} />
                      <Route path="/forgot-password" element={<ForgotPassword />} />
                      <Route path="/reset-password" element={<ResetPassword />} />
                      <Route path="/activate" element={<ActivateAccount />} />
                      <Route path="/auth/mfa-verify" element={<MFAVerify />} />
                      <Route path="/auth/mfa-required" element={<MFARequired />} />
                      <Route path="/onboarding" element={<Onboarding />} />
                      <Route path="/termos-de-uso" element={<TermsOfUse />} />
                      <Route path="/politica-de-privacidade" element={<PrivacyPolicy />} />
                      <Route path="/sobre-nos" element={<AboutUs />} />
                      <Route path="/glossario" element={<Glossary />} />
                      <Route path="/changelog" element={<Changelog />} />
                      <Route path="/checkout" element={<Checkout />} />
                      <Route path="/checkout/success" element={<CheckoutSuccess />} />
                      <Route path="/checkout/processing" element={<CheckoutProcessing />} />
                      <Route element={<DashboardLayout />}>
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/employees" element={<Employees />} />
                        <Route path="/organization" element={<Organization />} />
                        <Route path="/organograma" element={<Organogram />} />
                        <Route path="/roles" element={<Roles />} />
                        <Route path="/access-control" element={<AccessControl />} />
                        <Route path="/admin/convidar-socios" element={<ConvidarSocios />} />
                        <Route path="/admin/permissions-matrix" element={<PermissionsMatrix />} />
                        <Route path="/my-profile" element={<MyProfile />} />
                        <Route path="/salary-ranges" element={<SalaryRanges />} />
                        <Route path="/survey-data" element={<SurveyData />} />
                        <Route path="/salary-comparison" element={<SalaryComparison />} />
                        <Route path="/job-titles" element={<JobTitles />} />
                        <Route path="/people-analytics" element={<PeopleAnalytics />} />
                        <Route path="/legal-assistant" element={<LegalAssistant />} />
                        <Route path="/salary-assistant" element={<SalaryAssistant />} />
                        <Route path="/incentive-assistant" element={<IncentiveAssistant />} />
                        <Route path="/incentive-programs" element={<IncentivePrograms />} />
                        <Route path="/pricing" element={<Pricing />} />
                        <Route path="/salary-analysis-report" element={<SalaryAnalysisReport />} />
                        <Route path="/budget" element={<Budget />} />
                        <Route path="/budget-planning" element={<BudgetPlanning />} />
                        <Route path="/budget-approvals" element={<BudgetApprovals />} />
                        <Route path="/benefits" element={<Benefits />} />
                        <Route path="/knowledge-base" element={<KnowledgeBase />} />
                        <Route path="/audit-logs" element={<AuditLogs />} />
                        <Route path="/alert-settings" element={<AlertSettings />} />
                        <Route path="/data-audit" element={<DataAudit />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="/settings/plans" element={<Plans />} />
                        <Route path="/settings/billing" element={<Billing />} />
                        <Route path="/settings/landing-content" element={<LandingContent />} />
                        <Route path="/settings/my-plan" element={<MyPlan />} />
                        <Route path="/super-admin" element={<SuperAdminDashboard />} />
                        <Route path="/security-dashboard" element={<SecurityDashboard />} />
                        <Route path="/total-rewards" element={<TotalRewards />} />
                        <Route path="/equity" element={<Equity />} />
                        <Route path="/market-benchmark" element={<MarketBenchmark />} />
                        <Route path="/job-matching" element={<JobMatching />} />
                        <Route path="/talent-intelligence" element={<TalentIntelligence />} />
                        <Route path="/pay-equity" element={<PayEquity />} />
                        <Route path="/executive-compensation" element={<ExecutiveCompensation />} />
                        <Route path="/executive-dashboard" element={<ExecutiveDashboard />} />
                        <Route path="/merit-governance" element={<MeritGovernance />} />
                        <Route path="/budget-burndown" element={<BudgetBurndown />} />
                        <Route path="/approval-inbox" element={<ApprovalInbox />} />
                        <Route path="/decision-scenarios" element={<DecisionScenarios />} />
                      </Route>

                      {/* Performance Module */}
                      <Route element={<PerformanceLayout />}>
                        <Route path="/performance" element={<PerformanceDashboard />} />
                        <Route path="/performance/employees" element={<PerformanceEmployees />} />
                        <Route path="/performance/cycles" element={<PerformanceCycles />} />
                        <Route path="/performance/goals" element={<PerformanceGoals />} />
                        <Route path="/performance/evaluations" element={<PerformanceEvaluations />} />
                        <Route path="/performance/templates" element={<PerformanceTemplates />} />
                        <Route path="/performance/9box" element={<Performance9Box />} />
                        <Route path="/performance/one-on-ones" element={<PerformanceOneOnOnes />} />
                        <Route path="/performance/kudos" element={<PerformanceKudos />} />
                        <Route path="/performance/pdi" element={<PerformancePDI />} />
                        <Route path="/performance/succession" element={<PerformanceSuccession />} />
                        <Route path="/performance/feedback-360" element={<ExternalFeedback360 />} />
                        <Route path="/performance/glossary" element={<PerformanceGlossary />} />
                        <Route path="/performance/assistant" element={<PerformanceAssistant />} />
                      </Route>

                      {/* Public SEO landing pages */}
                      <Route path="/plano-de-cargos-e-salarios" element={<LandingCargosSalarios />} />

                      {/* Public NR-1 landing (lead capture) — nova URL oficial */}
                      <Route path="/nr1" element={<LandingNr1 />} />
                      {/* Redirect 301-style da URL antiga para preservar SEO e campanhas */}
                      <Route path="/nr1-publico" element={<Navigate to="/nr1" replace />} />
                      {/* URL comercial dedicada para anúncios pagos (Google Ads / Meta / LinkedIn) */}
                      <Route path="/landing-nr1" element={<LandingNr1Ads />} />
                      <Route path="/nr1/obrigado" element={<Nr1Obrigado />} />

                      {/* NR-1 Module (authenticated) */}
                      <Route element={<Nr1Layout />}>
                        <Route path="/nr1/painel" element={<Nr1Dashboard />} />
                        <Route path="/nr1/diagnostico/novo" element={<Nr1NovoDiagnostico />} />
                        <Route path="/nr1/diagnosticos" element={<Nr1Diagnosticos />} />
                        <Route path="/nr1/diagnostico/:id" element={<Nr1DiagnosticoDetalhe />} />
                        <Route path="/nr1/inteligencia" element={<Nr1Inteligencia />} />
                        <Route path="/nr1/fib" element={<ModuleGate mode="page" moduleSlug="nr1" featureName="FIB — Felicidade Interna Bruta"><Nr1FIB /></ModuleGate>} />
                        <Route path="/nr1/fib-bem-estar" element={<ModuleGate mode="page" moduleSlug="nr1" featureName="FIB — Felicidade Interna Bruta"><Nr1FibCard /></ModuleGate>} />
                       <Route path="/nr1/seguranca-psicologica" element={<Nr1SegPsi />} />
                       <Route path="/nr1/sociodemografico" element={<Nr1Sociodemografico />} />
                       <Route path="/nr1/etapas" element={<Nr1Etapas />} />
                       <Route path="/nr1/universo" element={<Nr1Universo />} />
                        <Route path="/nr1/agente" element={<Nr1BemEstarAgente />} />
                        <Route path="/nr1/jornada" element={<Nr1JornadaBemEstar />} />
                         <Route path="/nr1/acompanhamento" element={<ModuleGate mode="page" moduleSlug="nr1" featureName="Check-up de Colaborador"><Nr1Acompanhamento /></ModuleGate>} />
                        <Route path="/nr1/contratar" element={<Nr1Contratar />} />
                        <Route path="/nr1/consentimento" element={<Nr1Consentimento />} />
                       <Route path="/nr1/planos-acao" element={<Nr1PlanosAcao />} />
                       <Route path="/nr1/vitalidade" element={<Nr1Vitalidade />} />
                       <Route path="/nr1/biblioteca" element={<Nr1Biblioteca />} />
                       <Route path="/nr1/auditoria" element={<Nr1Auditoria />} />
                        <Route path="/nr1/clima" element={<ModuleGate mode="page" moduleSlug="clima" featureName="Clima Organizacional"><Nr1Clima /></ModuleGate>} />
                      <Route path="/nr1/clima/:id/responder" element={<Nr1ClimaResponder />} />
                       <Route path="/nr1/clima/dashboard" element={<ModuleGate mode="page" moduleSlug="clima" featureName="Clima Organizacional"><Nr1ClimaDashboard /></ModuleGate>} />
                       <Route path="/nr1/clima/dashboard/:id" element={<ModuleGate mode="page" moduleSlug="clima" featureName="Clima Organizacional"><Nr1ClimaDashboard /></ModuleGate>} />
                       <Route path="/nr1/clima/correlacao" element={<ModuleGate mode="page" moduleSlugs={["nr1", "clima"]} requireAll featureName="Correlação Clima x Riscos"><Nr1ClimaCorrelacao /></ModuleGate>} />
                       <Route path="/nr1/clima/externo" element={<ModuleGate mode="page" moduleSlug="clima" featureName="Clima Organizacional"><Nr1ClimaExternoDashboard /></ModuleGate>} />
                      <Route path="/nr1/clima/externo/:id" element={<ModuleGate mode="page" moduleSlug="clima" featureName="Clima Organizacional"><Nr1ClimaExternoDashboard /></ModuleGate>} />
                      <Route path="/nr1/clima/relatorios" element={<ModuleGate mode="page" moduleSlug="clima" featureName="Clima Organizacional"><Nr1ClimaRelatorios /></ModuleGate>} />
                      <Route path="/nr1/clima/governanca" element={<ModuleGate mode="page" moduleSlug="clima" featureName="Clima Organizacional"><Nr1ClimaGovernanca /></ModuleGate>} />
                      </Route>

                      {/* Public */}
                      <Route path="/feedback/:token" element={<ExternalFeedbackForm />} />
                      <Route path="/clima/publico/:token" element={<ClimaPublico />} />
                      <Route path="/clima-externo/:token" element={<ClimaExternoPublico />} />

                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                </BrowserRouter>
              </ErrorBoundary>
            </CompanyProvider>
          </LabelsProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
