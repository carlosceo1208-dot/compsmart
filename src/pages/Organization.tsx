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

export default function Organization() {
  useSEO(
    "CompSmart • Estrutura Organizacional",
    "Módulo de Estrutura Organizacional: filiais, departamentos, áreas e cargos."
  );

  return (
    <main className="container mx-auto px-4 py-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Estrutura Organizacional</h1>
        <p className="text-muted-foreground mt-2">
          Cadastre filiais, departamentos, áreas e cargos. Em breve: organograma em árvore e validações de vínculos.
        </p>
      </header>

      <section className="rounded-lg border bg-card text-card-foreground p-6">
        <h2 className="text-xl font-semibold mb-2">Em construção</h2>
        <p className="text-sm text-muted-foreground">
          Esta página é um placeholder para evitar erros 404 enquanto implementamos as funcionalidades completas do módulo.
        </p>
      </section>
    </main>
  );
}
