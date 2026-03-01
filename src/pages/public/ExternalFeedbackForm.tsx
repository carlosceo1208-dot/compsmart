import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Star, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type ExternalFeedbackStatus = Database["public"]["Enums"]["external_feedback_status"];
type ExternalEvaluatorType = Database["public"]["Enums"]["external_evaluator_type"];

interface FeedbackRequestData {
  id: string;
  employee_name: string;
  employee_job_title: string | null;
  company_name: string;
  company_logo_url: string | null;
  external_name: string;
  external_type: ExternalEvaluatorType;
  deadline: string;
  status: ExternalFeedbackStatus;
  template_questions: Array<{
    id: string;
    question: string;
    type: "rating" | "text";
  }> | null;
  custom_message: string | null;
}

const externalTypeLabels: Record<string, string> = {
  customer: "Cliente",
  supplier: "Fornecedor",
  partner: "Parceiro",
  other: "Parceiro de Negócios",
};

export default function ExternalFeedbackForm() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requestData, setRequestData] = useState<FeedbackRequestData | null>(null);

  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [overallRating, setOverallRating] = useState<number>(0);
  const [strengths, setStrengths] = useState("");
  const [improvementAreas, setImprovementAreas] = useState("");
  const [additionalComments, setAdditionalComments] = useState("");

  useEffect(() => {
    const fetchRequest = async () => {
      if (!token) {
        setError("Token inválido");
        setLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase.rpc("get_feedback_request_by_token", {
          p_token: token,
        });

        if (fetchError) throw fetchError;

        if (!data || data.length === 0) {
          setError("Solicitação de feedback não encontrada ou expirada");
          setLoading(false);
          return;
        }

        const request = data[0] as FeedbackRequestData;

        if (request.status === "completed") {
          setError("Esta avaliação já foi respondida");
          setLoading(false);
          return;
        }

        if (request.status === "expired" || request.status === "cancelled") {
          setError("Esta solicitação de feedback expirou ou foi cancelada");
          setLoading(false);
          return;
        }

        if (new Date(request.deadline) < new Date()) {
          setError("O prazo para responder esta avaliação expirou");
          setLoading(false);
          return;
        }

        setRequestData(request);
      } catch (err) {
        console.error("Error fetching request:", err);
        setError("Erro ao carregar a solicitação de feedback");
      } finally {
        setLoading(false);
      }
    };

    fetchRequest();
  }, [token]);

  const handleRatingChange = (questionId: string, rating: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: rating }));
  };

  const handleSubmit = async () => {
    if (!token || !requestData) return;

    // Validate required fields
    const questions = requestData.template_questions || [];
    const unanswered = questions.filter(
      (q) => q.type === "rating" && !answers[q.id]
    );

    if (unanswered.length > 0) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, responda todas as perguntas antes de enviar.",
        variant: "destructive",
      });
      return;
    }

    if (overallRating === 0) {
      toast({
        title: "Avaliação geral obrigatória",
        description: "Por favor, selecione uma nota geral para o colaborador.",
        variant: "destructive",
      });
      return;
    }

    // Validate text field lengths
    const MAX_TEXT_LENGTH = 2000;
    if ((strengths && strengths.length > MAX_TEXT_LENGTH) ||
        (improvementAreas && improvementAreas.length > MAX_TEXT_LENGTH) ||
        (additionalComments && additionalComments.length > MAX_TEXT_LENGTH)) {
      toast({
        title: "Texto muito longo",
        description: `Cada campo de texto deve ter no máximo ${MAX_TEXT_LENGTH} caracteres.`,
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      const answersArray = questions.map((q) => ({
        questionId: q.id,
        question: q.question,
        rating: answers[q.id] || null,
      }));

      // Sanitize text inputs: trim whitespace
      const sanitize = (text: string | null): string | null => {
        if (!text) return null;
        return text.trim().slice(0, MAX_TEXT_LENGTH);
      };

      const { error: submitError } = await supabase.rpc("submit_external_feedback", {
        p_token: token,
        p_answers: answersArray,
        p_overall_rating: overallRating,
        p_strengths: sanitize(strengths),
        p_improvement_areas: sanitize(improvementAreas),
        p_additional_comments: sanitize(additionalComments),
      });

      if (submitError) throw submitError;

      setSubmitted(true);
      toast({
        title: "Feedback enviado!",
        description: "Sua avaliação foi registrada com sucesso.",
      });
    } catch (err: any) {
      console.error("Error submitting feedback:", err);
      toast({
        title: "Erro ao enviar",
        description: err.message || "Não foi possível enviar o feedback. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (questionId: string, currentRating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => handleRatingChange(questionId, star)}
            className="p-1 transition-transform hover:scale-110"
          >
            <Star
              className={`h-7 w-7 transition-colors ${
                star <= currentRating
                  ? "fill-yellow-400 text-yellow-400"
                  : "fill-muted text-muted-foreground hover:text-yellow-300"
              }`}
            />
          </button>
        ))}
        {currentRating > 0 && (
          <span className="ml-2 text-sm font-medium text-muted-foreground">
            {currentRating}/5
          </span>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto" />
          <p className="mt-4 text-muted-foreground">Carregando formulário...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-amber-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8 pb-8">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Ops!</h2>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8 pb-8">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Feedback Enviado!</h2>
            <p className="text-muted-foreground mb-4">
              Sua avaliação foi registrada com sucesso. Agradecemos sua participação!
            </p>
            <p className="text-sm text-muted-foreground">
              Você pode fechar esta página.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!requestData) return null;

  const questions = requestData.template_questions || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            {requestData.company_logo_url && (
              <img
                src={requestData.company_logo_url}
                alt={requestData.company_name}
                className="h-10 w-auto"
              />
            )}
            <div>
              <h1 className="font-bold text-lg">{requestData.company_name}</h1>
              <p className="text-sm text-muted-foreground">Avaliação 360° Externa</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Welcome Card */}
        <Card className="mb-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-0">
          <CardContent className="pt-6">
            <h2 className="text-xl font-bold mb-2">Olá, {requestData.external_name}!</h2>
            <p className="opacity-90">
              Como {externalTypeLabels[requestData.external_type]} da{" "}
              {requestData.company_name}, sua opinião é muito valiosa para nós.
            </p>
          </CardContent>
        </Card>

        {/* About 360 Card */}
        <Card className="mb-6 border-indigo-200 bg-indigo-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              💡 O que é Avaliação 360°?
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>
              A Avaliação 360° é uma ferramenta de desenvolvimento profissional que coleta
              feedback de múltiplas perspectivas: gestores, colegas, subordinados e parceiros
              externos como você. Suas respostas são <strong>confidenciais</strong> e serão
              utilizadas para ajudar no crescimento profissional do colaborador.
            </p>
          </CardContent>
        </Card>

        {/* Employee Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Colaborador Avaliado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
                <span className="text-xl font-bold text-indigo-600">
                  {requestData.employee_name.charAt(0)}
                </span>
              </div>
              <div>
                <p className="font-medium text-lg">{requestData.employee_name}</p>
                {requestData.employee_job_title && (
                  <p className="text-muted-foreground">{requestData.employee_job_title}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Custom Message */}
        {requestData.custom_message && (
          <Card className="mb-6 border-amber-200 bg-amber-50/50">
            <CardContent className="pt-4">
              <p className="text-sm">
                <strong>Mensagem do solicitante:</strong>
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {requestData.custom_message}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Questions */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Perguntas</CardTitle>
            <CardDescription>
              Avalie cada item de 1 a 5 estrelas, onde 1 é muito ruim e 5 é excelente.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {questions.map((q, index) => (
              <div key={q.id} className="space-y-2">
                <Label className="text-base">
                  {index + 1}. {q.question}
                </Label>
                {q.type === "rating" && renderStars(q.id, answers[q.id] || 0)}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Overall Rating */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Avaliação Geral</CardTitle>
            <CardDescription>
              De modo geral, como você avalia este profissional?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setOverallRating(star)}
                  className="p-2 transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-10 w-10 transition-colors ${
                      star <= overallRating
                        ? "fill-yellow-400 text-yellow-400"
                        : "fill-muted text-muted-foreground hover:text-yellow-300"
                    }`}
                  />
                </button>
              ))}
            </div>
            {overallRating > 0 && (
              <p className="text-center text-muted-foreground">
                {overallRating}/5 estrelas
              </p>
            )}
          </CardContent>
        </Card>

        {/* Text Fields */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Comentários</CardTitle>
            <CardDescription>
              Compartilhe suas observações para ajudar no desenvolvimento do profissional.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="strengths">💪 Pontos Fortes</Label>
              <Textarea
                id="strengths"
                placeholder="O que você considera como principais qualidades deste profissional?"
                value={strengths}
                onChange={(e) => setStrengths(e.target.value)}
                maxLength={2000}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="improvement">📈 Áreas de Melhoria</Label>
              <Textarea
                id="improvement"
                placeholder="Em quais aspectos este profissional poderia melhorar?"
                value={improvementAreas}
                onChange={(e) => setImprovementAreas(e.target.value)}
                maxLength={2000}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="comments">💬 Comentários Adicionais</Label>
              <Textarea
                id="comments"
                placeholder="Algo mais que gostaria de compartilhar?"
                value={additionalComments}
                onChange={(e) => setAdditionalComments(e.target.value)}
                maxLength={2000}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-center">
          <Button
            size="lg"
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full max-w-md"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              "Enviar Avaliação"
            )}
          </Button>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-8 mb-4">
          Suas respostas são confidenciais e serão utilizadas apenas para fins de
          desenvolvimento profissional.
        </p>
      </main>
    </div>
  );
}
