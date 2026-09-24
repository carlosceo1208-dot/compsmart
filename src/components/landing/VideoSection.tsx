/**
 * Vídeo institucional CompSmart — texto à esquerda, vídeo à direita (50%).
 */
export const VideoSection = () => {
  return (
    <section
      id="video-institucional"
      className="py-5 bg-background"
      aria-labelledby="video-institucional-title"
    >
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-6 items-center">
          <div>
            <h2
              id="video-institucional-title"
              className="text-xl md:text-2xl font-bold text-foreground mb-2"
            >
              Por que CompSmart?
            </h2>
            <p className="text-sm text-muted-foreground">
              Em 2 minutos: o racional da Gestão Estratégica de Remuneração.
            </p>
          </div>
          <div className="relative w-full aspect-video rounded-lg overflow-hidden shadow-sm border border-border">
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
