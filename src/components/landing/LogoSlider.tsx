import { useEffect, useRef } from "react";

const companyLogos = [
  { name: "Empresa Tecnologia", initial: "T" },
  { name: "Indústria Brasil", initial: "I" },
  { name: "Serviços Globais", initial: "S" },
  { name: "Consultoria RH", initial: "C" },
  { name: "Varejo Nacional", initial: "V" },
  { name: "Financeira Plus", initial: "F" },
  { name: "Logística Express", initial: "L" },
  { name: "Educação Smart", initial: "E" },
];

export const LogoSlider = () => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    let animationId: number;
    let scrollPosition = 0;

    const scroll = () => {
      scrollPosition += 0.5;
      if (scrollPosition >= scrollContainer.scrollWidth / 2) {
        scrollPosition = 0;
      }
      scrollContainer.scrollLeft = scrollPosition;
      animationId = requestAnimationFrame(scroll);
    };

    animationId = requestAnimationFrame(scroll);

    return () => cancelAnimationFrame(animationId);
  }, []);

  return (
    <section className="py-12 bg-muted/30 overflow-hidden">
      <div className="container mx-auto px-4 mb-8">
        <p className="text-center text-sm text-muted-foreground uppercase tracking-wider font-medium">
          Empresas de todos os tamanhos confiam na CompSmart
        </p>
      </div>
      
      <div 
        ref={scrollRef}
        className="flex gap-12 overflow-hidden whitespace-nowrap"
        style={{ scrollBehavior: 'auto' }}
      >
        {/* Double the logos for seamless infinite scroll */}
        {[...companyLogos, ...companyLogos].map((company, index) => (
          <div 
            key={index}
            className="flex-shrink-0 flex items-center justify-center w-32 h-16 rounded-lg bg-background border border-border/50 shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-300 group"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center group-hover:from-primary/30 group-hover:to-primary/50 transition-colors">
                <span className="text-sm font-bold text-primary">
                  {company.initial}
                </span>
              </div>
              <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors hidden md:block">
                {company.name.split(' ')[0]}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
