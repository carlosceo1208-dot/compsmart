import { useEffect, useState } from 'react';
import { useLaunchDay } from '@/hooks/useLaunchDay';

interface Particle {
  id: number;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  color: string;
  delay: number;
  duration: number;
}

const COLORS = [
  'hsl(45, 93%, 47%)',   // Dourado
  'hsl(45, 93%, 60%)',   // Dourado claro
  'hsl(142, 76%, 36%)',  // Verde CompSmart
  'hsl(142, 76%, 50%)',  // Verde claro
  'hsl(0, 0%, 100%)',    // Branco
];

export const LaunchConfetti = () => {
  const { shouldShowConfetti, markConfettiSeen } = useLaunchDay();
  const [particles, setParticles] = useState<Particle[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (shouldShowConfetti) {
      // Gerar partículas
      const newParticles: Particle[] = [];
      for (let i = 0; i < 60; i++) {
        newParticles.push({
          id: i,
          x: Math.random() * 100,
          y: -10 - Math.random() * 20,
          rotation: Math.random() * 360,
          scale: 0.5 + Math.random() * 0.5,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          delay: Math.random() * 0.5,
          duration: 3 + Math.random() * 2,
        });
      }
      setParticles(newParticles);
      setIsVisible(true);

      // Marcar como visto e esconder após animação
      const timer = setTimeout(() => {
        setIsVisible(false);
        markConfettiSeen();
      }, 4500);

      return () => clearTimeout(timer);
    }
  }, [shouldShowConfetti, markConfettiSeen]);

  if (!isVisible || particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute animate-confetti-fall"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            animationDelay: `${particle.delay}s`,
            animationDuration: `${particle.duration}s`,
          }}
        >
          <div
            className="w-3 h-3 rounded-sm animate-confetti-spin"
            style={{
              backgroundColor: particle.color,
              transform: `scale(${particle.scale}) rotate(${particle.rotation}deg)`,
              boxShadow: `0 0 6px ${particle.color}`,
            }}
          />
        </div>
      ))}
      
      {/* Partículas douradas maiores */}
      {particles.slice(0, 15).map((particle) => (
        <div
          key={`star-${particle.id}`}
          className="absolute animate-confetti-fall"
          style={{
            left: `${(particle.x + 50) % 100}%`,
            top: `${particle.y}%`,
            animationDelay: `${particle.delay + 0.2}s`,
            animationDuration: `${particle.duration + 0.5}s`,
          }}
        >
          <svg
            className="w-4 h-4 animate-confetti-spin"
            viewBox="0 0 24 24"
            fill="hsl(45, 93%, 50%)"
            style={{
              transform: `scale(${particle.scale})`,
              filter: 'drop-shadow(0 0 4px hsl(45, 93%, 50%))',
            }}
          >
            <polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9" />
          </svg>
        </div>
      ))}
    </div>
  );
};
