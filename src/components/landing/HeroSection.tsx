import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ArrowRight, Sparkles, Play, X, Shield, Lock, ShieldCheck, MapPin, Calendar, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLaunchDay } from "@/hooks/useLaunchDay";
import { LaunchBanner } from "@/components/launch/LaunchBanner";

interface TrailParticle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
}

export const HeroSection = () => {
  const navigate = useNavigate();
  const { isLaunchDay } = useLaunchDay();
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [trailParticles, setTrailParticles] = useState<TrailParticle[]>([]);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const particleIdRef = useRef(0);
  const playButtonRef = useRef<HTMLDivElement>(null);
  
  // Video URL - Supabase Storage
  const videoUrl = "https://fpkjkqdfufhhicxkyqdw.supabase.co/storage/v1/object/public/videos/institucional.mp4";
  const thumbnailUrl = "https://fpkjkqdfufhhicxkyqdw.supabase.co/storage/v1/object/public/videos/institucional-thumb.jpg";
  const hasVideo = Boolean(videoUrl);

  // Countdown to January 7, 2026 (São Paulo timezone UTC-3)
  useEffect(() => {
    const targetDate = new Date('2026-01-07T00:00:00-03:00').getTime();
    
    const updateCountdown = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;
      
      if (difference > 0) {
        setCountdown({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000)
        });
      }
    };
    
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!playButtonRef.current) return;
    
    const rect = playButtonRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const colors = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', '#9b59b6', '#e91e63'];
    const size = Math.random() * 6 + 2;
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    const newParticle: TrailParticle = {
      id: particleIdRef.current++,
      x,
      y,
      size,
      color,
    };
    
    setTrailParticles(prev => [...prev, newParticle]);
    
    setTimeout(() => {
      setTrailParticles(prev => prev.filter(p => p.id !== newParticle.id));
    }, 1000);
  }, []);

  const handleMouseLeave = useCallback(() => {
    // Optionally clear all particles immediately on leave
  }, []);

  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden bg-gradient-to-br from-background via-primary/5 to-secondary/10">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      
      {/* Floating Orbs */}
      <div className="hero-orb w-[500px] h-[500px] bg-primary/30 top-20 -left-40 animate-float" style={{ animationDelay: "0s" }} />
      <div className="hero-orb w-[400px] h-[400px] bg-secondary/30 bottom-20 -right-40 animate-float" style={{ animationDelay: "1s" }} />
      <div className="hero-orb w-[300px] h-[300px] bg-accent/20 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-float" style={{ animationDelay: "2s" }} />
      
      {/* Decorative Sparkles */}
      <div className="absolute top-32 left-[15%] w-2 h-2 bg-primary rounded-full animate-pulse-glow" />
      <div className="absolute top-40 right-[20%] w-3 h-3 bg-secondary rounded-full animate-pulse-glow" style={{ animationDelay: "0.5s" }} />
      <div className="absolute bottom-40 left-[25%] w-2 h-2 bg-accent rounded-full animate-pulse-glow" style={{ animationDelay: "1s" }} />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Badge - Animated Entry */}
          <div className="flex items-center justify-center gap-3 flex-wrap animate-fade-in-down">
            <Badge className="bg-gradient-primary text-white px-4 py-1.5 text-sm flex items-center gap-2 shadow-primary">
              <Sparkles className="h-4 w-4" />
              {isLaunchDay ? 'Lançamento Oficial!' : 'Lançamento Janeiro 2026'}
            </Badge>
            <Badge className="bg-green-500/10 text-green-600 border-green-500/20 px-3 py-1.5 text-sm flex items-center gap-2 cursor-pointer hover:bg-green-500/20 transition-colors" onClick={() => setIsVideoOpen(true)}>
              <Play className="h-4 w-4" />
              Assista o CompSmart na prática
            </Badge>
          </div>

          {/* Launch Banner OR Countdown Timer */}
          {isLaunchDay ? (
            <div className="animate-fade-in-down" style={{ animationDelay: "0.05s" }}>
              <LaunchBanner />
            </div>
          ) : (
            <div className="flex items-center justify-center gap-4 animate-fade-in-down" style={{ animationDelay: "0.05s" }}>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  {countdown.days}
                </div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider">Dias</div>
              </div>
              <span className="text-2xl text-muted-foreground">:</span>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  {countdown.hours.toString().padStart(2, '0')}
                </div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider">Horas</div>
              </div>
              <span className="text-2xl text-muted-foreground">:</span>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  {countdown.minutes.toString().padStart(2, '0')}
                </div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider">Min</div>
              </div>
              <span className="text-2xl text-muted-foreground">:</span>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  {countdown.seconds.toString().padStart(2, '0')}
                </div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider">Seg</div>
              </div>
            </div>
          )}

          {/* Headline - Pain vs. Solution */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            Diga adeus ao caos das planilhas:{" "}
            <span 
              className="bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent animate-gradient-shift"
              style={{ 
                backgroundSize: "200% auto",
                willChange: "background-position"
              }}
            >
              Inteligência de Dados e IA para sua Gestão de Remuneração.
            </span>
          </h1>

          {/* Subtitle - Animated Entry */}
          <p className="text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            Tabelas salariais, planejamento de headcount e análise de mercado em uma única plataforma segura. Experimente grátis por 14 dias e transforme sua gestão hoje.
          </p>

          {/* CTAs - Animated Entry with Enhanced Hover Effects */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-6 animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
            <Button 
              size="lg"
              className="cta-action text-lg px-8 shadow-lg w-full sm:w-auto transition-all duration-300 will-change-transform group"
              onClick={() => navigate("/auth")}
            >
              Começar Teste Grátis de 14 Dias
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button 
              size="lg"
              variant="outline"
              className="glass-effect hover:bg-primary/10 hover:scale-105 text-lg px-8 w-full sm:w-auto transition-all duration-300 will-change-transform"
              onClick={() => document.getElementById('solution')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Ver como funciona
            </Button>
          </div>

          {/* Video Preview Section - Animated Entry */}
          <div className="pt-12 animate-fade-in-up" style={{ animationDelay: "0.5s" }}>
            {/* Video Section Header */}
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold mb-3">
                Planilhas ou Inteligência?{" "}
                <span className="bg-gradient-primary bg-clip-text text-transparent">
                  Veja como a CompSmart elimina o trabalho exaustivo da revisão salarial.
                </span>
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Assista ao diálogo entre um CEO e uma HR Manager e descubra por que empresas de alto crescimento estão abandonando os processos manuais.
              </p>
            </div>
            
            <div className="relative max-w-3xl mx-auto">
              <div className="relative rounded-2xl overflow-visible p-1 bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20">
                <div 
                  ref={playButtonRef}
                  className="group relative aspect-video rounded-xl overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 shadow-2xl cursor-pointer"
                  onClick={() => setIsVideoOpen(true)}
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                >
                  {/* Video Thumbnail with hover zoom */}
                  <img 
                    src={thumbnailUrl}
                    alt="Preview do vídeo institucional CompSmart - Carla apresentando com gráficos"
                    className="absolute inset-0 w-full h-full object-cover rounded-xl opacity-90 transition-transform duration-700 ease-out group-hover:scale-110"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  {/* Overlay gradiente para contraste do botão play */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-slate-900/30 rounded-xl" />
                  {/* Particles ao redor do botão */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="relative w-32 h-32">
                      {/* 12 partículas estáticas orbitando */}
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-2 h-2 bg-primary rounded-full animate-particle-float" />
                      <div className="absolute -top-4 right-4 w-3 h-3 bg-secondary rounded-full animate-particle-sparkle" style={{ animationDelay: "0.3s" }} />
                      <div className="absolute top-0 -right-8 w-2 h-2 bg-accent rounded-full animate-particle-pulse" style={{ animationDelay: "0.6s" }} />
                      <div className="absolute bottom-4 -right-8 w-4 h-4 bg-primary/80 rounded-full animate-particle-float" style={{ animationDelay: "0.9s" }} />
                      <div className="absolute -bottom-4 right-4 w-2 h-2 bg-secondary rounded-full animate-particle-sparkle" style={{ animationDelay: "1.2s" }} />
                      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-3 h-3 bg-accent rounded-full animate-particle-pulse" style={{ animationDelay: "1.5s" }} />
                      <div className="absolute -bottom-4 left-4 w-2 h-2 bg-primary rounded-full animate-particle-float" style={{ animationDelay: "1.8s" }} />
                      <div className="absolute bottom-4 -left-8 w-4 h-4 bg-secondary/80 rounded-full animate-particle-sparkle" style={{ animationDelay: "2.1s" }} />
                      <div className="absolute top-0 -left-8 w-2 h-2 bg-accent rounded-full animate-particle-pulse" style={{ animationDelay: "2.4s" }} />
                      <div className="absolute -top-4 left-4 w-3 h-3 bg-primary rounded-full animate-particle-float" style={{ animationDelay: "2.7s" }} />
                      <div className="absolute -top-2 right-0 w-2 h-2 bg-secondary rounded-full animate-particle-sparkle" style={{ animationDelay: "3.0s" }} />
                      <div className="absolute -top-2 left-0 w-3 h-3 bg-accent rounded-full animate-particle-pulse" style={{ animationDelay: "3.3s" }} />
                      
                      {/* Trail particles - seguem o cursor */}
                      {trailParticles.map(particle => (
                        <div
                          key={particle.id}
                          className="absolute rounded-full animate-particle-trail pointer-events-none"
                          style={{
                            left: `${particle.x}px`,
                            top: `${particle.y}px`,
                            width: `${particle.size}px`,
                            height: `${particle.size}px`,
                            backgroundColor: particle.color,
                            transform: 'translate(-50%, -50%)',
                          }}
                        />
                      ))}
                      
                      {/* Play Button com rings */}
                      <button 
                        onClick={() => hasVideo && setIsVideoOpen(true)}
                        className={`group relative w-24 h-24 flex items-center justify-center pointer-events-auto z-10 ${!hasVideo ? 'cursor-default' : ''}`}
                        disabled={!hasVideo}
                      >
                        {/* Outer glow ring */}
                        <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" style={{ animationDuration: "2s" }} />
                        
                        {/* Middle pulse ring */}
                        <div className="absolute inset-2 rounded-full bg-secondary/30 animate-ping" style={{ animationDuration: "2.5s", animationDelay: "0.5s" }} />
                        
                        {/* Play button ou Upload icon */}
                        <div className={`relative w-20 h-20 ${hasVideo ? 'bg-gradient-primary' : 'bg-gradient-to-br from-slate-600 to-slate-700'} rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(155,89,182,0.5)] hover:shadow-[0_0_60px_rgba(155,89,182,0.7)] hover:scale-110 transition-all duration-300`}>
                          {hasVideo ? (
                            <Play className="h-8 w-8 text-white ml-1 group-hover:scale-110 transition-transform" fill="white" />
                          ) : (
                            <div className="flex flex-col items-center">
                              <Upload className="h-6 w-6 text-white/70" />
                              <span className="text-[8px] text-white/50 mt-1">Em breve</span>
                            </div>
                          )}
                        </div>
                      </button>
                    </div>
                  </div>
                  
                  {/* Text below */}
                  <div className="absolute bottom-6 left-0 right-0 text-center pointer-events-none">
                    <p className="text-white text-base font-semibold drop-shadow-lg">
                      {hasVideo ? 'Veja como a inteligência trabalha COM você' : 'CEO e Head de RH apresentam o CompSmart'}
                    </p>
                    <p className="text-white/80 text-sm mt-1 drop-shadow">
                      {hasVideo ? '🎬 ~5 minutos que podem transformar seu RH' : '🎬 Assista ao vídeo institucional'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Security Badges */}
            <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
              <Badge className="bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/20 px-4 py-2 transition-all hover:scale-105">
                <ShieldCheck className="h-4 w-4 mr-2" />
                LGPD Compliant
              </Badge>
              <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 hover:bg-blue-500/20 px-4 py-2 transition-all hover:scale-105">
                <Lock className="h-4 w-4 mr-2" />
                Criptografia Ponta-a-Ponta
              </Badge>
              <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20 hover:bg-yellow-500/20 px-4 py-2 transition-all hover:scale-105">
                <MapPin className="h-4 w-4 mr-2" />
                100% Brasileiro
              </Badge>
              <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/20 hover:bg-purple-500/20 px-4 py-2 transition-all hover:scale-105">
                <Shield className="h-4 w-4 mr-2" />
                Segurança Corporativa
              </Badge>
            </div>
          </div>

          {/* Secondary CTA below video */}
          <div className="flex justify-center pt-4 animate-fade-in-up" style={{ animationDelay: "0.55s" }}>
            <Button 
              size="lg"
              className="cta-action text-lg px-8 shadow-lg transition-all duration-300 will-change-transform group"
              onClick={() => navigate("/auth")}
            >
              Quero meu teste grátis
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>

          {/* Trust Badge - Animated Entry */}
          <p className="text-sm text-muted-foreground pt-6 animate-fade-in-up" style={{ animationDelay: "0.6s" }}>
            Sem necessidade de cartão de crédito. Configuração em 2 minutos.
          </p>
        </div>
      </div>

      {/* Bottom Gradient Overlay */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />

      {/* Video Modal - Preparado para upload direto */}
      <Dialog open={isVideoOpen} onOpenChange={setIsVideoOpen}>
        <DialogContent className="max-w-5xl w-[95vw] p-0 bg-transparent border-none shadow-none">
          {/* Close button */}
          <button 
            onClick={() => setIsVideoOpen(false)}
            className="absolute -top-12 right-0 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center transition-colors z-50"
          >
            <X className="h-6 w-6 text-white" />
          </button>
          
          {/* Video container - Preparado para vídeo direto (MP4/WebM) */}
          <div className="relative aspect-video rounded-xl overflow-hidden bg-black shadow-2xl">
            {isVideoOpen && hasVideo && (
              <video 
                src={videoUrl}
                className="absolute inset-0 w-full h-full"
                controls
                autoPlay
                playsInline
              >
                Seu navegador não suporta vídeos HTML5.
              </video>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
};
