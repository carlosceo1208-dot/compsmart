import { useEffect } from "react";

const useSEO = (title: string, description: string) => {
  useEffect(() => {
    document.title = title;
    const meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (meta) {
      meta.setAttribute("content", description);
    } else {
      const m = document.createElement("meta");
      m.setAttribute("name", "description");
      m.setAttribute("content", description);
      document.head.appendChild(m);
    }
  }, [title, description]);
};

export default function Roles() {
  useSEO(
    "CompSmart • Gestão de Perfis",
    "Módulo de Gestão de Perfis e Permissões: crie e associe permissões aos perfis."
  );

  return (
    <main className="container mx-auto px-4 py-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Gestão de Perfis (Roles)</h1>
        <p className="text-muted-foreground mt-2">
          Configure perfis e permissões de acesso aos módulos do sistema. Em breve: CRUD completo de perfis e permissões.
        </p>
      </header>

      <section className="rounded-lg border bg-card text-card-foreground p-6">
        <h2 className="text-xl font-semibold mb-2">Em construção</h2>
        <p className="text-sm text-muted-foreground">
          Página temporária para eliminar o erro 404 ao acessar o módulo ativo enquanto implementamos as funcionalidades.
        </p>
      </section>
    </main>
  );
}
