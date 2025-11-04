import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
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
import SurveyData from "./pages/SurveyData";
import SalaryComparison from "./pages/SalaryComparison";
import JobTitles from "./pages/JobTitles";
import PeopleAnalytics from "./pages/PeopleAnalytics";
import LegalAssistant from "./pages/LegalAssistant";
import Pricing from "./pages/Pricing";
import { LabelsProvider } from "./contexts/LabelsContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <LabelsProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/employees" element={<Employees />} />
              <Route path="/organization" element={<Organization />} />
              <Route path="/roles" element={<Roles />} />
              <Route path="/access-control" element={<AccessControl />} />
              <Route path="/my-profile" element={<MyProfile />} />
              <Route path="/salary-ranges" element={<SalaryRanges />} />
              <Route path="/survey-data" element={<SurveyData />} />
              <Route path="/salary-comparison" element={<SalaryComparison />} />
              <Route path="/job-titles" element={<JobTitles />} />
              <Route path="/people-analytics" element={<PeopleAnalytics />} />
              <Route path="/legal-assistant" element={<LegalAssistant />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </LabelsProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
