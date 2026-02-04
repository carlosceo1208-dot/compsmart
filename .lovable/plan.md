

# Plano: Correção da Tela Branca e Melhoria de Tratamento de Erros

## Problema Identificado
A aplicação está mostrando uma tela completamente branca ao navegar para `/auth`. Isso geralmente ocorre quando há um erro JavaScript não capturado que "crasheia" toda a aplicação React.

## Análise Técnica
Baseado na análise do código e da sessão de replay:
- O usuário navegou de `/performance` → `/` → `/auth`
- A tela ficou branca após navegar para `/auth`
- Não há console logs de erro disponíveis (podem ter sido limpos pelo crash)
- A página Auth.tsx não possui erros de sintaxe visíveis

## Causa Provável
Erros assíncronos em handlers de eventos (como verificação de sessão ou Turnstile) ocorrem após a renderização e estão fora do tratamento do React Error Boundary. Se uma Promise for rejeitada sem ser capturada, isso pode crashear a aplicação.

## Solução Proposta

### 1. Adicionar Error Boundary Global
Criar um componente de Error Boundary para capturar erros de renderização e mostrar uma mensagem amigável ao invés de uma tela branca.

**Arquivo:** `src/components/ErrorBoundary.tsx`

```text
┌─────────────────────────────────────────┐
│         CompSmart Error Boundary        │
├─────────────────────────────────────────┤
│  Captura erros de componentes filhos    │
│  Mostra UI de fallback amigável         │
│  Opção de "Tentar Novamente"            │
│  Log do erro para debugging             │
└─────────────────────────────────────────┘
```

### 2. Adicionar Handler Global de Rejection
Adicionar listener para `unhandledrejection` no App.tsx para capturar Promises rejeitadas que escapam dos `try/catch`.

### 3. Melhorar Try/Catch na Página Auth
Garantir que todos os blocos assíncronos na página Auth.tsx tenham tratamento de erro adequado.

### 4. Verificar Componentes Problemáticos
Adicionar proteção extra no `TurnstileWidget` para evitar crashes.

## Mudanças Técnicas

### Arquivo 1: `src/components/ErrorBoundary.tsx` (NOVO)
```tsx
import { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCcw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center p-8 max-w-md">
            <AlertTriangle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Algo deu errado</h1>
            <p className="text-muted-foreground mb-6">
              Ocorreu um erro inesperado. Por favor, tente novamente.
            </p>
            <Button
              onClick={() => {
                this.setState({ hasError: false });
                window.location.href = "/";
              }}
              className="gap-2"
            >
              <RefreshCcw className="h-4 w-4" />
              Voltar ao Início
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### Arquivo 2: `src/App.tsx` (MODIFICAR)
- Importar e envolver o app com ErrorBoundary
- Adicionar useEffect para handler de unhandledrejection

```tsx
// Adicionar no início do componente App:
useEffect(() => {
  const handleRejection = (event: PromiseRejectionEvent) => {
    console.error("Unhandled rejection:", event.reason);
    event.preventDefault();
  };

  window.addEventListener("unhandledrejection", handleRejection);
  return () => window.removeEventListener("unhandledrejection", handleRejection);
}, []);

// Envolver BrowserRouter com ErrorBoundary:
<ErrorBoundary>
  <BrowserRouter>
    ...
  </BrowserRouter>
</ErrorBoundary>
```

### Arquivo 3: `src/pages/Auth.tsx` (MODIFICAR)
- Adicionar try/catch no checkSession do useEffect
- Adicionar try/catch no OAuth handler

```tsx
// No useEffect do checkSession:
useEffect(() => {
  const checkSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Session check failed:", error);
    }
  };
  checkSession();
  // ...
}, [navigate]);

// No onClick do Google OAuth:
onClick={async () => {
  setLoading(true);
  try {
    const { error } = await supabase.auth.signInWithOAuth({...});
    if (error) {
      toast.error("Erro ao conectar com Google");
    }
  } catch (error) {
    console.error("OAuth error:", error);
    toast.error("Erro ao conectar com Google");
  } finally {
    setLoading(false);
  }
}}
```

## Resultado Esperado
- Erros de renderização serão capturados pelo ErrorBoundary
- Erros assíncronos serão tratados graciosamente
- Usuário verá uma mensagem amigável em vez de tela branca
- Opção de recuperação ("Voltar ao Início")

## Arquivos a Modificar
1. `src/components/ErrorBoundary.tsx` - Criar novo arquivo
2. `src/App.tsx` - Adicionar ErrorBoundary e handler global
3. `src/pages/Auth.tsx` - Melhorar tratamento de erros assíncronos

