import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, Send, Sparkles } from "lucide-react";
import { useState } from "react";

const quickActions = [
  "Analisar avaliação de desempenho",
  "Gerar devolutiva para colaborador",
  "Sugerir plano de desenvolvimento (PDI)",
  "Explicar critérios do 9Box",
  "Comparar com ciclo anterior",
  "Calcular elegibilidade para mérito",
];

export default function PerformanceAssistant() {
  const [message, setMessage] = useState("");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-indigo-900 dark:text-indigo-100 flex items-center gap-2">
          <Bot className="h-6 w-6" />
          PerformAI
        </h1>
        <p className="text-sm text-muted-foreground">
          Assistente de IA para avaliação de desempenho
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Chat Area */}
        <div className="md:col-span-2">
          <Card className="border-indigo-200/50 dark:border-indigo-800/30 h-[600px] flex flex-col">
            <CardContent className="flex-1 flex flex-col justify-center items-center p-8">
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  Olá! Sou o PerformAI
                </h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  Posso ajudar com análises de desempenho, gerar devolutivas,
                  sugerir PDIs e muito mais. Como posso ajudar?
                </p>
              </div>
            </CardContent>

            <div className="border-t border-indigo-200/50 dark:border-indigo-800/30 p-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Digite sua pergunta sobre desempenho..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="flex-1"
                />
                <Button className="bg-indigo-600 hover:bg-indigo-700">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div>
          <Card className="border-indigo-200/50 dark:border-indigo-800/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
                Ações Rápidas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {quickActions.map((action) => (
                <Button
                  key={action}
                  variant="outline"
                  className="w-full justify-start text-left h-auto py-3 text-sm border-indigo-200/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/30"
                  onClick={() => setMessage(action)}
                >
                  {action}
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
