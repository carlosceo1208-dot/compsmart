import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { CompanyProvider } from "./contexts/CompanyContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import ActivateAccount from "./pages/ActivateAccount";
import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";
import NotFound from "./pages/NotFound";
import { DashboardLayout } from "./components/DashboardLayout";
import Organization from "./pages/Organization";
import Roles from "./pages/Roles";
import AccessControl from "./pages/AccessControl";
import MyProfile from "./pages/MyProfile";
import SalaryRanges from "./pages/SalaryRanges";
import Settings from "./pages/Settings";
import Plans from "./pages/settings/Plans";
import SurveyData from "./pages/SurveyData";
import SalaryComparison from "./pages/SalaryComparison";
import JobTitles from "./pages/JobTitles";
import PeopleAnalytics from "./pages/PeopleAnalytics";
import LegalAssistant from "./pages/LegalAssistant";
import SalaryAssistant from "./pages/SalaryAssistant";
import IncentiveAssistant from "./pages/IncentiveAssistant";
import IncentivePrograms from "./pages/IncentivePrograms";
import Pricing from "./pages/Pricing";
import SalaryAnalysisReport from "./pages/SalaryAnalysisReport";
import Budget from "./pages/Budget";
import BudgetPlanning from "./pages/BudgetPlanning";
import BudgetApprovals from "./pages/BudgetApprovals";
import Benefits from "./pages/Benefits";
import KnowledgeBase from "./pages/KnowledgeBase";
import AuditLogs from "./pages/AuditLogs";
import AlertSettings from "./pages/AlertSettings";
import DataAudit from "./pages/DataAudit";
import Onboarding from "./pages/Onboarding";
import Organogram from "./pages/Organogram";
import TermsOfUse from "./pages/TermsOfUse";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Checkout from "./pages/Checkout";
import CheckoutSuccess from "./pages/checkout/Success";
import CheckoutProcessing from "./pages/checkout/Processing";
import Billing from "./pages/settings/Billing";
import LandingContent from "./pages/settings/LandingContent";
import MyPlan from "./pages/settings/MyPlan";
import MFAVerify from "./components/auth/MFAVerify";
import { LabelsProvider } from "./contexts/LabelsContext";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import SecurityDashboard from "./pages/SecurityDashboard";
import AboutUs from "./pages/AboutUs";
import Glossary from "./pages/Glossary";
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>
        <LabelsProvider>
          <CompanyProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
        <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/activate" element={<ActivateAccount />} />
            <Route path="/auth/mfa-verify" element={<MFAVerify />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/termos-de-uso" element={<TermsOfUse />} />
            <Route path="/politica-de-privacidade" element={<PrivacyPolicy />} />
            <Route path="/sobre-nos" element={<AboutUs />} />
            <Route path="/glossario" element={<Glossary />} />
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
            </Route>
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
            </BrowserRouter>
          </CompanyProvider>
        </LabelsProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
