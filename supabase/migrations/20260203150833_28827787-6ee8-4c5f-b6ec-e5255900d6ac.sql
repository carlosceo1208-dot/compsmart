-- Enum para tipo de avaliador externo
CREATE TYPE external_evaluator_type AS ENUM ('customer', 'supplier', 'partner', 'other');

-- Enum para status da solicitação
CREATE TYPE external_feedback_status AS ENUM ('pending', 'sent', 'completed', 'expired', 'cancelled');

-- Tabela de solicitações de feedback externo
CREATE TABLE public.external_feedback_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  root_company_id UUID NOT NULL REFERENCES public.organizational_structure(id) ON DELETE CASCADE,
  cycle_id UUID REFERENCES public.performance_cycles(id) ON DELETE SET NULL,
  employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  external_name TEXT NOT NULL,
  external_email TEXT NOT NULL,
  external_type external_evaluator_type NOT NULL DEFAULT 'customer',
  token UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  deadline TIMESTAMPTZ NOT NULL,
  status external_feedback_status NOT NULL DEFAULT 'pending',
  template_questions JSONB DEFAULT '[]'::JSONB,
  custom_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de respostas dos avaliadores externos
CREATE TABLE public.external_feedback_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES public.external_feedback_requests(id) ON DELETE CASCADE,
  answers JSONB NOT NULL DEFAULT '[]'::JSONB,
  overall_rating NUMERIC(2,1) CHECK (overall_rating >= 1 AND overall_rating <= 5),
  strengths TEXT,
  improvement_areas TEXT,
  additional_comments TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_external_feedback_requests_company ON public.external_feedback_requests(root_company_id);
CREATE INDEX idx_external_feedback_requests_employee ON public.external_feedback_requests(employee_id);
CREATE INDEX idx_external_feedback_requests_cycle ON public.external_feedback_requests(cycle_id);
CREATE INDEX idx_external_feedback_requests_token ON public.external_feedback_requests(token);
CREATE INDEX idx_external_feedback_requests_status ON public.external_feedback_requests(status);
CREATE INDEX idx_external_feedback_responses_request ON public.external_feedback_responses(request_id);

-- Trigger para updated_at
CREATE TRIGGER update_external_feedback_requests_updated_at
  BEFORE UPDATE ON public.external_feedback_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar RLS
ALTER TABLE public.external_feedback_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_feedback_responses ENABLE ROW LEVEL SECURITY;

-- RLS Policies para external_feedback_requests
-- Usuários autenticados podem ver solicitações da sua empresa
CREATE POLICY "Users can view feedback requests from their company"
ON public.external_feedback_requests
FOR SELECT
USING (root_company_id = get_user_company_id());

-- Admin e HR podem criar solicitações
CREATE POLICY "Admin and HR can create feedback requests"
ON public.external_feedback_requests
FOR INSERT
WITH CHECK (
  root_company_id = get_user_company_id()
  AND has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role, 'manager'::app_role])
);

-- Admin e HR podem atualizar solicitações da empresa
CREATE POLICY "Admin and HR can update feedback requests"
ON public.external_feedback_requests
FOR UPDATE
USING (
  root_company_id = get_user_company_id()
  AND has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role, 'manager'::app_role])
);

-- Admin pode deletar solicitações
CREATE POLICY "Admin can delete feedback requests"
ON public.external_feedback_requests
FOR DELETE
USING (
  root_company_id = get_user_company_id()
  AND has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role])
);

-- RLS Policies para external_feedback_responses
-- Usuários autenticados podem ver respostas de solicitações da empresa
CREATE POLICY "Users can view feedback responses from their company"
ON public.external_feedback_responses
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.external_feedback_requests efr
    WHERE efr.id = request_id
    AND efr.root_company_id = get_user_company_id()
  )
);

-- Qualquer pessoa pode inserir resposta via token válido (sem autenticação)
-- Esta policy permite inserção anônima para formulário público
CREATE POLICY "Anyone can submit response to valid request"
ON public.external_feedback_responses
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.external_feedback_requests efr
    WHERE efr.id = request_id
    AND efr.status = 'sent'
    AND efr.deadline > NOW()
  )
);

-- Função para buscar request por token (sem autenticação necessária)
CREATE OR REPLACE FUNCTION public.get_feedback_request_by_token(p_token UUID)
RETURNS TABLE (
  id UUID,
  employee_name TEXT,
  employee_job_title TEXT,
  company_name TEXT,
  company_logo_url TEXT,
  external_name TEXT,
  external_type external_evaluator_type,
  deadline TIMESTAMPTZ,
  status external_feedback_status,
  template_questions JSONB,
  custom_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    efr.id,
    p.full_name AS employee_name,
    p.job_title AS employee_job_title,
    os.description AS company_name,
    os.logo_url AS company_logo_url,
    efr.external_name,
    efr.external_type,
    efr.deadline,
    efr.status,
    efr.template_questions,
    efr.custom_message
  FROM public.external_feedback_requests efr
  JOIN public.profiles p ON efr.employee_id = p.id
  JOIN public.organizational_structure os ON efr.root_company_id = os.id
  WHERE efr.token = p_token;
END;
$$;

-- Função para submeter resposta de feedback externo (sem autenticação)
CREATE OR REPLACE FUNCTION public.submit_external_feedback(
  p_token UUID,
  p_answers JSONB,
  p_overall_rating NUMERIC,
  p_strengths TEXT,
  p_improvement_areas TEXT,
  p_additional_comments TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_request_id UUID;
  v_response_id UUID;
BEGIN
  -- Verificar se o token é válido e a solicitação está ativa
  SELECT id INTO v_request_id
  FROM public.external_feedback_requests
  WHERE token = p_token
    AND status = 'sent'
    AND deadline > NOW();
  
  IF v_request_id IS NULL THEN
    RAISE EXCEPTION 'Solicitação de feedback inválida, expirada ou já respondida';
  END IF;
  
  -- Inserir resposta
  INSERT INTO public.external_feedback_responses (
    request_id,
    answers,
    overall_rating,
    strengths,
    improvement_areas,
    additional_comments
  ) VALUES (
    v_request_id,
    p_answers,
    p_overall_rating,
    p_strengths,
    p_improvement_areas,
    p_additional_comments
  )
  RETURNING id INTO v_response_id;
  
  -- Atualizar status da solicitação para completed
  UPDATE public.external_feedback_requests
  SET 
    status = 'completed',
    completed_at = NOW(),
    updated_at = NOW()
  WHERE id = v_request_id;
  
  RETURN v_response_id;
END;
$$;