/**
 * Vídeo institucional CompSmart — racional da Gestão Estratégica de Remuneração.
 * Player compacto (máx. 640px) para não ocupar muito espaço na landing.
 */
export const VideoSection = () => {
  return (
    <section
      id="video-institucional"
      className="py-10 bg-background"
      aria-labelledby="video-institucional-title"
    >
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2
            id="video-institucional-title"
            className="text-2xl md:text-3xl font-bold text-foreground mb-2"
          >
            Por que CompSmart?
          </h2>
          <p className="text-sm text-muted-foreground mb-5">
            Em 2 minutos: o racional da Gestão Estratégica de Remuneração.
          </p>

          <div
            className="relative w-full mx-auto rounded-lg overflow-hidden shadow-md border border-border"
            style={{ maxWidth: 560, aspectRatio: "16 / 9" }}
          >
            <iframe
              className="absolute inset-0 w-full h-full"
              src="https://www.youtube.com/embed/roNBjSX5YBQ?start=9&rel=0"
              title="CompSmart — Gestão Estratégica de Remuneração"
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        </div>
      </div>
    </section>
  );
};
