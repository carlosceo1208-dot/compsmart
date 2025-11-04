-- Create user subscriptions table
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_type text CHECK (plan_type IN ('starter', 'medium', 'pro')) NOT NULL DEFAULT 'starter',
  expires_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_subscriptions
CREATE POLICY "Users can view own subscription"
  ON public.user_subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all subscriptions"
  ON public.user_subscriptions
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage subscriptions"
  ON public.user_subscriptions
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create legal assistant conversations table
CREATE TABLE IF NOT EXISTS public.legal_assistant_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  question text NOT NULL,
  answer text NOT NULL,
  legal_references jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  tokens_used integer,
  response_time_ms integer
);

-- Enable RLS
ALTER TABLE public.legal_assistant_conversations ENABLE ROW LEVEL SECURITY;

-- RLS policies for legal_assistant_conversations
CREATE POLICY "Users can view own conversations"
  ON public.legal_assistant_conversations
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversations"
  ON public.legal_assistant_conversations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all conversations"
  ON public.legal_assistant_conversations
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updating updated_at
CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default starter plan for existing users
INSERT INTO public.user_subscriptions (user_id, plan_type)
SELECT id, 'starter'
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.user_subscriptions)
ON CONFLICT (user_id) DO NOTHING;