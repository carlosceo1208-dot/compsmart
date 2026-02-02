import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyContext } from "@/contexts/CompanyContext";
import { 
  Bot, 
  Send, 
  Sparkles, 
  User, 
  UserSearch,
  FileText,
  Target,
  LayoutGrid,
  TrendingUp,
  ThumbsUp,
  ThumbsDown,
  Loader2,
  Trash2,
  ChevronRight
} from "lucide-react";
import { usePerformAI } from "@/hooks/usePerformAI";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

const intelligentActionIcons: Record<string, any> = {
  'analyze': UserSearch,
  'feedback': FileText,
  'pdi': Target,
  '9box': LayoutGrid,
  'compare': TrendingUp,
};

export default function PerformanceAssistant() {
  const {
    messages,
    isLoading,
    quickActions,
    intelligentActions,
    selectedEmployee,
    setSelectedEmployee,
    sendMessage,
    executeIntelligentAction,
    clearMessages,
  } = usePerformAI();

  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState<{ [key: number]: 'up' | 'down' | null }>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { activeCompanyId } = useCompanyContext();

  // Fetch employees for selector
  const { data: employees = [] } = useQuery({
    queryKey: ['employees-for-performai', activeCompanyId],
    queryFn: async () => {
      if (!activeCompanyId) return [];
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, job_title, grade, avatar_url')
        .eq('root_company_id', activeCompanyId)
        .eq('status', 'active')
        .order('full_name');
      return data || [];
    },
    enabled: !!activeCompanyId,
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (input.trim() && !isLoading) {
      sendMessage(input);
      setInput("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-indigo-900 dark:text-indigo-100 flex items-center gap-2">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center">
              <Bot className="h-5 w-5 text-white" />
            </div>
            PerformAI
            <Badge className="bg-violet-600 text-white">2.0</Badge>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Central de Inteligência para Avaliação de Desempenho
          </p>
        </div>
        {messages.length > 0 && (
          <Button variant="outline" size="sm" onClick={clearMessages}>
            <Trash2 className="h-4 w-4 mr-2" />
            Nova Conversa
          </Button>
        )}
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Sidebar - Context & Actions */}
        <div className="space-y-4">
          {/* Employee Selector */}
          <Card className="border-indigo-200/50 dark:border-indigo-800/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-indigo-700 dark:text-indigo-300 flex items-center gap-2">
                <User className="h-4 w-4" />
                Contexto do Colaborador
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <Select
                value={selectedEmployee?.id || ""}
                onValueChange={(value) => {
                  const emp = employees.find(e => e.id === value);
                  setSelectedEmployee(emp ? {
                    id: emp.id,
                    full_name: emp.full_name || 'Sem nome',
                    job_title: emp.job_title,
                    grade: emp.grade,
                  } : null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar colaborador..." />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedEmployee && (
                <div className="mt-3 p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
                  <p className="font-medium text-sm">{selectedEmployee.full_name}</p>
                  <p className="text-xs text-muted-foreground">{selectedEmployee.job_title || 'Sem cargo'}</p>
                  {selectedEmployee.grade && (
                    <Badge variant="outline" className="mt-1 text-xs">
                      Grade {selectedEmployee.grade}
                    </Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Intelligent Actions */}
          <Card className="border-indigo-200/50 dark:border-indigo-800/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-indigo-700 dark:text-indigo-300 flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Ações Inteligentes
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              {intelligentActions.map((action) => {
                const Icon = intelligentActionIcons[action.id] || Sparkles;
                return (
                  <Button
                    key={action.id}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-left h-auto py-2.5 text-sm border-indigo-200/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 group"
                    onClick={() => executeIntelligentAction(action.id)}
                    disabled={isLoading || (action.id !== '9box' && !selectedEmployee)}
                  >
                    <Icon className="h-4 w-4 mr-2 text-indigo-600 dark:text-indigo-400" />
                    <span className="flex-1">{action.label}</span>
                    <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Button>
                );
              })}
              {!selectedEmployee && (
                <p className="text-[10px] text-muted-foreground text-center pt-1">
                  Selecione um colaborador para usar ações personalizadas
                </p>
              )}
            </CardContent>
          </Card>

          {/* Quick Questions */}
          <Card className="border-indigo-200/50 dark:border-indigo-800/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
                Perguntas Rápidas
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-1.5">
              {quickActions.slice(0, 4).map((action) => (
                <Button
                  key={action.id}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-left h-auto py-2 text-xs text-muted-foreground hover:text-indigo-600"
                  onClick={() => sendMessage(action.questionText)}
                  disabled={isLoading}
                >
                  {action.questionText}
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Main Chat Area */}
        <div className="lg:col-span-3">
          <Card className="border-indigo-200/50 dark:border-indigo-800/30 h-[calc(100vh-220px)] min-h-[500px] flex flex-col">
            {/* Chat Messages */}
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-4 py-12">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-violet-500 to-indigo-700 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-violet-200 dark:shadow-violet-900/30">
                    <Sparkles className="h-12 w-12 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-indigo-900 dark:text-indigo-100">
                    Olá! Sou o PerformAI 2.0
                  </h3>
                  <p className="text-muted-foreground max-w-md mb-6">
                    Posso analisar colaboradores, gerar devolutivas personalizadas, 
                    sugerir PDIs, explicar a Matriz 9Box e muito mais.
                  </p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-2xl">
                    {quickActions.slice(0, 6).map((action) => (
                      <Button
                        key={action.id}
                        variant="outline"
                        size="sm"
                        onClick={() => sendMessage(action.questionText)}
                        className="text-xs h-auto py-2.5 px-4 whitespace-normal text-left border-violet-200 hover:bg-violet-50 hover:text-violet-700 dark:hover:bg-violet-900/30"
                      >
                        {action.questionText}
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={cn(
                        "flex gap-3",
                        message.role === "user" ? "justify-end" : "justify-start"
                      )}
                    >
                      {message.role === "assistant" && (
                        <Avatar className="h-8 w-8 mt-1 flex-shrink-0">
                          <AvatarFallback className="bg-gradient-to-br from-violet-600 to-indigo-700 text-white">
                            <Bot className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div
                        className={cn(
                          "max-w-[85%] rounded-xl px-4 py-3",
                          message.role === "user"
                            ? "bg-indigo-600 text-white"
                            : "bg-muted/50 border border-border"
                        )}
                      >
                        {message.role === "assistant" ? (
                          <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-indigo-900 dark:prose-headings:text-indigo-100 prose-p:text-foreground prose-li:text-foreground">
                            <ReactMarkdown>{message.content}</ReactMarkdown>
                          </div>
                        ) : (
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        )}
                        
                        {message.role === "assistant" && index === messages.length - 1 && !isLoading && message.content && (
                          <div className="mt-4 flex items-center gap-2 border-t border-border/50 pt-3">
                            <span className="text-xs text-muted-foreground">Isso foi útil?</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setFeedback({ ...feedback, [index]: 'up' })}
                              className={cn(
                                "h-7 w-7 p-0 transition-colors",
                                feedback[index] === 'up' && "text-green-600 bg-green-50"
                              )}
                            >
                              <ThumbsUp className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setFeedback({ ...feedback, [index]: 'down' })}
                              className={cn(
                                "h-7 w-7 p-0 transition-colors",
                                feedback[index] === 'down' && "text-red-600 bg-red-50"
                              )}
                            >
                              <ThumbsDown className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        )}
                      </div>
                      {message.role === "user" && (
                        <Avatar className="h-8 w-8 mt-1 flex-shrink-0">
                          <AvatarFallback className="bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300">
                            <User className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  ))}
                  
                  {isLoading && (
                    <div className="flex justify-start gap-3">
                      <Avatar className="h-8 w-8 mt-1 flex-shrink-0">
                        <AvatarFallback className="bg-gradient-to-br from-violet-600 to-indigo-700 text-white">
                          <Bot className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex items-center gap-2 rounded-xl bg-muted/50 border border-border px-4 py-3">
                        <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                        <span className="text-sm text-muted-foreground">Analisando...</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>

            {/* Input Area */}
            <div className="border-t border-indigo-200/50 dark:border-indigo-800/30 p-4">
              {selectedEmployee && (
                <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <User className="h-3 w-3" />
                  <span>Contexto: <strong>{selectedEmployee.full_name}</strong></span>
                </div>
              )}
              <div className="flex items-end gap-3">
                <Textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Pergunte sobre desempenho, peça análises, gere devolutivas..."
                  className="min-h-[60px] max-h-[150px] resize-none flex-1"
                  disabled={isLoading}
                />
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  size="lg"
                  className="h-[60px] w-[60px] flex-shrink-0 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
