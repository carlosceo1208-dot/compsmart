import { useEffect, useRef } from 'react';

interface KudosConfettiProps {
  isActive: boolean;
  onComplete?: () => void;
}

export const KudosConfetti = ({ isActive, onComplete }: KudosConfettiProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isActive || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Kudos themed colors (indigo/purple/gold)
    const colors = [
      'hsl(245, 58%, 51%)',   // Indigo
      'hsl(245, 58%, 70%)',   // Light indigo
      'hsl(45, 93%, 47%)',    // Gold
      'hsl(330, 80%, 60%)',   // Pink
      'hsl(0, 0%, 100%)',     // White
      'hsl(280, 70%, 60%)',   // Purple
    ];

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      color: string;
      size: number;
      rotation: number;
      rotationSpeed: number;
      shape: 'circle' | 'star' | 'rect';
      opacity: number;
    }

    const particles: Particle[] = [];
    const particleCount = 120;

    // Create particles
    for (let i = 0; i < particleCount; i++) {
      const shape = Math.random() < 0.3 ? 'star' : Math.random() < 0.6 ? 'circle' : 'rect';
      particles.push({
        x: Math.random() * canvas.width,
        y: -20 - Math.random() * 100,
        vx: (Math.random() - 0.5) * 8,
        vy: Math.random() * 4 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: shape === 'star' ? Math.random() * 8 + 6 : Math.random() * 6 + 4,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.2,
        shape,
        opacity: 1,
      });
    }

    const drawStar = (x: number, y: number, size: number, rotation: number, color: string) => {
      if (!ctx) return;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
        const outerX = Math.cos(angle) * size;
        const outerY = Math.sin(angle) * size;
        const innerAngle = angle + Math.PI / 5;
        const innerX = Math.cos(innerAngle) * (size / 2);
        const innerY = Math.sin(innerAngle) * (size / 2);
        if (i === 0) {
          ctx.moveTo(outerX, outerY);
        } else {
          ctx.lineTo(outerX, outerY);
        }
        ctx.lineTo(innerX, innerY);
      }
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
      ctx.restore();
    };

    let startTime = Date.now();
    const duration = 4500; // 4.5 seconds

    const animate = () => {
      if (!ctx) return;
      
      const elapsed = Date.now() - startTime;
      const progress = elapsed / duration;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.15; // gravity
        p.rotation += p.rotationSpeed;
        p.vx *= 0.99; // air resistance
        
        // Fade out in last 30%
        if (progress > 0.7) {
          p.opacity = 1 - ((progress - 0.7) / 0.3);
        }

        ctx.globalAlpha = p.opacity;

        if (p.shape === 'star') {
          drawStar(p.x, p.y, p.size, p.rotation, p.color);
        } else if (p.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.fill();
        } else {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
          ctx.restore();
        }
      });

      ctx.globalAlpha = 1;

      if (elapsed < duration) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        onComplete?.();
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, [isActive, onComplete]);

  if (!isActive) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[100]"
      aria-hidden="true"
    />
  );
};
