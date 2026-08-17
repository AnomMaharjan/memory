import React, { useEffect, useRef, useState } from 'react';

/**
 * Animated particle background — renders floating orbs on canvas for desktop,
 * and a zero-CPU CSS ambient glow for mobile devices.
 *
 * @param {number} activeColor - Target hue value
 */
function ParticleBackground({ activeColor }) {
  const canvasRef = useRef(null);
  const targetHueRef = useRef(activeColor);
  const [isMobile, setIsMobile] = useState(() => {
    return typeof window !== 'undefined' && (
      window.innerWidth <= 768 ||
      (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    );
  });

  useEffect(() => {
    targetHueRef.current = activeColor;
  }, [activeColor]);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768 ||
        (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
      setIsMobile(mobile);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isMobile) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const resize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);

    // Optimized particle count for smooth 60fps performance without GPU fill-rate choke
    const NUM_PARTICLES = 18;
    const particles = Array.from({ length: NUM_PARTICLES }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 120 + 40,
      vx: (Math.random() - 0.5) * 0.12,
      vy: (Math.random() - 0.5) * 0.12,
      alpha: Math.random() * 0.05 + 0.02,
      hue: Math.random() < 0.5 ? 250 : 180,
    }));

    let animId;
    let isPaused = false;

    const handleVisibilityChange = () => {
      isPaused = document.hidden;
      if (!isPaused && !animId) {
        animId = requestAnimationFrame(render);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const render = () => {
      if (isPaused) {
        animId = null;
        return;
      }

      ctx.clearRect(0, 0, width, height);
      const target = targetHueRef.current;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < -p.r) p.x = width + p.r;
        if (p.x > width + p.r) p.x = -p.r;
        if (p.y < -p.r) p.y = height + p.r;
        if (p.y > height + p.r) p.y = -p.r;

        // Transition hue towards target
        if (target != null) {
          const diff = target - p.hue;
          let shortest = diff;
          if (Math.abs(diff) > 180) {
            shortest = diff > 0 ? diff - 360 : diff + 360;
          }
          p.hue += shortest * 0.02;
          if (p.hue < 0) p.hue += 360;
          if (p.hue > 360) p.hue -= 360;
        }

        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
        grad.addColorStop(0, `hsla(${p.hue}, 80%, 65%, ${p.alpha})`);
        grad.addColorStop(1, `hsla(${p.hue}, 80%, 65%, 0)`);

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      if (animId) cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isMobile]);

  if (isMobile) {
    return <div className="particle-mobile-bg" aria-hidden="true" />;
  }

  return <canvas ref={canvasRef} className="particle-canvas" aria-hidden="true" />;
}

export default ParticleBackground;
