-- ============================================
-- MÓDULO DE AVALIAÇÃO DE DESEMPENHO - FASE 1
-- ============================================

-- ENUMS
CREATE TYPE performance_cycle_status AS ENUM ('draft', 'goals', 'monitoring', 'insights', 'closing', 'closed');
CREATE TYPE performance_goal_level AS ENUM ('company', 'area', 'department', 'position', 'individual');
CREATE TYPE performance_goal_status AS ENUM ('pending', 'in_progress', 'achieved', 'not_achieved');
CREATE TYPE performance_evaluation_status AS ENUM ('draft', 'pending_review', 'reviewed', 'approved', 'returned');
CREATE TYPE performance_evaluator_type AS ENUM ('self', 'manager', 'superior', 'peer', 'hr');
CREATE TYPE performance_evaluation_angle AS ENUM ('90', '180', '360');
CREATE TYPE performance_scale_type AS ENUM ('numeric_1_5', 'conceptual', 'percentage');
CREATE TYPE performance_kudos_category AS ENUM ('teamwork', 'innovation', 'leadership', 'customer_focus', 'excellence');
CREATE TYPE performance_pdi_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');
CREATE TYPE performance_readiness AS ENUM ('ready_now', 'ready_1_year', 'ready_2_years', 'development');
CREATE TYPE performance_merit_type AS ENUM ('merit_increase', 'promotion', 'none');
CREATE TYPE performance_merit_status AS ENUM ('pending', 'approved', 'rejected', 'applied');

-- ============================================
-- TABELA: CICLOS DE AVALIAÇÃO
-- ============================================
CREATE TABLE public.performance_cycles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  root_company_id UUID NOT NULL REFERENCES public.organizational_structure(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  fiscal_year INTEGER NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  goals_start_date DATE,
  goals_end_date DATE,
  evaluation_start_date DATE,
  evaluation_end_date DATE,
  status performance_cycle_status NOT NULL DEFAULT 'draft',
  evaluation_angle performance_evaluation_angle NOT NULL DEFAULT '90',
  scale_type performance_scale_type NOT NULL DEFAULT 'numeric_1_5',
  include_competencies BOOLEAN DEFAULT true,
  competency_weight NUMERIC(5,2) DEFAULT 30.00,
  goals_weight NUMERIC(5,2) DEFAULT 70.00,
  include_probationary BOOLEAN DEFAULT false,
  linked_incentive_program_id UUID REFERENCES public.incentive_programs(id),
  incentive_weight_percentage NUMERIC(5,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================
-- TABELA: MODELOS DE AVALIAÇÃO
-- ============================================
CREATE TABLE public.performance_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  root_company_id UUID REFERENCES public.organizational_structure(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  template_type TEXT NOT NULL DEFAULT 'general', -- operational, administrative, technical, sales, managers, probationary
  indicators JSONB DEFAULT '[]'::jsonb,
  suggested_competency_ids UUID[] DEFAULT '{}',
  is_global BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================
-- TABELA: METAS DE DESEMPENHO (CASCATEADAS)
-- ============================================
CREATE TABLE public.performance_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  root_company_id UUID NOT NULL REFERENCES public.organizational_structure(id) ON DELETE CASCADE,
  cycle_id UUID NOT NULL REFERENCES public.performance_cycles(id) ON DELETE CASCADE,
  parent_goal_id UUID REFERENCES public.performance_goals(id) ON DELETE SET NULL,
  level performance_goal_level NOT NULL,
  unit_id UUID REFERENCES public.organizational_structure(id),
  job_title_id UUID REFERENCES public.job_titles(id),
  employee_id UUID REFERENCES public.profiles(id),
  title TEXT NOT NULL,
  description TEXT,
  target_value NUMERIC(15,2),
  current_value NUMERIC(15,2) DEFAULT 0,
  unit_of_measure TEXT,
  weight NUMERIC(5,2) DEFAULT 100.00,
  status performance_goal_status NOT NULL DEFAULT 'pending',
  due_date DATE,
  achieved_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================
-- TABELA: AVALIAÇÕES DE DESEMPENHO
-- ============================================
CREATE TABLE public.performance_evaluations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  root_company_id UUID NOT NULL REFERENCES public.organizational_structure(id) ON DELETE CASCADE,
  cycle_id UUID NOT NULL REFERENCES public.performance_cycles(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.performance_templates(id),
  employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  evaluator_id UUID NOT NULL REFERENCES public.profiles(id),
  evaluator_type performance_evaluator_type NOT NULL DEFAULT 'manager',
  status performance_evaluation_status NOT NULL DEFAULT 'draft',
  goals_score NUMERIC(5,2),
  competency_score NUMERIC(5,2),
  final_score NUMERIC(5,2),
  potential_score NUMERIC(5,2), -- Para 9Box
  strengths TEXT,
  improvement_areas TEXT,
  manager_comments TEXT,
  employee_comments TEXT,
  ai_feedback TEXT,
  is_probationary BOOLEAN DEFAULT false,
  probationary_decision TEXT, -- 'effectuate', 'extend', 'terminate'
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================
-- TABELA: SCORES DE COMPETÊNCIAS POR AVALIAÇÃO
-- ============================================
CREATE TABLE public.performance_competency_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  evaluation_id UUID NOT NULL REFERENCES public.performance_evaluations(id) ON DELETE CASCADE,
  competency_id UUID NOT NULL REFERENCES public.competencies(id) ON DELETE CASCADE,
  expected_level TEXT,
  evaluated_level TEXT,
  score NUMERIC(5,2),
  comments TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(evaluation_id, competency_id)
);

-- ============================================
-- TABELA: REUNIÕES 1:1
-- ============================================
CREATE TABLE public.performance_one_on_ones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  root_company_id UUID NOT NULL REFERENCES public.organizational_structure(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  manager_id UUID NOT NULL REFERENCES public.profiles(id),
  scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  agenda_items JSONB DEFAULT '[]'::jsonb,
  action_items JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================
-- TABELA: KUDOS / RECONHECIMENTOS
-- ============================================
CREATE TABLE public.performance_kudos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  root_company_id UUID NOT NULL REFERENCES public.organizational_structure(id) ON DELETE CASCADE,
  from_employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  to_employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category performance_kudos_category NOT NULL,
  message TEXT NOT NULL,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================
-- TABELA: PDI - PLANO DE DESENVOLVIMENTO INDIVIDUAL
-- ============================================
CREATE TABLE public.performance_pdi (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  root_company_id UUID NOT NULL REFERENCES public.organizational_structure(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  evaluation_id UUID REFERENCES public.performance_evaluations(id),
  title TEXT NOT NULL,
  description TEXT,
  competency_id UUID REFERENCES public.competencies(id),
  action_items JSONB DEFAULT '[]'::jsonb,
  status performance_pdi_status NOT NULL DEFAULT 'pending',
  progress_percentage NUMERIC(5,2) DEFAULT 0,
  due_date DATE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================
-- TABELA: SUCESSÃO
-- ============================================
CREATE TABLE public.performance_succession (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  root_company_id UUID NOT NULL REFERENCES public.organizational_structure(id) ON DELETE CASCADE,
  key_position_id UUID NOT NULL REFERENCES public.job_titles(id) ON DELETE CASCADE,
  successor_employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  readiness performance_readiness NOT NULL DEFAULT 'development',
  notes TEXT,
  development_plan TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(key_position_id, successor_employee_id)
);

-- ============================================
-- TABELA: REGRAS DE MÉRITO
-- ============================================
CREATE TABLE public.performance_merit_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  root_company_id UUID NOT NULL REFERENCES public.organizational_structure(id) ON DELETE CASCADE,
  cycle_id UUID REFERENCES public.performance_cycles(id) ON DELETE SET NULL,
  min_score NUMERIC(5,2) NOT NULL,
  max_score NUMERIC(5,2) NOT NULL,
  merit_percentage NUMERIC(5,2) NOT NULL,
  promotion_eligible BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================
-- TABELA: RECOMENDAÇÕES DE MÉRITO
-- ============================================
CREATE TABLE public.performance_merit_recommendations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  evaluation_id UUID NOT NULL REFERENCES public.performance_evaluations(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recommended_percentage NUMERIC(5,2) NOT NULL,
  recommended_type performance_merit_type NOT NULL DEFAULT 'merit_increase',
  recommended_new_job_title_id UUID REFERENCES public.job_titles(id),
  status performance_merit_status NOT NULL DEFAULT 'pending',
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  applied_to_budget BOOLEAN DEFAULT false,
  budget_projection_id UUID REFERENCES public.budget_employee_projections(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================
-- TABELA: VÍNCULO PLR/INCENTIVOS
-- ============================================
CREATE TABLE public.performance_variable_link (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  evaluation_id UUID NOT NULL REFERENCES public.performance_evaluations(id) ON DELETE CASCADE,
  incentive_program_id UUID NOT NULL REFERENCES public.incentive_programs(id) ON DELETE CASCADE,
  weight_percentage NUMERIC(5,2) NOT NULL DEFAULT 100,
  calculated_multiplier NUMERIC(5,2) NOT NULL DEFAULT 1.00,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(evaluation_id, incentive_program_id)
);

-- ============================================
-- TABELA: CONVERSAS DO PERFORMAI
-- ============================================
CREATE TABLE public.performai_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.conversation_sessions(id) ON DELETE SET NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  context_data JSONB DEFAULT '{}'::jsonb,
  document_name TEXT,
  document_text TEXT,
  operation_mode TEXT DEFAULT 'consulta',
  tokens_used INTEGER DEFAULT 0,
  response_time_ms INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================
-- TABELA: GLOSSÁRIO DE PERFORMANCE
-- ============================================
CREATE TABLE public.performance_glossary_terms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  term TEXT NOT NULL UNIQUE,
  definition TEXT NOT NULL,
  category TEXT NOT NULL,
  synonyms TEXT[] DEFAULT '{}',
  related_terms TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================
CREATE INDEX idx_performance_cycles_company ON public.performance_cycles(root_company_id);
CREATE INDEX idx_performance_cycles_year ON public.performance_cycles(fiscal_year);
CREATE INDEX idx_performance_goals_cycle ON public.performance_goals(cycle_id);
CREATE INDEX idx_performance_goals_employee ON public.performance_goals(employee_id);
CREATE INDEX idx_performance_evaluations_cycle ON public.performance_evaluations(cycle_id);
CREATE INDEX idx_performance_evaluations_employee ON public.performance_evaluations(employee_id);
CREATE INDEX idx_performance_evaluations_status ON public.performance_evaluations(status);
CREATE INDEX idx_performance_kudos_to ON public.performance_kudos(to_employee_id);
CREATE INDEX idx_performance_pdi_employee ON public.performance_pdi(employee_id);
CREATE INDEX idx_performance_merit_recommendations_status ON public.performance_merit_recommendations(status);
CREATE INDEX idx_performai_conversations_user ON public.performai_conversations(user_id);

-- ============================================
-- RLS POLICIES
-- ============================================

-- CYCLES
ALTER TABLE public.performance_cycles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own company cycles"
  ON public.performance_cycles FOR SELECT
  USING (root_company_id = get_user_company_id());

CREATE POLICY "Admins and HR manage cycles"
  ON public.performance_cycles FOR ALL
  USING (root_company_id = get_user_company_id() AND has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role]));

-- TEMPLATES
ALTER TABLE public.performance_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View templates"
  ON public.performance_templates FOR SELECT
  USING (is_global = true OR root_company_id = get_user_company_id());

CREATE POLICY "Admins and HR manage templates"
  ON public.performance_templates FOR ALL
  USING ((root_company_id = get_user_company_id() OR is_global = true) AND has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role]));

-- GOALS
ALTER TABLE public.performance_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own company goals"
  ON public.performance_goals FOR SELECT
  USING (root_company_id = get_user_company_id());

CREATE POLICY "Admins HR and Managers manage goals"
  ON public.performance_goals FOR ALL
  USING (root_company_id = get_user_company_id() AND has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role, 'manager'::app_role]));

-- EVALUATIONS
ALTER TABLE public.performance_evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own evaluations"
  ON public.performance_evaluations FOR SELECT
  USING (employee_id = auth.uid() OR evaluator_id = auth.uid() OR (root_company_id = get_user_company_id() AND has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role])));

CREATE POLICY "Admins HR and evaluators manage evaluations"
  ON public.performance_evaluations FOR ALL
  USING (evaluator_id = auth.uid() OR (root_company_id = get_user_company_id() AND has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role])));

-- COMPETENCY SCORES
ALTER TABLE public.performance_competency_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View competency scores via evaluation"
  ON public.performance_competency_scores FOR SELECT
  USING (evaluation_id IN (SELECT id FROM public.performance_evaluations WHERE employee_id = auth.uid() OR evaluator_id = auth.uid() OR (root_company_id = get_user_company_id() AND has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role]))));

CREATE POLICY "Manage competency scores via evaluation"
  ON public.performance_competency_scores FOR ALL
  USING (evaluation_id IN (SELECT id FROM public.performance_evaluations WHERE evaluator_id = auth.uid() OR (root_company_id = get_user_company_id() AND has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role]))));

-- ONE ON ONES
ALTER TABLE public.performance_one_on_ones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own 1on1s"
  ON public.performance_one_on_ones FOR SELECT
  USING (employee_id = auth.uid() OR manager_id = auth.uid() OR (root_company_id = get_user_company_id() AND has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role])));

CREATE POLICY "Managers and HR manage 1on1s"
  ON public.performance_one_on_ones FOR ALL
  USING (manager_id = auth.uid() OR (root_company_id = get_user_company_id() AND has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role])));

-- KUDOS
ALTER TABLE public.performance_kudos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View public kudos or own"
  ON public.performance_kudos FOR SELECT
  USING ((is_public = true AND root_company_id = get_user_company_id()) OR from_employee_id = auth.uid() OR to_employee_id = auth.uid());

CREATE POLICY "Users can send kudos"
  ON public.performance_kudos FOR INSERT
  WITH CHECK (from_employee_id = auth.uid() AND root_company_id = get_user_company_id());

-- PDI
ALTER TABLE public.performance_pdi ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own PDI"
  ON public.performance_pdi FOR SELECT
  USING (employee_id = auth.uid() OR (root_company_id = get_user_company_id() AND has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role, 'manager'::app_role])));

CREATE POLICY "Admins HR and Managers manage PDI"
  ON public.performance_pdi FOR ALL
  USING (root_company_id = get_user_company_id() AND has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role, 'manager'::app_role]));

-- SUCCESSION
ALTER TABLE public.performance_succession ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and HR view succession"
  ON public.performance_succession FOR SELECT
  USING (root_company_id = get_user_company_id() AND has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role]));

CREATE POLICY "Admins and HR manage succession"
  ON public.performance_succession FOR ALL
  USING (root_company_id = get_user_company_id() AND has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role]));

-- MERIT RULES
ALTER TABLE public.performance_merit_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View merit rules"
  ON public.performance_merit_rules FOR SELECT
  USING (root_company_id = get_user_company_id());

CREATE POLICY "Admins and HR manage merit rules"
  ON public.performance_merit_rules FOR ALL
  USING (root_company_id = get_user_company_id() AND has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role]));

-- MERIT RECOMMENDATIONS
ALTER TABLE public.performance_merit_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View merit recommendations"
  ON public.performance_merit_recommendations FOR SELECT
  USING (employee_id = auth.uid() OR evaluation_id IN (SELECT id FROM public.performance_evaluations WHERE root_company_id = get_user_company_id() AND has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role])));

CREATE POLICY "Admins and HR manage merit recommendations"
  ON public.performance_merit_recommendations FOR ALL
  USING (evaluation_id IN (SELECT id FROM public.performance_evaluations WHERE root_company_id = get_user_company_id() AND has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role])));

-- VARIABLE LINK
ALTER TABLE public.performance_variable_link ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View variable links"
  ON public.performance_variable_link FOR SELECT
  USING (evaluation_id IN (SELECT id FROM public.performance_evaluations WHERE employee_id = auth.uid() OR root_company_id = get_user_company_id()));

CREATE POLICY "Admins and HR manage variable links"
  ON public.performance_variable_link FOR ALL
  USING (evaluation_id IN (SELECT id FROM public.performance_evaluations WHERE root_company_id = get_user_company_id() AND has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role])));

-- PERFORMAI CONVERSATIONS
ALTER TABLE public.performai_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own PerformAI conversations"
  ON public.performai_conversations FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users insert own PerformAI conversations"
  ON public.performai_conversations FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins view all PerformAI conversations"
  ON public.performai_conversations FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- GLOSSARY
ALTER TABLE public.performance_glossary_terms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view active glossary terms"
  ON public.performance_glossary_terms FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins manage glossary terms"
  ON public.performance_glossary_terms FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- ============================================
-- TRIGGER PARA UPDATED_AT
-- ============================================
CREATE TRIGGER update_performance_cycles_updated_at
  BEFORE UPDATE ON public.performance_cycles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_performance_templates_updated_at
  BEFORE UPDATE ON public.performance_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_performance_goals_updated_at
  BEFORE UPDATE ON public.performance_goals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_performance_evaluations_updated_at
  BEFORE UPDATE ON public.performance_evaluations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_performance_one_on_ones_updated_at
  BEFORE UPDATE ON public.performance_one_on_ones
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_performance_pdi_updated_at
  BEFORE UPDATE ON public.performance_pdi
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_performance_succession_updated_at
  BEFORE UPDATE ON public.performance_succession
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_performance_merit_rules_updated_at
  BEFORE UPDATE ON public.performance_merit_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_performance_merit_recommendations_updated_at
  BEFORE UPDATE ON public.performance_merit_recommendations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_performance_glossary_terms_updated_at
  BEFORE UPDATE ON public.performance_glossary_terms
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();